import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Save, Trash2, Headphones, Activity, Music, Share2, Tag, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { Riff } from '../types';
import { LiveRiffCapture } from './LiveRiffCapture';
import { useToast } from './ToastProvider';
import { RiffVisualizer } from './RiffVisualizer';
import { MidiPianoRoll } from './MidiPianoRoll';

interface RiffLibraryProps {
  riffs: Riff[];
  onSaveRiff: (riff: Omit<Riff, 'id' | 'timestamp'>) => void;
  onDeleteRiff: (id: string) => void;
  onShareRiff: (midiData: number[], annotation?: string) => void;
}

export const RiffLibrary: React.FC<RiffLibraryProps> = ({ riffs, onSaveRiff, onDeleteRiff, onShareRiff }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const categories = ['all', ...Array.from(new Set(riffs.map(r => r.category).filter(Boolean)))];

  const filteredRiffs = activeCategory === 'all' 
    ? riffs 
    : riffs.filter(r => r.category === activeCategory);

  const playRiff = (riff: Riff) => {
    if (playingId === riff.id) return;
    setPlayingId(riff.id);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    let time = audioCtx.currentTime + 0.1;
    const stepDuration = 60.0 / 120 / 2; // Assuming 120 bpm 8th notes

    riff.midiData.forEach((note) => {
      if (note > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine'; // Can be customized or saved per riff in future
        osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
        
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration - 0.01);
        
        osc.start(time);
        osc.stop(time + stepDuration);
      }
      time += stepDuration;
    });

    const totalDuration = (time - audioCtx.currentTime);
    setTimeout(() => {
        setPlayingId(null);
        audioCtx.close();
    }, totalDuration * 1000 + 100);
  };

  const handleCapture = (midiData: number[], annotation?: string) => {
      showToast("Riff stored in sketchpad!");
      const cat = prompt("Enter a category for this riff (e.g. Lead, Bass, Lead)", "Idea");
      onSaveRiff({
          name: annotation || 'Untitled Riff',
          category: cat || 'Idea',
          midiData,
          annotation
      });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 md:p-8 relative h-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-display uppercase tracking-[0.2em] text-white">Riff Library</h2>
        <p className="text-zinc-400 mt-2 tracking-widest text-sm uppercase">Your Personal Musical Sketchpad</p>
      </div>

      <RiffVisualizer riffs={filteredRiffs} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="surface-panel rounded-2xl p-6 border border-white/10 bg-black/40 backdrop-blur-xl">
            <h3 className="text-gold font-display uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Activity size={16} /> New Idea
            </h3>
            <LiveRiffCapture 
               onCapture={handleCapture}
               onSaveLibrary={handleCapture} 
            />
          </div>

          <div className="surface-panel rounded-2xl p-6 border border-white/10 bg-black/40 backdrop-blur-xl">
             <h3 className="text-gold font-display uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Tag size={16} /> Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest border transition-all ${
                    activeCategory === c 
                      ? 'bg-gold/20 text-gold border-gold/50' 
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
           <div className="space-y-4">
              <AnimatePresence>
                {filteredRiffs.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-center p-12 surface-panel rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl text-zinc-500 uppercase tracking-widest text-sm font-display flex flex-col items-center gap-4"
                  >
                    <Music size={32} className="opacity-50" />
                    No riffs found. Start capturing your ideas!
                  </motion.div>
                ) : (
                  filteredRiffs.map(riff => (
                    <motion.div
                      key={riff.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group p-4 bg-black/40 border border-white/10 hover:border-gold/30 rounded-2xl backdrop-blur-xl transition-all flex flex-col"
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
                        <div className="flex items-start gap-4">
                           <button 
                              onClick={() => playRiff(riff)}
                              disabled={playingId !== null}
                              className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                                playingId === riff.id 
                                  ? 'bg-gold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)]' 
                                  : 'bg-white/5 text-gold hover:bg-gold/20'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                           >
                              {playingId === riff.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                           </button>
                           <div>
                              <h4 className="text-white font-display tracking-wider text-sm">{riff.name}</h4>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                                 <span className="flex items-center gap-1.5"><Tag size={10} /> {riff.category}</span>
                                 <span className="flex items-center gap-1.5"><Activity size={10} /> {riff.midiData.filter(d => d > 0).length} notes</span>
                                 <span className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(riff.timestamp).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0 border-t md:border-0 border-white/5 pt-3 md:pt-0">
                           <button 
                              onClick={() => setExpandedId(expandedId === riff.id ? null : riff.id)}
                              className={`p-2 rounded-lg transition-colors border ${expandedId === riff.id ? 'bg-gold/20 text-gold border-gold/30' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'}`}
                              title={expandedId === riff.id ? "Collapse Piano Roll" : "Expand Piano Roll"}
                           >
                              {expandedId === riff.id ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                           </button>
                           <button 
                              onClick={() => onShareRiff(riff.midiData, riff.annotation)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5"
                              title="Share"
                           >
                              <Share2 size={14} />
                           </button>
                           <button 
                              onClick={() => onDeleteRiff(riff.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                              title="Delete"
                           >
                              <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                      
                      {/* Piano Roll Expansion */}
                      <AnimatePresence>
                         {expandedId === riff.id && (
                           <motion.div 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="w-full mt-4 pt-4 border-t border-white/10 overflow-hidden"
                           >
                              <MidiPianoRoll riff={riff} />
                           </motion.div>
                         )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};
