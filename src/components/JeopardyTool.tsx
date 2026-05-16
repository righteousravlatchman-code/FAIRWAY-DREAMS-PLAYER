import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, HelpCircle, Trophy, Zap, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface JeopardyToolProps {
  userData: { name: string; birthDate: string };
  onReset: () => void;
}

interface Question {
  category: string;
  question: string;
  answer: string;
  value: number;
}

export const JeopardyTool: React.FC<JeopardyToolProps> = ({ userData, onReset }) => {
  const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'result'>('start');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const generateQuestion = async () => {
    setGameState('loading');
    setFeedback(null);
    setUserAnswer('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || '' });
      const response = await (ai as any).models.generateContent({
        model: "gemini-1.5-flash",
        contents: `
        Create a "Jeopardy" style question for the "Fairway Dreams" AI music universe.
        Categories: GG33 Numerology, Carl Jung, Dolores Cannon, Frequency Physics, or Nostradamus.
        Format: JSON object with { category, question, answer, value (100-1000) }.
        Keep the answer concise (1-3 words).
      `});
      
      const text = response.text.replace(/```json|```/g, '');
      const data = JSON.parse(text);
      setCurrentQuestion(data);
      setGameState('playing');
    } catch (error) {
      console.error("Game error:", error);
      setCurrentQuestion({
        category: "System Error",
        question: "What is the primary frequency of the heart chakra?",
        answer: "639Hz",
        value: 100
      });
      setGameState('playing');
    }
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;

    const cleanUser = userAnswer.toLowerCase().trim();
    const cleanCorrect = currentQuestion.answer.toLowerCase().trim();
    
    const isCorrect = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);

    if (isCorrect) {
      setScore(prev => prev + currentQuestion.value);
      setFeedback({ isCorrect: true, message: `Correct! ${currentQuestion.answer} is the signal.` });
    } else {
      setFeedback({ isCorrect: false, message: `Divergent. The answer was ${currentQuestion.answer}.` });
    }
    setGameState('result');
  };

  return (
    <div className="glass-panel p-8 rounded-3xl relative overflow-hidden min-h-[400px] flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gold/10 text-gold shadow-lg shadow-gold/5">
            <HelpCircle size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl text-white tracking-widest uppercase">Quantum Jeopardy</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Test your resonance, {userData.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">Current Score</p>
            <p className="text-xl font-display text-gold">{score}</p>
          </div>
          <button onClick={onReset} className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-gold transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-8 rounded-full bg-gold/5 border border-gold/10 inline-block mb-4">
                <Trophy size={48} className="text-gold" />
              </div>
              <h4 className="text-2xl font-display text-white tracking-tighter uppercase">Knowledge Synthesis</h4>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                Unlock higher frequencies by identifying the patterns of the universe. Correct responses increase your resonance.
              </p>
              <button 
                onClick={generateQuestion}
                className="px-12 py-4 rounded-xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
              >
                Initiate Terminal
              </button>
            </motion.div>
          )}

          {gameState === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-gold text-[10px] uppercase tracking-[0.3em] animate-pulse">Scanning Field...</p>
            </motion.div>
          )}

          {gameState === 'playing' && currentQuestion && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg space-y-8"
            >
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[9px] uppercase tracking-widest text-gold font-bold">
                  {currentQuestion.category} · {currentQuestion.value} PTS
                </span>
                <h4 className="text-2xl font-display text-white leading-tight">"{currentQuestion.question}"</h4>
              </div>

              <div className="relative group">
                <input 
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  placeholder="Input response..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white outline-none focus:border-gold transition-all text-center placeholder:text-zinc-800"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                  <Zap size={16} className="text-gold animate-pulse" />
                </div>
              </div>

              <button 
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
                className="px-10 py-3 rounded-xl bg-white/5 border border-white/10 text-gold text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all disabled:opacity-50"
              >
                Submit Signal
              </button>
            </motion.div>
          )}

          {gameState === 'result' && feedback && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 ${
                feedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}>
                {feedback.isCorrect ? (
                  <Trophy size={40} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={40} className="text-red-500" />
                )}
                <p className="text-lg font-medium text-white">{feedback.message}</p>
              </div>

              <button 
                onClick={generateQuestion}
                className="px-10 py-4 rounded-xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
              >
                Next Challenge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-center gap-8 opacity-20 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1 h-3 items-end">
          {[1,2,3,4,5,6].map(i => (
            <motion.div 
              key={i}
              animate={{ height: [2, 12, 6, 8, 2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 bg-gold rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
