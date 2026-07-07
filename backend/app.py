"""
app.py — QuizCraft AI Flask application (route layer only).

Business logic lives in:
  config.py                 — tuneable constants
  utils/file_utils.py       — multi-format text extraction & sanitization
  utils/logging_utils.py    — structured logging + in-memory analytics store
  services/quiz_service.py  — OpenRouter / DeepSeek AI call
"""
import logging
import os
import traceback
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

import config
from utils.file_utils import (
    extract_text,
    get_extension,
    get_file_type_label,
    is_allowed_extension,
    sanitize_content,
)
from utils.logging_utils import (
    estimate_cost,
    generation_logs,
    log_generation_failure,
    log_generation_request,
    log_generation_success,
    log_upload,
    log_upload_failure,
)
from services.quiz_service import generate_quiz

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("quizcraft")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH
os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------------------------------
# In-memory stores
# ---------------------------------------------------------------------------

quiz_sessions: dict[str, dict] = {}   # session_id → session data
quiz_history:  list[dict]      = []   # completed quiz results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _err(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Routes — Health
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "QuizCraft AI API is running",
        "timestamp": _now_iso(),
        "api_key_configured": bool(os.getenv("OPENROUTER_API_KEY")),
        "supported_formats": sorted(config.ALLOWED_EXTENSIONS),
    })


# ---------------------------------------------------------------------------
# Routes — Upload (multi-format)
# ---------------------------------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload_file():
    """
    Accept PPT, PPTX, PDF, DOCX, or TXT. Extract text, create a session.
    Returns session_id, filename, file_type, slide_count, total_words, slides[].
    """
    logger.info("POST /api/upload")

    if "file" not in request.files:
        log_upload_failure(filename="(none)", reason="missing file field")
        return _err("No file received. The form field must be named 'file'.")

    file = request.files["file"]
    if not file or file.filename == "":
        log_upload_failure(filename="(empty)", reason="empty filename")
        return _err("No file selected.")

    filename = file.filename
    logger.info("Received: %r (%s)", filename, file.content_type)

    if not is_allowed_extension(filename):
        ext = get_extension(filename) or "(no extension)"
        log_upload_failure(filename=filename, reason=f"unsupported extension {ext!r}")
        return _err(
            f"Unsupported file type '{ext}'. "
            f"Accepted: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}"
        )

    ext       = get_extension(filename)
    file_type = get_file_type_label(filename)
    saved_name = f"{uuid.uuid4()}{ext}"
    filepath   = os.path.join(config.UPLOAD_FOLDER, saved_name)

    try:
        file.save(filepath)
        file_size = os.path.getsize(filepath)

        if file_size == 0:
            os.remove(filepath)
            return _err("Uploaded file is empty.")

        # extract_text handles all supported formats and returns
        # {slide_count, total_words, slides[], file_processing_time_seconds}
        extracted = extract_text(filepath, filename)

        raw_text   = "\n\n".join(s["text"] for s in extracted["slides"] if s["text"].strip())
        clean_text = sanitize_content(raw_text)

        if not clean_text:
            os.remove(filepath)
            return _err(
                "No readable text found. "
                "The file may contain only images or be password-protected."
            )

        session_id = str(uuid.uuid4())
        proc_time  = extracted.get("file_processing_time_seconds", 0.0)

        quiz_sessions[session_id] = {
            "filepath":          filepath,
            "filename":          filename,
            "file_type":         file_type,
            "file_size_bytes":   file_size,
            "extracted_content": extracted,
            "clean_text":        clean_text,
            "file_processing_time": proc_time,
        }
        logger.info(
            "[UPLOAD] Session stored: %s | total sessions in memory: %d",
            session_id, len(quiz_sessions),
        )

        log_upload(
            filename=filename,
            file_size_bytes=file_size,
            slide_count=extracted["slide_count"],
            total_words=extracted["total_words"],
            session_id=session_id,
            file_processing_time=proc_time,
        )

        return jsonify({
            "session_id":  session_id,
            "filename":    filename,
            "file_type":   file_type,
            "slide_count": extracted["slide_count"],
            "total_words": extracted["total_words"],
            "slides":      extracted["slides"],
            "file_processing_time_seconds": proc_time,
        }), 200

    except ValueError as exc:
        logger.warning("Upload rejected: %s", exc)
        if os.path.exists(filepath):
            os.remove(filepath)
        log_upload_failure(filename=filename, reason=str(exc))
        return _err(str(exc))

    except Exception as exc:
        logger.error("Unexpected upload error:\n%s", traceback.format_exc())
        if os.path.exists(filepath):
            os.remove(filepath)
        log_upload_failure(filename=filename, reason=str(exc))
        return _err(f"Upload failed: {exc}", 500)


