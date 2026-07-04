import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, Presentation, BookOpen } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

export default function UploadScreen() {
  const { uploadFile, uploading, uploadError } = useQuiz();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const validateFile = (file) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['ppt', 'pptx', 'pdf', 'docx', 'txt'].includes(ext)) {
      setLocalError('Invalid format. Please upload a .ppt, .pptx, .pdf, .docx, or .txt file.');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setLocalError('File too large. Maximum size is 50MB.');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (validateFile(file)) {
      setSelectedFile(file);
      setFilePreview({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(1),
        lastModified: new Date(file.lastModified).toLocaleDateString(),
      });
    }
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setLocalError(null);
      await uploadFile(selectedFile);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const error = localError || uploadError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 mb-6"
          >
            <Presentation className="w-10 h-10 text-primary-400" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">QuizCraft AI</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Upload your presentation and let AI create an intelligent quiz from your content.
          </p>
        </div>

        {/* Upload Zone */}
        <motion.div
          ref={dropRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-10 md:p-16 text-center transition-all duration-300 cursor-pointer
            ${dragActive
              ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
              : selectedFile
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}
          onClick={() => !selectedFile && inputRef.current?.click()}
          whileHover={{ scale: selectedFile ? 1 : 1.01 }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".ppt,.pptx,.pdf,.docx,.txt"
            onChange={handleChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/15 mb-6"
                >
                  <Upload className="w-8 h-8 text-primary-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drop your presentation here
                </h3>
                <p className="text-gray-400 mb-6">
                  or click to browse files
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>Supports .ppt, .pptx, .pdf, .docx, .txt (max 50MB)</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {filePreview.name}
                </h3>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-6">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {filePreview.size} MB
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {filePreview.lastModified}
                  </span>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFilePreview(null);
                      setLocalError(null);
                      if (inputRef.current) inputRef.current.value = '';
                    }}
                    className="btn-secondary text-sm"
                  >
                    Remove
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    disabled={uploading}
                    className="btn-primary text-sm"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Upload & Analyze'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: FileText, title: 'PPT Parsing', desc: 'Extracts text from all slides' },
            { icon: BrainCircuit, title: 'AI Generation', desc: 'Powered by DeepSeek AI' },
            { icon: Sparkles, title: 'Smart Quiz', desc: 'Adaptive difficulty levels' },
          ].map((item, i) => (
            <div key={i} className="card p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 shrink-0">
                <item.icon className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// Missing lucide imports - use regular icons instead
function BrainCircuit({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.9 4.4-4.2 5.2"/><path d="M12 22a7 7 0 0 1-7-7c0-2.4 1.9-4.4 4.2-5.2"/><path d="M16 12h.01"/><path d="M8 12h.01"/><path d="M10 16h4"/>
    </svg>
  );
}

function Sparkles({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.64 5.64l12.72 12.72"/><path d="M18.36 5.64L5.64 18.36"/>
    </svg>
  );
}