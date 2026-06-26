import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Upload, CheckCircle, XCircle, Brain, Clock, Target, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Confetti from '../components/Confetti';
import { useQuiz } from '../context/QuizContext';

export default function ResultScreen() {
  const { results, resetQuiz } = useQuiz();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (results && results.percentage >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [results]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No results available.</p>
      </div>
    );
  }

  const {
    score,
    total_questions,
    percentage,
    passed,
    correct_count,
    wrong_count,
    results: questionResults,
    difficulty,
    filename,
  } = results;

  // Pie chart data
  const pieData = [
    { name: 'Correct', value: correct_count, color: '#34d399' },
    { name: 'Wrong', value: wrong_count, color: '#f87171' },
  ];

  // Bar chart data - score distribution
  const barData = questionResults.map((r, i) => ({
    question: `Q${i + 1}`,
    result: r.is_correct ? 1 : 0,
  }));

  const difficultyColor = {
    easy: 'badge-success',
    medium: 'badge-warning',
    hard: 'badge-error',
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {showConfetti && <Confetti />}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{
              background: passed
                ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.2))',
              border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <Trophy className={`w-10 h-10 ${passed ? 'text-green-400' : 'text-red-400'}`} />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {passed ? (
              <span className="text-gradient">Congratulations!</span>
            ) : (
              <span className="text-red-400">Keep Practicing!</span>
            )}
          </h1>
          <p className="text-gray-400 text-lg">
            {passed
              ? 'You have successfully completed the quiz.'
              : 'Review the explanations below to improve.'}
          </p>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Score', value: `${score}/${total_questions}`, icon: Target, color: 'from-primary-500/20 to-accent-500/20 border-primary-500/20' },
            { label: 'Percentage', value: `${percentage}%`, icon: Brain, color: passed ? 'from-green-500/20 to-emerald-500/20 border-green-500/20' : 'from-red-500/20 to-rose-500/20 border-red-500/20' },
            { label: 'Correct', value: correct_count, icon: CheckCircle, color: 'from-green-500/20 to-emerald-500/20 border-green-500/20' },
            { label: 'Wrong', value: wrong_count, icon: XCircle, color: 'from-red-500/20 to-rose-500/20 border-red-500/20' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`card bg-gradient-to-br ${stat.color} text-center`}
            >
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary-400" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4 mb-8 text-sm text-gray-400"
        >
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {filename}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            difficulty === 'easy' ? 'bg-green-500/15 text-green-400' :
            difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
            'bg-red-500/15 text-red-400'
          }`}>
            {difficulty.toUpperCase()}
          </span>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,26,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Question Results</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="question" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} ticks={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,26,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(value) => value === 1 ? 'Correct' : 'Wrong'}
                  />
                  <Bar dataKey="result" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.result === 1 ? '#34d399' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Detailed Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Detailed Review</h3>
          {questionResults.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className={`card border-l-4 ${r.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  r.is_correct ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {r.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">
                    {i + 1}. {r.question}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-400">
                      <span className="text-gray-400">Correct answer:</span> {r.correct_text}
                    </p>
                    {!r.is_correct && r.user_answer_text && (
                      <p className="text-red-400">
                        <span className="text-gray-400">Your answer:</span> {r.user_answer_text}
                      </p>
                    )}
                    <div className="mt-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                      <p className="text-xs text-primary-300 font-medium mb-1">Explanation</p>
                      <p className="text-sm text-gray-300">{r.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-4 pb-8"
        >
          <button
            onClick={resetQuiz}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload New PPT
          </button>
          <button
            onClick={resetQuiz}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
        </motion.div>
      </div>
    </div>
  );
}