import React from 'react';
import { motion } from 'framer-motion';

export default function QuestionPalette({ total, current, answers, onSelect }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Question Palette</h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const isAnswered = answers[i] !== undefined;
          const isCurrent = i === current;

          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(i)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                isCurrent
                  ? 'bg-primary-500 text-white ring-2 ring-primary-400 ring-offset-2 ring-offset-dark-800'
                  : isAnswered
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded bg-primary-500 ring-1 ring-primary-400" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded bg-white/10 border border-white/20" />
          <span>Unanswered</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-semibold">
            {Object.keys(answers).length}/{total}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-500"
            style={{ width: `${(Object.keys(answers).length / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}