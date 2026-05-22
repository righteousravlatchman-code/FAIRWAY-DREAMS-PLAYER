import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Activity, Save, Download, Settings, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastProvider';

export const LiveRiffCapture: React.FC<{ onCapture: (midiData: number[], annotation?: string) => void }> = ({ onCapture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [midiSequence, setMidiSequence] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [minNote, setMinNote] = useState(21); // A0
  const [maxNote, setMaxNote] = useState(108); // C8
  const [annotation, setAnnotation] = useState('');
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  
  const [quantize, setQuantize] = useState(false);
  const [timeQuantize, setTimeQuantize] = useState(false);
  const [scale, setScale] = useState('chromatic');
  const quantizeRef = useRef(false);
  const timeQuantizeRef = useRef(false);
  const scaleRef = useRef('chromatic');

  const [calibrating, setCalibrating] = useState(false);
  const [measuredLatency, setMeasuredLatency] = useState<number | null>(null);
  const calibrationStartRef = useRef<number>(0);
  const isCalibratingRef = useRef(false);

  const minNoteRef = useRef(21);
  const maxNoteRef = useRef(108);
  const metronomeEnabledRef = useRef(false);
  const metronomeBpmRef = useRef(120);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reqRef = useRef<number | null>(null);
  const { showToast } = useToast();

  const hzToMidi = (hz: number) => Math.round(69 + 12 * Math.log2(hz / 440));

  const snapToScale = (note: number, scaleType: string) => {
    if (scaleType === 'chromatic') return note;
    const noteClass = note % 12;
    const octave = Math.floor(note / 12) * 12;
    let scaleMap: number[] = [];
    if (scaleType === 'major') scaleMap = [0, 2, 4, 5, 7, 9, 11];
    else if (scaleType === 'minor') scaleMap = [0, 2, 3, 5, 7, 8, 10];
    else if (scaleType === 'pentatonic') scaleMap = [0, 2, 4, 7, 9];
    else return note;

    let closest = 0;
    let minDiff = 999;
    scaleMap.forEach(s => {
      [-12, 0, 12].forEach(offset => {
        const val = s + offset;
        const diff = Math.abs(val - noteClass);
        if (diff < minDiff) {
          minDiff = diff;
          closest = val;
        }
      });
    });
    return octave + closest;
  };

  const startCalibration = async () => {
    try {
      setCalibrating(true);
      setMeasuredLatency(null);
      isCalibratingRef.current = true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, echoCancellation: false });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      // Play a short pulse
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 1000;
      
      const startTime = audioCtx.currentTime + 0.1;
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      
      osc.start(startTime);
      osc.stop(startTime + 0.1);
      
      calibrationStartRef.current = Date.now() + 100; // Approximating startTime offset

      let checkReq: number;
      const checkLatency = () => {
        if (!isCalibratingRef.current) return;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        let maxVal = -Infinity;
        let maxIndex = -1;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIndex = i;
          }
        }
        
        const maxFreq = (maxIndex * audioCtx.sampleRate) / analyser.fftSize;
        
        // Wait for 1000Hz peak
        if (maxVal > 150 && maxFreq > 900 && maxFreq < 1100 && Date.now() > calibrationStartRef.current) {
          const latency = Date.now() - calibrationStartRef.current;
          setMeasuredLatency(latency);
          setCalibrating(false);
          isCalibratingRef.current = false;
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();
          return;
        }

        if (Date.now() - calibrationStartRef.current > 2000) {
          // Timeout
          showToast("Calibration failed. Check volume.", "error");
          setCalibrating(false);
          isCalibratingRef.current = false;
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();
          return;
        }

        checkReq = requestAnimationFrame(checkLatency);
      };

      requestAnimationFrame(checkLatency);

    } catch (err) {
      console.error("Mic access denied", err);
      showToast("Microphone access is required for calibration.", "error");
      setCalibrating(false);
      isCalibratingRef.current = false;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      setMidiSequence([]);
      
      let lastPeakTime = 0;
      let nextNoteTime = audioCtx.currentTime + 0.1; // Metronome initial time
      let nextGridTime = audioCtx.currentTime + 0.1;
      let activeGridNote = 0;

      const processAudio = () => {
        if (!analyserRef.current || !audioContextRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Find dominant frequency
        let maxVal = -Infinity;
        let maxIndex = -1;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIndex = i;
          }
        }

        const sampleRate = audioCtx.sampleRate;
        const maxFreq = (maxIndex * sampleRate) / analyser.fftSize;

        const now = Date.now();
        const latencyOffset = measuredLatency && !isNaN(measuredLatency) ? (measuredLatency / 1000) : 0;
        
        // Time quantization check
        const gridStep = 30.0 / metronomeBpmRef.current; // 8th note duration
        if (timeQuantizeRef.current) {
          while (nextGridTime < audioCtx.currentTime - latencyOffset) {
            setMidiSequence(prev => [...prev, activeGridNote]);
            activeGridNote = 0;
            nextGridTime += gridStep;
          }
        }

        // Arbitrary threshold for "loud enough" to be considered a note
        if (maxVal > 150 && maxFreq > 50 && maxFreq < 2000) {
          let minDelayMs = timeQuantizeRef.current ? 50 : 200;

          if (now - lastPeakTime > minDelayMs) {
             let note = hzToMidi(maxFreq);
             
             if (quantizeRef.current) {
                note = snapToScale(note, scaleRef.current);
             }

             if (note >= minNoteRef.current && note <= maxNoteRef.current) {
                 setCurrentNote(note);
                 if (timeQuantizeRef.current) {
                   activeGridNote = note; // Store for the grid pulse to pick it up
                 } else {
                   setMidiSequence(prev => [...prev, note]);
                 }
                 lastPeakTime = now;
             }
          }
        } else if (timeQuantizeRef.current && now - lastPeakTime > 100) {
           setCurrentNote(null);
        }

        if (metronomeEnabledRef.current) {
          const scheduleAheadTime = 0.1;
          while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.value = 800;
              
              gain.gain.value = 0;
              gain.gain.setValueAtTime(0.5, nextNoteTime);
              gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.05);
              
              osc.start(nextNoteTime);
              osc.stop(nextNoteTime + 0.05);

              nextNoteTime += 60.0 / metronomeBpmRef.current;
          }
        } else {
            // Keep it synced so if toggled on it doesn't try to catch up a bunch of missed beats
            nextNoteTime = audioCtx.currentTime + 0.1;
            if (!timeQuantizeRef.current) {
              nextGridTime = audioCtx.currentTime + 0.1;
            }
        }

        reqRef.current = requestAnimationFrame(processAudio);
      };

      processAudio();

    } catch (err: any) {
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        console.error("Mic access denied or unavailable", err);
        showToast("Microphone access is required to capture riffs.", "error");
      }
    }
  };

  const stopRecording = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsRecording(false);
    setCurrentNote(null);
  };

  useEffect(() => {
    return () => stopRecording();
  }, []);

  const handleSave = () => {
    if (midiSequence.length > 0) {
      onCapture(midiSequence, annotation);
      setMidiSequence([]);
      setAnnotation('');
    }
  };

  const exportMidi = () => {
    if (midiSequence.length === 0) return;
    
    // MIDI Header: MThd (4 bytes), length (4 bytes: 6), format (2 bytes: 0), tracks (2 bytes: 1), division (2 bytes: 120)
    const header = [
      0x4D, 0x54, 0x68, 0x64, 
      0x00, 0x00, 0x00, 0x06, 
      0x00, 0x00, 
      0x00, 0x01, 
      0x00, 0x78 // 120 ticks per quarter note
    ];

    // Track data
    const trackEvents: number[] = [];
    
    // Tempo Meta Event: Set tempo (default 120 BPM if not enabled, but we'll just use metronomeBpm)
    const microSecPerBeat = Math.round(60000000 / metronomeBpm);
    const b1 = (microSecPerBeat >> 16) & 0xFF;
    const b2 = (microSecPerBeat >> 8) & 0xFF;
    const b3 = microSecPerBeat & 0xFF;
    
    trackEvents.push(0x00, 0xFF, 0x51, 0x03, b1, b2, b3);

    if (annotation.trim()) {
      const textBytes = new TextEncoder().encode(annotation.trim().substring(0, 127));
      trackEvents.push(0x00, 0xFF, 0x01, textBytes.length, ...textBytes);
    }

    midiSequence.forEach(note => {
      // NOTE ON at delta 0
      trackEvents.push(0x00); // delta time 0
      trackEvents.push(0x90); // Note On, Channel 0
      trackEvents.push(note & 0x7F); // Note
      trackEvents.push(0x60); // Velocity 96
      
      // NOTE OFF at delta 120 (1 quarter note) -> variable length!
      // 120 is 0x78 <= 127, so it's a single byte variable length quantity
      trackEvents.push(0x78); // delta time 120
      trackEvents.push(0x80); // Note Off, Channel 0
      trackEvents.push(note & 0x7F); // Note
      trackEvents.push(0x00); // Velocity 0
    });

    // End of track meta event
    trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

    // Track chunk header: MTrk (4 bytes), length (4 bytes)
    const trackEventLength = trackEvents.length;
    const trackHeader = [
      0x4D, 0x54, 0x72, 0x6B,
      (trackEventLength >> 24) & 0xFF,
      (trackEventLength >> 16) & 0xFF,
      (trackEventLength >> 8) & 0xFF,
      trackEventLength & 0xFF
    ];

    const midiData = new Uint8Array([...header, ...trackHeader, ...trackEvents]);

    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = annotation.trim() ? annotation.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'captured_riff';
    a.download = `${safeName}_${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('MIDI exported successfully', 'success');
  };

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Mic size={16} className={isRecording ? "text-red-500 animate-pulse" : "text-zinc-500"} />
           <span className="text-xs font-display uppercase tracking-widest text-white">Live Riff Capture (MIDI)</span>
        </div>
        {isRecording ? (
          <button onClick={stopRecording} className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors">
            <Square fill="currentColor" size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-white/10 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
              <Settings size={14} />
            </button>
            <button onClick={startRecording} className="p-2 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Mic size={14} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfig && !isRecording && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-3 py-2 border-t border-white/5"
          >
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-400">
                <span>Min MIDI Note</span>
                <span className="text-white">{minNote}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="127" 
                value={minNote}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMinNote(val);
                  minNoteRef.current = val;
                  if (val > maxNote) {
                    setMaxNote(val);
                    maxNoteRef.current = val;
                  }
                }}
                className="w-full accent-gold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-400">
                <span>Max MIDI Note</span>
                <span className="text-white">{maxNote}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="127" 
                value={maxNote}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMaxNote(val);
                  maxNoteRef.current = val;
                  if (val < minNote) {
                    setMinNote(val);
                    minNoteRef.current = val;
                  }
                }}
                className="w-full accent-gold"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Pitch Quantize (Scale)</span>
                <button 
                  onClick={() => {
                    const nu = !quantize;
                    setQuantize(nu);
                    quantizeRef.current = nu;
                  }}
                  className={`w-8 h-4 rounded-full relative transition-colors ${quantize ? 'bg-gold' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${quantize ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              
              {quantize && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-400">
                    <span>Scale</span>
                    <select 
                       value={scale}
                       onChange={(e) => {
                         setScale(e.target.value);
                         scaleRef.current = e.target.value;
                       }}
                       className="bg-black/40 text-white border border-white/10 rounded p-1 outline-none text-xs"
                    >
                       <option value="chromatic">Chromatic</option>
                       <option value="major">Major</option>
                       <option value="minor">Minor</option>
                       <option value="pentatonic">Pentatonic</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Time Quantize (Grid)</span>
                <button 
                  onClick={() => {
                    const nu = !timeQuantize;
                    setTimeQuantize(nu);
                    timeQuantizeRef.current = nu;
                  }}
                  className={`w-8 h-4 rounded-full relative transition-colors ${timeQuantize ? 'bg-gold' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${timeQuantize ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">MIDI Latency Calibration</span>
                <button 
                  onClick={startCalibration}
                  disabled={calibrating}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[10px] text-zinc-300 uppercase tracking-widest disabled:opacity-50"
                >
                  {calibrating ? "Listening..." : "Calibrate"}
                </button>
              </div>
              
              {(measuredLatency !== null || calibrating) && (
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-400 mt-1">
                  <span>Measured Latency</span>
                  <span className={measuredLatency !== null ? "text-gold" : "text-white animate-pulse"}>
                    {measuredLatency !== null ? `${measuredLatency} ms` : '...'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Metronome</span>
                <button 
                  onClick={() => {
                    const nu = !metronomeEnabled;
                    setMetronomeEnabled(nu);
                    metronomeEnabledRef.current = nu;
                  }}
                  className={`w-8 h-4 rounded-full relative transition-colors ${metronomeEnabled ? 'bg-gold' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${metronomeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              
              {metronomeEnabled && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-400">
                    <span>BPM</span>
                    <span className="text-white">{metronomeBpm}</span>
                  </div>
                  <input 
                    type="range" 
                    min="40" 
                    max="240" 
                    value={metronomeBpm}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMetronomeBpm(val);
                      metronomeBpmRef.current = val;
                    }}
                    className="w-full accent-gold"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isRecording && (
        <div className="flex items-center gap-2 text-xs text-gold font-mono h-6">
          <Activity size={12} className="animate-pulse" />
          {currentNote ? `Detecting Note: ${currentNote}` : "Listening..."}
        </div>
      )}

      {midiSequence.length > 0 && (
        <div className="flex flex-col gap-2">
           <div className="text-[10px] text-zinc-500 font-mono break-words bg-black/40 p-2 rounded-lg border border-white/5 max-h-20 overflow-y-auto">
             [{midiSequence.join(', ')}]
           </div>
           {!isRecording && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Add a label to this riff (e.g. 'Intro Lead')"
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-gold/50"
                  maxLength={100}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className="flex-1 flex items-center gap-2 justify-center py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest border border-gold/20"
                  >
                    <Save size={12} /> Share Riff
                  </button>
                  <button 
                    onClick={exportMidi}
                    className="flex-1 flex items-center gap-2 justify-center py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest border border-white/10"
                  >
                    <Download size={12} /> Export .MID
                  </button>
                </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};
