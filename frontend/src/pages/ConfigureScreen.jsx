import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Sliders, Brain, BarChart3, ChevronRight, AlertCircle, BookOpen, FileText } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

export default function ConfigureScreen() {
  const { questionCount, difficulty, slides, filename, slideCount, totalWords, sessionId, generateQuiz, generating, dispatch } = useQuiz();
  const [localError, setLocalError] = useState(null);

  const difficulties = [
    { id: 'easy', label: 'Easy', icon: Brain, desc: 'Basic recall & understanding', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
    { id: 'medium', label: 'Medium', icon: BarChart3, desc: 'Comprehension & application', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' },
    { id: 'hard', label: 'Hard', icon: Brain, desc: 'Analysis & synthesis', color: 'from-red-500/20 to-rose-500/20 border-red-500/30' },
  ];

  const handleGenerate = async () => {
    if (!sessionId) {
      setLocalError('Session expired. Please upload again.');
      return;
    }
    try {
      setLocalError(null);
      await generateQuiz(sessionId, questionCount, difficulty);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-20 w-96 h-96 bg-accent-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <span>Upload</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-400 font-medium">Configure</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-500">Generate</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-500">Quiz</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-500">Results</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Configure Your <span className="text-gradient">Quiz</span>
          </h1>
          <p className="text-gray-400">Customize the quiz parameters for your presentation</p>
        </motion.div>

        {/* File Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/15">
              <FileText className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{filename}</h3>
              <div className="flex gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {slideCount} slides
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {totalWords.toLocaleString()} words
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Count */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary-500/15">
                <Sliders className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Question Count</h3>
                <p className="text-sm text-gray-400">Choose between 5-30 questions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gradient">{questionCount}</span>
                <span className="text-sm text-gray-400">questions</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={questionCount}
                onChange={(e) => dispatch({ type: 'SET_QUESTION_COUNT', payload: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6366f1 ${((questionCount - 5) / 25) * 100}%, rgba(255,255,255,0.1) ${((questionCount - 5) / 25) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>
          </motion.div>

          {/* Slide Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent-500/15">
                <BookOpen className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Content Summary</h3>
                <p className="text-sm text-gray-400">Preview of uploaded slides</p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {slides.slice(0, 5).map((slide, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-6 h-6 rounded-md bg-primary-500/20 flex items-center justify-center text-xs font-medium text-primary-400 shrink-0">
                    {slide.slide_number}
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {slide.text.slice(0, 100)}{slide.text.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
              {slides.length > 5 && (
                <p className="text-xs text-center text-gray-500">+{slides.length - 5} more slides</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Difficulty Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-white">Difficulty Level</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficulties.map((d) => {
              const isActive = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => dispatch({ type: 'SET_DIFFICULTY', payload: d.id })}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${d.color} shadow-lg`
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg inline-block mb-3 ${isActive ? 'bg-white/10' : 'bg-primary-500/10'}`}>
                    <d.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">{d.label}</h4>
                  <p className="text-xs text-gray-400">{d.desc}</p>
                  {isActive && (
                    <motion.div
                      layoutId="difficultyIndicator"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-dark-900"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        {localError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{localError}</p>
          </motion.div>
        )}

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary text-lg px-12 py-4"
          >
            {generating ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                Generate Quiz with AI
                <Brain className="w-5 h-5" />
              </span>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}