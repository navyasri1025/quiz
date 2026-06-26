# QuizCraft AI

An AI-powered quiz generator that transforms PowerPoint presentations into interactive quizzes. Built with a React + Vite frontend and a Flask backend, using OpenRouter and DeepSeek AI for intelligent question generation.

## Features

- Upload PPT/PPTX presentations
- Generate AI-powered quizzes
- Choose difficulty (Easy, Medium, Hard)
- Interactive quiz interface with timer
- AI explanations for answers
- Quiz history and analytics dashboard
- Dark & Light mode
- Responsive UI with smooth animations

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Framer Motion
- Recharts

### Backend
- Flask
- Python
- python-pptx
- OpenRouter API
- Flask-CORS

## Project Structure

```text
quiz/
├── backend/
│   ├── app.py
│   ├── uploads/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
└── README.md
```

## Installation

Clone the repository:

```bash
git clone https://github.com/navyasri1025/quiz.git
cd quiz
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
FLASK_DEBUG=true
OPENROUTER_API_KEY=your_openrouter_api_key
SITE_URL=http://localhost:3000
```

## API Endpoints

- `POST /api/upload` – Upload PowerPoint
- `POST /api/generate-quiz` – Generate AI quiz
- `POST /api/submit-quiz` – Submit answers
- `GET /api/history` – View quiz history

## License

MIT License
