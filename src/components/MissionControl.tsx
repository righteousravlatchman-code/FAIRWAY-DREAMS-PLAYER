import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Users, 
  Calendar, 
  Target,
  ChevronRight,
  Info,
  RefreshCw,
  Sparkles,
  Activity,
  Loader2,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { 
  personalYear, 
  wealthWindow, 
  personalMonth, 
  personalDay, 
  dailyDirective, 
  compatibility,
  reduce
} from '../services/numerologyService';
import { generateDailyResonance, generateMissionControlInsight } from '../services/geminiService';
import Markdown from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { useToast } from './ToastProvider';
import { useAudioNarrator } from '../hooks/useAudioNarrator';

interface MissionControlProps {
  userData: { name: string; birthDate: string };
}

export const MissionControl: React.FC<MissionControlProps> = ({ userData }) => {
  const [compPartner, setCompPartner] = useState('');
  const [compResult, setCompResult] = useState<string | null>(null);
  const [dailyResonance, setDailyResonance] = useState<string | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});
  const { isPlaying, audioLoading, toggleText, setAudioBuffer } = useAudioNarrator();
  
  const { showToast } = useToast();

  const handleGenerateInsight = async (element: string, data: any) => {
    if (insights[element]) return;
    setLoadingInsights(prev => ({ ...prev, [element]: true }));
    try {
      const res = await generateMissionControlInsight(userData.name, userData.birthDate, element, data);
      setInsights(prev => ({ ...prev, [element]: res }));
      showToast(`Deep insight for ${element} received.`, "success");
    } catch (err) {
      showToast("Failed to retrieve deep systems insight.", "error");
    } finally {
      setLoadingInsights(prev => ({ ...prev, [element]: false }));
    }
  };

  const stats = useMemo(() => {
    const py = personalYear(userData.birthDate);
    const pm = personalMonth(py);
    const pd = personalDay(pm);
    const wealth = wealthWindow(py);
    const directive = dailyDirective(pd);

    // Calculate Life Path for display
    const lifePath = reduce(userData.birthDate);

    return { py, pm, pd, wealth, directive, lifePath };
  }, [userData.birthDate]);

  useEffect(() => {
    const fetchDaily = async () => {
      setLoadingDaily(true);
      setAudioBuffer(null);
      try {
        const report = await generateDailyResonance(userData);
        setDailyResonance(report);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchDaily();
  }, [userData.name, userData.birthDate]);

  const handleToggleAudio = () => {
    if (dailyResonance) {
      toggleText(dailyResonance);
    }
  };

  const handleCompatibilityCheck = () => {
    if (!compPartner) return;
    const result = compatibility(stats.lifePath, compPartner);
    setCompResult(result);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-gold/10 text-gold border border-gold/20">
            <Shield size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-white tracking-widest uppercase">Mission Control</h2>
            <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-widest">Strategic Life Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 self-end sm:self-auto">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] sm:text-[10px] text-zinc-400 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Daily Directive Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} className="sm:w-[120px] sm:h-[120px]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Zap size={14} className="text-gold sm:w-4 sm:h-4" />
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-500">Daily Directive</span>
            </div>
            
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-white mb-4 tracking-tight leading-tight">
              {stats.directive}
            </h3>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-zinc-500 mb-1">Personal Day</p>
                <p className="text-white font-display text-lg sm:text-xl">{stats.pd}</p>
              </div>
              <div className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-zinc-500 mb-1">Personal Month</p>
                <p className="text-white font-display text-lg sm:text-xl">{stats.pm}</p>
              </div>
              <div className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-zinc-500 mb-1">Personal Year</p>
                <p className="text-white font-display text-lg sm:text-xl">{stats.py}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              {!insights["Daily Directive"] ? (
                 <button 
                   onClick={() => handleGenerateInsight("Daily Directive", { directive: stats.directive, pd: stats.pd, pm: stats.pm, py: stats.py })}
                   disabled={loadingInsights["Daily Directive"]}
                   className="text-[10px] text-gold uppercase tracking-widest font-bold flex items-center gap-2 hover:text-white transition-colors"
                 >
                   {loadingInsights["Daily Directive"] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                   Deep Insight
                 </button>
              ) : (
                 <div className="markdown-body prose prose-invert prose-xs prose-gold max-w-none prose-headings:font-display prose-headings:text-xs prose-headings:uppercase prose-p:text-zinc-400 mt-2 text-xs leading-relaxed">
                    <ReactMarkdown>{insights["Daily Directive"]}</ReactMarkdown>
                 </div>
              )}
            </div>

          </div>
        </motion.div>

        {/* Wealth Window Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-gold/10 bg-gold/5 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp size={14} className="text-gold sm:w-4 sm:h-4" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-gold">Wealth Window</span>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed italic">
              "{stats.wealth}"
            </p>
            
            <div className="pt-4 sm:pt-6 border-t border-gold/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-zinc-500">Current Phase</span>
                <span className="text-gold text-[8px] sm:text-[10px] uppercase tracking-widest">Active</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.py / 9) * 100}%` }}
                  className="h-full gold-gradient"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gold/10">
              {!insights["Wealth Window"] ? (
                 <button 
                   onClick={() => handleGenerateInsight("Wealth Window", { wealthDescription: stats.wealth, py: stats.py })}
                   disabled={loadingInsights["Wealth Window"]}
                   className="text-[10px] text-gold uppercase tracking-widest font-bold flex items-center gap-2 hover:text-white transition-colors"
                 >
                   {loadingInsights["Wealth Window"] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                   Deep Insight
                 </button>
              ) : (
                 <div className="markdown-body prose prose-invert prose-xs prose-gold max-w-none prose-headings:font-display prose-headings:text-xs prose-headings:uppercase prose-p:text-zinc-400 mt-2 text-xs leading-relaxed">
                    <ReactMarkdown>{insights["Wealth Window"]}</ReactMarkdown>
                 </div>
              )}
            </div>

          </div>
        </motion.div>

        {/* Daily Intelligence Briefing Card (NEW) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={100} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-gold" />
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-500">Daily Intelligence Briefing</span>
              </div>
              <div className="flex items-center gap-3">
                {dailyResonance && (
                  <button 
                    onClick={handleToggleAudio}
                    disabled={audioLoading}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] uppercase tracking-widest font-bold transition-all ${
                      isPlaying 
                        ? 'bg-gold text-black border-gold shadow-[0_0_10px_rgba(201,168,76,0.2)]' 
                        : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
                    }`}
                  >
                    {audioLoading ? <Loader2 size={10} className="animate-spin" /> : isPlaying ? <Pause size={10} /> : <Volume2 size={10} />}
                    {isPlaying ? 'Stop' : 'Listen'}
                  </button>
                )}
                {loadingDaily && <Loader2 size={14} className="text-gold animate-spin" />}
              </div>
            </div>

            <div className="min-h-[100px]">
              {loadingDaily ? (
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                </div>
              ) : dailyResonance ? (
                <div className="markdown-body prose prose-invert prose-xs prose-gold max-w-none prose-headings:font-display prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-widest prose-p:text-zinc-400 prose-p:text-xs prose-p:leading-relaxed">
                  <Markdown>{dailyResonance}</Markdown>
                </div>
              ) : (
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest italic">Intelligence stream offline...</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Compatibility Tool */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 glass-panel p-6 sm:p-8 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Users size={14} className="text-gold sm:w-4 sm:h-4" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-500">Compatibility Matrix</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[7px] sm:text-[8px] uppercase tracking-widest text-zinc-500 mb-2 block">Partner Life Path / Name Value</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={compPartner}
                  onChange={(e) => setCompPartner(e.target.value)}
                  placeholder="Enter number or name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm focus:border-gold/50 outline-none transition-colors"
                />
                <button 
                  onClick={handleCompatibilityCheck}
                  className="p-2.5 sm:p-3 rounded-xl bg-gold text-black hover:bg-white transition-colors"
                >
                  <Target size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {compResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white leading-relaxed italic border-l-2 border-gold/50 pl-3">
                      {compResult}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    {!insights["Compatibility Matrix"] ? (
                       <button 
                         onClick={() => handleGenerateInsight("Compatibility Matrix", { 
                           partner: compPartner, 
                           result: compResult, 
                           userLifePath: stats.lifePath 
                         })}
                         disabled={loadingInsights["Compatibility Matrix"]}
                         className="text-[10px] text-gold uppercase tracking-widest font-bold flex items-center gap-2 hover:text-white transition-colors"
                       >
                         {loadingInsights["Compatibility Matrix"] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                         Deep Insight
                       </button>
                    ) : (
                       <div className="markdown-body prose prose-invert prose-xs prose-gold max-w-none prose-headings:font-display prose-headings:text-xs prose-headings:uppercase prose-p:text-zinc-400 mt-2 text-xs leading-relaxed">
                          <ReactMarkdown>{insights["Compatibility Matrix"]}</ReactMarkdown>
                       </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* System Info / Life Path */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-gold/20 flex items-center justify-center relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full border border-gold/10 animate-ping opacity-20" />
              <div className="text-center">
                <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-zinc-500">Life Path</p>
                <p className="text-white font-display text-3xl sm:text-4xl">{stats.lifePath}</p>
              </div>
            </div>
            
            <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left w-full">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Info size={12} className="text-gold sm:w-14 sm:h-14" />
                <h4 className="text-white text-[10px] sm:text-xs uppercase tracking-widest">Energetic Signature</h4>
              </div>
              <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed">
                Your core vibration ({stats.lifePath}) is currently interacting with the {stats.py} Personal Year frequency. 
                This creates a unique resonance window for {stats.py === 8 ? 'financial mastery' : 'strategic alignment'}.
              </p>
              <div className="flex justify-center md:justify-start gap-2">
                <span className="px-2 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[7px] sm:text-[8px] text-zinc-400 uppercase tracking-widest">
                  Frequency: {stats.lifePath}Hz
                </span>
                <span className="px-2 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[7px] sm:text-[8px] text-zinc-400 uppercase tracking-widest">
                  Phase: {stats.py}/9
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-left">
                {!insights["Energetic Signature"] ? (
                  <button 
                    onClick={() => handleGenerateInsight("Energetic Signature", { lifePath: stats.lifePath, personalYear: stats.py })}
                    disabled={loadingInsights["Energetic Signature"]}
                    className="text-[10px] text-gold uppercase tracking-widest font-bold flex items-center gap-2 hover:text-white transition-colors justify-center md:justify-start w-full"
                  >
                    {loadingInsights["Energetic Signature"] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Deep Insight
                  </button>
                ) : (
                  <div className="markdown-body prose prose-invert prose-xs prose-gold max-w-none prose-headings:font-display prose-headings:text-xs prose-headings:uppercase prose-p:text-zinc-400 mt-2 text-xs leading-relaxed">
                      <ReactMarkdown>{insights["Energetic Signature"]}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