# ---------------------------------------------------------------------------
# Routes — Generate Quiz
# ---------------------------------------------------------------------------

@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz_route():
    """
    Generate quiz questions and return them with token/cost metadata.
    """
    logger.info("POST /api/generate-quiz")

    if not request.is_json:
        return _err("Content-Type must be application/json.")

    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    difficulty  = data.get("difficulty", "medium")

    logger.info(
        "[GENERATE] Received — session_id=%s  difficulty=%s  question_count=%s",
        session_id, difficulty, data.get("question_count"),
    )

    try:
        question_count = int(data.get("question_count", config.DEFAULT_QUESTIONS))
    except (TypeError, ValueError):
        return _err("question_count must be an integer.")

    if not session_id:
        return _err("Missing session_id. Upload a file first.")
    if session_id not in quiz_sessions:
        logger.warning(
            "[GENERATE] session_id NOT FOUND: %s | active sessions (%d): %s",
            session_id,
            len(quiz_sessions),
            list(quiz_sessions.keys())[:10],   # cap at 10 so logs stay readable
        )
        return _err("Session not found or expired. Re-upload your file.")
    logger.info("[GENERATE] session_id found: %s", session_id)
    if not (config.MIN_QUESTIONS <= question_count <= config.MAX_QUESTIONS):
        return _err(f"question_count must be {config.MIN_QUESTIONS}–{config.MAX_QUESTIONS}.")
    if difficulty not in config.VALID_DIFFICULTIES:
        return _err(f"difficulty must be one of {sorted(config.VALID_DIFFICULTIES)}.")

    session    = quiz_sessions[session_id]
    clean_text = session.get("clean_text", "")

    if not clean_text:
        return _err("No text content in session. Re-upload your file.")

    start_time = log_generation_request(
        session_id=session_id,
        question_count=question_count,
        difficulty=difficulty,
        content_length=len(clean_text),
    )

    try:
        questions, usage = generate_quiz(clean_text, question_count, difficulty)

        gen_record = log_generation_success(
            session_id=session_id,
            start_time=start_time,
            model=usage["model"],
            input_tokens=usage["input_tokens"],
            output_tokens=usage["output_tokens"],
            questions_returned=len(questions),
            filename=session.get("filename", ""),
            file_type=session.get("file_type", ""),
            total_words=session.get("extracted_content", {}).get("total_words", 0),
            question_count=question_count,
            difficulty=difficulty,
            file_processing_time=session.get("file_processing_time", 0.0),
        )

        session.update({"questions": questions, "difficulty": difficulty,
                        "question_count": question_count, "gen_record": gen_record})

        return jsonify({
            "session_id":      session_id,
            "questions":       questions,
            "total_questions": len(questions),
            "difficulty":      difficulty,
            # token & cost info for the UI
            "usage": {
                "model":               usage["model"],
                "input_tokens":        usage["input_tokens"],
                "output_tokens":       usage["output_tokens"],
                "total_tokens":        usage["input_tokens"] + usage["output_tokens"],
                "latency_seconds":     gen_record["latency_seconds"],
                "estimated_cost_usd":  gen_record["estimated_cost_usd"],
            },
        }), 200

    except Exception as exc:
        log_generation_failure(
            session_id=session_id,
            start_time=start_time,
            error=str(exc),
            difficulty=difficulty,
            question_count=question_count,
            filename=session.get("filename", ""),
        )
        logger.error("Generation failed:\n%s", traceback.format_exc())
        return _err(str(exc), 500)


# ---------------------------------------------------------------------------
# Routes — Submit Quiz
# ---------------------------------------------------------------------------

