import React, { createContext, useContext, useReducer, useCallback } from 'react';

const QuizContext = createContext(null);

const initialState = {
  // Screen: 'upload' | 'configure' | 'generating' | 'quiz' | 'results'
  screen: 'upload',

  // Upload
  sessionId: null,
  filename: null,
  slideCount: 0,
  totalWords: 0,
  slides: [],
  uploading: false,
  uploadError: null,

  // Configure
  questionCount: 10,
  difficulty: 'medium',

  // Generating
  generating: false,
  generationProgress: 0,
  generationStatus: '',
  generationError: null,

  // Quiz
  questions: [],
  currentQuestion: 0,
  answers: {},
  quizStarted: false,
  quizSubmitted: false,

  // Results
  results: null,

  // History
  history: [],
  historyLoading: false,
};

function quizReducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    // Upload actions
    case 'UPLOAD_START':
      return { ...state, uploading: true, uploadError: null };
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        uploading: false,
        sessionId: action.payload.session_id,
        filename: action.payload.filename,
        slideCount: action.payload.slide_count,
        totalWords: action.payload.total_words,
        slides: action.payload.slides,
        screen: 'configure',
      };
    case 'UPLOAD_ERROR':
      return { ...state, uploading: false, uploadError: action.payload };

    // Configure actions
    case 'SET_QUESTION_COUNT':
      return { ...state, questionCount: Math.max(5, Math.min(30, action.payload)) };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };

    // Generation actions
    case 'GENERATE_START':
      return {
        ...state,
        screen: 'generating',
        generating: true,
        generationProgress: 0,
        generationStatus: 'Initializing AI engine...',
        generationError: null,
      };
    case 'GENERATE_PROGRESS':
      return {
        ...state,
        generationProgress: action.payload.progress,
        generationStatus: action.payload.status,
      };
    case 'GENERATE_SUCCESS':
      return {
        ...state,
        generating: false,
        generationProgress: 100,
        generationStatus: 'Quiz generated successfully!',
        questions: action.payload.questions,
        screen: 'quiz',
        quizStarted: true,
        currentQuestion: 0,
        answers: {},
      };
    case 'GENERATE_ERROR':
      return {
        ...state,
        screen: 'configure',
        generating: false,
        generationError: action.payload,
      };

    // Quiz actions
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.payload.questionIndex]: action.payload.answer },
      };
    case 'SUBMIT_QUIZ':
      return { ...state, quizSubmitted: true };

    // Results
    case 'SET_RESULTS':
      return { ...state, results: action.payload, screen: 'results' };

    // Reset
    case 'RESET':
      return { ...initialState, history: state.history };

    // History
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'SET_HISTORY_LOADING':
      return { ...state, historyLoading: action.payload };

    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  const uploadFile = useCallback(async (file) => {
    dispatch({ type: 'UPLOAD_START' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned HTML instead of JSON. Flask server may not be running. Response: ${text.substring(0, 100)}`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      dispatch({ type: 'UPLOAD_SUCCESS', payload: data });
      return data;
    } catch (err) {
      const errorMsg = err.message.includes('Failed to fetch')
        ? 'Cannot connect to server. Make sure Flask backend is running on port 5000.'
        : err.message;
      dispatch({ type: 'UPLOAD_ERROR', payload: errorMsg });
      throw err;
    }
  }, []);

  const generateQuiz = useCallback(async (sessionId, questionCount, difficulty) => {
    dispatch({ type: 'GENERATE_START' });

    const steps = [
      { progress: 10, status: 'Analyzing presentation content...' },
      { progress: 25, status: 'Extracting key concepts and topics...' },
      { progress: 40, status: 'Sending content to DeepSeek AI...' },
      { progress: 55, status: 'AI is generating questions...' },
      { progress: 70, status: 'Validating question quality...' },
      { progress: 85, status: 'Formatting quiz structure...' },
      { progress: 95, status: 'Finalizing your quiz...' },
    ];

    // Run progress simulation in parallel with the actual API call
    const progressPromise = (async () => {
      for (const step of steps) {
        dispatch({ type: 'GENERATE_PROGRESS', payload: step });
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      }
    })();

    try {
      // Run actual API call in parallel
      const res = await fetch(`${getApiBaseUrl()}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question_count: questionCount, difficulty }),
      });
      
      // Wait for progress simulation to catch up
      await progressPromise;
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned HTML. Flask backend may not be running.`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      dispatch({ type: 'GENERATE_PROGRESS', payload: { progress: 100, status: 'Quiz generated successfully!' } });
      setTimeout(() => {
        dispatch({ type: 'GENERATE_SUCCESS', payload: data });
      }, 500);
      return data;
    } catch (err) {
      const errorMsg = err.message.includes('Failed to fetch')
        ? 'Cannot connect to Flask server. Make sure it is running on port 5000.'
        : err.message;
      dispatch({ type: 'GENERATE_ERROR', payload: errorMsg });
      throw err;
    }
  }, []);

  const submitQuiz = useCallback(async (sessionId, answers) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/submit-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      dispatch({ type: 'SET_RESULTS', payload: data });
      dispatch({ type: 'SUBMIT_QUIZ' });
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    dispatch({ type: 'SET_HISTORY_LOADING', payload: true });
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/history`);
      const data = await res.json();
      dispatch({ type: 'SET_HISTORY', payload: data.history || [] });
    } catch {
      // Silent fail
    } finally {
      dispatch({ type: 'SET_HISTORY_LOADING', payload: false });
    }
  }, []);

  const resetQuiz = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = {
    ...state,
    dispatch,
    uploadFile,
    generateQuiz,
    submitQuiz,
    fetchHistory,
    resetQuiz,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}