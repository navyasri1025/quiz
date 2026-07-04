"""
quiz_service.py — AI quiz-generation business logic for QuizCraft AI.

Prompt design
-------------
Questions are generated according to Bloom's Revised Taxonomy:
  Easy   → Remember / Understand  (L1–L2)
  Medium → Apply / Analyze        (L3–L4)
  Hard   → Evaluate / Create      (L5–L6)

The prompt explicitly instructs the model to:
  - use ONLY the provided content (no hallucination)
  - produce plausible distractors
  - avoid duplicate questions
  - distribute correct answers across all four positions
  - provide a concise explanation for each answer
"""
import json
import logging
import os
import re

import requests

from config import (
    AI_MAX_TOKENS,
    AI_REQUEST_TIMEOUT_SECONDS,
    AI_TEMPERATURE,
    OPENROUTER_API_URL,
    OPENROUTER_MODEL,
    SITE_URL,
)

logger = logging.getLogger("quizcraft")

# ---------------------------------------------------------------------------
# Bloom's taxonomy difficulty instructions
# ---------------------------------------------------------------------------

_BLOOM_INSTRUCTIONS: dict[str, str] = {
    "easy": (
        "Target Bloom's Taxonomy Levels 1–2 (Remember & Understand).\n"
        "- Remember: ask for definitions, facts, and basic recall.\n"
        "- Understand: ask students to paraphrase, summarise, or classify.\n"
        "Questions should be answerable by someone who read the material once."
    ),
    "medium": (
        "Target Bloom's Taxonomy Levels 3–4 (Apply & Analyze).\n"
        "- Apply: present a scenario and ask which concept/method/formula applies.\n"
        "- Analyze: ask students to break down a concept, compare ideas, or identify cause-effect.\n"
        "Distractors should be plausible — avoid trivially wrong options."
    ),
    "hard": (
        "Target Bloom's Taxonomy Levels 5–6 (Evaluate & Create).\n"
        "- Evaluate: ask students to judge, justify, or critique based on content.\n"
        "- Create: ask students to predict outcomes, design solutions, or synthesise ideas.\n"
        "Distractors must require partial knowledge to eliminate — this separates experts from novices."
    ),
}

_SYSTEM_PROMPT = (
    "You are an expert educational assessment designer who creates high-quality "
    "multiple-choice questions strictly grounded in provided source material. "
    "You output only valid JSON with no markdown, no code fences, and no commentary."
)


def _build_prompt(content_text: str, question_count: int, difficulty: str) -> str:
    bloom = _BLOOM_INSTRUCTIONS.get(difficulty, _BLOOM_INSTRUCTIONS["medium"])

    return f"""You are creating a {difficulty.upper()} difficulty quiz based ONLY on the content below.

{bloom}

=== SOURCE CONTENT (use ONLY this — do not hallucinate) ===
{content_text}
=== END OF SOURCE CONTENT ===

Generate exactly {question_count} multiple-choice questions following ALL rules below:

CONTENT RULES:
1. Every question and every answer option must be grounded in the source content above.
2. Do NOT introduce facts, figures, or concepts not present in the source.
3. If the source lacks enough content for {question_count} unique questions, create variations at different cognitive levels rather than repeating.

QUESTION QUALITY RULES:
4. Each question must be unambiguous — only ONE option is clearly correct.
5. No two questions may test the exact same fact or concept.
6. Question stems must be complete sentences ending with '?' or a blank to fill.
7. Avoid trick questions, double negatives, and 'All of the above' / 'None of the above'.

DISTRACTOR RULES:
8. All four options must be plausible to someone with partial knowledge.
9. Incorrect options must be clearly wrong to an expert — not just superficially different.
10. Vary the position of the correct answer: do not always place it at index 0 or 1.

OUTPUT FORMAT — return ONLY this JSON array, nothing else:
[
  {{
    "question": "<complete question text>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correctAnswer": <integer 0-3>,
    "explanation": "<one-sentence explanation citing the source>",
    "bloomLevel": "<Remember|Understand|Apply|Analyze|Evaluate|Create>"
  }},
  ...
]

Return exactly {question_count} objects. correctAnswer must be an integer 0, 1, 2, or 3."""


