"""
logging_utils.py — Structured logging + in-memory analytics for QuizCraft AI.

Every AI generation call is recorded with:
  timestamp, model, latency, prompt tokens, completion tokens,
  estimated cost, success/failure, error message.

The generation_logs list is the source of truth for the /api/evaluation
endpoint — no external database required for course-project scale.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Optional

from config import (
    COST_PER_1K_INPUT_TOKENS,
    COST_PER_1K_OUTPUT_TOKENS,
    OPENROUTER_MODEL,
)

logger = logging.getLogger("quizcraft")

# In-memory store of every generation attempt — imported by app.py.
generation_logs: list[dict] = []


# ---------------------------------------------------------------------------
# Cost helper
# ---------------------------------------------------------------------------

def estimate_cost(input_tokens: int, output_tokens: int) -> float:
    """Return estimated USD cost for one API call."""
    return round(
        (input_tokens  / 1000) * COST_PER_1K_INPUT_TOKENS +
        (output_tokens / 1000) * COST_PER_1K_OUTPUT_TOKENS,
        6,
    )


# ---------------------------------------------------------------------------
# Generation lifecycle
# ---------------------------------------------------------------------------

def log_generation_request(
    *,
    session_id: str,
    question_count: int,
    difficulty: str,
    content_length: int,
) -> float:
    """Log the start of a generation request. Returns a monotonic start time."""
    start = time.monotonic()
    logger.info(
        "[GEN-START] session=%s  questions=%d  difficulty=%s  content_chars=%d",
        session_id, question_count, difficulty, content_length,
    )
    return start


def log_generation_success(
    *,
    session_id: str,
    start_time: float,
    model: str = OPENROUTER_MODEL,
    input_tokens: int = 0,
    output_tokens: int = 0,
    questions_returned: int,
    # extra analytics fields
    filename: str = "",
    file_type: str = "",
    total_words: int = 0,
    question_count: int = 0,
    difficulty: str = "",
    file_processing_time: float = 0.0,
) -> dict:
    """Log a successful generation and append to generation_logs."""
    latency = round(time.monotonic() - start_time, 3)
    cost = estimate_cost(input_tokens, output_tokens)
    total_tokens = input_tokens + output_tokens

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "model": model,
        "latency_seconds": latency,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "estimated_cost_usd": cost,
        "questions_returned": questions_returned,
        "success": True,
        # analytics extras
        "filename": filename,
        "file_type": file_type,
        "total_words": total_words,
        "question_count": question_count,
        "difficulty": difficulty,
        "file_processing_time_seconds": file_processing_time,
    }

    generation_logs.append(record)

    logger.info(
        "[GEN-OK] session=%s  latency=%.2fs  tokens=%d(in)/%d(out)  "
        "cost=$%.6f  questions=%d  model=%s",
        session_id, latency, input_tokens, output_tokens,
        cost, questions_returned, model,
    )
    return record


def log_generation_failure(
    *,
    session_id: str,
    start_time: float,
    error: str,
    model: str = OPENROUTER_MODEL,
    difficulty: str = "",
    question_count: int = 0,
    filename: str = "",
) -> dict:
    """Log a failed generation and append to generation_logs."""
    latency = round(time.monotonic() - start_time, 3)

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "model": model,
        "latency_seconds": latency,
        "success": False,
        "error": error,
        "difficulty": difficulty,
        "question_count": question_count,
        "filename": filename,
    }

    generation_logs.append(record)

    logger.error(
        "[GEN-FAIL] session=%s  latency=%.2fs  error=%s",
        session_id, latency, error,
    )
    return record


# ---------------------------------------------------------------------------
# Upload lifecycle
# ---------------------------------------------------------------------------

def log_upload(
    *,
    filename: str,
    file_size_bytes: int,
    slide_count: int,
    total_words: int,
    session_id: str,
    file_processing_time: float = 0.0,
) -> None:
    logger.info(
        "[UPLOAD-OK] session=%s  file=%r  size=%d B  sections=%d  words=%d  proc=%.2fs",
        session_id, filename, file_size_bytes,
        slide_count, total_words, file_processing_time,
    )


def log_upload_failure(*, filename: str, reason: str) -> None:
    logger.warning("[UPLOAD-FAIL] file=%r  reason=%s", filename, reason)
