import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calculator, ChevronRight, RefreshCw, Star, Target, Compass, Zap, Shield, Heart, Gem, Ghost, Book, Globe } from 'lucide-react';
import { TRACKS } from '../constants';
import { Track } from '../types';
import { MetalIcon } from './MetalIcon';

interface NumerologyToolProps {
  userData: { name: string; birthDate: string };
  onReset: () => void;
  tracks: Track[];
}

export const NumerologyTool: React.FC<NumerologyToolProps> = ({ userData, onReset, tracks }) => {
  const [result, setResult] = useState<{
    lifePath: number;
    alignedTrack: Track;
  } | null>(null);

  useEffect(() => {
    if (userData.birthDate) {
      calculateLifePath(userData.birthDate);
    }
  }, [userData.birthDate, tracks]);

  const calculateLifePath = (date: string) => {
    const digits = date.replace(/\D/g, '');
    if (digits.length !== 8) return;

    let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    
    // Reduce to single digit or master number (11, 22, 33)
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }

    // Find a track that contains this number in its numerologyCode
    const alignedTrack = tracks.find(t => t.numerologyCode?.includes(sum.toString())) || tracks[0];

    setResult({ lifePath: sum, alignedTrack });
  };

  const getLifePathInterpretation = (num: number) => {
    const interpretations: Record<number, { title: string; description: string; traits: string[] }> = {
      1: {
        title: "The Primal Force",
        description: "You are a natural-born leader, pioneer, and innovator. Your frequency vibrates with independence and the drive to create new paths where none existed before.",
        traits: ["Leadership", "Independence", "Innovation", "Ambition"]
      },
      2: {
        title: "The All-Knowing",
        description: "Your vibration is one of harmony, balance, and deep intuition. You are the peacemaker, capable of seeing all sides of a situation and bringing unity to chaos.",
        traits: ["Diplomacy", "Intuition", "Harmony", "Sensitivity"]
      },
      3: {
        title: "The Creative Communicator",
        description: "You are a vessel for self-expression and joy. Your frequency resonates with the arts, communication, and the ability to inspire others through your unique voice.",
        traits: ["Creativity", "Expression", "Optimism", "Social"]
      },
      4: {
        title: "The Master Builder",
        description: "You represent stability, order, and the foundation of all things. Your frequency is grounded, practical, and dedicated to building lasting structures in the physical world.",
        traits: ["Stability", "Practicality", "Discipline", "Order"]
      },
      5: {
        title: "The Dynamic Catalyst",
        description: "Your vibration is one of freedom, change, and adventure. You are the bridge between worlds, constantly evolving and seeking new experiences to expand your consciousness.",
        traits: ["Freedom", "Adaptability", "Adventure", "Curiosity"]
      },
      6: {
        title: "The Harmonizer",
        description: "You are the nurturer and the protector. Your frequency vibrates with responsibility, service, and the deep desire to create beauty and balance in your environment.",
        traits: ["Responsibility", "Nurturing", "Service", "Beauty"]
      },
      7: {
        title: "The Seeker of Truth",
        description: "You are the mystic and the analyst. Your frequency is one of introspection, spiritual seeking, and the quest to uncover the hidden mysteries of the universe.",
        traits: ["Introspection", "Spirituality", "Analysis", "Wisdom"]
      },
      8: {
        title: "The Manifestor",
        description: "Your vibration is one of power, abundance, and material mastery. You have the ability to bridge the spiritual and material worlds to manifest significant results.",
        traits: ["Power", "Abundance", "Authority", "Efficiency"]
      },
      9: {
        title: "The Universal Soul",
        description: "You represent completion and humanitarianism. Your frequency is one of compassion, selflessness, and the wisdom gained from a full cycle of experience.",
        traits: ["Compassion", "Humanitarianism", "Wisdom", "Tolerance"]
      },
      11: {
        title: "The Intuitive Visionary",
        description: "As a Master Number, you carry a high-voltage frequency of spiritual illumination. You are a channel for higher wisdom and a beacon of light for others.",
        traits: ["Illumination", "Intuition", "Inspiration", "Vision"]
      },
      22: {
        title: "The Master Architect",
        description: "You have the potential to manifest your highest visions into physical reality on a grand scale. You combine the intuition of 11 with the practicality of 4.",
        traits: ["Manifestation", "Practicality", "Vision", "Leadership"]
      },
      33: {
        title: "The Master Teacher",
        description: "Your frequency is one of pure unconditional love and selfless service. You are here to raise the collective vibration through compassion and spiritual guidance.",
        traits: ["Compassion", "Service", "Love", "Guidance"]
      }
    };
    return interpretations[num] || { title: "The Unknown Frequency", description: "Your vibration is unique and currently decoding.", traits: [] };
  };

  return (
    <div className="glass-panel rounded-[2rem] p-8 md:p-12 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <MetalIcon iconName="Calculator" type="silver" size={120} />
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none flex gap-1 items-end">
        {Array.from({ length: 60 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: [10, 400, 50, 300, 10] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
            className="flex-1 bg-gold"
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shadow-lg shadow-gold/5">
              <MetalIcon iconName="Calculator" type="gold" size={20} />
            </div>
            <div>
              <h3 className="font-display text-xl text-white tracking-widest uppercase">Alignment Tool</h3>
              <p className="text-[8px] uppercase tracking-[0.3em] text-gold">GG33 Framework Integration</p>
            </div>
          </div>
          <button onClick={onReset} className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-gold transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        <p className="text-zinc-500 text-sm mb-8 leading-relaxed max-w-md">
          Your Life Path frequency has been decoded based on your birth date. Discover which consciousness-coded signal resonates with your energetic signature.
        </p>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8 items-center pt-8 border-t border-white/5"
            >
              <div>
                <div className="text-gold text-[10px] uppercase tracking-[0.4em] mb-2">Your Life Path</div>
                <div className="font-display text-6xl text-white mb-2">{result.lifePath}</div>
                <div className="text-white font-display text-lg tracking-widest uppercase mb-4 opacity-80">
                  {getLifePathInterpretation(result.lifePath).title}
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                  {getLifePathInterpretation(result.lifePath).description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {getLifePathInterpretation(result.lifePath).traits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] uppercase tracking-widest text-zinc-400">
                      {trait}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-1 h-4 items-end opacity-30">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 16, 6, 12, 4] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-gold rounded-full"
                    />
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex items-center gap-6 border-gold/20 shadow-xl shadow-gold/5 relative overflow-hidden group">
                <div className="absolute top-2 right-2 flex gap-0.5 h-2 items-end opacity-20 group-hover:opacity-100 transition-opacity">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [2, 8, 4, 6, 2],
                        backgroundColor: ['#c9a84c', '#ffffff', '#c9a84c'],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                      className="w-0.5 rounded-full"
                    />
                  ))}
                </div>
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity flex gap-0.5 items-end">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [1, 40, 10, 30, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
                      className="flex-1 bg-gold"
                    />
                  ))}
                </div>
                
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 z-10">
                  <img src={result.alignedTrack.art || '/src/assets/images/default_cover_1779345608057.png'} alt={result.alignedTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-0 left-0 w-full flex gap-0.5 h-1 items-end opacity-50">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [1, 4, 2, 3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                        className="flex-1 bg-gold"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-gold text-[8px] uppercase tracking-widest">Aligned Signal</div>
                    <div className="flex gap-0.5 h-0.5 items-end opacity-30">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [0.5, 2] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                          className="w-0.5 bg-gold rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display text-sm text-white truncate">{result.alignedTrack.title}</h4>
                    <div className="flex gap-0.5 h-1 items-end opacity-10">
                      {[1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [1, 3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-0.5 bg-white rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-[8px] text-gold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                      {result.alignedTrack.genre.join(' · ')}
                    </p>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Code: {result.alignedTrack.numerologyCode}</p>
                  </div>

                  {result.alignedTrack.description && (
                    <p className="text-[9px] text-zinc-400 leading-relaxed mb-4 line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      {result.alignedTrack.description}
                    </p>
                  )}

                  <button className="relative flex items-center gap-1 text-gold text-[8px] uppercase tracking-widest hover:gap-2 transition-all group/listen">
                    Listen Now <ChevronRight size={10} />
                    <div className="absolute -bottom-1 left-0 flex gap-0.5 h-0.5 items-end opacity-0 group-hover/listen:opacity-50 transition-opacity">
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [0.5, 2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                          className="w-0.5 bg-gold rounded-full"
                        />
                      ))}
                    </div>
                  </button>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 opacity-40">
                {[
                  { label: "Numerology", value: "GG33" },
                  { label: "Psychology", value: "Jung" },
                  { label: "Metaphysics", value: "Cannon" },
                  { label: "Prophecy", value: "Nostradamus" },
                  { label: "Astrology", value: "Mystic Rebels" },
                  { label: "Consciousness", value: "Monroe" }
                ].map((inf) => (
                  <div key={inf.label} className="text-center">
                    <p className="text-[6px] uppercase tracking-tighter text-zinc-500 mb-0.5">{inf.label}</p>
                    <p className="text-[8px] uppercase tracking-widest text-gold font-bold">{inf.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
