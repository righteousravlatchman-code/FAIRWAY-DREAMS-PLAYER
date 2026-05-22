import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShareButtons } from './ShareButtons';
import { Play } from 'lucide-react';
import { Track } from '../types';

export const ARTISTS = [
  {
    id: 'fairway-dreams',
    name: 'Fairway Dreams',
    type: 'Collective',
    cover: 'https://cdn2.suno.ai/30a77b97-fefe-42e9-bac2-64928fd1fec9.jpeg',
    bio: 'Fairway Dreams is an AI-enhanced musical collective, born from the synthesis of ancient frequencies, GG33 numerology, and modern electronic production. Their aim is to elevate consciousness through sound waves.',
    history: 'Founded in 2024, the collective started as a small experiment combining solfeggio frequencies with lo-fi beats, rapidly expanding into a sprawling ecosystem of resonant digital artifacts.',
    influences: ['Dolores Cannon', 'Carl Jung', 'Nostradamus', 'The Monroe Institute', 'Suno AI'],
    achievements: ['Pioneers of the AI-Resonance Genre', 'GG33 Authorized Frequency Provider'],
    discography: [
      {
        id: 'album-1',
        title: 'Quantum State',
        type: 'Album',
        releaseDate: '2025-01-15',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'ep-1',
        title: 'Inner Circle',
        type: 'EP',
        releaseDate: '2024-11-22',
        cover: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'single-1',
        title: 'Manifestation Protocol',
        type: 'Single',
        releaseDate: '2024-09-08',
        cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800'
      }
    ]
  }
];

interface ArtistsViewProps {
  onSelectTrack?: (track: Track) => void;
}

export function ArtistsView({ onSelectTrack }: ArtistsViewProps) {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  const selectedArtist = ARTISTS.find(a => a.id === selectedArtistId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl text-[var(--text-primary)] tracking-widest uppercase mb-4">Artists & Visionaries</h2>
        <p className="text-[var(--text-secondary)] uppercase tracking-[0.2em] text-xs">The Minds Behind the Frequencies</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedArtistId ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {ARTISTS.map(artist => (
              <div 
                key={artist.id}
                onClick={() => setSelectedArtistId(artist.id)}
                className="group cursor-pointer bg-[var(--panel-bg)] rounded-3xl p-6 border border-[var(--panel-border)] hover-zoom transition-all"
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-6 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                  <img src={artist.cover} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display text-2xl text-[var(--text-primary)] tracking-widest uppercase">{artist.name}</h3>
                </div>
                <span className="inline-block px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-full text-[10px] uppercase tracking-wider mb-4">
                  {artist.type}
                </span>
                <p className="text-[var(--text-secondary)] text-sm line-clamp-3 leading-relaxed mb-6">
                  {artist.bio}
                </p>
                <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <ShareButtons 
                    url={window.location.origin + `/?artist=${artist.id}`} 
                    title={artist.name} 
                    type="artist"
                  />
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 md:p-12"
          >
            <button 
              onClick={() => setSelectedArtistId(null)}
              className="mb-8 text-gold text-[10px] uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
            >
              ← Back to Directory
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-1">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl mb-6">
                  <img src={selectedArtist?.cover} alt={selectedArtist?.name} className="w-full h-full object-cover" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl text-[var(--text-primary)] tracking-widest uppercase mb-2">
                  {selectedArtist?.name}
                </h1>
                <span className="inline-block px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-full text-[10px] uppercase tracking-wider mb-6">
                  {selectedArtist?.type}
                </span>
                
                <div className="mb-8">
                  <ShareButtons 
                    url={window.location.origin + `/?artist=${selectedArtist?.id}`} 
                    title={selectedArtist?.name || ''} 
                    type="artist"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Musical Influences</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtist?.influences.map((inf, i) => (
                        <span key={i} className="text-xs text-[var(--text-primary)] bg-white/5 border border-[var(--panel-border)] px-2 py-1 rounded-md">
                          {inf}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Notable Achievements</h4>
                    <ul className="space-y-2">
                      {selectedArtist?.achievements.map((ach, i) => (
                        <li key={i} className="text-sm text-[var(--text-primary)] relative pl-3 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-gold before:rounded-full">
                          {ach}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-12">
                <section>
                  <h3 className="font-display text-2xl text-[var(--text-primary)] tracking-widest uppercase mb-4 border-b border-[var(--panel-border)] pb-2 flex items-center gap-3">
                    Biography
                  </h3>
                  <div className="prose prose-invert max-w-none prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed">
                    <p>{selectedArtist?.bio}</p>
                    <p>{selectedArtist?.history}</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-display text-2xl text-[var(--text-primary)] tracking-widest uppercase mb-6 border-b border-[var(--panel-border)] pb-2 flex items-center gap-3">
                    Discography
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {selectedArtist?.discography.map(release => (
                      <div key={release.id} className="flex gap-4 p-4 rounded-xl bg-black/5 hover:bg-black/10 border border-[var(--panel-border)] transition-colors group">
                        <img src={release.cover} alt={release.title} className="w-16 h-16 rounded-lg object-cover shadow-lg" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-1 group-hover:text-gold transition-colors">{release.title}</h4>
                            <ShareButtons 
                              url={window.location.origin + `/?album=${release.id}`} 
                              title={release.title} 
                              type="album"
                            />
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 bg-white/10 px-2 py-0.5 rounded mr-2">{release.type}</span>
                          <span className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">{new Date(release.releaseDate).getFullYear()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
