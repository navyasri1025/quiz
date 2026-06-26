import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown, Clock, Brain, FileText, ChevronRight } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

export default function QuizHistory() {
  const { history, fetchHistory, resetQuiz } = useQuiz();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!history || history.length === 0) {
    return (
      <div className="card p-8 text-center">
        <History className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <h3 className="text-lg font-semibold text-white mb-2">No Quiz History</h3>
        <p className="text-sm text-gray-400">Your completed quizzes will appear here.</p>
        <button onClick={resetQuiz} className="btn-primary mt-4 text-sm">
          Start a Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/15">
            <History className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Quiz History</h3>
        </div>
        <span className="text-sm text-gray-400">{history.length} total</span>
      </div>

      <div className="space-y-3">
        {history.slice().reverse().map((q, i) => (
          <motion.div
            key={q.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                q.passed ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {q.passed ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {q.filename?.replace(/\.[^/.]+$/, '') || 'Unknown Presentation'}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {q.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {q.score}/{q.total_questions} correct
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {q.timestamp ? new Date(q.timestamp).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-lg font-bold ${q.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {q.percentage}%
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}