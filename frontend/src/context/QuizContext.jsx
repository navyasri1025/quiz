/**
 * QuizContext.jsx — Global state management for QuizCraft AI.
 *
 * The context owns:
 *   - Screen navigation (upload → configure → generating → quiz → results)
 *   - Upload, generation, quiz, and results state
 *   - Quiz history list
 *
 * All network calls are delegated to api.js so this file contains no fetch()
 * calls and no URL strings — pure state + orchestration logic.
 */
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as api from '../api';

const QuizContext = createContext(null);

const initialState = {
  // Current screen in the quiz flow
  screen: 'upload', // 'upload' | 'configure' | 'generating' | 'quiz' | 'results'

  // ── Upload ───────────────────────────────────────────────────────────────
  sessionId: null,
  filename: null,
  slideCount: 0,
  totalWords: 0,
  slides: [],
  uploading: false,
  uploadError: null,

  // ── Configure ────────────────────────────────────────────────────────────
  questionCount: 10,
  difficulty: 'medium',

  // ── Generating ───────────────────────────────────────────────────────────
  generating: false,
  generationProgress: 0,
  generationStatus: '',
  generationError: null,

  // ── Quiz ─────────────────────────────────────────────────────────────────
  questions: [],
  currentQuestion: 0,
  answers: {},
  quizStarted: false,
  quizSubmitted: false,

  // ── Results ──────────────────────────────────────────────────────────────
  results: null,

  // ── History ──────────────────────────────────────────────────────────────
  history: [],
  historyLoading: false,
};

function quizReducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    // Upload
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

    // Configure
    case 'SET_QUESTION_COUNT':
      return { ...state, questionCount: Math.max(5, Math.min(30, action.payload)) };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };

    // Generation
    case 'GENERATE_START':
      return {
        ...state,
        screen: 'generating',
        generating: true,
        generationProgress: 0,
        generationStatus: 'Initializing AI engine…',
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

    // Quiz interaction
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionIndex]: action.payload.answer,
        },
      };
    case 'SUBMIT_QUIZ':
      return { ...state, quizSubmitted: true };

    // Results
    case 'SET_RESULTS':
      return { ...state, results: action.payload, screen: 'results' };

    // Reset — keeps history so the Analytics tab stays populated.
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

  // ── uploadFile ──────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file) => {
    dispatch({ type: 'UPLOAD_START' });
    try {
      const data = await api.uploadFile(file);
      dispatch({ type: 'UPLOAD_SUCCESS', payload: data });
      return data;
    } catch (err) {
      dispatch({ type: 'UPLOAD_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  // ── generateQuiz ────────────────────────────────────────────────────────
  const generateQuiz = useCallback(async (sessionId, questionCount, difficulty) => {
    dispatch({ type: 'GENERATE_START' });

    // Simulate visual progress steps while the real API call runs in parallel.
    const steps = [
      { progress: 10, status: 'Analyzing presentation content…' },
      { progress: 25, status: 'Extracting key concepts…' },
      { progress: 40, status: 'Sending content to DeepSeek AI…' },
      { progress: 55, status: 'AI is generating questions…' },
      { progress: 70, status: 'Validating question quality…' },
      { progress: 85, status: 'Formatting quiz structure…' },
      { progress: 95, status: 'Finalizing your quiz…' },
    ];

    const progressPromise = (async () => {
      for (const step of steps) {
        dispatch({ type: 'GENERATE_PROGRESS', payload: step });
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      }
    })();

    try {
      const data = await api.generateQuiz(sessionId, questionCount, difficulty);

      // Let the progress animation finish before revealing the quiz screen.
      await progressPromise;

      dispatch({
        type: 'GENERATE_PROGRESS',
        payload: { progress: 100, status: 'Quiz generated successfully!' },
      });
      setTimeout(() => {
        dispatch({ type: 'GENERATE_SUCCESS', payload: data });
      }, 500);

      return data;
    } catch (err) {
      dispatch({ type: 'GENERATE_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  // ── submitQuiz ──────────────────────────────────────────────────────────
  const submitQuiz = useCallback(async (sessionId, answers) => {
    const data = await api.submitQuiz(sessionId, answers);
    dispatch({ type: 'SET_RESULTS', payload: data });
    dispatch({ type: 'SUBMIT_QUIZ' });
    return data;
  }, []);

  // ── fetchHistory ────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    dispatch({ type: 'SET_HISTORY_LOADING', payload: true });
    try {
      const data = await api.fetchHistory();
      dispatch({ type: 'SET_HISTORY', payload: data.history ?? [] });
    } catch (err) {
      // Non-fatal: log silently so the app still works offline.
      console.warn('[QuizContext] fetchHistory failed:', err.message);
    } finally {
      dispatch({ type: 'SET_HISTORY_LOADING', payload: false });
    }
  }, []);

  // ── resetQuiz ───────────────────────────────────────────────────────────
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
  if (!ctx) throw new Error('useQuiz must be used within a QuizProvider');
  return ctx;
}
