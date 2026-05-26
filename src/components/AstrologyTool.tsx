import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, Compass, Moon, TreePine, Sun, Volume2, Pause, Loader2, Gem, Ghost, Book, Calendar, Clock, Mic2, Fingerprint, Eye, Bird, Fish, Feather, Rabbit, Bug, Shield, Flame, Waves, Wind, Skull, Hand, Tent, Map, Grid, Trash2, Zap, Globe, Sparkle, Cat, Mouse, Award, Dog, ChevronDown } from 'lucide-react';
import { VedicAstrology, ArabianAstrology, DruidAstrology, MayanAstrology } from '../services/astrologyService';
import { useAudioNarrator } from '../hooks/useAudioNarrator';
import { useToast } from './ToastProvider';
import { MetalIcon } from './MetalIcon';
import { generateTraditionInsight } from '../services/geminiService';

interface AstrologyToolProps {
  userData: { name: string; birthDate: string };
  onReset: () => void;
}

type Tradition = 'vedic' | 'arabian' | 'druid' | 'mayan';

export const AstrologyTool: React.FC<AstrologyToolProps> = ({ userData, onReset }) => {
  const [activeTradition, setActiveTradition] = useState<Tradition>('vedic');
  const [deepInsights, setDeepInsights] = useState<Record<string, string>>({});
  const [loadingInsight, setLoadingInsight] = useState(false);
  const { isPlaying, audioLoading, toggleData, setAudioBuffer } = useAudioNarrator();
  const { showToast } = useToast();

  const handleGenerateDeepInsight = async () => {
    if (deepInsights[activeTradition]) return;
    
    setLoadingInsight(true);
    try {
      let dataToAnalyze = null;
      switch (activeTradition) {
        case 'vedic': dataToAnalyze = vedicData; break;
        case 'arabian': dataToAnalyze = arabianData; break;
        case 'druid': dataToAnalyze = druidData; break;
        case 'mayan': dataToAnalyze = mayanData; break;
      }
        
      const res = await generateTraditionInsight(userData.name, userData.birthDate, activeTradition, dataToAnalyze);
      setDeepInsights(prev => ({ ...prev, [activeTradition]: res }));
      showToast("Deep Celestial Insight Received", "success");
    } catch (err) {
      showToast("Failed to divine insight. Matrix interference.", "error");
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleToggleAudio = () => {
    const data: any = {
      vedic: vedicData,
      arabian: arabianData,
      druid: druidData,
      mayan: mayanData
    };
    
    toggleData(`Multi-Tradition Celestial Alignment for ${userData.name}`, data);
  };

  // Helper to approximate celestial positions for demonstration
  const celestialPositions = useMemo(() => {
    const [year, month, day] = userData.birthDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Approximate Sun position (0 degrees at Spring Equinox March 21)
    const springEquinox = new Date(year, 2, 21);
    const diffDays = (date.getTime() - springEquinox.getTime()) / (1000 * 60 * 60 * 24);
    const sunDegrees = (diffDays / 365.25 * 360 + 360) % 360;
    
    // Approximate Moon position (roughly 13.2 degrees per day)
    // Using Jan 6, 2000 as a New Moon reference (roughly 280 degrees in tropical)
    const refDate = new Date(2000, 0, 6);
    const daysSinceRef = (date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
    const moonDegrees = (280 + daysSinceRef * 13.176) % 360;
    
    // Approximate Ascendant (very rough, usually needs birth time)
    const ascendantDegrees = (sunDegrees + 90) % 360; 

    return { sunDegrees, moonDegrees, ascendantDegrees };
  }, [userData.birthDate]);

  const vedicData = useMemo(() => {
    const nakshatra = VedicAstrology.calculateNakshatra(celestialPositions.moonDegrees);
    const rashi = VedicAstrology.calculateRashi(celestialPositions.sunDegrees);
    const dashas = VedicAstrology.calculateDasha(nakshatra.lord, userData.birthDate);
    const interpretation = VedicAstrology.interpretNakshatra(nakshatra.name);
    return { nakshatra, rashi, dashas, interpretation };
  }, [celestialPositions, userData.birthDate]);

  const arabianData = useMemo(() => {
    const parts = ArabianAstrology.calculateParts(
      celestialPositions.sunDegrees,
      celestialPositions.moonDegrees,
      celestialPositions.ascendantDegrees
    );
    const mansion = ArabianAstrology.calculateLunarMansion(celestialPositions.moonDegrees);
    return { parts, mansion };
  }, [celestialPositions]);

  const druidData = useMemo(() => {
    const tree = DruidAstrology.getTreeSign(userData.birthDate);
    const totem = DruidAstrology.getTotemAnimal(tree.tree);
    const ogham = DruidAstrology.interpretOgham(tree.tree);
    const moonPhase = DruidAstrology.calculateMoonPhase(userData.birthDate);
    return { tree, totem, ogham, moonPhase };
  }, [userData.birthDate]);

  const mayanData = useMemo(() => {
    const tzolkin = MayanAstrology.calculateTzolkin(userData.birthDate);
    const longCount = MayanAstrology.calculateLongCount(userData.birthDate);
    return { tzolkin, longCount };
  }, [userData.birthDate]);

  const traditions = [
    { id: 'vedic', name: 'Vedic', icon: <MetalIcon iconName="Compass" size={14} type="gold" />, color: 'text-orange-400' },
    { id: 'arabian', name: 'Arabian', icon: <MetalIcon iconName="Moon" size={14} type="silver" />, color: 'text-emerald-400' },
    { id: 'druid', name: 'Druid', icon: <MetalIcon iconName="TreePine" size={14} type="steel" />, color: 'text-lime-400' },
    { id: 'mayan', name: 'Mayan', icon: <MetalIcon iconName="Sun" size={14} type="gold" />, color: 'text-amber-400' },
  ];

  const getDruidTotemIcon = (animal: string) => {
    switch (animal) {
      case 'White Stag': return 'Gem';
      case 'Dragon': return 'Flame';
      case 'Serpent': return 'Waves';
      case 'Raven': return 'Bird';
      case 'Hare': return 'Rabbit';
      case 'Bee': return 'Bug';
      case 'White Horse': return 'Zap';
      case 'Unicorn': return 'Sparkle';
      case 'Salmon': return 'Fish';
      case 'Swan': return 'Feather';
      case 'Boar': return 'Shield';
      case 'Owl': return 'Eye';
      default: return 'HelpCircle';
    }
  };

  const getMayanDayIcon = (symbol: string) => {
    if (symbol.includes('Dragon') || symbol.includes('Crocodile')) return 'Flame';
    if (symbol.includes('Wind')) return 'Wind';
    if (symbol.includes('Night')) return 'Moon';
    if (symbol.includes('Seed') || symbol.includes('Lizard')) return 'TreePine';
    if (symbol.includes('Serpent')) return 'Waves';
    if (symbol.includes('Death')) return 'Skull';
    if (symbol.includes('Hand') || symbol.includes('Deer')) return 'Hand';
    if (symbol.includes('Star') || symbol.includes('Rabbit')) return 'Rabbit';
    if (symbol.includes('Water') || symbol.includes('Moon')) return 'Waves';
    if (symbol.includes('Dog')) return 'Dog';
    if (symbol.includes('Monkey')) return 'Award';
    if (symbol.includes('Road')) return 'Map';
    if (symbol.includes('Reed')) return 'Grid';
    if (symbol.includes('Jaguar')) return 'Cat';
    if (symbol.includes('Eagle')) return 'Bird';
    if (symbol.includes('Vulture')) return 'Bird';
    if (symbol.includes('Earth')) return 'Globe';
    if (symbol.includes('Flint') || symbol.includes('Mirror')) return 'Sparkle';
    if (symbol.includes('Storm')) return 'Zap';
    if (symbol.includes('Sun') || symbol.includes('Lord')) return 'Sun';
    return 'HelpCircle';
  };

  return (
    <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gold/10 text-gold">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl text-white tracking-widest uppercase">Celestial Matrix</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Multi-Tradition Alignment System</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleToggleAudio}
            disabled={audioLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all ${
              isPlaying 
              ? 'bg-gold text-black border-gold shadow-[0_0_20px_rgba(201,168,76,0.2)]' 
              : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
            }`}
          >
            {audioLoading ? <Loader2 size={12} className="animate-spin" /> : isPlaying ? <Pause size={12} /> : <Volume2 size={12} />}
            {isPlaying ? 'Stop' : 'Briefing'}
          </button>
          {traditions.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTradition(t.id as Tradition)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 ${
                activeTradition === t.id 
                  ? 'bg-white/10 text-white border border-white/20 shadow-lg' 
                  : 'bg-white/5 text-zinc-500 border border-transparent hover:bg-white/10'
              }`}
            >
              <span className={activeTradition === t.id ? t.color : ''}>{t.icon}</span>
              {t.name}
            </button>
          ))}
          <button 
            onClick={onReset} 
            className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-gold transition-colors border border-transparent hover:border-gold/20"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Subject Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Subject</p>
            <p className="text-white font-display text-lg tracking-widest">{userData.name}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Birth Date</p>
            <p className="text-white font-display text-lg tracking-widest">{userData.birthDate}</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
            <h4 className="text-gold text-[10px] uppercase tracking-widest mb-4">Celestial Coordinates</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Sun Position</span>
                <span className="text-white font-mono text-xs">{celestialPositions.sunDegrees.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Moon Position</span>
                <span className="text-white font-mono text-xs">{celestialPositions.moonDegrees.toFixed(2)}°</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <p className="text-[9px] text-zinc-500 italic leading-relaxed">
                Calculated using tropical approximation for the current epoch.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Tradition Content */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTradition}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTradition === 'vedic' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <MetalIcon iconName="Sparkles" type="gold" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-1">Nakshatra (Lunar Mansion)</p>
                        <h4 className="text-white font-display text-xl tracking-widest leading-none">{vedicData.nakshatra.name}</h4>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Lord: {vedicData.nakshatra.lord} | Pada: {vedicData.nakshatra.pada}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <MetalIcon iconName="Compass" type="gold" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-1">Rashi (Moon Sign)</p>
                        <h4 className="text-white font-display text-xl tracking-widest leading-none">{vedicData.rashi.rashi}</h4>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Sidereal: {vedicData.rashi.siderealDegrees}°</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-white text-[10px] uppercase tracking-widest">Nakshatra Interpretation</h5>
                      <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-[8px] uppercase tracking-widest">Soul Purpose</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-zinc-400 text-xs font-medium mb-1">Core Quality</p>
                        <p className="text-white text-sm italic">{vedicData.interpretation.quality}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-xs font-medium mb-1">Dominant Theme</p>
                        <p className="text-white text-sm italic">{vedicData.interpretation.theme}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-orange-400 text-[10px] uppercase tracking-widest mb-2">Frequency Alignment</p>
                        <p className="text-zinc-500 text-xs leading-relaxed">
                          Your soul's vibration in this lifetime is governed by {vedicData.nakshatra.lord}. This celestial frequency suggests a path of {vedicData.interpretation.theme.toLowerCase()} and requires attunement to {vedicData.nakshatra.deity}'s energy for optimal manifestation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h5 className="text-white text-[10px] uppercase tracking-widest mb-4">Vimshottari Dasha (Life Cycles)</h5>
                    <div className="space-y-3">
                      {vedicData.dashas.slice(0, 4).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-display text-xs">
                              {d.lord[0]}
                            </div>
                            <div>
                              <p className="text-white text-xs font-medium">{d.lord} Period</p>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{d.years} Years</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-zinc-400">{d.startDate}</p>
                            <p className="text-[9px] text-zinc-600">to {d.endDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTradition === 'arabian' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <MetalIcon iconName="Gem" type="silver" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Part of Fortune</p>
                        <h4 className="text-white font-display text-lg tracking-widest leading-none">{arabianData.parts.partOfFortune.sign}</h4>
                        <p className="text-zinc-500 text-[9px] leading-relaxed italic mt-1">{arabianData.parts.partOfFortune.meaning}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <MetalIcon iconName="Ghost" type="silver" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Part of Spirit</p>
                        <h4 className="text-white font-display text-lg tracking-widest leading-none">{arabianData.parts.partOfSpirit.sign}</h4>
                        <p className="text-zinc-500 text-[9px] leading-relaxed italic mt-1">{arabianData.parts.partOfSpirit.meaning}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                      <MetalIcon iconName="Moon" type="silver" size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Lunar Manzil (Station)</p>
                      <h4 className="text-white font-display text-xl tracking-widest leading-none">{arabianData.mansion.name}</h4>
                      <p className="text-zinc-400 text-xs mt-2">"{arabianData.mansion.meaning}"</p>
                    </div>
                  </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-4">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Traditional Use</p>
                      <p className="text-white text-xs italic">{arabianData.mansion.use}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-emerald-400 text-[10px] uppercase tracking-widest mb-2">Energetic Signature</p>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        This lunar station represents a specific frequency of {arabianData.mansion.meaning.toLowerCase()}. In the Arabian tradition, this is a time of {arabianData.mansion.use.toLowerCase()}, suggesting your internal clock is synchronized with these specific cosmic windows.
                      </p>
                    </div>
                  </div>
                )}

              {activeTradition === 'druid' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-lime-500/5 border border-lime-500/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
                        <MetalIcon iconName="TreePine" type="steel" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-lime-400 mb-1">Celtic Tree Sign</p>
                        <h4 className="text-white font-display text-xl tracking-widest leading-none">{druidData.tree.tree}</h4>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Symbol: {druidData.tree.symbol}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-lime-500/5 border border-lime-500/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
                        <MetalIcon iconName={getDruidTotemIcon(druidData.totem.animal)} type="silver" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-lime-400 mb-1">Totem Animal</p>
                        <h4 className="text-white font-display text-xl tracking-widest leading-none">{druidData.totem.animal}</h4>
                        <p className="text-zinc-500 text-[9px] italic mt-1">{druidData.totem.meaning}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-white text-[10px] uppercase tracking-widest">Ogham Divination</h5>
                      <span className="px-2 py-1 rounded bg-lime-500/10 text-lime-400 text-[8px] uppercase tracking-widest">Ancient Wisdom</span>
                    </div>
                    <p className="text-zinc-300 text-sm italic leading-relaxed mb-6">
                      "{druidData.ogham.divination}"
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-lime-400 mb-1">Tree Traits</p>
                        <p className="text-white text-xs">{druidData.tree.traits}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-lime-400 mb-1">Totem Power</p>
                        <p className="text-white text-xs">{druidData.totem.animal} Energy</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Birth Moon Phase</p>
                        <p className="text-white text-xs font-medium">{druidData.moonPhase.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-500 italic">{druidData.moonPhase.meaning}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTradition === 'mayan' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/10">
                        <MetalIcon iconName={getMayanDayIcon(mayanData.tzolkin.daySign.symbol)} type="gold" size={32} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">Tzolkin Day Sign</p>
                        <h4 className="text-white font-display text-xl tracking-widest leading-none">{mayanData.tzolkin.daySign.name}</h4>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Spirit: {mayanData.tzolkin.daySign.symbol}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/10">
                        <MetalIcon iconName="Mic2" type="gold" size={32} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">Galactic Tone</p>
                        <h4 className="text-white font-display text-xl tracking-widest leading-none">{mayanData.tzolkin.tone.name}</h4>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Number: {mayanData.tzolkin.tone.number}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">Long Count Date</p>
                        <p className="text-white font-mono text-lg tracking-widest">{mayanData.longCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Kin Number</p>
                        <p className="text-white font-display text-lg tracking-widest">#{mayanData.tzolkin.kin}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Day Sign Meaning</p>
                        <p className="text-white text-xs italic leading-relaxed mb-3">{mayanData.tzolkin.daySign.meaning}</p>
                        <p className="text-[9px] text-amber-400/60 uppercase tracking-widest">Archetype: {mayanData.tzolkin.daySign.symbol}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Tone Meaning</p>
                        <p className="text-white text-xs italic leading-relaxed mb-3">{mayanData.tzolkin.tone.meaning}</p>
                        <p className="text-[9px] text-amber-400/60 uppercase tracking-widest">Vibration: {mayanData.tzolkin.tone.name}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-amber-400 text-[10px] uppercase tracking-widest mb-2">Frequency Synthesis</p>
                        <p className="text-zinc-500 text-[11px] leading-relaxed">
                          Your Mayan Kin #{mayanData.tzolkin.kin} combines the {mayanData.tzolkin.daySign.name} energy with the {mayanData.tzolkin.tone.name} vibration. This creates a specific galactic signature focused on {mayanData.tzolkin.daySign.meaning.split(',')[0].toLowerCase()} and {mayanData.tzolkin.tone.meaning.split(',')[0].toLowerCase()}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Deep Insight Section */}
          <div className="mt-8">
            <div className="p-6 rounded-2xl bg-black/40 border border-gold/20 shadow-[0_0_30px_rgba(201,168,76,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-gold" />
              </div>
              <h4 className="text-gold font-display tracking-widest uppercase mb-4 flex items-center gap-2">
                <Eye size={16} /> Deep Celestial Insight
              </h4>
              
              {!deepInsights[activeTradition] ? (
                <div className="text-center py-6 relative z-10">
                  <p className="text-zinc-400 text-xs mb-6 italic">Query the core intelligence for a multi-dimensional read on your {activeTradition} alignment.</p>
                  <button 
                    onClick={handleGenerateDeepInsight}
                    disabled={loadingInsight}
                    className="inline-flex items-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 px-6 py-3 rounded-xl transition-all uppercase tracking-widest text-[10px] font-bold"
                  >
                    {loadingInsight ? (
                      <><Loader2 size={14} className="animate-spin" /> Divining Matrix...</>
                    ) : (
                      <><Sparkles size={14} /> Synthesize {activeTradition} Identity</>
                    )}
                  </button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-invert prose-gold max-w-none text-sm relative z-10 leading-relaxed"
                >
                  <ReactMarkdown>{deepInsights[activeTradition]}</ReactMarkdown>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
