import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  Zap, 
  Wind, 
  Waves, 
  Sun, 
  Moon, 
  Sparkles, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Activity,
  Settings2,
  Play,
  Square,
  Sliders,
  Headphones
} from 'lucide-react';

interface Frequency {
  hz: number;
  name: string;
  benefit: string;
  color: string;
  icon: React.ReactNode;
}

const FREQUENCIES: Frequency[] = [
  { hz: 174, name: 'Foundation', benefit: 'Relieves pain and stress. Provides a sense of security.', color: 'from-zinc-500 to-zinc-800', icon: <Wind size={20} /> },
  { hz: 285, name: 'Quantum Cognition', benefit: 'Heals tissue and organs. Influences energy fields.', color: 'from-blue-500 to-blue-800', icon: <Radio size={20} /> },
  { hz: 396, name: 'Liberation', benefit: 'Liberating guilt and fear. Turning grief into joy.', color: 'from-red-500 to-red-800', icon: <Zap size={20} /> },
  { hz: 417, name: 'Undoing', benefit: 'Facilitating change. Clearing traumatic experiences.', color: 'from-orange-500 to-orange-800', icon: <Waves size={20} /> },
  { hz: 432, name: 'Natural Harmony', benefit: 'The heartbeat of the Earth. Deep relaxation and clarity.', color: 'from-emerald-500 to-emerald-800', icon: <Sun size={20} /> },
  { hz: 528, name: 'Transformation', benefit: 'DNA repair. Miracles and signs. Love frequency.', color: 'from-gold to-yellow-600', icon: <Sparkles size={20} /> },
  { hz: 639, name: 'Connection', benefit: 'Relationship healing. Connecting with community.', color: 'from-pink-500 to-pink-800', icon: <Waves size={20} /> },
  { hz: 741, name: 'Intuition', benefit: 'Expression and solutions. Awakening intuition.', color: 'from-indigo-500 to-indigo-800', icon: <Moon size={20} /> },
  { hz: 852, name: 'Spiritual Order', benefit: 'Returning to spiritual order. Seeing through illusions.', color: 'from-purple-500 to-purple-800', icon: <Sun size={20} /> },
  { hz: 963, name: 'Divine Consciousness', benefit: 'Pure spirit. Oneness. Connection to the All.', color: 'from-white to-zinc-400', icon: <Sparkles size={20} /> },
];

