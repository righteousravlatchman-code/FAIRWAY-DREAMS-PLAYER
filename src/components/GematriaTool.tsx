import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Hash, Book, Volume2, Pause, Loader2 } from 'lucide-react';
import { KabbalahLetterology, LetterFrequencyAnalysis } from '../services/letterologyService';
import { useAudioNarrator } from '../hooks/useAudioNarrator';

interface GematriaToolProps {
  userData: { name: string; birthDate: string };
  onReset: () => void;
}

export const GematriaTool: React.FC<GematriaToolProps> = ({ userData, onReset }) => {
  const gematria = useMemo(() => KabbalahLetterology.calculateGematria(userData.name), [userData.name]);
  const treePath = useMemo(() => KabbalahLetterology.calculateTreePath(userData.name), [userData.name]);
  const resonance = useMemo(() => LetterFrequencyAnalysis.calculateResonance(userData.name), [userData.name]);
  const { isPlaying, audioLoading, toggleData } = useAudioNarrator();

  const handleToggleAudio = () => {
    toggleData(`Gematria Signal Analysis for ${userData.name}`, {
      gematria,
      treePath,
      resonance
    });
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
      
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gold/10 text-gold shadow-xl shadow-gold/5">
            <Hash size={32} />
          </div>
          <div>
            <h3 className="font-display text-2xl text-white tracking-widest uppercase">Gematria Signal</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Numerical Resonance System</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleToggleAudio}
            disabled={audioLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] uppercase tracking-widest font-bold ${
              isPlaying 
              ? 'bg-gold text-black border-gold shadow-[0_0_20px_rgba(201,168,76,0.2)]' 
              : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
            }`}
          >
            {audioLoading ? <Loader2 size={12} className="animate-spin" /> : isPlaying ? <Pause size={12} /> : <Volume2 size={12} />}
            {isPlaying ? 'Stop' : 'Briefing'}
          </button>
          <button onClick={onReset} className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-gold transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/5 relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-gold">
              <Hash size={48} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Gematria Value</p>
            <p className="text-gold font-display text-6xl tracking-tighter">{gematria.value}</p>
            <p className="mt-4 text-zinc-500 text-[10px] uppercase tracking-widest italic">{gematria.meaning}</p>
            
            <div className="mt-8 pt-8 border-t border-white/5">
              <h5 className="text-gold text-[10px] uppercase tracking-widest mb-4">Frequency Breakdown</h5>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Resonance Level</span>
                  <span className="text-white font-mono text-xs">{(gematria.value % 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Harmonic Index</span>
                  <span className="text-white font-mono text-xs">{(gematria.value / 7).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Solfeggio Match</span>
                  <span className="text-gold font-mono text-xs">{resonance.match.toFixed(1)}%</span>
                </div>
                <p className="text-[9px] text-zinc-600 leading-relaxed italic">
                  Calculated using the standard Kabbalistic Gematria reduction method.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-gold/5 border border-gold/10">
            <h4 className="text-white font-display text-sm tracking-widest mb-6 uppercase flex items-center gap-2">
              <Sparkles size={16} className="text-gold" /> Solfeggio Resonance
            </h4>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-display text-2xl">
                {resonance.freq}
              </div>
              <div>
                <p className="text-white text-lg font-display tracking-widest uppercase">{resonance.name}</p>
                <p className="text-gold text-[10px] uppercase tracking-widest">{resonance.match.toFixed(1)}% Match</p>
              </div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed italic">
              "{resonance.meaning}"
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
            <h4 className="text-white font-display text-sm tracking-widest mb-6 uppercase flex items-center gap-2">
              <Book size={16} className="text-gold" /> Mystical Alignment
            </h4>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gold font-display text-2xl">
                {treePath.num}
              </div>
              <div>
                <p className="text-white text-lg font-display tracking-widest uppercase">{treePath.name}</p>
                <p className="text-gold text-[10px] uppercase tracking-widest">Tree of Life Path</p>
              </div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed italic">
              "{treePath.meaning}"
            </p>
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 border border-gold/10 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border border-gold/20 rounded-full border-dashed"
              />
            </div>
            <div className="relative z-10 flex items-center justify-center h-48">
              <span className="font-display text-5xl text-white drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">{gematria.value}</span>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-white font-display text-sm tracking-widest mb-4 uppercase">Numerical Resonance</h4>
            <p className="text-zinc-500 text-xs italic leading-relaxed max-w-sm mx-auto">
              The numerical value of your name signal in the Kabbalistic Gematria system is {gematria.value}. This frequency interacts with the mathematical constants of the physical world to manifest specific outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
