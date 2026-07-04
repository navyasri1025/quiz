import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, History, BarChart3, ChevronRight } from 'lucide-react';
import { QuizProvider, useQuiz } from './context/QuizContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import UploadScreen from './pages/UploadScreen';
import ConfigureScreen from './pages/ConfigureScreen';
import AIGenerationScreen from './pages/AIGenerationScreen';
import QuizScreen from './pages/QuizScreen';
import ResultScreen from './pages/ResultScreen';
import QuizHistory from './components/QuizHistory';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function Sidebar({ activeTab, setActiveTab }) {
  const { darkMode } = useTheme();

  const tabs = [
    { id: 'quiz', label: 'Quiz', icon: Brain },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-50 border-r border-white/10 bg-dark-900/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient">QuizCraft</h1>
            <p className="text-xs text-gray-500">AI Quiz Generator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">QuizCraft AI v1.0</p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-gradient">QuizCraft</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

function MainContent({ activeTab, setActiveTab }) {
  const { screen } = useQuiz();

  const renderQuizScreen = () => {
    switch (screen) {
      case 'upload':
        return <UploadScreen />;
      case 'configure':
        return <ConfigureScreen />;
      case 'generating':
        return <AIGenerationScreen />;
      case 'quiz':
        return <QuizScreen />;
      case 'results':
        return <ResultScreen />;
      default:
        return <UploadScreen />;
    }
  };

  return (
    <div className="md:pl-64 pt-16 md:pt-0">
      <AnimatePresence mode="wait">
        <motion.main
          key={activeTab === 'quiz' ? `screen-${screen}` : `tab-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'quiz' ? (
            renderQuizScreen()
          ) : (
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6 capitalize">
                {activeTab === 'history' ? (
                  <span className="flex items-center gap-2">
                    <History className="w-6 h-6 text-primary-400" />
                    Quiz History
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary-400" />
                    Analytics Dashboard
                  </span>
                )}
              </h2>

              {activeTab === 'history' && (
                /*
                 * Pass setActiveTab so QuizHistory's "Start a Quiz" button can
                 * navigate to the quiz tab (Issue 2 fix).
                 */
                <QuizHistory setActiveTab={setActiveTab} />
              )}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
            </div>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

function MobileBottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'quiz', label: 'Quiz', icon: Brain },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive ? 'text-primary-400' : 'text-gray-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('quiz');

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileHeader />
      <MainContent activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QuizProvider>
        <AppContent />
      </QuizProvider>
    </ThemeProvider>
  );
}
