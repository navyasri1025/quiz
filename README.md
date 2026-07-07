# 🚀 QuizCraft AI

## 📖 Project Overview

QuizCraft AI is an AI-powered quiz generation platform that transforms PowerPoint presentations into interactive multiple-choice quizzes using DeepSeek AI through OpenRouter.

Users simply upload a PowerPoint presentation, configure quiz settings such as difficulty level and number of questions, and the application automatically generates intelligent MCQs from the presentation content. After completing the quiz, users receive detailed performance analytics, answer explanations, and quiz history.

Developed as part of the **GenAI & Agentic AI Engineering – BVRIT Student Programme**.

---

# ✨ Features

📂 Upload PPT/PPTX presentations

🤖 AI-powered quiz generation using DeepSeek Chat V3

📚 Easy, Medium and Hard difficulty levels

❓ Customizable number of questions

⚡ Fast AI generation with loading progress

📝 Interactive quiz interface

⏱ Timer for every question

📍 Question Palette for quick navigation

📊 Real-time quiz progress tracking

✅ Instant score calculation

📖 Detailed answer explanations

📈 Performance Analytics Dashboard

📚 Quiz History

🌙 Dark / Light Theme

📱 Fully Responsive UI

🔐 Secure API key management using .env

🛡 Prompt Injection Protection

📂 Secure file upload validation

⚠ Independent backend error handling

---

# 🛠 Technologies Used

## Frontend

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React

## Backend

- Python
- Flask
- Flask-CORS
- python-pptx
- OpenRouter API
- DeepSeek Chat V3
- python-dotenv

---

# 🏗 Architecture

The application follows a clean client-server architecture.

### Frontend (React)

Responsible for

- PowerPoint upload
- Quiz configuration
- AI generation screen
- Quiz interface
- Timer management
- Results page
- Analytics dashboard
- Quiz history
- Theme management

### Backend (Flask)

Responsible for

- File validation
- PPT text extraction
- Content sanitization
- AI prompt generation
- OpenRouter communication
- Quiz generation
- Response validation
- Session management
- Score calculation
- Logging

The backend returns

- Quiz Questions
- Multiple Choice Options
- Correct Answers
- Explanations
- Quiz Score
- Analytics
- Session Information

---

# 📁 Folder Structure

```
quiz/

├── backend/
│   ├── app.py
│   ├── config.py
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── README.md
├── .gitignore
└── .env.example
```

---

# ⚙ Requirements

- Python 3.10+
- Node.js 18+
- npm
- OpenRouter API Key

---

# 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/navyasri1025/quiz.git
```

### Navigate to Project

```bash
cd quiz
```

### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Create Backend .env

```env
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
FLASK_DEBUG=true
SITE_URL=http://localhost:3000
```

---

# ▶ Running the Backend

```bash
cd backend
python app.py
```

Backend runs on

```
http://localhost:5000
```

---

# ▶ Running the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on

```
http://localhost:3000
```

---

# 🎥 Demo Video

Watch the complete project demonstration here.

🔗 **Demo Video:**  
https://drive.google.com/file/d/1UTTjfTzK91_R-QMpWVL5bllforcGk0Le/view?usp=sharing

**Video Demonstrates**

✅ PPT Upload

✅ AI Quiz Generation

✅ Quiz Configuration

✅ Interactive Quiz

✅ Question Navigation

✅ Timer

✅ Quiz Submission

✅ Results Dashboard

✅ Performance Analytics

✅ Quiz History

---

# 🤖 AI Workflow

Upload Presentation

↓

Extract Slide Text

↓

Sanitize Content

↓

Generate AI Prompt

↓

DeepSeek AI (OpenRouter)

↓

Generate Quiz

↓

Interactive Quiz

↓

Submit Answers

↓

Score Calculation

↓

Analytics Dashboard

↓

Quiz History

---

# 📊 Analytics

The application provides

📈 Score Percentage

📊 Correct vs Wrong Answers

📉 Performance Graph

🏆 Best Score

📚 Quiz History

🎯 Difficulty Statistics

---

# 🔒 Security

✅ Prompt Injection Protection

✅ Secure File Validation

✅ UUID File Storage

✅ Backend API Key Protection

✅ Request Validation

✅ Content Sanitization

✅ Error Handling

---

# 🧪 Testing

The project has been manually tested for

✅ PPT Upload

✅ Invalid File Upload

✅ Large Presentation

✅ Empty Presentation

✅ AI Generation

✅ Quiz Submission

✅ API Failure Handling

✅ Invalid API Key

✅ Session Management

✅ Responsive Design

---

# 🔮 Future Improvements

👤 User Authentication

☁ Cloud Database Integration

📄 PDF & DOCX Support

🖼 OCR for Image Slides

🎤 Voice-based Quiz

🌍 Multi-language Quiz Generation

🏫 Teacher Dashboard

👨‍🎓 Student Dashboard

📥 Export Results as PDF

🏆 Leaderboard

📈 AI Performance Insights

---

# 📚 Learning Outcomes

During the development of QuizCraft AI, the following concepts were learned and implemented

- React Context API
- Flask Backend Development
- REST API Design
- Prompt Engineering
- AI Integration using OpenRouter
- PowerPoint Parsing
- State Management
- Secure File Upload
- API Integration
- Data Visualization
- Responsive UI Development

---

# 📄 License

MIT License.

---

# 👩‍💻 Author

**Navya Sri Buggana**

Developed as part of the TechVest Agentic AI Engineering Program at BVRIT Hyderabad College of Engineering for Women.

GitHub: https://github.com/navyasri1025

---