# QuizCraft AI

An AI-powered quiz generator that transforms PowerPoint presentations into interactive multiple-choice quizzes. Upload a `.pptx` file, choose a difficulty, and let DeepSeek AI build a scored quiz from your slide content in seconds.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation & Setup](#installation--setup)
7. [Running the App](#running-the-app)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [Logging & Observability](#logging--observability)
11. [Security Notes](#security-notes)
12. [Troubleshooting](#troubleshooting)
13. [Known Limitations](#known-limitations)
14. [License](#license)

---

## Features

| Feature | Detail |
|---|---|
| PPT / PPTX upload | Drag-and-drop or file picker; validated on client and server |
| AI quiz generation | DeepSeek Chat v3 via OpenRouter — easy / medium / hard difficulty |
| Interactive quiz UI | Per-question timer, question palette, progress bar |
| Instant results | Score, percentage, per-question explanations, pie/bar charts |
| Quiz history | Last 50 sessions persisted in memory; shown in History tab |
| Analytics dashboard | Score trend line chart, difficulty distribution, best/avg score |
| Dark mode | Persistent via `localStorage` |
| Responsive design | Sidebar on desktop, bottom nav on mobile |
| Accessible | `aria-role`, `aria-label`, `role="timer"`, `aria-live` on generation screen |

---

## Tech Stack

### Frontend
| Library | Version | Role |
|---|---|---|
| React | 18 | UI framework |
| Vite | 6 | Build tool + dev-server proxy |
| Tailwind CSS | 3 | Utility-first styling |
| Framer Motion | 12 | Animations |
| Recharts | 3 | Score charts |
| lucide-react | 1 | Icons |

### Backend
| Library | Version | Role |
|---|---|---|
| Flask | 3.1 | HTTP server |
| flask-cors | 5 | CORS headers |
| python-pptx | 1.0 | PPTX text extraction |
| python-dotenv | 1.1 | `.env` loading |
| requests | 2.32 | OpenRouter HTTP calls |
| gunicorn | 23 | Production WSGI server |

---

## Architecture

```
Browser (React + Vite :3000)
        │
        │  /api/*  →  Vite dev-server proxy
        │
Flask API (:5000)
        │
        ├── app.py              HTTP routes (thin layer)
        ├── config.py           All constants & env vars
        │
        ├── utils/
        │   ├── file_utils.py   PPTX extraction + injection sanitization
        │   └── logging_utils.py  Structured latency/token/cost logging
        │
        └── services/
            └── quiz_service.py  OpenRouter API call, prompt building,
                                  JSON parsing, question validation
                        │
                        └──  OpenRouter API  →  DeepSeek Chat v3
```

### Request flow

1. User drops a `.pptx` on the upload zone.
2. `api.js → /api/upload` — Flask saves the file, `file_utils.extract_text_from_pptx` extracts slide text, `sanitize_content` strips injection attempts, a `session_id` is returned.
3. User picks difficulty/count on the Configure screen.
4. `api.js → /api/generate-quiz` — Flask calls `quiz_service.generate_quiz`, which builds a prompt, calls OpenRouter, parses + validates the JSON response. Token usage and latency are logged.
5. User answers questions; clicking Submit calls `api.js → /api/submit-quiz`.
6. Results screen shows score + per-question explanations. History is updated.

---

## Project Structure

```
quiz/
├── backend/
│   ├── app.py                  Flask routes (entry point)
│   ├── config.py               All constants and env-var defaults
│   ├── requirements.txt
│   ├── .env                    Backend secrets (not committed)
│   ├── uploads/                Saved PPTX files (git-ignored except .gitkeep)
│   ├── services/
│   │   ├── __init__.py
│   │   └── quiz_service.py     AI generation logic
│   └── utils/
│       ├── __init__.py
│       ├── file_utils.py       PPTX parsing + content sanitization
│       └── logging_utils.py    Structured request/response logger
│
├── frontend/
│   ├── src/
│   │   ├── api.js              Centralised HTTP client (all fetch calls)
│   │   ├── App.jsx             Layout, routing, tab state
│   │   ├── main.jsx
│   │   ├── index.css           Tailwind + custom component classes
│   │   ├── context/
│   │   │   ├── QuizContext.jsx State machine + action dispatchers
│   │   │   └── ThemeContext.jsx Dark/light mode
│   │   ├── pages/
│   │   │   ├── UploadScreen.jsx
│   │   │   ├── ConfigureScreen.jsx
│   │   │   ├── AIGenerationScreen.jsx
│   │   │   ├── QuizScreen.jsx
│   │   │   └── ResultScreen.jsx
│   │   └── components/
│   │       ├── QuizHistory.jsx
│   │       ├── AnalyticsDashboard.jsx
│   │       ├── QuestionPalette.jsx
│   │       ├── ThemeToggle.jsx
│   │       └── Confetti.jsx
│   ├── package.json
│   ├── vite.config.js          Proxy: /api → localhost:5000
│   ├── tailwind.config.js
│   └── .env                    VITE_API_URL= (keep empty for proxy)
│
├── .env.example                Template for both backend + frontend envs
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Python** 3.10 or later
- **Node.js** 18 or later (comes with npm)
- A free **OpenRouter API key** — get one at <https://openrouter.ai/keys>

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/navyasri1025/quiz.git
cd quiz
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
PORT=5000
FLASK_DEBUG=true
OPENROUTER_API_KEY=sk-or-v1-your-key-here
SITE_URL=http://localhost:3000
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
# Keep this empty — API calls go through the Vite proxy to Flask on :5000.
# Only set an absolute URL if you are deploying to a different domain.
VITE_API_URL=
```

---

## Running the App

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd backend
python app.py
```
Flask starts on `http://localhost:5000`. You should see:
```
QuizCraft AI Backend
Port            : 5000
OpenRouter key  : ✓ configured
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
Vite starts on `http://localhost:3000`. Open that URL in your browser.

### Production build

```bash
# Frontend
cd frontend && npm run build   # outputs to frontend/dist/

# Backend (using gunicorn)
cd backend && gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Environment Variables

### `backend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | — | OpenRouter API key |
| `PORT` | No | `5000` | Flask listen port |
| `FLASK_DEBUG` | No | `false` | Enable Flask debug mode |
| `SITE_URL` | No | `http://localhost:3000` | Sent in OpenRouter request headers |
| `COST_PER_1K_INPUT` | No | `0.0` | Token cost for logging (USD) |
| `COST_PER_1K_OUTPUT` | No | `0.0` | Token cost for logging (USD) |

### `frontend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `""` (empty) | API base URL. **Leave empty** in development to use the Vite proxy. Set to the backend URL only when deploying frontend and backend on different domains. |

---

## API Reference

Base URL: `http://localhost:5000`

All responses are `application/json`. Error responses always have the shape `{ "error": "message" }`.

---

### `GET /api/health`

Liveness probe.

**Response 200**
```json
{
  "status": "ok",
  "message": "QuizCraft AI API is running",
  "timestamp": "2026-07-04T02:30:00Z",
  "api_key_configured": true
}
```

---

### `POST /api/upload`

Upload a PPT/PPTX file and extract slide text.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | A `.ppt` or `.pptx` file (max 50 MB) |

**Response 200**
```json
{
  "session_id": "uuid",
  "filename": "lecture.pptx",
  "slide_count": 12,
  "total_words": 1480,
  "slides": [
    { "slide_number": 1, "text": "Introduction\nWelcome to…", "word_count": 45 }
  ]
}
```

**Error codes**
| Code | Reason |
|---|---|
| 400 | Missing file, wrong extension, empty file, image-only PPTX |
| 413 | File exceeds 50 MB |
| 500 | Corrupt file or unexpected server error |

---

### `POST /api/generate-quiz`

Generate quiz questions from an uploaded session.

**Request** — `application/json`
```json
{
  "session_id": "uuid",
  "question_count": 10,
  "difficulty": "medium"
}
```

| Field | Type | Constraints |
|---|---|---|
| `session_id` | string | Must match a valid upload session |
| `question_count` | integer | 5 – 30 |
| `difficulty` | string | `"easy"` \| `"medium"` \| `"hard"` |

**Response 200**
```json
{
  "session_id": "uuid",
  "questions": [
    {
      "question": "What is …?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 2,
      "explanation": "Because …"
    }
  ],
  "total_questions": 10,
  "difficulty": "medium"
}
```

**Error codes**
| Code | Reason |
|---|---|
| 400 | Invalid/missing session_id, out-of-range question_count, bad difficulty |
| 500 | OpenRouter API error, timeout, JSON parse failure |

---

### `POST /api/submit-quiz`

Score a completed quiz and save to history.

**Request** — `application/json`
```json
{
  "session_id": "uuid",
  "answers": { "0": 2, "1": 0, "2": 3 }
}
```

**Response 200**
```json
{
  "session_id": "uuid",
  "score": 7,
  "total_questions": 10,
  "percentage": 70.0,
  "passed": true,
  "correct_count": 7,
  "wrong_count": 3,
  "difficulty": "medium",
  "filename": "lecture.pptx",
  "results": [
    {
      "question_number": 1,
      "question": "…",
      "options": ["A","B","C","D"],
      "correct_answer": 2,
      "correct_text": "C",
      "user_answer": 2,
      "user_answer_text": "C",
      "is_correct": true,
      "explanation": "…"
    }
  ]
}
```

---

### `GET /api/history`

Return the last 50 quiz submissions (newest first).

**Response 200**
```json
{
  "history": [
    {
      "id": "uuid",
      "filename": "lecture.pptx",
      "difficulty": "medium",
      "score": 7,
      "total_questions": 10,
      "percentage": 70.0,
      "passed": true,
      "timestamp": "2026-07-04T02:30:00Z"
    }
  ]
}
```

---

### `GET /api/session/<session_id>`

Retrieve metadata for a session (debugging).

**Response 200**
```json
{
  "filename": "lecture.pptx",
  "slide_count": 12,
  "total_words": 1480,
  "has_questions": false
}
```

---

## Logging & Observability

Every generation request emits structured log lines:

```
2026-07-04 02:30:00 [INFO] quizcraft — [GEN-START] session=abc  questions=10  difficulty=medium  content_chars=4200
2026-07-04 02:30:22 [INFO] quizcraft — [GEN-OK] session=abc  latency=22.14s  tokens=1120(in)/843(out)  cost=$0.000000  questions=10  model=deepseek/deepseek-chat-v3-0324:free
```

Fields logged on every AI call:
- `model` — model identifier
- `latency_seconds` — wall-clock time for the API round-trip
- `input_tokens` / `output_tokens` — from the OpenRouter usage object
- `estimated_cost_usd` — calculated from `COST_PER_1K_INPUT/OUTPUT` env vars
- `success` — `true` / `false`
- `error` — populated on failure

---

## Security Notes

1. **Prompt injection** — `sanitize_content()` in `file_utils.py` strips any slide line containing known injection phrases (e.g. "ignore previous instructions") before the text reaches the AI model. Content is also truncated to 12 000 characters.
2. **API key** — `OPENROUTER_API_KEY` lives only in `backend/.env` and is read server-side. It is never returned in any API response and never appears in the frontend bundle.
3. **File validation** — extension and MIME-like checks are done before saving; file size is capped at 50 MB by Flask.
4. **CORS** — all `/api/*` routes accept any origin in development. Lock `origins` to your deployment domain in production.
5. **Uploaded files** — stored in `backend/uploads/` with a UUID filename to prevent path-traversal attacks. The original filename is only stored in the session dict and returned in API responses.

---

## Troubleshooting

### "Cannot connect to the backend"

- Make sure `python app.py` is running in the `backend/` folder.
- Check it is listening on port 5000: `netstat -an | findstr 5000` (Windows).
- Confirm `VITE_API_URL=` is **empty** in `frontend/.env`.

### "OpenRouter API key is invalid or expired"

- Verify the key in `backend/.env` starts with `sk-or-v1-`.
- Test it directly: `curl https://openrouter.ai/api/v1/models -H "Authorization: Bearer sk-or-v1-…"`

### "No text content found in this presentation"

- The PPTX contains only images/diagrams with no text boxes.
- Add text to at least one slide, or use a different presentation.

### Quiz generation times out

- The free DeepSeek model can be slow under load. Retry in a few seconds.
- If it consistently times out, reduce `question_count` to 5.

### Upload works but history is empty after restart

- History is stored in memory. It resets when Flask restarts. This is expected for the current implementation (see Known Limitations).

### Vite port conflicts

- If port 3000 is busy, Vite auto-increments to 3001. The backend proxy in `vite.config.js` is port-agnostic; just update `SITE_URL` in `backend/.env` if needed.

---

## Known Limitations

| Limitation | Workaround / Future Fix |
|---|---|
| History is in-memory | Replace `quiz_history` list with SQLite / PostgreSQL |
| Old `.ppt` (binary) format not fully supported | Convert to `.pptx` in PowerPoint, or add LibreOffice conversion |
| No user authentication | Add Flask-Login or JWT for multi-user support |
| Single-process Flask in dev | Use gunicorn with multiple workers in production |
| No file cleanup | Add a background job to delete old uploads after 24 h |

---

## License

MIT License — see [LICENSE](LICENSE) for details.