@app.route("/api/submit-quiz", methods=["POST"])
def submit_quiz():
    logger.info("POST /api/submit-quiz")

    if not request.is_json:
        return _err("Content-Type must be application/json.")

    data       = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    answers    = data.get("answers", {})

    if not session_id:
        return _err("Missing session_id.")
    if session_id not in quiz_sessions:
        return _err("Session not found or expired.")

    session   = quiz_sessions[session_id]
    questions = session.get("questions")

    if not questions:
        return _err("No quiz found. Generate a quiz first.")

    results = []
    correct_count = 0

    for i, q in enumerate(questions):
        user_answer = answers.get(str(i))
        is_correct  = user_answer == q["correctAnswer"]
        if is_correct:
            correct_count += 1

        results.append({
            "question_number":  i + 1,
            "question":         q["question"],
            "options":          q["options"],
            "correct_answer":   q["correctAnswer"],
            "correct_text":     q["options"][q["correctAnswer"]],
            "user_answer":      user_answer,
            "user_answer_text": q["options"][user_answer] if isinstance(user_answer, int) else None,
            "is_correct":       is_correct,
            "explanation":      q["explanation"],
            "bloomLevel":       q.get("bloomLevel", ""),
        })

    total      = len(questions)
    percentage = round((correct_count / total) * 100, 2)
    passed     = percentage >= config.PASS_THRESHOLD_PERCENT
    gen_record = session.get("gen_record", {})

    history_entry = {
        "id":              str(uuid.uuid4()),
        "filename":        session.get("filename", "Unknown"),
        "file_type":       session.get("file_type", ""),
        "difficulty":      session.get("difficulty", "medium"),
        "score":           correct_count,
        "total_questions": total,
        "percentage":      percentage,
        "passed":          passed,
        "timestamp":       _now_iso(),
        # analytics stored with every history entry
        "total_words":     session.get("extracted_content", {}).get("total_words", 0),
        "latency_seconds": gen_record.get("latency_seconds", 0),
        "input_tokens":    gen_record.get("input_tokens", 0),
        "output_tokens":   gen_record.get("output_tokens", 0),
        "total_tokens":    gen_record.get("total_tokens", 0),
        "estimated_cost_usd": gen_record.get("estimated_cost_usd", 0),
        "model":           gen_record.get("model", config.OPENROUTER_MODEL),
        "file_processing_time_seconds": session.get("file_processing_time", 0),
    }
    quiz_history.append(history_entry)

    logger.info(
        "Quiz submitted — session=%s  score=%d/%d (%.1f%%)",
        session_id, correct_count, total, percentage,
    )

    return jsonify({
        "session_id":    session_id,
        "score":         correct_count,
        "total_questions": total,
        "percentage":    percentage,
        "passed":        passed,
        "correct_count": correct_count,
        "wrong_count":   total - correct_count,
        "results":       results,
        "difficulty":    session.get("difficulty", "medium"),
        "filename":      session.get("filename", "Unknown"),
        "usage":         {
            "model":              gen_record.get("model", config.OPENROUTER_MODEL),
            "total_tokens":       gen_record.get("total_tokens", 0),
            "latency_seconds":    gen_record.get("latency_seconds", 0),
            "estimated_cost_usd": gen_record.get("estimated_cost_usd", 0),
        },
    }), 200


# ---------------------------------------------------------------------------
# Routes — History (enhanced)
# ---------------------------------------------------------------------------

@app.route("/api/history", methods=["GET"])
def get_history():
    """
    Return history with optional search / filter / sort.

    Query params:
      q         — search string (matches filename, difficulty)
      difficulty — easy | medium | hard
      sort      — newest (default) | oldest
      limit     — integer (default 50)
    """
    q          = (request.args.get("q") or "").lower().strip()
    difficulty = (request.args.get("difficulty") or "").lower().strip()
    sort       = request.args.get("sort", "newest")
    try:
        limit = min(int(request.args.get("limit", 50)), config.HISTORY_MAX_ENTRIES)
    except ValueError:
        limit = 50

    entries = list(quiz_history)

    if q:
        entries = [e for e in entries
                   if q in e.get("filename", "").lower()
                   or q in e.get("difficulty", "").lower()]

    if difficulty in ("easy", "medium", "hard"):
        entries = [e for e in entries if e.get("difficulty") == difficulty]

    if sort == "oldest":
        entries = entries[:limit]
    else:
        entries = list(reversed(entries))[:limit]

    logger.info("GET /api/history — %d entries returned", len(entries))
    return jsonify({"history": entries, "total": len(quiz_history)}), 200


@app.route("/api/history/<entry_id>", methods=["DELETE"])
def delete_history_entry(entry_id: str):
    """Delete a single history entry by its id."""
    global quiz_history
    before = len(quiz_history)
    quiz_history = [e for e in quiz_history if e.get("id") != entry_id]
    if len(quiz_history) == before:
        return _err("History entry not found.", 404)
    logger.info("Deleted history entry %s", entry_id)
    return jsonify({"message": "Deleted successfully."}), 200


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    """Delete all history entries."""
    global quiz_history
    count = len(quiz_history)
    quiz_history = []
    logger.info("Cleared %d history entries.", count)
    return jsonify({"message": f"Cleared {count} entries."}), 200


# ---------------------------------------------------------------------------
# Routes — Evaluation Dashboard
# ---------------------------------------------------------------------------

