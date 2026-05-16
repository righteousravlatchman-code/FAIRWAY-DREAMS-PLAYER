import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from './ToastProvider';

interface UnifiedIntakeProps {
  onComplete: (data: { name: string; birthDate: string }) => void;
  initialData?: { name: string; birthDate: string };
}

export const UnifiedIntake: React.FC<UnifiedIntakeProps> = ({ onComplete, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      showToast('Please enter a valid name', 'warning');
      return;
    }
    if (!birthDate) {
      showToast('Please select your birth date', 'warning');
      return;
    }
    
    showToast('Frequencies synchronized', 'success');
    onComplete({ name, birthDate });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden max-w-2xl mx-auto"
    >
      <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-50" />
      
      <div className="text-center mb-8 sm:mb-10">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl gold-gradient flex items-center justify-center text-black mx-auto mb-4 sm:mb-6 shadow-lg shadow-gold/20">
          <Sparkles size={24} className="sm:w-8 sm:h-8" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)] tracking-widest mb-3 sm:mb-4">SIGNAL INTAKE</h2>
        <p className="text-zinc-500 text-[10px] sm:text-sm uppercase tracking-[0.2em] px-4">Enter your details to decode your multi-dimensional frequency</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-gold ml-2">
            <User size={10} className="sm:w-3 sm:h-3" /> Full Name
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base text-[var(--text-primary)] placeholder:text-zinc-700 outline-none focus:border-gold transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-gold ml-2">
            <Calendar size={10} className="sm:w-3 sm:h-3" /> Birth Date
          </label>
          <input 
            type="date" 
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base text-[var(--text-primary)] outline-none focus:border-gold transition-all"
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:shadow-2xl hover:shadow-gold/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          Initialize All Reports <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="mt-10 flex justify-center gap-1 h-4 items-end opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: [4, 16, 8, 12, 4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="w-0.5 bg-gold rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
};
