import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Sparkles, Download, RefreshCw, Loader2, Play, Pause, Headphones, Volume2, Calendar, Zap, Target, Activity } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateFrequencyReport, generateDailyResonance } from '../services/geminiService';
import { useToast } from './ToastProvider';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { useAudioNarrator } from '../hooks/useAudioNarrator';

interface FrequencyReportProps {
  userData: { name: string; birthDate: string };
}

export const FrequencyReport: React.FC<FrequencyReportProps> = ({ userData }) => {
  const [report, setReport] = useState<string | null>(null);
  const [dailyResonance, setDailyResonance] = useState<string | null>(null);
  const [view, setView] = useState<'daily' | 'dossier'>('daily');
  const [loading, setLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const { isPlaying, audioLoading, toggleText, setAudioBuffer } = useAudioNarrator();
  
  const { showToast } = useToast();

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);
    setAudioBuffer(null);
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

  const handleGenerateDaily = async () => {
    setDailyLoading(true);
    setAudioBuffer(null);
    try {
      const content = await generateDailyResonance(userData);
      setDailyResonance(content);
    } catch (error) {
      showToast('Failed to generate daily pulse', 'error');
    } finally {
      setDailyLoading(false);
    }
  };

  const handleToggleAudio = () => {
    const textToRead = view === 'daily' ? dailyResonance : report;
    if (textToRead) {
      toggleText(textToRead);
    }
  };

  useEffect(() => {
    if (!report && !loading) {
      handleGenerateReport();
    }
    if (!dailyResonance && !dailyLoading) {
      handleGenerateDaily();
    }
  }, [userData]);

  const handleDownload = () => {
    const content = view === 'daily' ? dailyResonance : report;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Frequency_${view === 'daily' ? 'Daily' : 'Dossier'}_${userData.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report downloaded', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gold/10 text-gold border border-gold/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
            <Activity size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-white tracking-widest uppercase">Frequency Briefing</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Quantum State: Synchronized</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {/* Toggle View */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setView('daily')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === 'daily' ? 'bg-gold text-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Daily Pulse
            </button>
            <button 
              onClick={() => setView('dossier')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === 'dossier' ? 'bg-gold text-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Full Dossier
            </button>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block" />

          <button 
            onClick={handleToggleAudio}
            disabled={loading || dailyLoading || audioLoading || (view === 'daily' ? !dailyResonance : !report)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] uppercase tracking-widest font-bold ${
              isPlaying 
              ? 'bg-gold text-black border-gold shadow-[0_0_20px_rgba(201,168,76,0.3)]' 
              : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
            } disabled:opacity-50`}
          >
            {audioLoading ? <Loader2 size={14} className="animate-spin" /> : isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Stop' : 'Briefing'}
          </button>
          
          <button 
            onClick={handleDownload}
            disabled={(view === 'daily' ? !dailyResonance : !report) || loading || dailyLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gold text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(201,168,76,0.2)]"
          >
            <Download size={14} />
            MD
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(view === 'daily' ? dailyLoading : loading) ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass-panel p-20 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-gold/10 animate-[spin_3s_linear_infinite] border-t-gold shadow-[0_0_30px_rgba(201,168,76,0.1)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-gold animate-pulse" size={40} />
              </div>
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className="text-white font-display text-2xl uppercase tracking-[0.3em]">Calibrating</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-relaxed">Synthesizing multi-dimensional data streams for {view === 'daily' ? 'today\'s resonance' : 'full dossier'}...</p>
            </div>
          </motion.div>
        ) : (view === 'daily' && dailyResonance) || (view === 'dossier' && report) ? (
          <motion.div 
            key={view}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 sm:p-16 rounded-[4rem] border border-gold/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-white/10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-gold/5 border border-gold/20 flex items-center justify-center text-gold shadow-[inset_0_0_20px_rgba(201,168,76,0.1)]">
                    {view === 'daily' ? <Calendar size={32} /> : <FileText size={32} />}
                  </div>
                  <div>
                    <h3 className="text-white font-display text-2xl py-1 uppercase tracking-[0.4em] gold-gradient bg-clip-text text-transparent">
                      {view === 'daily' ? 'Daily Pulse' : 'Frequency Dossier'}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Subject: {userData.name}</p>
                      <div className="w-1 h-1 rounded-full bg-gold/40" />
                      <p className="text-[10px] text-gold/60 uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={view === 'daily' ? handleGenerateDaily : handleGenerateReport}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-gold hover:border-gold/30 transition-all group"
                    title="Refresh Analysis"
                  >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                  </button>
                </div>
              </div>

              {view === 'daily' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-8">
                    <div className="markdown-body prose prose-invert prose-gold max-w-none prose-headings:font-display prose-headings:tracking-[0.2em] prose-headings:uppercase prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-gold">
                      <Markdown>{dailyResonance}</Markdown>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-4">
                      <div className="flex-1 min-w-[200px] p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-gold">
                          <Zap size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active Influence</span>
                        </div>
                        <p className="text-sm text-white font-medium">Jupiter Sextile Ascendant</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">Amplified expansion in personal outreach. High probability of synchronicities.</p>
                      </div>
                      <div className="flex-1 min-w-[200px] p-6 rounded-3xl bg-gold/10 border border-gold/20 flex flex-col gap-3 shadow-[0_10px_30px_rgba(201,168,76,0.05)]">
                        <div className="flex items-center gap-2 text-gold">
                          <Target size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Strategic Focus</span>
                        </div>
                        <p className="text-sm text-white font-medium">Network Expansion</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">Deploy new initiatives between 2 PM and 4 PM. Vibration is peaked for impact.</p>
                      </div>
                    </div>
                  </div>

                  <div className="sticky top-8 space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-black/40 border border-gold/10 relative overflow-hidden group">
                      <div className="absolute inset-0 opacity-10 cyber-grid group-hover:opacity-20 transition-opacity" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-2">
                            <Activity className="text-gold" size={16} />
                            <h4 className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">Real-time Spectral Output</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] text-emerald-500/80 uppercase tracking-widest font-bold">Live</span>
                          </div>
                        </div>
                        <FrequencyVisualizer name={userData.name} birthDate={userData.birthDate} />
                        <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Stability</p>
                            <p className="text-xs text-white font-mono">98.4%</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Amplitude</p>
                            <p className="text-xs text-white font-mono">0.65</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Phase</p>
                            <p className="text-xs text-white font-mono">Balanced</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-gold/5 border border-gold/10 text-center space-y-4">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-gold/60">Optimized Today For:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['Clarity', 'Action', 'Synthesis'].map(tag => (
                          <span key={tag} className="px-4 py-1.5 rounded-full bg-black/40 border border-gold/20 text-gold text-[8px] font-bold uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <div className="mb-12 p-8 sm:p-12 rounded-[2.5rem] bg-black/40 border border-gold/10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 cyber-grid" />
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gold/60 mb-6 text-center font-bold">Spectral Signature Analysis</p>
                    <FrequencyVisualizer name={userData.name} birthDate={userData.birthDate} />
                  </div>

                  <div className="markdown-body prose prose-invert prose-gold max-w-none prose-headings:font-display prose-headings:tracking-[0.2em] prose-headings:uppercase prose-h1:text-4xl prose-h1:gold-gradient prose-h1:bg-clip-text prose-h1:text-transparent prose-h2:text-2xl prose-h3:text-xl prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-gold prose-li:text-zinc-400">
                    <Markdown>{report}</Markdown>
                  </div>
                </div>
              )}
            </div>

            {/* Decorative Signal Bars */}
            <div className="mt-16 flex justify-center gap-1.5 h-6 items-end opacity-20">
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [6, 24, 8, 18, 6] : 6 }}
                  transition={{ duration: 0.6, repeat: isPlaying ? Infinity : 0, delay: i * 0.03 }}
                  className="w-1 bg-gold rounded-full"
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
