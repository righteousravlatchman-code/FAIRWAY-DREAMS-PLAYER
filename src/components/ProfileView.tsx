import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { User, Heart, BookOpen, Settings, Edit2, Save, X, Music, Sparkles, LogOut, Plus, Lock, Globe, Trash2, Play, Share2, FileText, Download, Upload, Loader2, Volume2, Pause } from 'lucide-react';
import { UserProfile, Track, SavedInsight, Playlist, ListeningEvent } from '../types';
import { TRACKS } from '../constants';
import { auth, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { RecommendationService } from '../services/recommendationService';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { useAudioNarrator } from '../hooks/useAudioNarrator';
import { ShareButtons } from './ShareButtons';

interface ProfileViewProps {
  profile: UserProfile;
  playlists: Playlist[];
  listeningHistory: ListeningEvent[];
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onSelectTrack: (track: Track) => void;
  onCreatePlaylist: (name: string, isPublic: boolean) => void;
  onDeletePlaylist: (id: string) => void;
  onUpdatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, trackId: string) => void;
  tracks: Track[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  profile, 
  playlists,
  listeningHistory,
  onUpdateProfile, 
  onSelectTrack, 
  onCreatePlaylist,
  onDeletePlaylist,
  onUpdatePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  tracks 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(true);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    bio: profile.bio,
    avatar: profile.avatar
  });
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `avatars/${auth.currentUser.uid}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setEditForm(prev => ({ ...prev, avatar: downloadUrl }));
      // Auto-save if not editing? Or just wait for save?
      // Better to just update form so user can save all at once
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const favoriteTracks = useMemo(() => 
    tracks.filter(t => (profile.likedTrackIds || []).includes(t.id)),
    [tracks, profile.likedTrackIds]
  );

  const userPlaylists = useMemo(() => 
    playlists.filter(p => p.userId === profile.uid),
    [playlists, profile.uid]
  );

  const { isPlaying, audioLoading, toggleText } = useAudioNarrator();

  const handleToggleAudio = () => {
    if (profile.frequencyReport) {
      toggleText(profile.frequencyReport);
    }
  };

  const recommendations = useMemo(() => 
    RecommendationService.getRecommendations(tracks, profile, listeningHistory),
    [tracks, profile, listeningHistory]
  );

  const discoverWeekly = useMemo(() => 
    RecommendationService.getDiscoverWeekly(tracks, profile),
    [tracks, profile]
  );

  const handleSave = () => {
    onUpdateProfile(editForm);
    setIsEditing(false);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim(), newPlaylistPublic);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 mx-auto mb-8">
          <User size={40} />
        </div>
        <h2 className="font-display text-2xl text-white tracking-widest mb-4 uppercase">Access Restricted</h2>
        <p className="text-zinc-500 text-sm mb-8 tracking-widest uppercase">Sign in to view your digital essence</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-4 gap-12">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6 group">
                <div className="w-32 h-32 rounded-full border-2 border-gold p-1 overflow-hidden relative">
                  <img 
                    src={editForm.avatar || profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                      <Loader2 size={24} className="text-gold animate-spin" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className={`absolute bottom-0 right-0 p-2 rounded-full gold-gradient text-black shadow-lg cursor-pointer hover:scale-110 transition-transform ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                      className="hidden" 
                      disabled={isUploading}
                    />
                    <Upload size={14} />
                  </label>
                )}
              </div>

              {isEditing ? (
                <div className="w-full space-y-4">
                  <input 
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-center outline-none focus:border-gold"
                    placeholder="Your Name"
                  />
                  <textarea 
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-center outline-none focus:border-gold h-24 resize-none"
                    placeholder="Your Bio"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      className="flex-1 py-2 rounded-xl gold-gradient text-black font-bold text-xs uppercase tracking-widest"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-2xl text-white tracking-widest">{profile.name}</h3>
                    {profile.hebrewName && (
                      <span className="text-xl text-gold font-display opacity-80">{profile.hebrewName}</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm mb-6 leading-relaxed">{profile.bio || "No bio yet. Frequency uncoded."}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-gold hover:bg-white/10 transition-all"
                    >
                      <Edit2 size={12} /> Edit Profile
                    </button>
                    <button 
                      onClick={() => auth.signOut()}
                      className="p-2 rounded-full border border-white/10 text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                <span>Liked Tracks</span>
                <span className="text-gold">{(profile.likedTrackIds || []).length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                <span>Playlists</span>
                <span className="text-gold">{userPlaylists.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                <span>Insights</span>
                <span className="text-gold">{profile.savedInsights.length}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-gold" />
              <h4 className="font-display text-sm text-white tracking-widest uppercase">Customization</h4>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">Active Theme</p>
                <select 
                  value={profile.settings.theme}
                  onChange={(e) => onUpdateProfile({ settings: { ...profile.settings, theme: e.target.value } })}
                  className="w-full bg-transparent text-[var(--text-primary)] text-xs capitalize outline-none cursor-pointer"
                >
                  <option value="gold" className="bg-black text-white">Dark Gold</option>
                  <option value="light" className="bg-white text-black">Light Mode</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">Spirit Guide (Mascot)</p>
                <select 
                  value={profile.mascot || 'none'}
                  onChange={(e) => onUpdateProfile({ mascot: e.target.value })}
                  className="w-full bg-transparent text-[var(--text-primary)] text-xs capitalize outline-none cursor-pointer"
                >
                  <option value="none" className="bg-black text-white">None (Disabled)</option>
                  <option value="owl" className="bg-black text-white">The Cosmic Owl</option>
                  <option value="fox" className="bg-black text-white">The Astral Fox</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-12">
          {/* Frequency Report */}
          {profile.frequencyReport && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-gold" />
                  <h3 className="font-display text-xl text-white tracking-widest uppercase">Frequency Dossier</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleToggleAudio}
                    disabled={audioLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] uppercase tracking-widest font-bold ${
                      isPlaying 
                      ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(201,168,76,0.2)]' 
                      : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
                    }`}
                  >
                    {audioLoading ? <Loader2 size={14} className="animate-spin" /> : isPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
                    {isPlaying ? 'Stop' : 'Briefing'}
                  </button>
                  <button 
                    onClick={() => {
                    const blob = new Blob([profile.frequencyReport || ''], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Frequency_Report_${profile.name.replace(/\s+/g, '_')}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-gold hover:bg-gold/10 transition-all"
                  title="Download Report"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="glass-panel p-8 sm:p-12 rounded-[3rem] border-gold/20 relative overflow-hidden cyber-grid">
                <div className="scan-line" />
                <div className="absolute top-0 right-0 p-8 flex gap-2">
                  <div className="glow-dot animate-pulse" />
                  <div className="glow-dot animate-pulse delay-75" />
                  <div className="glow-dot animate-pulse delay-150" />
                </div>
                <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-30" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-12 pb-6 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center text-gold">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-display text-lg uppercase tracking-[0.3em]">Official Analysis</h3>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Authenticated Frequency Record</p>
                    </div>
                  </div>

                  <div className="mb-12 p-6 rounded-2xl bg-black/40 border border-gold/10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 cyber-grid" />
                    <p className="text-[8px] uppercase tracking-widest text-gold/60 mb-4 text-center">Spectral Signature Analysis</p>
                    <FrequencyVisualizer name={profile.name} birthDate={profile.updatedAt || '2024-01-01'} />
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:tracking-[0.2em] prose-headings:uppercase prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-sm prose-p:text-zinc-400 prose-strong:text-gold prose-li:text-zinc-400">
                    <ReactMarkdown>{profile.frequencyReport}</ReactMarkdown>
                  </div>
                </div>

                {/* Decorative Signal Bars */}
                <div className="mt-12 flex justify-center gap-1 h-4 items-end opacity-20">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 16, 6, 12, 4] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
                      className="w-0.5 bg-gold rounded-full"
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recommendations */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Sparkles size={20} className="text-gold" />
              <h3 className="font-display text-xl text-white tracking-widest uppercase">For Your Frequency</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* For You */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Personalized Mix</h4>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map(track => (
                    <motion.div 
                      key={track.id}
                      whileHover={{ x: 5 }}
                      onClick={() => onSelectTrack(track)}
                      className="glass-panel p-3 rounded-xl flex items-center gap-4 cursor-pointer group"
                    >
                      <img src={track.art || '/src/assets/images/default_cover_1779345608057.png'} alt={track.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white text-xs font-medium truncate">{track.title}</h5>
                        <p className="text-zinc-500 text-[8px] uppercase tracking-widest truncate">{track.genre[0]}</p>
                      </div>
                      <Play size={14} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Discover Weekly */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Discover Weekly</h4>
                <div className="space-y-3">
                  {discoverWeekly.slice(0, 3).map(track => (
                    <motion.div 
                      key={track.id}
                      whileHover={{ x: 5 }}
                      onClick={() => onSelectTrack(track)}
                      className="glass-panel p-3 rounded-xl flex items-center gap-4 cursor-pointer group"
                    >
                      <img src={track.art || '/src/assets/images/default_cover_1779345608057.png'} alt={track.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white text-xs font-medium truncate">{track.title}</h5>
                        <p className="text-zinc-500 text-[8px] uppercase tracking-widest truncate">{track.genre[0]}</p>
                      </div>
                      <Sparkles size={14} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Playlists */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Music size={20} className="text-gold" />
                <h3 className="font-display text-xl text-white tracking-widest uppercase">Curation Playlists</h3>
              </div>
              <button 
                onClick={() => setShowCreatePlaylist(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] uppercase tracking-widest hover:bg-gold/20 transition-all"
              >
                <Plus size={14} /> New Playlist
              </button>
            </div>

            <AnimatePresence>
              {showCreatePlaylist && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 glass-panel p-6 rounded-2xl border-gold/30"
                >
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-[8px] uppercase tracking-widest text-zinc-500">Playlist Name</label>
                      <input 
                        type="text"
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-gold"
                        placeholder="E.g., Midnight Resonances"
                      />
                    </div>
                    <div className="flex items-center gap-4 h-10">
                      <button 
                        onClick={() => setNewPlaylistPublic(!newPlaylistPublic)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-[10px] uppercase tracking-widest ${
                          newPlaylistPublic ? 'border-gold/50 text-gold bg-gold/5' : 'border-white/10 text-zinc-500'
                        }`}
                      >
                        {newPlaylistPublic ? <Globe size={12} /> : <Lock size={12} />}
                        {newPlaylistPublic ? 'Public' : 'Private'}
                      </button>
                      <button 
                        onClick={handleCreatePlaylist}
                        className="px-6 py-2 rounded-lg gold-gradient text-black font-bold text-[10px] uppercase tracking-widest"
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => setShowCreatePlaylist(false)}
                        className="p-2 text-zinc-500 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPlaylists.map(playlist => (
                <motion.div 
                  key={playlist.id}
                  whileHover={{ y: -5 }}
                  className="glass-panel p-6 rounded-3xl relative group overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-gold/10 text-gold">
                      <Music size={20} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingPlaylistId(editingPlaylistId === playlist.id ? null : playlist.id)}
                        className={`p-2 rounded-lg transition-colors ${editingPlaylistId === playlist.id ? 'bg-gold text-black' : 'bg-white/5 text-zinc-500 hover:text-gold'}`}
                        title="Edit Contents"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => onUpdatePlaylist(playlist.id!, { isPublic: !playlist.isPublic })}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-gold transition-colors"
                      >
                        {playlist.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                      </button>
                      <button 
                        onClick={() => onDeletePlaylist(playlist.id!)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {editingPlaylistId === playlist.id ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-2">Track Management</p>
                      <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                        {tracks.map(track => {
                          const isInPlaylist = playlist.trackIds.includes(track.id);
                          return (
                            <button
                              key={track.id}
                              onClick={() => isInPlaylist ? onRemoveFromPlaylist(playlist.id, track.id) : onAddToPlaylist(playlist.id, track.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${isInPlaylist ? 'bg-gold/10 text-gold' : 'hover:bg-white/5 text-zinc-500'}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={track.art || '/src/assets/images/default_cover_1779345608057.png'} alt="" className="w-6 h-6 rounded-md object-cover" referrerPolicy="no-referrer" />
                                <span className="text-[10px] truncate">{track.title}</span>
                              </div>
                              {isInPlaylist ? <X size={12} /> : <Plus size={12} />}
                            </button>
                          );
                        })}
                      </div>
                      <button 
                         onClick={() => setEditingPlaylistId(null)}
                         className="w-full py-2 rounded-xl bg-white/5 text-zinc-500 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-display tracking-widest uppercase mb-1">{playlist.title}</h4>
                          <p className="text-zinc-500 text-[8px] uppercase tracking-widest mb-4">
                            {playlist.trackIds.length} Tracks • {new Date(playlist.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {playlist.isPublic && (
                          <div onClick={e => e.stopPropagation()}>
                            <ShareButtons 
                              url={window.location.origin + `/?playlist=${playlist.id}`} 
                              title={playlist.title} 
                              type="playlist"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 flex -space-x-3">
                        {playlist.trackIds.slice(0, 3).map((tid, i) => {
                          const track = tracks.find(t => t.id === tid);
                          return track ? (
                            <img 
                              key={tid} 
                              src={track.art || '/src/assets/images/default_cover_1779345608057.png'} 
                              className="w-8 h-8 rounded-full border-2 border-black object-cover" 
                              style={{ zIndex: 3 - i }}
                              referrerPolicy="no-referrer"
                            />
                          ) : null;
                        })}
                        {playlist.trackIds.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[8px] text-white z-0">
                            +{playlist.trackIds.length - 3}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                </motion.div>
              ))}
            </div>
          </section>

          {/* Favorite Tracks */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Heart size={20} className="text-gold" />
              <h3 className="font-display text-xl text-white tracking-widest uppercase">Liked Signals</h3>
            </div>

            {favoriteTracks.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {favoriteTracks.map(track => (
                  <motion.div 
                    key={track.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onSelectTrack(track)}
                    className="glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer group"
                  >
                    <img src={track.art || '/src/assets/images/default_cover_1779345608057.png'} alt={track.title} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium truncate">{track.title}</h4>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest truncate">{track.genre.join(', ')}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Music size={16} className="text-gold" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                <Music size={32} className="text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">No liked tracks yet.</p>
              </div>
            )}
          </section>

          {/* Saved Insights */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <BookOpen size={20} className="text-gold" />
              <h3 className="font-display text-xl text-white tracking-widest uppercase">Saved Insights</h3>
            </div>

            {profile.savedInsights.length > 0 ? (
              <div className="space-y-4">
                {profile.savedInsights.map(insight => (
                  <motion.div 
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full gold-gradient opacity-50" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-gold text-[10px] uppercase tracking-widest mb-1">{insight.trackTitle}</p>
                        <p className="text-zinc-500 text-[8px] uppercase tracking-widest">
                          {new Date(insight.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <Sparkles size={14} className="text-gold/30" />
                    </div>
                    <p className="text-zinc-300 text-sm italic leading-relaxed">"{insight.content}"</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                <Sparkles size={32} className="text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">No saved insights yet.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
