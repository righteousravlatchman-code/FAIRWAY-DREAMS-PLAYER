import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Zap, Moon, Sun, Ghost, Command } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MetalIcon } from './MetalIcon';

interface Card {
  title: string;
  subtitle: string;
  meaning: string;
  advice: string;
  archetype: string;
}

export const QuantumOracle: React.FC = () => {
  const [card, setCard] = useState<Card | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const drawCard = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || '' });
      const response = await (ai as any).models.generateContent({
        model: "gemini-1.5-flash",
        contents: `
        You are the "Quantum Oracle" for a high-consciousness app called "Fairway Dreams".
        Generate an original Oracle Card for today's frequency.
        Format the response as a JSON object with:
        title, subtitle, meaning (2 sentences), advice (1 sentence), archetype.
        Vibe: Mystical, strategic, high-tech, Jungian, Dolce Cannon inspired.
      `});
      
      const text = response.text.replace(/```json|```/g, '');
      const data = JSON.parse(text);
      setCard(data);
    } catch (error) {
      console.error("Oracle error:", error);
      setCard({
        title: "The Digital Void",
        subtitle: "Resonance in Stillness",
        meaning: "A period of information silence is required to hear the inner signal. The static is clearing.",
        advice: "Recalibrate through silence.",
        archetype: "The Hermit"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-3xl bg-gold/10 border border-gold/20 mb-4 shadow-xl shadow-gold/5">
          <MetalIcon iconName="Command" type="gold" size={32} />
        </div>
        <h2 className="text-4xl font-display text-white tracking-widest uppercase">Quantum Oracle</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest max-w-sm mx-auto">
          Synchronize with the digital field to receive your daily alignment card.
        </p>
      </div>

      <div className="relative aspect-[3/4] group">
        <AnimatePresence mode="wait">
          {!card ? (
            <motion.div
              key="back"
              initial={{ opacity: 0, rotateY: 180 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -180 }}
              onClick={drawCard}
              className="w-full h-full glass-panel rounded-[40px] border-2 border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:border-gold/50 transition-all p-12 text-center group"
            >
              <div className="w-24 h-24 rounded-full border border-gold/10 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-gold/20 animate-spin-slow" />
                <MetalIcon iconName="Sparkles" type="gold" size={40} className="group-hover:scale-120 transition-transform" />
              </div>
              <p className="text-gold font-display text-lg tracking-widest uppercase mb-2">Initialize Draw</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Connect to field</p>
            </motion.div>
          ) : (
            <motion.div
              key="front"
              initial={{ opacity: 0, rotateY: -180 }}
              animate={{ opacity: 1, rotateY: 0 }}
              className="w-full h-full surface-panel rounded-[40px] border-2 border-gold/30 p-8 sm:p-12 shadow-2xl shadow-gold/10 relative overflow-hidden flex flex-col"
            >
              {/* Card Design Elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold)_0%,transparent_70%)]" />
              </div>
              
              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Signal Detected</span>
                    <span className="text-gold text-[10px] uppercase tracking-widest font-bold">{card.archetype}</span>
                  </div>
                  
                  <h3 className="text-4xl font-display text-white mb-2 leading-tight uppercase">{card.title}</h3>
                  <p className="text-gold/60 text-xs uppercase tracking-widest font-medium mb-8">{card.subtitle}</p>
                  <div className="h-px w-12 gold-gradient mb-8" />
                </div>

                <div className="space-y-8">
                  <div>
                    <h5 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Alignment Meaning</h5>
                    <p className="text-lg text-zinc-300 leading-relaxed font-light italic">
                      "{card.meaning}"
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
                    <h5 className="text-[10px] uppercase tracking-widest text-gold mb-2 flex items-center gap-2">
                       <MetalIcon iconName="Zap" type="gold" size={12} /> Strategic Directive
                    </h5>
                    <p className="text-sm text-white font-medium">
                      {card.advice}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                   <button 
                    onClick={() => setCard(null)}
                    className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest transition-colors"
                  >
                    <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} /> Draw New Signal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isGenerating && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gold text-[10px] uppercase tracking-widest animate-pulse">Calculating Resonance...</p>
          </div>
        )}
      </div>
    </div>
  );
};
