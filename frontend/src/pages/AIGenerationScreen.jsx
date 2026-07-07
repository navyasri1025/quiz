import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader, AlertCircle, ArrowLeft } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

// lucide-react v1 does not export Sparkles — use an inline SVG instead.
function SparklesIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

// Progress steps shown in the generation screen — kept in sync with the
// steps array in QuizContext so the checkmarks light up at the right time.
const PROGRESS_STEPS = [
  { threshold: 10, label: 'Analyzing presentation content' },
  { threshold: 25, label: 'Extracting key concepts' },
  { threshold: 40, label: 'Sending to DeepSeek AI' },
  { threshold: 55, label: 'AI generating questions' },
  { threshold: 70, label: 'Validating question quality' },
  { threshold: 85, label: 'Formatting quiz structure' },
  { threshold: 95, label: 'Finalizing your quiz' },
];

export default function AIGenerationScreen() {
  const { generationProgress, generationStatus, generationError, dispatch } = useQuiz();

  // ── Error state — show a clear message and a back button ──────────────
  if (generationError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Generation Failed</h2>
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left break-words">
            {generationError}
          </p>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'configure' })}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Configure
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-20 right-20 w-40 h-40 bg-accent-500/10 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg w-full"
        role="status"
        aria-live="polite"
        aria-label={`Generating quiz: ${generationStatus}`}
      >
        {/* Animated AI icon */}
        <div className="relative mb-8 inline-block">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-12 h-12 text-primary-400" />
            </motion.div>
          </motion.div>

          {/* Sparkle badge — purely decorative */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2"
            aria-hidden="true"
          >
            <SparklesIcon className="w-6 h-6 text-accent-400" />
          </motion.div>
        </div>

        {/* Heading + status message */}
        <h2 className="text-2xl font-bold text-white mb-3">
          AI is Generating Your Quiz
        </h2>
        <p className="text-gray-400 mb-8">{generationStatus}</p>

        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-3 p-0.5 mb-4">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
            initial={{ width: '0%' }}
            animate={{ width: `${generationProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Step checklist */}
        <div className="space-y-3 text-left">
          {PROGRESS_STEPS.map((step, i) => {
            const done = generationProgress >= step.threshold;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: done ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    done ? 'bg-primary-400' : 'bg-gray-600'
                  }`}
                />
                <span
                  className={`text-sm ${done ? 'text-primary-300' : 'text-gray-500'}`}
                >
                  {step.label}
                </span>
                {done && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto text-xs text-green-400"
                    aria-label="Complete"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Spinner footer note */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500"
        >
          <Loader className="w-4 h-4 animate-spin" />
          <span>This may take up to 30 seconds</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
