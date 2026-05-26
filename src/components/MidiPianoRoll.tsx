import React, { useMemo, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { Riff } from '../types';

interface MidiPianoRollProps {
  riff: Riff;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteName = (midiNote: number) => {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[midiNote % 12];
  return `${noteName}${octave}`;
};

export const MidiPianoRoll: React.FC<MidiPianoRollProps> = ({ riff }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { minNote, maxNote, totalSteps, noteEvents } = useMemo(() => {
    let minNote = 127;
    let maxNote = 0;
    const totalSteps = riff.midiData.length;
    
    // Group consecutive identical notes into single events with duration
    const noteEvents: { note: number; start: number; duration: number }[] = [];
    let currentEvent: { note: number; start: number; duration: number } | null = null;

    for (let i = 0; i < totalSteps; i++) {
        const note = riff.midiData[i];
        if (note > 0) {
            minNote = Math.min(minNote, note);
            maxNote = Math.max(maxNote, note);
        }

        if (currentEvent && currentEvent.note === note) {
            currentEvent.duration++;
        } else {
            if (currentEvent) {
                noteEvents.push(currentEvent);
            }
            if (note > 0) {
                currentEvent = { note, start: i, duration: 1 };
            } else {
                currentEvent = null;
            }
        }
    }
    if (currentEvent) {
        noteEvents.push(currentEvent);
    }
    
    // Padding
    minNote -= 2;
    maxNote += 2;
    // ensure standard minimum range
    if (maxNote - minNote < 12) {
        maxNote = minNote + 12;
    }

    // Default bounds if no notes recorded
    if (noteEvents.length === 0) {
        minNote = 48; // C3
        maxNote = 72; // C5
    }

    return { minNote, maxNote, totalSteps, noteEvents };
  }, [riff.midiData]);

  const numRows = maxNote - minNote + 1;
  const stepWidth = 24; // width per step in px
  const rowHeight = 16; // height per row in px

  const playRiff = () => {
    if (isPlaying || noteEvents.length === 0) return;
    setIsPlaying(true);
    setPlaybackProgress(0);
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let time = audioCtx.currentTime + 0.1;
    const stepDuration = 60.0 / 120 / 2; // Assuming 120 bpm 8th notes, matching RiffLibrary playback

    riff.midiData.forEach((note) => {
      if (note > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
        
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration - 0.01);
        
        osc.start(time);
        osc.stop(time + stepDuration);
      }
      time += stepDuration;
    });

    const totalDuration = riff.midiData.length * stepDuration;
    
    let startTime = document.timeline ? document.timeline.currentTime as number : performance.now();
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
       const elapsedSecs = (timestamp - startTime) / 1000;
       if (elapsedSecs >= totalDuration) {
           setIsPlaying(false);
           setPlaybackProgress(0);
           audioCtx.close();
           return;
       }
       setPlaybackProgress(elapsedSecs / totalDuration);
       animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col gap-4 mt-4 w-full">
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl">
         <span className="text-zinc-400 text-xs font-mono uppercase">Piano Roll Viewer</span>
         <button 
           onClick={playRiff}
           disabled={isPlaying || noteEvents.length === 0}
           className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-gold/20 text-gold hover:text-white rounded-lg transition-colors border border-transparent hover:border-gold/30 disabled:opacity-50 text-xs font-bold uppercase tracking-widest"
         >
           {isPlaying ? <Square size={14} /> : <Play size={14} />} {isPlaying ? 'Playing...' : 'Preview'}
         </button>
      </div>

      <div 
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-xl max-h-[350px] min-h-[200px]"
      >
        <div 
           className="relative" 
           style={{ 
               width: `${Math.max(totalSteps * stepWidth, 600)}px`, 
               height: `${numRows * rowHeight}px` 
           }}
        >
          {/* Background grid horizontal rows (note names) */}
          <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
            {Array.from({ length: numRows }).map((_, i) => {
               const currentNote = maxNote - i;
               const isBlackKey = [1, 3, 6, 8, 10].includes(currentNote % 12);
               return (
                  <div 
                    key={`row-${i}`} 
                    className={`flex-1 border-b border-white/[0.02] flex items-center px-1 sticky left-0 ${isBlackKey ? 'bg-white/[0.03]' : 'bg-transparent'}`}
                    style={{ height: rowHeight }}
                  >
                     <span 
                        className={`text-[8px] font-mono scale-90 origin-left ${currentNote % 12 === 0 ? 'text-zinc-400 font-bold' : 'text-zinc-600'}`}
                     >
                        {getNoteName(currentNote)}
                     </span>
                  </div>
               );
            })}
          </div>

          {/* Background grid vertical lines (beats) */}
          <div className="absolute inset-0 flex pointer-events-none z-0 ml-8">
             {Array.from({ length: Math.max(totalSteps, 24) }).map((_, i) => (
                <div 
                  key={`col-${i}`} 
                  className={`border-r ${i % 4 === 0 ? 'border-white/10' : 'border-white/[0.03]'}`}
                  style={{ width: stepWidth, height: '100%' }}
                />
             ))}
          </div>

          {/* Render Notes */}
          <div className="absolute inset-0 z-10 ml-8">
            {noteEvents.map((ev, i) => {
              const row = maxNote - ev.note;
              return (
                  <div 
                      key={`note-${i}`}
                      className="absolute bg-gold rounded-[2px] border border-black/40 shadow-[0_0_10px_rgba(201,168,76,0.3)] cursor-pointer hover:bg-white transition-colors group"
                      style={{
                        left: ev.start * stepWidth + 1,
                        top: row * rowHeight + 1,
                        width: ev.duration * stepWidth - 2,
                        height: rowHeight - 2
                      }}
                      title={`${getNoteName(ev.note)}`}
                  >
                      <div className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 bg-black/95 text-gold text-[10px] px-2 py-1 rounded border border-gold/30 z-[100] whitespace-nowrap shadow-xl font-mono">
                        {getNoteName(ev.note)} (x{ev.duration})
                      </div>
                  </div>
              )
            })}
          </div>

          {/* Playhead */}
          {isPlaying && (
             <div 
               className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 pointer-events-none ml-8"
               style={{
                  left: `${playbackProgress * totalSteps * stepWidth}px`
               }}
             />
          )}
        </div>
      </div>
    </div>
  );
};
