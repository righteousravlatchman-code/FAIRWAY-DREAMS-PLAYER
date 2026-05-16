import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Sparkles, Download, RefreshCw, Loader2, Play, Pause, Headphones, Volume2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateFrequencyReport, generateReportAudio } from '../services/geminiService';
import { useToast } from './ToastProvider';
import { FrequencyVisualizer } from './FrequencyVisualizer';

interface FrequencyReportProps {
  userData: { name: string; birthDate: string };
}

export const FrequencyReport: React.FC<FrequencyReportProps> = ({ userData }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  
  const { showToast } = useToast();

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);
    setAudioBuffer(null);
    setIsPlaying(false);
    try {
      const content = await generateFrequencyReport(userData);
      setReport(content);
      showToast('Multi-Dimensional Report Generated', 'success');
    } catch (error) {
      showToast('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!report) return;
    setAudioLoading(true);
    try {
      const result = await generateReportAudio(report);
      
      // Decode PCM data
      const binary = atob(result.audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Convert 16-bit Int PCM to Float32 PCM
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const buffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);
      setAudioBuffer(buffer);
      
      showToast('Audio Briefing Ready', 'success');
      playAudio(buffer);
    } catch (error) {
      console.error("Audio error:", error);
      showToast('Failed to generate audio', 'error');
    } finally {
      setAudioLoading(false);
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        setIsPlaying(false);
      }
    } else if (audioBuffer) {
      playAudio(audioBuffer);
    } else {
      handleGenerateAudio();
    }
  };

  useEffect(() => {
    if (!report && !loading) {
      handleGenerateReport();
    }
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
    };
  }, [userData]);

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Frequency_Report_${userData.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report downloaded', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-gold/10 text-gold border border-gold/20">
            <FileText size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-white tracking-widest uppercase">Frequency Report</h2>
            <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-widest">Comprehensive Multi-Dimensional Analysis</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 self-end sm:self-auto">
          <button 
            onClick={toggleAudio}
            disabled={loading || audioLoading || !report}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] uppercase tracking-widest font-bold ${
              isPlaying 
              ? 'bg-gold text-black border-gold' 
              : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
            } disabled:opacity-50`}
          >
            {audioLoading ? <Loader2 size={14} className="animate-spin" /> : isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Stop Briefing' : 'Listen to Briefing'}
          </button>
          
          <button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Regenerate
          </button>
          <button 
            onClick={handleDownload}
            disabled={!report || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
          >
            <Download size={14} />
            Download MD
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-12 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-gold/20 animate-spin border-t-gold" />
              <Sparkles className="absolute inset-0 m-auto text-gold animate-pulse" size={32} />
            </div>
            <div>
              <h3 className="text-white font-display text-xl uppercase tracking-widest mb-2">Decoding Frequencies</h3>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Synthesizing celestial and numerical data points...</p>
            </div>
          </motion.div>
        ) : report ? (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 sm:p-12 rounded-[3rem] border border-gold/20 relative overflow-hidden cyber-grid"
          >
            <div className="scan-line" />
            <div className="absolute top-0 right-0 p-8 flex gap-2">
              <div className="glow-dot animate-pulse" />
              <div className="glow-dot animate-pulse delay-75" />
              <div className="glow-dot animate-pulse delay-150" />
            </div>
            
            <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-12 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center text-gold">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-display text-lg uppercase tracking-[0.3em]">Frequency Dossier</h3>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest">ID: {userData.name.toUpperCase().replace(/\s/g, '-')}-{new Date().getFullYear()}</p>
                  </div>
                </div>

                {audioBuffer && !isPlaying && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-gold/40 text-[8px] uppercase tracking-widest"
                  >
                    <Volume2 size={12} />
                    Audio Briefing Cached
                  </motion.div>
                )}
              </div>

              <div className="mb-12 p-6 rounded-2xl bg-black/40 border border-gold/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 cyber-grid" />
                <p className="text-[8px] uppercase tracking-widest text-gold/60 mb-4 text-center">Spectral Signature Analysis</p>
                <FrequencyVisualizer name={userData.name} birthDate={userData.birthDate} />
              </div>

              <div className="markdown-body prose prose-invert prose-gold max-w-none prose-headings:font-display prose-headings:tracking-[0.2em] prose-headings:uppercase prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-zinc-400 prose-strong:text-gold prose-li:text-zinc-400">
                <Markdown>{report}</Markdown>
              </div>
            </div>

            {/* Decorative Signal Bars */}
            <div className="mt-12 flex justify-center gap-1 h-4 items-end opacity-20">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [4, 16, 6, 12, 4] : 4 }}
                  transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0, delay: i * 0.05 }}
                  className="w-0.5 bg-gold rounded-full"
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
