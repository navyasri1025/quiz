import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Loader } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

export default function AIGenerationScreen() {
  const { generationProgress, generationStatus } = useQuiz();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-20 right-20 w-40 h-40 bg-accent-500/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        {/* AI Icon Animation */}
        <div className="relative mb-8">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-accent-400" />
          </motion.div>
        </div>

        {/* Status */}
        <h2 className="text-2xl font-bold text-white mb-3">
          AI is Generating Your Quiz
        </h2>
        <p className="text-gray-400 mb-8">{generationStatus}</p>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-3 p-0.5 mb-4">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
            initial={{ width: '0%' }}
            animate={{ width: `${generationProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 text-left">
          {[
            { progress: 10, label: 'Analyzing presentation content' },
            { progress: 25, label: 'Extracting key concepts' },
            { progress: 40, label: 'Sending to DeepSeek AI' },
            { progress: 55, label: 'AI generating questions' },
            { progress: 70, label: 'Validating question quality' },
            { progress: 85, label: 'Formatting quiz structure' },
            { progress: 95, label: 'Finalizing your quiz' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: generationProgress >= step.progress ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-2 h-2 rounded-full ${
                generationProgress >= step.progress ? 'bg-primary-400' : 'bg-gray-600'
              }`} />
              <span className={`text-sm ${
                generationProgress >= step.progress ? 'text-primary-300' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {generationProgress >= step.progress && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-xs text-green-400"
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Loading spinner */}
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