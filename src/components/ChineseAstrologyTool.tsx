import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface ChineseAstrologyToolProps {
  userData: { name: string; birthDate: string };
  onReset: () => void;
}

export const ChineseAstrologyTool: React.FC<ChineseAstrologyToolProps> = ({ userData, onReset }) => {
  const birthYear = new Date(userData.birthDate).getFullYear();
  const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const elements = ["Metal", "Water", "Wood", "Fire", "Earth"];
  
  const animal = animals[((birthYear - 4) % 12 + 12) % 12];
  const element = elements[Math.floor((((birthYear % 10) + 10) % 10) / 2)];
  const fullSign = `${element} ${animal}`;

  return (
    <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gold/10 text-gold">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl text-white tracking-widest">Chinese Astrology</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Eastern Signal System</p>
          </div>
        </div>
        <button onClick={onReset} className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-gold transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Subject</p>
            <p className="text-white font-display text-lg tracking-widest">{userData.name}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Birth Year</p>
            <p className="text-white font-display text-lg tracking-widest">{birthYear}</p>
          </div>
        </div>
        
        <div className="p-8 rounded-2xl bg-gold/5 border border-gold/10 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full border-2 border-gold/30 flex items-center justify-center mb-4 text-xs font-display text-gold px-2 text-center leading-tight">
            {fullSign}
          </div>
          <h4 className="text-white font-display text-sm tracking-widest mb-2 uppercase">Eastern Signal: {fullSign}</h4>
          <p className="text-zinc-500 text-xs italic leading-relaxed">
            In the eastern tradition, the {fullSign} represents a unique vibrational signature. Your energy is characterized by the traits of this powerful archetype.
          </p>
        </div>
      </div>
    </div>
  );
};
