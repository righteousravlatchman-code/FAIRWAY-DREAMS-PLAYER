import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, BarChart3, Info, Heart, Zap, Compass, Activity, Shield } from 'lucide-react';
import { CompleteNameReport } from '../services/letterologyService';

interface LetterologyToolProps {
  userData: { name: string; birthDate: string };
  onReset: () => void;
}

export const LetterologyTool: React.FC<LetterologyToolProps> = ({ userData, onReset }) => {
  const firstName = userData.name.split(' ')[0];
  const report = useMemo(() => CompleteNameReport.generateFullReport(userData.name, firstName), [userData.name, firstName]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "gold" }: any) => (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 relative group overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-${color}`}>
        <Icon size={48} />
      </div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-${color} font-display text-2xl tracking-widest`}>{value}</p>
        {subtitle && <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gold/10 text-gold shadow-xl shadow-gold/5">
            <Sparkles size={32} />
          </div>
          <div>
            <h3 className="font-display text-2xl text-white tracking-widest uppercase">Letterology Intelligence</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Multi-System Phonetic Signal Analysis</p>
          </div>
        </div>
        <button 
          onClick={onReset} 
          className="self-start md:self-center flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-zinc-500 hover:text-gold hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest font-bold border border-white/5"
        >
          <RefreshCw size={14} /> New Analysis
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Core Pythagorean Numbers */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard 
              title="Expression" 
              value={report.pythagorean.expression.number} 
              subtitle={report.pythagorean.expression.keyword}
              icon={Zap}
            />
            <StatCard 
              title="Soul Urge" 
              value={report.pythagorean.soulUrge.number} 
              subtitle={report.pythagorean.soulUrge.keyword}
              icon={Heart}
            />
            <StatCard 
              title="Personality" 
              value={report.pythagorean.personality.number} 
              subtitle={report.pythagorean.personality.keyword}
              icon={Shield}
            />
          </div>

          {/* Detailed Analysis Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traits */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
              <h4 className="text-white font-display text-sm tracking-widest mb-6 uppercase flex items-center gap-2">
                <Activity size={16} className="text-gold" /> Core Traits
              </h4>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-display text-xs flex-shrink-0">
                    {report.pythagorean.expression.number}
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    <span className="text-white font-medium">Expression:</span> {report.pythagorean.expression.trait}
                  </p>
                </div>
                <div className="pl-12 pb-4 border-b border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500">Signal Strength</span>
                    <span className="text-gold font-mono text-[10px]">{(report.pythagorean.expression.number * 11.1).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(report.pythagorean.expression.number * 11.1)}%` }}
                      className="h-full bg-gold/40"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-display text-xs flex-shrink-0">
                    {report.pythagorean.soulUrge.number}
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    <span className="text-white font-medium">Soul Urge:</span> {report.pythagorean.soulUrge.trait}
                  </p>
                </div>
                <div className="pl-12">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500">Internal Resonance</span>
                    <span className="text-gold font-mono text-[10px]">{(report.pythagorean.soulUrge.number * 11.1).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(report.pythagorean.soulUrge.number * 11.1)}%` }}
                      className="h-full bg-gold/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Karmic Lessons */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
              <h4 className="text-white font-display text-sm tracking-widest mb-6 uppercase flex items-center gap-2">
                <Compass size={16} className="text-gold" /> Karmic Lessons
              </h4>
              {report.pythagorean.karmicLessons.missingNumbers.length > 0 ? (
                <div className="space-y-3">
                  {report.pythagorean.karmicLessons.lessons.map((lesson, i) => (
                    <div key={i} className="flex items-center gap-3 text-zinc-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                      {lesson}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-500 text-xs italic">No karmic lessons detected in this signal.</p>
              )}
            </div>
          </div>

          {/* Letter Frequency & Elements */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-white font-display text-sm tracking-widest uppercase flex items-center gap-2">
                <BarChart3 size={16} className="text-gold" /> Elemental Balance
              </h4>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Dominant: <span className="text-gold">{report.letterAnalysis.elements.dominant}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 mb-8">
              {Object.entries(report.letterAnalysis.elements.counts).map(([element, count]: any) => (
                <div key={element} className="flex flex-col items-center gap-2">
                  <div className="w-full bg-white/5 rounded-full h-16 relative overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / report.letterAnalysis.pattern.totalLetters) * 100}%` }}
                      className="absolute bottom-0 left-0 w-full bg-gold/30"
                    />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-zinc-500">{element}</span>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed italic text-center border-t border-white/5 pt-6">
              {report.letterAnalysis.elements.interpretation}
            </p>
          </div>

          {/* Phonetic Flow */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-white font-display text-sm tracking-widest uppercase flex items-center gap-2">
                <Activity size={16} className="text-gold" /> Phonetic Signal Flow
              </h4>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Complexity: <span className="text-gold">{report.letterAnalysis.phonetics.complexity}%</span>
              </div>
            </div>

            <div className="flex gap-1 h-12 items-end mb-6">
              {report.letterAnalysis.phonetics.patterns.map((p: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${p.count * 20}%` }}
                  className={`flex-1 rounded-t-sm ${p.type === 'V' ? 'bg-gold/40' : 'bg-white/10'}`}
                  title={`${p.type === 'V' ? 'Vowel' : 'Consonant'} cluster: ${p.count}`}
                />
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Signal Rhythm</p>
                <p className="text-white text-sm font-display tracking-widest uppercase">{report.letterAnalysis.phonetics.flow}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Phonetic Structure</p>
                <p className="text-zinc-400 text-xs italic">{report.letterAnalysis.phonetics.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Alternative Systems */}
        <div className="space-y-6">
          {/* Chaldean */}
          <div className="p-8 rounded-3xl bg-gold/5 border border-gold/10 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-colors" />
            <h4 className="text-white font-display text-xs tracking-widest mb-6 uppercase">Chaldean Resonance</h4>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-display text-gold">{report.chaldean.reduced}</span>
              <span className="text-zinc-500 text-xs uppercase tracking-widest">/ {report.chaldean.compound}</span>
            </div>
            <p className="text-zinc-400 text-[10px] leading-relaxed italic">
              {report.chaldean.meaning}
            </p>
          </div>

          {/* Kabbalah */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
            <h4 className="text-white font-display text-xs tracking-widest mb-6 uppercase">Tree of Life Path</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold font-display">
                {report.kabbalah.num}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{report.kabbalah.name}</p>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Sephirah Alignment</p>
              </div>
            </div>
            <p className="text-zinc-400 text-[10px] leading-relaxed">
              {report.kabbalah.meaning}
            </p>
          </div>

          {/* First Vowel / Subconscious */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
            <h4 className="text-white font-display text-xs tracking-widest mb-6 uppercase">Subconscious Motivation</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-gold/30 flex items-center justify-center text-gold font-display text-xl">
                {report.pythagorean.firstVowel.letter}
              </div>
              <div>
                <p className="text-white text-sm font-medium">Vowel Resonance</p>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Value: {report.pythagorean.firstVowel.value}</p>
              </div>
            </div>
            <p className="text-zinc-400 text-[10px] leading-relaxed italic">
              {report.pythagorean.firstVowel.meaning}
            </p>
          </div>

          {/* Balance */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
            <h4 className="text-white font-display text-xs tracking-widest mb-4 uppercase">Phonetic Balance</h4>
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              <span>Vowels: {report.letterAnalysis.balance.vowels}</span>
              <span>Consonants: {report.letterAnalysis.balance.consonants}</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex mb-4">
              <div 
                className="h-full bg-gold" 
                style={{ width: `${(report.letterAnalysis.balance.vowels / (report.letterAnalysis.balance.vowels + report.letterAnalysis.balance.consonants)) * 100}%` }} 
              />
              <div className="h-full bg-white/20 flex-1" />
            </div>
            <p className="text-zinc-500 text-[10px] italic leading-relaxed">
              {report.letterAnalysis.balance.balance}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-3 text-zinc-500">
        <Info size={14} className="text-gold" />
        <p className="text-[9px] uppercase tracking-widest leading-relaxed">
          This analysis synthesizes Pythagorean, Chaldean, and Kabbalistic systems to decode the multi-dimensional frequency of your name signal.
        </p>
      </div>
    </div>
  );
};
