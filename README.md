# QuizCraft AI - Intelligent Quiz Generator

Transform your PowerPoint presentations into interactive AI-powered quizzes with ease. Built with React + Vite frontend and Flask backend, powered by DeepSeek AI through OpenRouter.

## Features

### 🎯 Core Features
- **PPT/PPTX Upload** - Drag & drop file upload with slide content extraction
- **AI Quiz Generation** - Powered by DeepSeek models via OpenRouter
- **Configurable Difficulty** - Easy, Medium, or Hard question levels
- **Interactive Quiz Interface** - One question at a time with timer and progress tracking
- **Detailed Results** - Score, percentage, AI explanations for each question
- **Question Palette** - Navigate questions easily with visual progress indicator

### ✨ Premium UI
- **Glassmorphism Design** - Modern, translucent UI elements
- **Dark/Light Theme** - Toggle between dark and light modes
- **Framer Motion Animations** - Smooth, professional transitions
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Professional Typography** - Inter font family with proper hierarchy

### 📊 Analytics & Bonus Features
- **Quiz History** - Track all your completed quizzes
- **Analytics Dashboard** - Score trends, difficulty distribution, stats
- **Pie Chart** - Visual score distribution (correct vs wrong)
- **Bar Chart** - Per-question result visualization
- **Confetti Effect** - Celebratory animation for high scores
- **Study Summary** - Comprehensive review with AI explanations

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 6** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Recharts** - Charting library

### Backend
- **Flask** - Python web framework
- **python-pptx** - PPTX file parsing
- **OpenRouter API** - Access to DeepSeek models
- **Flask-CORS** - Cross-origin resource sharing

## Project Structure

```
quiz/
├── backend/
│   ├── app.py              # Flask application with all API routes
│   ├── uploads/            # Uploaded PPTX files
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main app with routing and layout
│   │   ├── index.css       # Global styles + glassmorphism utilities
│   │   ├── context/
│   │   │   ├── QuizContext.jsx    # Quiz state management
│   │   │   └── ThemeContext.jsx   # Dark/light theme
│   │   ├── pages/
│   │   │   ├── UploadScreen.jsx        # File upload interface
│   │   │   ├── ConfigureScreen.jsx     # Quiz configuration
│   │   │   ├── AIGenerationScreen.jsx  # AI generation progress
│   │   │   ├── QuizScreen.jsx          # Active quiz interface
│   │   │   └── ResultScreen.jsx        # Results & analytics
│   │   └── components/
│   │       ├── QuestionPalette.jsx      # Question navigation grid
│   │       ├── AnalyticsDashboard.jsx   # Analytics with charts
│   │       ├── QuizHistory.jsx          # Past quiz records
│   │       ├── Confetti.jsx             # Confetti celebration
│   │       └── ThemeToggle.jsx          # Dark/light switcher
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
├── .env.example           # Environment variables template
├── .gitignore
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- OpenRouter API key ([get one free](https://openrouter.ai/keys))

### Backend Setup

```bash
# Navigate to backend directory
cd quiz/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env in the quiz/ directory
cp ../.env.example ../.env
# Edit .env and add your OpenRouter API key:
# OPENROUTER_API_KEY=your_key_here

# Run the backend server
python app.py
```

The backend will start on `http://localhost:5000`.

### Frontend Setup

```bash
# Navigate to frontend directory
cd quiz/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000` with API proxy to backend.

### Environment Variables

Create a `.env` file in the `quiz/` directory:

```env
# Backend Configuration
PORT=5000
FLASK_DEBUG=true

# OpenRouter API Key (required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Site URL
SITE_URL=http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload PPT/PPTX file |
| POST | `/api/generate-quiz` | Generate quiz from uploaded content |
| POST | `/api/submit-quiz` | Submit answers and get results |
| GET | `/api/history` | Get quiz history |
| GET | `/api/session/:id` | Get session info |

## Usage

1. **Upload** - Drag and drop a PPT/PPTX file or click to browse
2. **Configure** - Set question count (5-30) and difficulty level
3. **Generate** - AI processes your content and creates questions
4. **Quiz** - Answer questions with timer, navigation, and palette
5. **Results** - View score, charts, explanations, and analytics

## Running the Complete Application

**Terminal 1 - Backend:**
```bash
cd quiz/backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd quiz/frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

## License

MIT