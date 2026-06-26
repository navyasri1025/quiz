import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Flag, Send } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import QuestionPalette from '../components/QuestionPalette';

export default function QuizScreen() {
  const { questions, currentQuestion, answers, sessionId, submitQuiz, dispatch } = useQuiz();
  const [timeLeft, setTimeLeft] = useState(questions.length * 30); // 30 seconds per question
  const [showPalette, setShowPalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      performSubmit();
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

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: currentQuestion + 1 });
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: currentQuestion - 1 });
    }
  };

  const performSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitQuiz(sessionId, answers);
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, answers, submitQuiz, submitting]);

  const handleSubmit = performSubmit;

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Top Bar */}
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
            >
              <Flag className="w-3.5 h-3.5 inline mr-1" />
              Palette
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              timeLeft < 60 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-gray-300'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-400">
              <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-green-400" />
              {answeredCount}/{totalQuestions}
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-2 mb-8">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question */}
                <div className="card mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-lg font-bold text-primary-400 shrink-0">
                      {currentQuestion + 1}
                    </div>
                    <h2 className="text-xl font-semibold text-white leading-relaxed">
                      {question.question}
                    </h2>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = question.correctAnswer === index;
                    const showResult = false; // Only show after submission

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleAnswer(index)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-300 flex items-center gap-4 ${
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500/40 border'
                            : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className={`text-base ${isSelected ? 'text-white' : 'text-gray-300'}`}>
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

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mt-8"
            >
              <button
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentQuestion === totalQuestions - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || answeredCount < totalQuestions}
                  className="btn-success flex items-center gap-2"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
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
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Question Palette - Desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <QuestionPalette
              total={totalQuestions}
              current={currentQuestion}
              answers={answers}
              onSelect={(index) => dispatch({ type: 'SET_CURRENT_QUESTION', payload: index })}
            />
          </div>
        </div>
      </div>

      {/* Mobile Palette Modal */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:hidden"
            onClick={() => setShowPalette(false)}
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
                  dispatch({ type: 'SET_CURRENT_QUESTION', payload: index });
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