type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export function FrequencyTuner() {
  const [selectedFreq, setSelectedFreq] = useState<Frequency | null>(null);
  const [isTuning, setIsTuning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState<WaveformType>('sine');
  
  // Custom calibration states
  const [customHz, setCustomHz] = useState<number>(432);
  const [binauralOffset, setBinauralOffset] = useState<number>(0);
  const [fineTuneMode, setFineTuneMode] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscLRef = useRef<OscillatorNode | null>(null);
  const oscRRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopFrequency();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(isPlaying ? volume * 0.1 : 0, 0, 0.05);
    }
  }, [volume, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      if (oscLRef.current) oscLRef.current.type = waveform;
      if (oscRRef.current) oscRRef.current.type = waveform;
    }
  }, [waveform, isPlaying]);
  
  useEffect(() => {
    if (isPlaying && oscLRef.current && oscRRef.current && audioContextRef.current) {
        oscLRef.current.frequency.setTargetAtTime(customHz, audioContextRef.current.currentTime, 0.1);
        oscRRef.current.frequency.setTargetAtTime(customHz + binauralOffset, audioContextRef.current.currentTime, 0.1);
    }
  }, [customHz, binauralOffset, isPlaying]);

  const startFrequency = (baseHz: number, offset: number = binauralOffset) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    stopFrequency();

    const oscL = audioContextRef.current.createOscillator();
    const oscR = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    const analyser = audioContextRef.current.createAnalyser();
    
    analyser.fftSize = 2048;
    
    // Use stereo panner for binaural beats
    const pannerL = audioContextRef.current.createStereoPanner();
    const pannerR = audioContextRef.current.createStereoPanner();
    pannerL.pan.value = -1;
    pannerR.pan.value = 1;

    oscL.type = waveform;
    oscL.frequency.setValueAtTime(baseHz, audioContextRef.current.currentTime);
    oscR.type = waveform;
    oscR.frequency.setValueAtTime(baseHz + offset, audioContextRef.current.currentTime);
    
    gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.1, audioContextRef.current.currentTime + 0.1);

    oscL.connect(pannerL);
    oscR.connect(pannerR);
    
    pannerL.connect(gain);
    pannerR.connect(gain);
    
    gain.connect(analyser);
    analyser.connect(audioContextRef.current.destination);

    oscL.start();
    oscR.start();
    
    oscLRef.current = oscL;
    oscRRef.current = oscR;
    gainNodeRef.current = gain;
    analyserRef.current = analyser;
    setIsPlaying(true);
    
    drawOscilloscope();
  };

  const stopFrequency = () => {
    if (gainNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.setTargetAtTime(0, now, 0.05);
      if (oscLRef.current) oscLRef.current.stop(now + 0.1);
      if (oscRRef.current) oscRRef.current.stop(now + 0.1);
    }
    setIsPlaying(false);
  };
  
  const drawOscilloscope = () => {
    if (!canvasRef.current || !analyserRef.current || !isPlaying) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const W = canvas.width;
    const H = canvas.height;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isPlaying || !analyserRef.current) {
        // Clear when stopped
        ctx.clearRect(0, 0, W, H);
        return;
      }
      
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, W, H);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#C9A84C';
      
      ctx.beginPath();
      
      const sliceWidth = W * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * H / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    
    draw();
  };

  const handleTune = (freq: Frequency) => {
    setIsTuning(true);
    setSelectedFreq(freq);
    setCustomHz(freq.hz);
    setBinauralOffset(0); // Reset binaural on preset selection
    if (isPlaying) {
      startFrequency(freq.hz, 0);
    }
    setTimeout(() => setIsTuning(false), 1500);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopFrequency();
    } else {
      startFrequency(customHz, binauralOffset);
    }
  };

  return (
    <div className="surface-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-white/5">
      {/* Background Signal Visualizer */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {isPlaying && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 2], opacity: [0, 1, 0] }}
              transition={{ 
                duration: Math.max(1, 4 - (binauralOffset * 0.1)), 
                repeat: Infinity, 
                delay: i * 0.5,
                ease: "easeOut"
              }}
              className="absolute w-[400px] h-[400px] rounded-full border border-gold"
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-zinc-900 border transition-all duration-700 ${isPlaying ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}>
              <Radio className={isPlaying ? 'text-gold animate-pulse' : 'text-zinc-600'} size={28} />
            </div>
            <div>
              <h3 className="font-display text-2xl text-white tracking-widest uppercase mb-1">Signal Calibration</h3>
              <div className="flex items-center gap-3">
                <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-bold">Quantum Tuner v1.1.0</p>
                <div className="h-px w-8 bg-white/10" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Status: {isPlaying ? 'Broadcasting Resonance' : 'Standby'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 px-3 border-r border-white/10">
              {volume === 0 ? <VolumeX size={14} className="text-zinc-500" /> : <Volume2 size={14} className="text-gold" />}
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 accent-gold h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-1 p-1 pr-3 border-r border-white/10">
              {(['sine', 'square', 'sawtooth', 'triangle'] as WaveformType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setWaveform(type)}
                  className={`p-2 rounded-lg text-[8px] uppercase font-bold transition-all border ${
                    waveform === type 
                      ? 'bg-gold/20 border-gold text-gold shadow-[0_0_10px_rgba(201,168,76,0.3)]' 
                      : 'bg-white/5 border-transparent text-zinc-600 hover:text-zinc-400'
                  }`}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  <Activity size={12} className="mb-0.5" />
                  {type[0]}
                </button>
              ))}
            </div>
            <div className="px-2">
               <button 
                 onClick={() => setFineTuneMode(!fineTuneMode)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors ${fineTuneMode ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-zinc-400 border border-transparent hover:text-white hover:bg-white/10'}`}
               >
                 <Sliders size={12} />
                 Fine Tune
               </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.hz}
              onClick={() => handleTune(freq)}
              className={`group relative p-6 rounded-2xl border transition-all duration-500 text-left overflow-hidden ${
                selectedFreq?.hz === freq.hz && !fineTuneMode
                  ? 'border-gold bg-gold/5 shadow-[0_0_15px_rgba(201,168,76,0.1)]' 
                  : 'border-white/5 bg-white/2 hover:border-white/10'
              }`}
            >
              <div className={`absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity ${selectedFreq?.hz === freq.hz ? 'text-gold opacity-100' : 'text-zinc-700'}`}>
                {freq.icon}
              </div>
              
              <div className="relative z-10">
                <div className={`font-mono text-xl mb-1 ${selectedFreq?.hz === freq.hz && !fineTuneMode ? 'text-gold' : 'text-white'}`}>
                  {freq.hz}<span className="text-[10px] opacity-50 ml-1">Hz</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-gold/70 transition-colors font-bold">
                  {freq.name}
                </div>
              </div>

              {selectedFreq?.hz === freq.hz && isPlaying && !fineTuneMode && (
                <div className="absolute bottom-0 left-0 w-full flex gap-0.5 h-1 items-end">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [1, 4, 1] }}
                      transition={{ duration: 0.5 + (i * 0.1), repeat: Infinity }}
                      className="flex-1 bg-gold/50"
                    />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Fine Tuning Panel */}
        <AnimatePresence>
          {fineTuneMode && (
            <motion.div 
               initial={{ opacity: 0, height: 0, marginBottom: 0 }}
               animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
               exit={{ opacity: 0, height: 0, marginBottom: 0 }}
               className="surface-panel !bg-black/50 p-6 rounded-3xl border border-gold/30 relative overflow-hidden"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2"><Radio size={12}/> Master Frequency</label>
                        <span className="font-mono text-gold text-lg">{customHz.toFixed(1)} Hz</span>
                      </div>
                      <input 
                         type="range" 
                         min="1" 
                         max="1000" 
                         step="0.1" 
                         value={customHz}
                         onChange={(e) => setCustomHz(parseFloat(e.target.value))}
                         className="w-full accent-gold h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2"><Headphones size={12}/> Binaural Offset (Brainwave Entrainment)</label>
                        <span className="font-mono text-blue-400 text-lg">+{binauralOffset.toFixed(1)} Hz</span>
                      </div>
                      <input 
                         type="range" 
                         min="0" 
                         max="40" 
                         step="0.1" 
                         value={binauralOffset}
                         onChange={(e) => setBinauralOffset(parseFloat(e.target.value))}
                         className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] uppercase tracking-widest text-zinc-600 mt-2 font-bold">
                        <span>Delta (0-4Hz)</span>
                        <span>Theta (4-8Hz)</span>
                        <span>Alpha (8-13Hz)</span>
                        <span>Beta (13-30Hz)</span>
                        <span>Gamma (30+Hz)</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2"><Activity size={12}/> Realtime Signal Calibration</label>
                    </div>
                    <div className="flex-1 bg-black/80 rounded-xl border border-white/10 p-2 relative">
                        <canvas 
                          ref={canvasRef}
                          width={400}
                          height={120}
                          className="w-full h-full rounded-lg"
                        />
                        {!isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono">Awaiting Signal</span>
                          </div>
                        )}
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedFreq || fineTuneMode ? (
            <motion.div
              key={fineTuneMode ? 'custom' : selectedFreq?.hz}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="surface-panel p-8 rounded-3xl border border-gold/20 relative overflow-hidden group bg-black/40"
            >
              <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="relative">
                  <div className={`w-32 h-32 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-gold/30 transition-colors`}>
                    {/* Inner Signal Ring */}
                    <motion.div 
                      animate={isPlaying ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-4 rounded-full border-2 border-gold/20`}
                    />
                    <div className={isPlaying ? 'text-gold relative z-10' : 'text-zinc-700 relative z-10'}>
                      {fineTuneMode ? <Sliders size={48} /> : React.cloneElement(selectedFreq!.icon as React.ReactElement<any>, { size: 48 })}
                    </div>
                  </div>
                  
                  {isPlaying && (
                    <div className="absolute -inset-4 bg-gold/5 rounded-full blur-2xl animate-pulse -z-10" />
                  )}
                </div>
                
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-4">
                    <h4 className="font-display text-4xl text-white tracking-widest uppercase italic">{fineTuneMode ? customHz.toFixed(1) : selectedFreq?.hz}Hz</h4>
                    <span className="hidden sm:block w-px h-6 bg-white/10" />
                    <h5 className="text-gold text-lg uppercase tracking-[0.2em] font-medium">{fineTuneMode ? 'Custom Calibration' : selectedFreq?.name}</h5>
                    {binauralOffset > 0 && (
                        <>
                           <span className="hidden sm:block w-px h-6 bg-white/10" />
                           <h5 className="text-blue-400 text-sm uppercase tracking-[0.2em] font-bold">+ {binauralOffset.toFixed(1)}Hz Binaural</h5>
                        </>
                    )}
                  </div>
                  
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0 font-mono italic">
                    "{fineTuneMode ? 'Manual frequency synthesis. Adjust master tuning and binaural entrainment offset.' : selectedFreq?.benefit}"
                  </p>
                  
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <button 
                      onClick={togglePlayback}
                      className={`group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all duration-500 ${
                        isPlaying 
                          ? 'bg-zinc-800 text-gold border border-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                          : 'gold-gradient text-black hover:scale-105 shadow-xl shadow-gold/10'
                      }`}
                    >
                      {isPlaying ? (
                        <><Square size={14} className="fill-current" /> Terminate Signal</>
                      ) : (
                        <><Play size={14} className="fill-current" /> Initialize Frequency</>
                      )}
                    </button>
                    {!fineTuneMode && (
                        <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                          Scan Neural Database <ChevronRight size={14} />
                        </button>
                    )}
                  </div>
                </div>

                <div className="hidden xl:flex flex-col items-end gap-2 opacity-20">
                  <span className="text-[8px] uppercase tracking-tighter text-zinc-500 font-mono">Phase Alignment</span>
                  <div className="flex gap-1 h-12 items-end">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={isPlaying ? { height: [4, Math.random() * 40 + 8, 4] } : { height: 2 }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                        className="w-1 bg-gold rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {isTuning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center"
                >
                  <div className="relative w-64 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 gold-gradient"
                    />
                  </div>
                  <p className="text-gold text-[10px] uppercase tracking-[0.5em] animate-pulse font-bold">Synchronizing Neural Channels...</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/2 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setFineTuneMode(true)}>
              <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-6 flex items-center justify-center text-zinc-700 group-hover:text-gold group-hover:border-gold/30 border border-transparent transition-all">
                <Settings2 size={32} />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-bold">Awaiting Signal Definition</p>
              <p className="text-[8px] text-zinc-700 uppercase tracking-widest mt-2">Select a frequency node from the grid above or enter Fine Tune mode</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Hardware Interface Details */}
      <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5 text-[8px] text-zinc-700 uppercase tracking-[0.3em] font-mono">
        <div className="flex gap-4">
          <span>Module: SIG-CAL (Signal Calibration)</span>
          <span>Core: Solfeggio_Std + Binaural_Ext</span>
        </div>
        <div className="flex gap-4">
          <span className={isPlaying ? 'text-gold' : ''}>Active: {isPlaying ? 'Yes' : 'No'}</span>
          <span>Clock: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