@app.route("/api/evaluation", methods=["GET"])
def get_evaluation():
    """
    Return aggregated metrics for the Evaluation Dashboard.

    Derived from generation_logs (every attempt, success + failure).
    """
    logs = generation_logs

    total_attempts  = len(logs)
    successful      = [l for l in logs if l.get("success")]
    failed          = [l for l in logs if not l.get("success")]
    success_count   = len(successful)
    failure_count   = len(failed)
    success_rate    = round(success_count / total_attempts * 100, 1) if total_attempts else 0
    failure_rate    = round(failure_count / total_attempts * 100, 1) if total_attempts else 0

    avg_latency     = round(sum(l["latency_seconds"] for l in successful) / success_count, 2) \
                      if success_count else 0
    avg_tokens      = round(sum(l.get("total_tokens", 0) for l in successful) / success_count) \
                      if success_count else 0
    total_cost      = round(sum(l.get("estimated_cost_usd", 0) for l in successful), 6)
    avg_file_proc   = round(
        sum(l.get("file_processing_time_seconds", 0) for l in successful) / success_count, 3
    ) if success_count else 0

    # per-difficulty breakdown
    diff_stats: dict[str, dict] = {}
    for diff in ("easy", "medium", "hard"):
        subset = [l for l in successful if l.get("difficulty") == diff]
        diff_stats[diff] = {
            "count":       len(subset),
            "avg_latency": round(sum(l["latency_seconds"] for l in subset) / len(subset), 2)
                           if subset else 0,
            "avg_tokens":  round(sum(l.get("total_tokens", 0) for l in subset) / len(subset))
                           if subset else 0,
        }

    # per-file-type breakdown
    type_counts: dict[str, int] = {}
    for l in successful:
        ft = l.get("file_type") or "Unknown"
        type_counts[ft] = type_counts.get(ft, 0) + 1

    # recent 20 successful logs for the timeline chart
    recent = [
        {
            "timestamp":    l["timestamp"],
            "latency":      l["latency_seconds"],
            "total_tokens": l.get("total_tokens", 0),
            "difficulty":   l.get("difficulty", ""),
            "filename":     l.get("filename", ""),
            "success":      l["success"],
        }
        for l in logs[-20:]
    ]

    return jsonify({
        "total_attempts":       total_attempts,
        "success_count":        success_count,
        "failure_count":        failure_count,
        "success_rate_percent": success_rate,
        "failure_rate_percent": failure_rate,
        "avg_latency_seconds":  avg_latency,
        "avg_tokens":           avg_tokens,
        "total_cost_usd":       total_cost,
        "avg_file_processing_seconds": avg_file_proc,
        "model":                config.OPENROUTER_MODEL,
        "difficulty_breakdown": diff_stats,
        "file_type_breakdown":  type_counts,
        "recent_logs":          recent,
    }), 200


# ---------------------------------------------------------------------------
# Routes — Session
# ---------------------------------------------------------------------------

@app.route("/api/session/<session_id>", methods=["GET"])
def get_session(session_id: str):
    if session_id not in quiz_sessions:
        return _err("Session not found.", 404)
    s = quiz_sessions[session_id]
    return jsonify({
        "filename":    s.get("filename"),
        "file_type":   s.get("file_type"),
        "slide_count": s.get("extracted_content", {}).get("slide_count"),
        "total_words": s.get("extracted_content", {}).get("total_words"),
        "has_questions": "questions" in s,
    }), 200


# ---------------------------------------------------------------------------
# Global error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(_e):
    return _err(
        "Endpoint not found. See /api/health for available routes.", 404
    )


@app.errorhandler(413)
def too_large(_e):
    return _err("File too large. Maximum is 50 MB.", 413)


@app.errorhandler(500)
def internal_error(_e):
    logger.error("Unhandled 500:\n%s", traceback.format_exc())
    return _err("Internal server error. Please try again.", 500)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    key_ok = "✓ configured" if os.getenv("OPENROUTER_API_KEY") else "✗ NOT SET"
    logger.info("=" * 60)
    logger.info("  QuizCraft AI Backend")
    logger.info("  Port            : %d", config.PORT)
    logger.info("  Debug mode      : %s", config.FLASK_DEBUG)
    logger.info("  Upload folder   : %s", config.UPLOAD_FOLDER)
    logger.info("  Max upload size : %d MB", config.MAX_CONTENT_LENGTH // (1024 * 1024))
    logger.info("  OpenRouter key  : %s", key_ok)
    logger.info("  Supported types : %s", ", ".join(sorted(config.ALLOWED_EXTENSIONS)))
    logger.info("=" * 60)
    # use_reloader=False prevents Werkzeug from spawning a second worker
    # process on every file-save.  Without this, quiz_sessions (an in-memory
    # dict) is wiped on each reload, causing "Session not found or expired".
    app.run(host="0.0.0.0", port=config.PORT, debug=config.FLASK_DEBUG, use_reloader=False)
