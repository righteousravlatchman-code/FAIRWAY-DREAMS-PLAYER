import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, ShieldCheck, Download, ChevronRight } from 'lucide-react';

export function LicensingCalculator() {
  const [tracks, setTracks] = useState(1);
  const [useCase, setUseCase] = useState('creator');
  
  const prices = {
    creator: 26,
    professional: 80,
    enterprise: 250
  };

  const total = tracks * prices[useCase as keyof typeof prices];

  return (
    <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden mt-16">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Calculator size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-black shadow-lg shadow-gold/20">
            <Calculator size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl text-white tracking-widest uppercase">License Calculator</h3>
            <p className="text-[8px] uppercase tracking-[0.3em] text-gold">Custom Quote Generator</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 block">Number of Tracks</label>
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={tracks}
                  onChange={(e) => setTracks(parseInt(e.target.value))}
                  className="flex-1 accent-gold"
                />
                <span className="font-display text-2xl text-white w-8">{tracks}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 block">License Type</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'creator', name: 'Creator', desc: 'Social media & personal use' },
                  { id: 'professional', name: 'Professional', desc: 'Commercial & brand use' },
                  { id: 'enterprise', name: 'Enterprise', desc: 'Broadcast & full sync' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setUseCase(type.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      useCase === type.id 
                        ? 'border-gold bg-gold/5' 
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${useCase === type.id ? 'text-gold' : 'text-white'}`}>
                        {type.name}
                      </span>
                      {useCase === type.id && <ShieldCheck size={14} className="text-gold" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border-gold/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
            
            <div>
              <p className="text-[8px] uppercase tracking-[0.4em] text-gold mb-6">Estimated Investment</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-6xl text-white tracking-tighter">${total}</span>
                <span className="text-zinc-600 text-[10px] uppercase tracking-widest">USD</span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-8">One-time payment · Lifetime rights</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-gold" /> High-quality WAV/MP3 files
                </li>
                <li className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-gold" /> Signed License Agreement
                </li>
                <li className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-gold" /> Metadata & Stems (if applicable)
                </li>
              </ul>
            </div>

            <button className="w-full py-4 rounded-xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-gold/20 transition-all flex items-center justify-center gap-2">
              Secure License <Download size={14} />
            </button>
          </div>
        </div>

        {/* Signal Bars */}
        <div className="mt-12 flex gap-0.5 h-1 items-end opacity-10">
          {Array.from({ length: 80 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [1, 4, 2, 3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
              className="flex-1 bg-gold"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