# ---------------------------------------------------------------------------
# Response parsing and validation
# ---------------------------------------------------------------------------

def _extract_json_array(raw: str) -> str:
    """Extract the first JSON array from the model response, handling fences."""
    raw = re.sub(r"```(?:json)?\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)
    raw = raw.strip()

    if raw.startswith("["):
        return raw

    match = re.search(r"\[.*\]", raw, re.DOTALL)
    return match.group() if match else raw


def _validate_questions(questions: list) -> None:
    """Raise ValueError with a clear message if any question is malformed."""
    if not isinstance(questions, list):
        raise ValueError("AI response is not a JSON array.")
    if not questions:
        raise ValueError("AI returned an empty question list.")

    required = {"question", "options", "correctAnswer", "explanation"}

    for i, q in enumerate(questions, start=1):
        missing = required - q.keys()
        if missing:
            raise ValueError(f"Question {i} missing fields: {', '.join(sorted(missing))}.")

        if not isinstance(q["options"], list) or len(q["options"]) != 4:
            raise ValueError(
                f"Question {i} must have exactly 4 options (got {len(q.get('options', []))})."
            )

        ca = q["correctAnswer"]
        if not isinstance(ca, int) or ca not in (0, 1, 2, 3):
            raise ValueError(
                f"Question {i}: correctAnswer must be integer 0-3 (got {ca!r})."
            )

        if not str(q.get("question", "")).strip():
            raise ValueError(f"Question {i} has an empty question text.")


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_quiz(
    content_text: str,
    question_count: int,
    difficulty: str,
) -> tuple[list[dict], dict]:
    """
    Call the OpenRouter API and return (questions, usage_info).

    Returns
    -------
    questions  : validated list of question dicts
    usage_info : {model, input_tokens, output_tokens}

    Raises a descriptive Exception on any failure.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise Exception(
            "OPENROUTER_API_KEY is not configured. "
            "Add it to backend/.env and restart the server."
        )

    prompt = _build_prompt(content_text, question_count, difficulty)
    logger.debug("Prompt length: %d chars", len(prompt))

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "QuizCraft AI",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        "temperature": AI_TEMPERATURE,
        "max_tokens": AI_MAX_TOKENS,
    }

    logger.info(
        "Calling OpenRouter — model=%s  questions=%d  difficulty=%s",
        OPENROUTER_MODEL, question_count, difficulty,
    )

    try:
        response = requests.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload,
            timeout=AI_REQUEST_TIMEOUT_SECONDS,
        )
    except requests.exceptions.Timeout:
        raise Exception(
            f"OpenRouter timed out after {AI_REQUEST_TIMEOUT_SECONDS}s. "
            "The model may be busy — please try again."
        )
    except requests.exceptions.ConnectionError:
        raise Exception("Could not reach OpenRouter API. Check your internet connection.")

    logger.info("OpenRouter response: HTTP %d", response.status_code)

    if response.status_code == 401:
        raise Exception("OpenRouter API key is invalid. Update OPENROUTER_API_KEY in backend/.env.")
    if response.status_code == 429:
        raise Exception("OpenRouter rate limit exceeded. Please wait and retry.")

    try:
        response.raise_for_status()
    except requests.exceptions.HTTPError as exc:
        raise Exception(f"OpenRouter API error (HTTP {response.status_code}): {exc}")

    data = response.json()

    if "choices" not in data or not data["choices"]:
        logger.error("Unexpected API response: %s", str(data)[:400])
        raise Exception("AI API returned an unexpected response format. Please try again.")

    raw_content: str = data["choices"][0]["message"]["content"]
    logger.debug("Raw AI response (300 chars): %s", raw_content[:300])

    usage = data.get("usage", {})
    usage_info = {
        "model": OPENROUTER_MODEL,
        "input_tokens":  usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
    }

    try:
        json_str = _extract_json_array(raw_content)
        questions = json.loads(json_str)
    except json.JSONDecodeError as exc:
        logger.error("JSON parse failed. Raw: %s", raw_content[:500])
        raise Exception(f"AI returned malformed JSON. Please retry. Error: {exc}") from exc

    _validate_questions(questions)

    logger.info("Generated %d valid questions.", len(questions))
    return questions, usage_info
