"""
config.py — Central configuration for QuizCraft AI backend.

All tuneable constants live here so they can be changed in one place
without hunting through business-logic files.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
PORT: int = int(os.getenv("PORT", 5000))
FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "false").lower() == "true"

# ---------------------------------------------------------------------------
# File upload
# ---------------------------------------------------------------------------
UPLOAD_FOLDER: str = os.path.join(os.path.dirname(__file__), "uploads")
MAX_CONTENT_LENGTH: int = 50 * 1024 * 1024          # 50 MB hard limit

# Supported extensions and their human-readable type names.
# Keeping the mapping here means app.py never has any extension logic.
ALLOWED_EXTENSIONS: frozenset = frozenset({".ppt", ".pptx", ".pdf", ".docx", ".txt"})

FILE_TYPE_LABELS: dict = {
    ".pptx": "PowerPoint",
    ".ppt":  "PowerPoint (legacy)",
    ".pdf":  "PDF",
    ".docx": "Word Document",
    ".txt":  "Plain Text",
}

# ---------------------------------------------------------------------------
# Quiz generation
# ---------------------------------------------------------------------------
MIN_QUESTIONS: int = 5
MAX_QUESTIONS: int = 30
DEFAULT_QUESTIONS: int = 10
VALID_DIFFICULTIES: frozenset = frozenset({"easy", "medium", "hard"})
PASS_THRESHOLD_PERCENT: float = 60.0                 # score >= 60 % → passed
HISTORY_MAX_ENTRIES: int = 200                       # raised cap

# ---------------------------------------------------------------------------
# OpenRouter / DeepSeek AI
# ---------------------------------------------------------------------------
OPENROUTER_API_URL: str = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL: str = "tencent/hy3:free"
AI_REQUEST_TIMEOUT_SECONDS: int = 120
AI_MAX_TOKENS: int = 8192
AI_TEMPERATURE: float = 0.7
SITE_URL: str = os.getenv("SITE_URL", "http://localhost:3000")

# Prices in USD per 1 000 tokens (input / output).
# Free tier = $0 — but tracking is ready for paid model substitution.
COST_PER_1K_INPUT_TOKENS: float = float(os.getenv("COST_PER_1K_INPUT", "0.0"))
COST_PER_1K_OUTPUT_TOKENS: float = float(os.getenv("COST_PER_1K_OUTPUT", "0.0"))

# ---------------------------------------------------------------------------
# Content sanitization
# ---------------------------------------------------------------------------
# Max chars forwarded to AI — caps token cost and limits injection surface.
MAX_CONTENT_CHARS: int = 12_000

# Lines containing any of these phrases are stripped before reaching the AI.
INJECTION_PATTERNS: tuple = (
    "ignore previous instructions",
    "ignore all instructions",
    "disregard the above",
    "you are now",
    "forget your instructions",
    "act as",
    "jailbreak",
    "dan mode",
    "developer mode",
    "system prompt",
    "new instructions:",
    "override:",
)
