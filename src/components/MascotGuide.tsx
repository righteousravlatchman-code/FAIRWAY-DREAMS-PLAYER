import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle, X } from 'lucide-react';
import type { UserProfile } from '../types';

import owlImage from '../assets/images/cosmic_owl_1779443653172.png';
import foxImage from '../assets/images/astral_fox_1779443673773.png';

interface MascotGuideProps {
  mascotType?: string;
}

const OWL_QUOTES = [
  "Wisdom lies in the silent intervals between the beats.",
  "I observe the celestial harmonics. Your curation is... intriguing.",
  "The golden ratio is hidden within these frequencies.",
  "Seek the nocturnal rhythms. They reveal what the daylight obscures.",
  "Time is a flat circle, much like this looping atmospheric synth.",
  "Even the darkest voids contain structural resonance."
];

const FOX_QUOTES = [
  "Let's ride the astral currents! The tempo is rising!",
  "I map the grid through soundscapes. Follow my trail.",
  "Neon shadows and obsidian beats. This is where I thrive.",
  "Feel that sub-bass? It's shifting the tectonic plates of the cyber-realm.",
  "Quick, into the slipstream! The frequencies wait for no one.",
  "My glowing geometry pulses with this track!"
];

export function MascotGuide({ mascotType }: MascotGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  if (!mascotType || mascotType === 'none') {
    return null;
  }

  const isFox = mascotType === 'fox';
  const imageSrc = isFox ? foxImage : owlImage;
  const mascotName = isFox ? 'Astral Fox' : 'Cosmic Owl';
  const quotes = isFox ? FOX_QUOTES : OWL_QUOTES;

  const generateQuote = () => {
    setQuoteIndex(Math.floor(Math.random() * quotes.length));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, rotate: 2 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="absolute bottom-full right-0 mb-6 w-[280px] bg-black/80 backdrop-blur-3xl border border-gold/40 rounded-[2rem] rounded-br-[0.5rem] p-5 shadow-[0_0_40px_-5px_rgba(201,168,76,0.25)] overflow-hidden"
          >
            {/* Holographic Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-white/5 pointer-events-none" />

            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-gold transition-colors z-10"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Sparkles className="text-gold" size={14} />
              <span className="text-[10px] text-gold uppercase tracking-[0.2em] font-display font-medium">{mascotName}</span>
            </div>
            <p className="text-sm font-mono text-zinc-200 leading-relaxed mb-4 relative z-10">
              <span className="text-gold/50 mr-2 opacity-50">{">"}</span>{quotes[quoteIndex]}
            </p>
            <div className="flex justify-between items-center relative z-10 pt-2 border-t border-gold/10">
              <span className="text-[8px] text-zinc-600 uppercase tracking-widest bg-black/50 px-2 py-1 rounded-sm">Vibrational Insight</span>
              <button 
                onClick={generateQuote}
                className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-gold transition-colors font-medium flex items-center gap-1"
              >
                Rescan <MessageCircle size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) generateQuote();
        }}
        className="relative group w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-gold/70 via-gold/20 to-black shadow-[0_0_30px_-5px_rgba(201,168,76,0.3)] cursor-pointer overflow-hidden z-20"
      >
        {/* Animated Spin Glow effect */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          className="absolute -inset-4 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(201,168,76,0.8)_360deg)] opacity-0 group-hover:opacity-100" 
        />
        
        <div className="w-full h-full rounded-full overflow-hidden bg-black relative z-10 border-[2px] border-black">
          <img 
            src={imageSrc} 
            alt={mascotName} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform scale-110 group-hover:scale-100 transition-transform duration-500 will-change-transform"
          />
          <div className="absolute inset-0 bg-gold/10 mix-blend-color pointer-events-none" />
        </div>

        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-black border border-gold/50 shadow-[0_0_15px_rgba(201,168,76,0.5)] text-gold rounded-full flex items-center justify-center z-30"
        >
          <MessageCircle size={12} className="opacity-80" />
        </motion.div>
      </motion.button>
    </div>
  );
}
