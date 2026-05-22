import React from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, ExternalLink, Heart, Sparkles, Save, Trash2, AlertCircle, Share2, Radio, Settings, Sliders, Palette } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Track, VisualizerMode, ThemeColors, VisualizerSettings, Playlist } from '../types';
import { Visualizer } from './Visualizer';
import { useToast } from './ToastProvider';
import { ShareButtons } from './ShareButtons';

interface PlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  analyser: AnalyserNode | null;
  settings: VisualizerSettings;
  theme: ThemeColors;
  themeName: string;
  isFavorite: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onSettingsChange: (s: VisualizerSettings) => void;
  onThemeChange: (t: string) => void;
  onToggleFavorite: (trackId: string) => void;
  onAddToPlaylist?: (playlistId: string, trackId: string) => void;
  onGenerateInsight: () => void;
  onSaveInsight: (track: Track, content: string) => void;
  onClearInsight: () => void;
  currentInsight: string | null;
  isGeneratingInsight: boolean;
  isLoading: boolean;
  error: string | null;
  playlists: Playlist[];
}

export const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  analyser,
  settings,
  theme,
  themeName,
  isFavorite,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onSettingsChange,
  onThemeChange,
  onToggleFavorite,
  onAddToPlaylist,
  onGenerateInsight,
  onSaveInsight,
  onClearInsight,
  currentInsight,
  isGeneratingInsight,
  isLoading,
  error,
  playlists
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showSharePicker, setShowSharePicker] = React.useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const imageRef1 = React.useRef<HTMLImageElement>(null);
  const imageRef2 = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!analyser || !isPlaying) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId: number;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '201,168,76';
    };
    const rgbPrimary = theme.primary ? hexToRgb(theme.primary) : '201,168,76';

    const updatePulse = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      const pulse = avg / 255;
      
      // Scale from 1.0 up to 1.15 depending on pulse and intensity
      const scale = 1 + (pulse * 0.15 * settings.intensity);
      // We can also add a subtle brightness increase based on pulse
      const brightness = 1 + (pulse * 0.5);
      const glowRadius = pulse * 50 * settings.intensity;
      const glowAlpha = pulse * 0.6;

      if (imageRef1.current) {
        imageRef1.current.style.transform = `scale(${scale})`;
        imageRef1.current.style.filter = `brightness(${brightness})`;
        imageRef1.current.style.boxShadow = `0 0 ${glowRadius}px ${glowRadius/2}px rgba(${rgbPrimary},${glowAlpha})`;
      }
      if (imageRef2.current) {
        imageRef2.current.style.transform = `scale(${scale})`;
        imageRef2.current.style.filter = `brightness(${brightness})`;
        imageRef2.current.style.boxShadow = `0 0 ${glowRadius * 1.5}px ${glowRadius}px rgba(${rgbPrimary},${glowAlpha})`;
      }
      animationFrameId = requestAnimationFrame(updatePulse);
    };

    updatePulse();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (imageRef1.current) {
        imageRef1.current.style.transform = 'scale(1)';
        imageRef1.current.style.filter = 'brightness(1)';
        imageRef1.current.style.boxShadow = '';
      }
      if (imageRef2.current) {
        imageRef2.current.style.transform = 'scale(1)';
        imageRef2.current.style.filter = 'brightness(1)';
        imageRef2.current.style.boxShadow = '';
      }
    };
  }, [analyser, isPlaying, settings.intensity, theme]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSetting = (key: keyof VisualizerSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const { showToast } = useToast();


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_-12px_rgba(201,168,76,0.15)] surface-panel bg-black/60 backdrop-blur-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        {/* Visualizer Area */}
        <div className="relative h-[300px] md:h-[400px] w-full bg-black/20 group">
          <Visualizer 
            analyser={analyser} 
            settings={settings} 
            theme={theme} 
            isPlaying={isPlaying} 
            onSettingsChange={onSettingsChange}
          />
          
          {/* Visualizer Interaction Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-[90%] max-w-sm">
            <p className="text-[8px] sm:text-[10px] text-center uppercase tracking-[0.15em] text-white bg-black/80 backdrop-blur-md px-4 py-2 sm:py-3 rounded-2xl border border-white/20 shadow-2xl">
              Drag to adjust Speed & Intensity • Double-click to cycle modes • Shift+Click to change color
            </p>
          </div>
          
          {/* Settings Toggle */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-6 right-20 p-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-gold hover:bg-gold hover:text-black transition-all z-20"
          >
            <Settings size={16} className={showSettings ? 'rotate-90' : ''} />
          </button>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-20 right-6 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 z-30 shadow-2xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold mb-2">
                    <Sliders size={12} /> Customization
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                      <span>Speed</span>
                      <span>{settings.speed.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="3" step="0.1" 
                      value={settings.speed}
                      onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                      <span>Sensitivity</span>
                      <span>{settings.sensitivity.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2" step="0.1" 
                      value={settings.sensitivity}
                      onChange={(e) => updateSetting('sensitivity', parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                      <span>Intensity</span>
                      <span>{settings.intensity.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="2" step="0.1" 
                      value={settings.intensity}
                      onChange={(e) => updateSetting('intensity', parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                      <Palette size={10} /> Custom Color
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={settings.customColor || theme.primary}
                        onChange={(e) => updateSetting('customColor', e.target.value)}
                        className="w-8 h-8 bg-transparent border-none cursor-pointer"
                      />
                      <button 
                        onClick={() => updateSetting('customColor', undefined)}
                        className="text-[8px] uppercase tracking-widest text-[var(--text-secondary)] hover:text-gold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Overlay Info */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              animate={{ 
                scale: isPlaying ? [1, 1.08, 1] : 1,
              }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative p-8"
            >
              <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse" />
              
              {/* Radial Signal Bars */}
              <motion.div 
                animate={{ rotate: isPlaying ? [0, 360] : 0 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    style={{ rotate: i * 30 }}
                    animate={{ height: isPlaying ? [100, 120, 100] : 90 }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    className="absolute w-0.5 bg-gold/30 origin-center md:h-[150px]"
                  />
                ))}
              </motion.div>

              <img 
                ref={imageRef1}
                src={currentTrack.art || '/src/assets/images/default_cover_1779345608057.png'} 
                alt={currentTrack.title}
                className="w-28 h-28 md:w-40 md:h-40 rounded-full border-2 border-gold object-cover shadow-[0_0_30px_rgba(201,168,76,0.3)] relative z-10 transition-transform duration-75"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center pointer-events-none p-4">
            <h2 className="font-display text-xl md:text-2xl text-white tracking-widest mb-1 text-center">
              {currentTrack.title}
              {currentTrack.isLive && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-3 inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider relative -top-1"
                >
                  <Radio size={8} /> Live
                </motion.span>
              )}
            </h2>
            <p className="text-gold text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-80 mb-4">Fairway Dreams Studio</p>

            {/* Signal Strength Meter */}
            <div className="flex gap-1 h-8 items-end">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isPlaying ? [10, 32, 15, 28, 10] : 4,
                    opacity: isPlaying ? [0.3, 1, 0.5, 1, 0.3] : 0.2
                  }}
                  transition={{ 
                    duration: 0.5 + Math.random(), 
                    repeat: Infinity,
                    delay: i * 0.1 
                  }}
                  className="w-1 bg-gold rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Track Metadata Badges */}
          <div className="absolute bottom-6 left-6 hidden md:flex flex-col gap-2">
            {currentTrack.bpm && (
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                <span className="text-gold">BPM</span> {currentTrack.bpm}
              </div>
            )}
            {currentTrack.key && (
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                <span className="text-gold">KEY</span> {currentTrack.key}
              </div>
            )}
            {currentTrack.numerologyCode && (
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                <span className="text-gold">CODE</span> {currentTrack.numerologyCode}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-6 left-6 flex gap-2 scale-75 md:scale-100 origin-top-left">
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-wider text-gold">AI Composition</span>
            {(currentTrack.isLive || isPlaying) && (
              <span className={`px-3 py-1 rounded-full backdrop-blur-md border text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${currentTrack.isLive ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-gold/10 border-gold/20 text-gold'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentTrack.isLive ? 'bg-red-500' : 'bg-gold'}`} />
                {currentTrack.isLive ? 'Live Broadcast' : 'Live Signal'}
              </span>
            )}
          </div>

          <div className="absolute top-6 right-6 flex gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowSharePicker(!showSharePicker)}
                className={`p-2 rounded-lg backdrop-blur-md border border-white/10 transition-colors flex items-center gap-2 ${showSharePicker ? 'bg-gold text-black border-gold' : 'bg-black/50 text-gold hover:bg-gold hover:text-black'}`}
                title="Share Track"
              >
                <Share2 size={16} />
                <span className="text-[10px] uppercase tracking-wider hidden md:inline">Share</span>
              </button>

              <AnimatePresence>
                {showSharePicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 z-50 shadow-2xl"
                  >
                    <ShareButtons 
                      url={window.location.origin + `/?track=${currentTrack.id}`}
                      title={currentTrack.title}
                      type="track"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => onToggleFavorite(currentTrack.id)}
              className={`p-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 transition-colors ${isFavorite ? 'text-red-500' : 'text-gold hover:text-red-500'}`}
              title="Add to Liked Signals"
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            {onAddToPlaylist && (
              <div className="relative">
                <button 
                  onClick={() => setShowPlaylistPicker(!showPlaylistPicker)}
                  className={`p-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 transition-colors ${showPlaylistPicker ? 'bg-gold text-black border-gold' : 'text-gold hover:bg-gold hover:text-black'}`}
                  title="Add to Playlist"
                >
                  <Save size={16} />
                </button>
                
                <AnimatePresence>
                  {showPlaylistPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 z-50 shadow-2xl"
                    >
                      <h5 className="text-[8px] uppercase tracking-widest text-zinc-500 mb-3 border-b border-white/5 pb-2">Save to Curation Playlist</h5>
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {playlists.length > 0 ? (
                          playlists.map(playlist => {
                            const isInPlaylist = playlist.trackIds.includes(currentTrack.id);
                            return (
                              <button 
                                key={playlist.id}
                                onClick={() => {
                                  onAddToPlaylist(playlist.id!, currentTrack.id);
                                  setShowPlaylistPicker(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-[10px] uppercase tracking-wider transition-all ${isInPlaylist ? 'bg-gold/10 text-gold cursor-default' : 'hover:bg-white/10 text-zinc-300 hover:text-gold'}`}
                              >
                                <span>{playlist.title}</span>
                                {isInPlaylist && <Sparkles size={10} />}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-[8px] text-zinc-600 text-center py-4">No playlists found. Create one in your Profile.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button 
              onClick={() => setIsFullscreen(true)}
              className="p-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-gold hover:bg-gold hover:text-black transition-colors group/fs"
            >
              <Maximize2 size={16} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 h-1 items-end opacity-0 group-hover/fs:opacity-50 transition-opacity">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [1, 4, 2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    className="w-0.5 bg-gold rounded-full"
                  />
                ))}
              </div>
            </button>
          </div>

          {/* Progress Bar */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 md:h-1 bg-white/5 cursor-pointer group/progress overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              onSeek(pct * duration);
            }}
          >
            <div className="absolute inset-0 flex gap-0.5 items-end opacity-20">
              {Array.from({ length: 100 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [1, 4, 2, 3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                  className="flex-1 bg-white"
                />
              ))}
            </div>
            <div 
              className="h-full gold-gradient shadow-[0_0_15px_rgba(201,168,76,0.5)] transition-all duration-150 relative z-10"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Larger touch target for mobile */}
            <div className="absolute inset-0 -top-4 -bottom-4 z-20 md:hidden" />
          </div>
        </div>

        {/* Controls Area */}
        <div className="p-4 md:p-8 bg-gradient-to-b from-zinc-900/50 to-black">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
            {/* Left: Modes & Themes */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] hidden md:inline">Visualizer</span>
                <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-1">
                  {(['bars', 'wave', 'radial', 'particles', 'mirror', 'scope', 'tunnel', 'nebula', 'vortex', 'matrix', 'kaleidoscope', 'liquid', 'dna', 'galaxy', 'atom', 'blackhole', 'constellation'] as VisualizerMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSetting('mode', m)}
                      className={`relative px-3 py-1.5 md:py-1 rounded-full text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${
                        settings.mode === m 
                          ? 'bg-gold/20 border border-gold/50 text-gold' 
                          : 'bg-white/5 border border-white/5 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {m}
                      {settings.mode === m && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 h-1 items-end opacity-50">
                          {[1, 2, 3].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: [1, 4, 2, 3, 1] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                              className="w-0.5 bg-gold rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] hidden md:inline">Frequency</span>
                <div className="flex gap-4 md:gap-2">
                  {['gold', 'blue', 'violet', 'emerald', 'day'].map((t) => (
                    <button
                      key={t}
                      onClick={() => onThemeChange(t)}
                      className={`relative w-8 h-8 md:w-5 md:h-5 rounded-full border-2 transition-transform hover:scale-125 ${
                        t === 'gold' ? 'bg-[#c9a84c]' : 
                        t === 'blue' ? 'bg-[#4fc3f7]' : 
                        t === 'violet' ? 'bg-[#a78bfa]' : 
                        t === 'emerald' ? 'bg-[#34d399]' : 'bg-[#f5f5dc]'
                      } ${themeName === t ? 'border-white' : 'border-transparent'}`}
                    >
                      {themeName === t && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 h-1 items-end opacity-50">
                          {[1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: [1, 4, 2] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                              className="w-0.5 bg-white rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Playback */}
            <div className="flex items-center justify-center gap-8 md:gap-6 order-first md:order-none py-2 md:py-0">
              <button 
                onClick={onPrev} 
                className="text-[var(--text-secondary)] hover:text-gold transition-all active:scale-90 relative group/prev"
              >
                <SkipBack size={32} fill="currentColor" className="w-8 h-8 md:w-7 md:h-7" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 h-1 items-end opacity-0 group-hover/prev:opacity-50 transition-opacity">
                  {[1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [1, 4, 2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-0.5 bg-gold rounded-full"
                    />
                  ))}
                </div>
              </button>
              
              <div className="relative">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, x: '-50%' }}
                      exit={{ opacity: 0, y: 10, x: '-50%' }}
                      className="absolute bottom-full mb-6 left-1/2 w-max max-w-[90vw] md:max-w-[280px] px-4 py-3 bg-red-600/95 backdrop-blur-md text-white text-[10px] rounded-xl shadow-2xl z-50 flex flex-col gap-1 pointer-events-auto border border-white/20"
                    >
                      <div className="flex items-center gap-2 font-bold uppercase tracking-widest">
                        <AlertCircle size={14} />
                        <span>Playback Error</span>
                      </div>
                      <p className="opacity-90 leading-relaxed whitespace-pre-wrap">{error}</p>
                      {error.includes("CORS") && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open('https://firebase.google.com/docs/storage/web/download-files#cors_configuration', '_blank');
                          }}
                          className="mt-1 text-[8px] underline opacity-70 hover:opacity-100 text-left cursor-pointer"
                        >
                          How to fix CORS in Firebase
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={onTogglePlay}
                  disabled={isLoading}
                  className="w-20 h-20 md:w-16 md:h-16 rounded-full gold-gradient flex items-center justify-center text-black shadow-xl shadow-gold/20 hover:scale-105 active:scale-95 transition-all relative group/play"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full"
                    />
                  ) : isPlaying ? (
                    <Pause size={36} fill="currentColor" className="md:w-8 md:h-8" />
                  ) : (
                    <Play size={36} fill="currentColor" className="ml-1 md:w-8 md:h-8" />
                  )}
                  
                  {isPlaying && !isLoading && (
                    <div className="absolute -inset-3 rounded-full border border-gold/30 animate-ping opacity-20" />
                  )}
                </button>
              </div>

              <button 
                onClick={onNext} 
                className="text-[var(--text-secondary)] hover:text-gold transition-all active:scale-90 relative group/next"
              >
                <SkipForward size={32} fill="currentColor" className="w-8 h-8 md:w-7 md:h-7" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 h-1 items-end opacity-0 group-hover/next:opacity-50 transition-opacity">
                  {[1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [1, 4, 2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-0.5 bg-gold rounded-full"
                    />
                  ))}
                </div>
              </button>
            </div>

            {/* Right: Volume & Link */}
            <div className="flex flex-row items-center justify-center gap-6 w-full md:w-auto">
              <div className="hidden md:flex items-center gap-3 relative w-full md:w-auto">
                <Volume2 size={16} className="text-[var(--text-secondary)]" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 md:w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold"
                />
              </div>
              
              <a 
                href={currentTrack.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto relative flex items-center justify-center gap-2 px-6 py-3 md:px-4 md:py-2 rounded-xl md:rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-gold hover:bg-white/10 transition-all group/suno"
              >
                Suno <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="mt-6 flex justify-between text-[10px] font-mono text-[var(--text-secondary)] tracking-widest relative">
            <span>{formatTime(currentTime)}</span>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex gap-0.5 h-1 items-end opacity-20">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [1, 4, 2, 3, 1] }}
                  transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: i * 0.05 }}
                  className="flex-1 bg-zinc-800"
                />
              ))}
            </div>
            
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="border-t border-white/5 bg-black/40 p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-gold mb-6 flex items-center gap-2">
              <Sparkles size={14} /> AI Resonance Insight
            </h4>
            
            <AnimatePresence mode="wait">
              {currentInsight ? (
                <motion.div 
                  key="insight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 w-full"
                >
                  <p className="text-lg text-zinc-300 italic font-light leading-relaxed max-w-2xl mx-auto">
                    "{currentInsight}"
                  </p>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => onSaveInsight(currentTrack, currentInsight)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] uppercase tracking-widest hover:bg-gold/20 transition-all"
                    >
                      <Save size={12} /> Save Insight
                    </button>
                    <button 
                      onClick={onClearInsight}
                      className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[var(--text-secondary)] text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button 
                    onClick={onGenerateInsight}
                    disabled={isGeneratingInsight}
                    className="relative group px-8 py-3 rounded-xl border border-gold/30 text-gold text-[10px] uppercase tracking-widest hover:bg-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isGeneratingInsight ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles size={14} />
                          </motion.div>
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Decoding Frequency...
                          </motion.span>
                        </>
                      ) : (
                        'Generate AI Insight'
                      )}
                    </span>
                    
                    {isGeneratingInsight && (
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent"
                      />
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Visualizer Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="absolute inset-0">
              <Visualizer 
                analyser={analyser} 
                settings={settings} 
                theme={theme} 
                isPlaying={isPlaying} 
                onSettingsChange={onSettingsChange}
              />
            </div>

            {/* Centered focal art for Fullscreen */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: isPlaying ? [1, 1.05, 1] : 1
                }}
                transition={{ 
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative p-12 flex items-center justify-center"
              >
                 <motion.div 
                   animate={{ rotate: isPlaying ? [0, 360] : 0 }}
                   transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 rounded-full border border-gold/20 border-dashed animate-pulse opacity-50"
                 />
                 
                 <motion.div 
                   animate={{ rotate: isPlaying ? [360, 0] : 0 }}
                   transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-4 rounded-full border border-gold/10 border-dotted"
                 />

                 <img 
                  ref={imageRef2}
                  src={currentTrack.art || '/src/assets/images/default_cover_1779345608057.png'} 
                  alt={currentTrack.title}
                  className="w-48 h-48 md:w-72 md:h-72 rounded-full border-4 border-gold/50 object-cover shadow-[0_0_50px_rgba(201,168,76,0.5)] relative z-10 transition-transform duration-75"
                />
              </motion.div>
            </div>

            {/* Top Bar */}
            <div className="relative z-10 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <img src={currentTrack.art || '/src/assets/images/default_cover_1779345608057.png'} alt={currentTrack.title} className="w-12 h-12 rounded-full border border-gold" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="text-white font-display tracking-widest text-sm">{currentTrack.title}</h3>
                  <p className="text-gold text-[8px] uppercase tracking-widest">Fairway Dreams Studio</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFullscreen(false)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <SkipBack className="rotate-90" size={20} />
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="mt-auto relative z-10 p-8 bg-gradient-to-t from-black/80 to-transparent">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-center gap-12">
                  <button onClick={onPrev} className="text-white/60 hover:text-gold transition-colors">
                    <SkipBack size={32} fill="currentColor" />
                  </button>
                  <button 
                    onClick={onTogglePlay}
                    disabled={isLoading}
                    className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center text-black shadow-2xl relative group"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-4 border-black/20 border-t-black rounded-full"
                      />
                    ) : isPlaying ? (
                      <Pause size={40} fill="currentColor" />
                    ) : (
                      <Play size={40} fill="currentColor" className="ml-1" />
                    )}
                  </button>
                  <button onClick={onNext} className="text-white/60 hover:text-gold transition-colors">
                    <SkipForward size={32} fill="currentColor" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div 
                    className="h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      onSeek(pct * duration);
                    }}
                  >
                    <div 
                      className="h-full gold-gradient shadow-[0_0_20px_rgba(201,168,76,0.8)]"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-white/40 tracking-widest">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
