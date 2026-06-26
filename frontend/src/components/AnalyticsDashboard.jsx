import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Award, Brain, Clock } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

export default function AnalyticsDashboard() {
  const { history, fetchHistory } = useQuiz();

  useEffect(() => {
    fetchHistory();
  }, []);

  if (!history || history.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <h3 className="text-lg font-semibold text-white mb-2">No Quiz History</h3>
        <p className="text-sm text-gray-400">Complete a quiz to see your analytics here.</p>
      </div>
    );
  }

  // Calculate stats
  const totalQuizzes = history.length;
  const averageScore = history.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes;
  const passedQuizzes = history.filter((q) => q.passed).length;
  const bestScore = Math.max(...history.map((q) => q.percentage));
  const worstScore = Math.min(...history.map((q) => q.percentage));

  // Line chart data
  const lineData = history.map((q, i) => ({
    attempt: i + 1,
    score: q.percentage,
    label: q.filename?.slice(0, 15) || `Quiz ${i + 1}`,
  }));

  // Difficulty distribution
  const diffCount = { easy: 0, medium: 0, hard: 0 };
  history.forEach((q) => {
    if (diffCount[q.difficulty] !== undefined) diffCount[q.difficulty]++;
  });
  const diffData = Object.entries(diffCount).map(([name, value]) => ({
    name,
    value,
    color: name === 'easy' ? '#34d399' : name === 'medium' ? '#fbbf24' : '#f87171',
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Quizzes', value: totalQuizzes, icon: Activity, color: 'from-primary-500/20 to-accent-500/20' },
          { label: 'Avg Score', value: `${averageScore.toFixed(1)}%`, icon: Award, color: averageScore >= 60 ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-rose-500/20' },
          { label: 'Passed', value: `${passedQuizzes}/${totalQuizzes}`, icon: Brain, color: 'from-blue-500/20 to-cyan-500/20' },
          { label: 'Best Score', value: `${bestScore}%`, icon: TrendingUp, color: 'from-green-500/20 to-emerald-500/20' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`card bg-gradient-to-br ${stat.color} text-center`}
          >
            <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary-400" />
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="attempt" stroke="#9ca3af" fontSize={12} label={{ value: 'Attempt', position: 'bottom', fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,15,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Difficulty Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Difficulty Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diffData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {diffData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,15,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {history.slice(-5).reverse().map((q, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  q.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {q.passed ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{q.filename?.replace(/\.[^/.]+$/, '') || 'Quiz'}</p>
                  <p className="text-xs text-gray-400">{q.difficulty} • {q.timestamp?.slice(0, 10)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${q.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {q.percentage}%
                </p>
                <p className="text-xs text-gray-400">{q.score}/{q.total_questions}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}