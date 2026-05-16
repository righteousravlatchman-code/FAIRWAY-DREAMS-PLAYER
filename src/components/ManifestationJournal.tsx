import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine, Sparkles, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export function ManifestationJournal() {
  const [intention, setIntention] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const encodeIntention = async () => {
    if (!intention || isEncoding) return;
    setIsEncoding(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As a vibrational architect, analyze this intention: "${intention}". Provide a unique 3-word "Vibrational Signature" (e.g., "888-GOLDEN-RATIO") and a 1-sentence metaphysical coding instruction for a music producer to embed this into a track. Keep it mystical and high-frequency.`,
      });
      setSignature(response.text || "999-DIVINE-ALIGNMENT");
    } catch (error) {
      console.error(error);
      setSignature("777-UNIVERSAL-FLOW");
    } finally {
      setIsEncoding(false);
    }
  };

  return (
    <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
      {/* Background Signal */}
      <div className="absolute top-0 right-0 w-full h-full opacity-[0.02] pointer-events-none flex gap-1 items-end">
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-black shadow-lg shadow-gold/20">
            <PenLine size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl text-[var(--text-primary)] tracking-widest uppercase">Intention Coder</h3>
            <p className="text-[8px] uppercase tracking-[0.3em] text-gold">Manifestation Framework v1.0</p>
            
            <div className="mt-2 flex gap-0.5 h-1 items-end opacity-20">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [1, 4, 2, 3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                  className="w-0.5 bg-gold rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-zinc-500 text-sm mb-12 max-w-2xl leading-relaxed">
          Write your intention or manifestation below. Our AI vibrational architect will decode your words into a unique frequency signature, which can then be "encoded" into your listening session.
        </p>

        <div className="space-y-6 max-w-2xl">
          <div className="relative">
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="I am attracting abundance and clarity in all my creative endeavors..."
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-8 text-white placeholder:text-zinc-700 outline-none focus:border-gold transition-all h-48 resize-none text-lg font-light italic"
            />
            <div className="absolute bottom-6 right-6 flex gap-1 h-4 items-end opacity-20">
              {[1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 16, 8, 12] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-gold rounded-full"
                />
              ))}
            </div>
          </div>

          <button
            onClick={encodeIntention}
            disabled={!intention || isEncoding}
            className="w-full md:w-auto px-12 py-5 rounded-2xl gold-gradient text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:shadow-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isEncoding ? (
              <>
                <Zap size={16} className="animate-spin" /> Decoding Intention...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Encode Intention
              </>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {signature && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 p-8 rounded-3xl border border-gold/20 bg-gold/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-black flex flex-col items-center justify-center border border-gold/30 shadow-xl">
                  <ShieldCheck size={32} className="text-gold mb-1" />
                  <span className="text-[6px] uppercase tracking-widest text-zinc-500">Verified</span>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="text-gold text-[8px] uppercase tracking-[0.4em] mb-2">Vibrational Signature Assigned</div>
                  <h4 className="font-display text-3xl text-white tracking-tighter mb-4 uppercase">{signature.split('\n')[0]}</h4>
                  <p className="text-zinc-400 text-xs italic leading-relaxed max-w-xl">
                    {signature.includes('\n') ? signature.split('\n').slice(1).join(' ') : "The intention has been successfully mapped to the universal frequency grid."}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="px-6 py-2 rounded-full border border-gold/30 text-gold text-[8px] uppercase tracking-widest hover:bg-gold/10 transition-all flex items-center gap-2">
                    Sync to Player <ChevronRight size={10} />
                  </button>
                  <button className="px-6 py-2 rounded-full bg-white/5 text-zinc-500 text-[8px] uppercase tracking-widest hover:text-white transition-all">
                    Download Code
                  </button>
                </div>
              </div>

              {/* Decorative Signal */}
              <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                <div className="flex gap-0.5 h-12 items-end">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 48, 10, 30, 4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                      className="w-0.5 bg-gold"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
