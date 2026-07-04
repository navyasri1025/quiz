import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Flag,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import QuestionPalette from '../components/QuestionPalette';

export default function QuizScreen() {
  const { questions, currentQuestion, answers, sessionId, submitQuiz, dispatch } =
    useQuiz();

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const [timeLeft, setTimeLeft] = useState(totalQuestions * 30); // 30 s per question
  const [showPalette, setShowPalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Keep a ref to the latest submit function so the timer's setInterval
  // closure always calls the current version and never goes stale.
  const submitRef = useRef(null);

  const performSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitQuiz(sessionId, answers);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, answers, submitQuiz, submitting]);

  // Always point the ref at the latest performSubmit so the timer can call it
  // without needing performSubmit in the timer's own dependency array.
  submitRef.current = performSubmit;

  // Countdown timer — uses the ref to avoid stale-closure lint warnings.
  useEffect(() => {
    if (timeLeft <= 0) {
      submitRef.current();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex) => {
    dispatch({
      type: 'SET_ANSWER',
      payload: { questionIndex: currentQuestion, answer: optionIndex },
    });
  };

  const goTo = (index) =>
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: index });

  const question = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No questions available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Question</span>
              <span className="text-white font-semibold">{currentQuestion + 1}</span>
              <span className="text-gray-400">/ {totalQuestions}</span>
            </div>
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="btn-secondary text-xs px-3 py-1.5"
              aria-label="Toggle question palette"
            >
              <Flag className="w-3.5 h-3.5 inline mr-1" />
              Palette
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer — turns red when under 60 seconds */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                timeLeft < 60 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-gray-300'
              }`}
              role="timer"
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-400">
              <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-green-400" />
              {answeredCount}/{totalQuestions}
            </div>
          </div>
        </motion.div>

        {/* ── Progress bar ─────────────────────────────────────────────── */}
        <div className="w-full bg-white/5 rounded-full h-2 mb-8" role="progressbar"
          aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={totalQuestions}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex gap-6">
          {/* ── Question + options ──────────────────────────────────────── */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question card */}
                <div className="card mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-lg font-bold text-primary-400 shrink-0">
                      {currentQuestion + 1}
                    </div>
                    <h2 className="text-xl font-semibold text-white leading-relaxed">
                      {question.question}
                    </h2>
                  </div>
                </div>

                {/* Answer options */}
                <div className="space-y-3" role="radiogroup" aria-label="Answer options">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    return (
                      <motion.button
                        key={index}
                        role="radio"
                        aria-checked={isSelected}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        onClick={() => handleAnswer(index)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-300 flex items-center gap-4 ${
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500/40 border'
                            : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 ${
                            isSelected
                              ? 'bg-primary-500 text-white'
                              : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span
                          className={`text-base ${isSelected ? 'text-white' : 'text-gray-300'}`}
                        >
                          {option}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <CheckCircle className="w-5 h-5 text-primary-400" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Submit error */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{submitError}</p>
              </motion.div>
            )}

            {/* ── Navigation ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mt-8"
            >
              <button
                onClick={() => goTo(currentQuestion - 1)}
                disabled={currentQuestion === 0}
                className="btn-secondary flex items-center gap-2"
                aria-label="Previous question"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentQuestion === totalQuestions - 1 ? (
                <button
                  onClick={performSubmit}
                  disabled={submitting || answeredCount < totalQuestions}
                  className="btn-success flex items-center gap-2"
                  aria-label="Submit quiz"
                  title={
                    answeredCount < totalQuestions
                      ? `Answer all questions before submitting (${totalQuestions - answeredCount} remaining)`
                      : 'Submit your answers'
                  }
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" fill="none"
                        />
                        <path
                          className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Submitting…
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Quiz
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => goTo(currentQuestion + 1)}
                  className="btn-primary flex items-center gap-2"
                  aria-label="Next question"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>

          {/* ── Desktop palette ─────────────────────────────────────────── */}
          <div className="hidden lg:block w-64 shrink-0">
            <QuestionPalette
              total={totalQuestions}
              current={currentQuestion}
              answers={answers}
              onSelect={goTo}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile palette modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:hidden"
            onClick={() => setShowPalette(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Question palette"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <QuestionPalette
                total={totalQuestions}
                current={currentQuestion}
                answers={answers}
                onSelect={(index) => {
                  goTo(index);
                  setShowPalette(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
