import React from 'react';
import { motion } from 'motion/react';
import { Music, Play, Heart } from 'lucide-react';
import { Track } from '../types';

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string;
  likedTrackIds: string[];
  onSelect: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ tracks, currentTrackId, likedTrackIds, onSelect, onToggleFavorite }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-display text-xl text-[var(--text-primary)] tracking-widest">Discography</h3>
          <div className="h-px w-12 gold-gradient mt-2" />
          
          <div className="mt-4 flex gap-0.5 h-2 items-end opacity-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [2, 8, 4, 6, 2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                className="w-0.5 bg-gold rounded-full"
              />
            ))}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{tracks.length} Signals Detected</span>
      </div>

      <div className="grid gap-3">
        {tracks.map((track, idx) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(track)}
            className={`group relative flex items-center gap-3 md:gap-6 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all cursor-pointer ${
              currentTrackId === track.id 
                ? 'bg-gold/10 border-gold/30 shadow-lg shadow-gold/5' 
                : 'bg-[var(--panel-bg)] border-[var(--panel-border)] hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <span className={`font-display text-[10px] md:text-xs w-6 text-center ${currentTrackId === track.id ? 'text-gold' : 'text-[var(--text-secondary)]'}`}>
              {(idx + 1).toString().padStart(2, '0')}
            </span>

            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={track.art} alt={track.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${currentTrackId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <Play size={16} fill="currentColor" className="text-gold" />
              </div>
              
              {currentTrackId === track.id && (
                <div className="absolute bottom-0 left-0 w-full flex gap-0.5 h-1 items-end opacity-50">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [1, 4, 2, 3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      className="flex-1 bg-gold"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${currentTrackId === track.id ? 'text-gold' : 'text-[var(--text-primary)]'}`}>
                {track.title}
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-1 truncate">
                {track.playlist}
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex gap-2">
                {track.genre.slice(0, 2).map(g => (
                  <span key={g} className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">
                    {g}
                  </span>
                ))}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(track.id);
                }}
                className={`p-3 md:p-2 rounded-lg hover:bg-white/10 active:scale-90 transition-all ${(likedTrackIds || []).includes(track.id) ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}
              >
                <Heart size={18} className="md:w-4 md:h-4" fill={(likedTrackIds || []).includes(track.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {currentTrackId === track.id && (
              <div className="flex gap-1 items-end h-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 16, 8, 20, 4] }}
                    transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.1 }}
                    className="w-0.5 bg-gold"
                  />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
