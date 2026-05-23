import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Music, Drone, Info, ShieldCheck, Mail, Menu, X, ChevronRight, Sparkles, Save, LogIn, LogOut, User as UserIcon, Megaphone, Sun, Moon, BookOpen, Shield, Layout, Play, Radio, Users, FileText, HelpCircle, Settings, Compass, Star, ExternalLink, ShoppingBag } from 'lucide-react';
import { Track, VisualizerMode, ThemeColors, MediaItem, VisualizerSettings } from './types';
import { TRACKS, THEMES } from './constants';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useToast } from './components/ToastProvider';
import { Player } from './components/Player';
import { TrackList } from './components/TrackList';
import { NumerologyTool } from './components/NumerologyTool';
import { MissionControl } from './components/MissionControl';
import { FrequencyTuner } from './components/FrequencyTuner';
import { ManifestationJournal } from './components/ManifestationJournal';
import { CommunityCircle } from './components/CommunityCircle';
import { LicensingCalculator } from './components/LicensingCalculator';
import { AstrologyTool } from './components/AstrologyTool';
import { ChineseAstrologyTool } from './components/ChineseAstrologyTool';
import { LetterologyTool } from './components/LetterologyTool';
import { GematriaTool } from './components/GematriaTool';
import { JeopardyTool } from './components/JeopardyTool';
import { PersonnelTool } from './components/PersonnelTool';
import { CRMTool } from './components/CRMTool';
import { QuantumOracle } from './components/QuantumOracle';
import { FrequencyReport } from './components/FrequencyReport';
import { UnifiedIntake } from './components/UnifiedIntake';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { MerchStore } from './components/MerchStore';
import { StoreCart } from './components/StoreCart';
import { LiveStage } from './components/LiveStage';
import { ToolGuide } from './components/ToolGuide';
import { MilitaryDroneBackground } from './components/MilitaryDroneBackground';
import { ArtistsView } from './components/ArtistsView';
import { RiffLibrary } from './components/RiffLibrary';
import { useRiffLibrary } from './hooks/useRiffLibrary';
import { getHebrewName } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { UserProfile, SavedInsight, Playlist, ListeningEvent, Product, CartItem } from './types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  deleteDoc,
  OperationType, 
  handleFirestoreError,
  User
} from './firebase';

const INITIAL_PROFILE: UserProfile = {
  name: 'Seeker',
  bio: 'Decoding the digital frequency of consciousness.',
  avatar: '',
  role: 'user',
  likedTrackIds: [],
  savedInsights: [],
  settings: {
    theme: 'gold',
    vizSettings: {
      mode: 'bars',
      themeName: 'gold',
      speed: 1,
      sensitivity: 1,
      intensity: 1
    }
  }
};

import { MascotGuide } from './components/MascotGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeTool, setActiveTool] = useState('numerology');
  const [externalAppUrl, setExternalAppUrl] = useState('https://ai.studio/apps/b941faf9-f653-4d2c-a216-c0b005bf0ed8?fullscreenApplet=true');
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const statsY = useTransform(scrollY, [0, 500], [0, -50]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>({
    mode: 'bars',
    themeName: 'gold',
    speed: 1,
    sensitivity: 1,
    intensity: 1,
    showCenterImage: true
  });
  const [activeTheme, setActiveTheme] = useState<ThemeColors>(THEMES.gold);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [userData, setUserData] = useState<{ name: string; birthDate: string } | null>(() => {
    const saved = localStorage.getItem('fd_userData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const saveUserData = (data: { name: string; birthDate: string } | null) => {
    setUserData(data);
    if (data) {
      localStorage.setItem('fd_userData', JSON.stringify(data));
    } else {
      localStorage.removeItem('fd_userData');
    }
  };
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>(TRACKS);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [listeningHistory, setListeningHistory] = useState<ListeningEvent[]>([]);

  const { riffs, saveRiff, deleteRiff } = useRiffLibrary();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // System Config Listener
  useEffect(() => {
    const configRef = doc(db, 'system', 'config');
    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setSystemConfig(snapshot.data());
      }
    }, (err) => {
      console.warn("System config not accessible:", err);
    });
    return () => unsubscribe();
  }, []);

  // Media Listener
  useEffect(() => {
    const mediaRef = collection(db, 'media');
    const q = query(mediaRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreMedia = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem));
      const firestoreTracks = firestoreMedia.filter(m => m.type === 'audio') as Track[];
      
      if (firestoreTracks.length > 0) {
        setTracks(firestoreTracks);
        // If current track is not in the new tracks list, set it to the first one
        setCurrentTrack(prev => {
          const exists = firestoreTracks.find(t => t.id === prev.id);
          return exists || firestoreTracks[0];
        });
      } else {
        setTracks(TRACKS);
      }
    }, (err) => {
      console.warn("Media collection not accessible:", err);
    });
    return () => unsubscribe();
  }, []);

  // Theme Sync
  useEffect(() => {
    if (profile.settings.theme === 'light' || profile.settings.theme === 'day') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [profile.settings.theme]);

  // Track Theme Sync
  useEffect(() => {
    if (currentTrack.theme && THEMES[currentTrack.theme as keyof typeof THEMES]) {
      setActiveTheme(THEMES[currentTrack.theme as keyof typeof THEMES]);
    } else {
      setActiveTheme(THEMES.gold);
    }
  }, [currentTrack]);

  // Profile Sync
  useEffect(() => {
    if (!user) {
      setProfile(INITIAL_PROFILE);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    // Listen to profile changes
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const effectiveRole = user.email === 'righteousravlatchman@gmail.com' ? 'admin' : (data.role || 'user');
        
        setProfile(prev => ({
          ...prev,
          ...data,
          role: effectiveRole,
          likedTrackIds: data.likedTrackIds || data.favoriteTrackIds || [],
          settings: data.settings || prev.settings
        }));

        if (user.email === 'righteousravlatchman@gmail.com' && data.role !== 'admin') {
          updateDoc(userDocRef, { role: 'admin' }).catch(err => 
            console.error("Error setting admin role:", err)
          );
        }

        if (data.settings?.vizSettings) {
          setVizSettings(data.settings.vizSettings);
        }
        
        // Generate Hebrew name if missing
        if (!data.hebrewName && user.displayName) {
          getHebrewName(user.displayName).then(hebrewName => {
            if (hebrewName && hebrewName !== user.displayName) {
              updateDoc(userDocRef, { hebrewName }).catch(err => 
                console.error("Error setting hebrew name:", err)
              );
            }
          });
        }

        // One-time update for admin frequency report if missing
        if (user.email === 'righteousravlatchman@gmail.com' && !data.frequencyReport) {
          const report = `
# Frequency Report: Ravikiran Daniel Latchman
## The Visionary Architect
**Avatar:** Royal Purple, representing the integration of spiritual wisdom (Pisces Sun) with earthly authority and material manifestation (Life Path 8 and Expression 22).

### Why They Are Like This

#### Life Path Story
His life is a journey of mastering personal power and the flow of abundance, learning to balance material ambition with spiritual understanding. He is here to build lasting structures of impact, often overcoming significant challenges to step into his innate authority.

#### Moon Story (Emotional Strategy)
With his Moon in Sagittarius, he processes emotions through a lens of optimism, philosophy, and a need for freedom. Rather than dwelling in difficult feelings, he seeks a higher meaning or a new adventure, sometimes intellectualizing his emotions to maintain a sense of forward momentum.

#### Expression Number Behavior
He operates as a 'Master Builder' (Expression 22/4), driven by a powerful and practical need to turn grand, inspired visions into tangible reality. This manifests as a disciplined, systematic, and often relentless approach to achieving his goals.

#### Attachment & Trust Style
A Fearful-Avoidant pattern is likely. He desires deep, soulful connection (Pisces) but has an equally strong need for freedom and autonomy (Sagittarius Moon), sometimes creating distance when he feels his personal power or independence is threatened.

### Their Energetic Weather

#### Personal Cycle
He is in a 7 Personal Year, a cycle demanding introspection, analysis, and spiritual recalibration, amplifying his Pisces Sun's reflective nature. In his current 4 Personal Month, he is being pushed to ground these deep insights by focusing on diligent work, creating structure, and managing practical details.

#### Major Transits / Zones
Saturn and Neptune are both transiting his natal Pisces Sun, creating a powerful 'pressure cooker' for spiritual maturation, reality checks, and dissolving old ego structures (pressure/opportunity zone). Simultaneously, Pluto trining his Gemini Ascendant is empowering his voice and ability to communicate transformative ideas with authority (opportunity zone).

#### Suggested Messaging Tone
Respectful, thoughtful, and authentic. Appeal to his intellect and inner wisdom, giving him ample space to process. Avoid superficiality and high-pressure tactics; focus on substance and long-term vision.

#### Shadow → Activated State
*   **Shadow:** Controlling or Micromanaging (from a deep fear of fumbling his grand vision).
*   **Activated State:** Empowered Trustee (confidently delegating and trusting the process and others to co-create).

### What To Do With Them (CRM)

#### Opportunity Level
Neutral

#### Best Way to Influence / Motivate
Appeal to his legacy. Present well-researched, logical strategies that solve a complex problem or offer a clear path to greater mastery. Show him precisely how your proposal aligns with his deepest spiritual principles and practical ambitions.

#### Relationship Growth Path
Focus on building trust through intellectual respect and unwavering consistency. Engage in deep conversations about strategy, philosophy, and spirituality. Provide stability and demonstrate competence, proving you are a reliable pillar for his long-term vision.

#### 'Do' and 'Do Not' Approaches
*   **DO:** Give him space for reflection.
*   **DO:** Acknowledge his strategic mind.
*   **DO:** Speak with depth and authenticity.
*   **DON'T:** Rush him into decisions.
*   **DON'T:** Rely on emotional appeals.
*   **DON'T:** Challenge his authority directly; instead, present alternative data for his consideration.

#### Timing Recommendations
Plant conceptual seeds now for action in his next personal year. Present thoughtful proposals this month, but frame them as ideas for consideration. Suggest revisiting for a firm decision in 2-3 months to allow for his necessary internal processing.
`;
          updateDoc(userDocRef, { frequencyReport: report }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
        }

        // If userData isn't set but we have it in profile, sync it
        if (!userData && data.name && data.birthDate) {
          saveUserData({ name: data.name, birthDate: data.birthDate });
        }
      } else {
        // Initialize new user profile
        const newProfile: UserProfile = {
          ...INITIAL_PROFILE,
          uid: user.uid,
          name: user.displayName || 'Seeker',
          avatar: user.photoURL || '',
          role: user.email === 'righteousravlatchman@gmail.com' ? 'admin' : 'user',
          frequencyReport: user.email === 'righteousravlatchman@gmail.com' ? `
# Frequency Report: Ravikiran Daniel Latchman
## The Visionary Architect
**Avatar:** Royal Purple, representing the integration of spiritual wisdom (Pisces Sun) with earthly authority and material manifestation (Life Path 8 and Expression 22).

### Why They Are Like This

#### Life Path Story
His life is a journey of mastering personal power and the flow of abundance, learning to balance material ambition with spiritual understanding. He is here to build lasting structures of impact, often overcoming significant challenges to step into his innate authority.

#### Moon Story (Emotional Strategy)
With his Moon in Sagittarius, he processes emotions through a lens of optimism, philosophy, and a need for freedom. Rather than dwelling in difficult feelings, he seeks a higher meaning or a new adventure, sometimes intellectualizing his emotions to maintain a sense of forward momentum.

#### Expression Number Behavior
He operates as a 'Master Builder' (Expression 22/4), driven by a powerful and practical need to turn grand, inspired visions into tangible reality. This manifests as a disciplined, systematic, and often relentless approach to achieving his goals.

#### Attachment & Trust Style
A Fearful-Avoidant pattern is likely. He desires deep, soulful connection (Pisces) but has an equally strong need for freedom and autonomy (Sagittarius Moon), sometimes creating distance when he feels his personal power or independence is threatened.

### Their Energetic Weather

#### Personal Cycle
He is in a 7 Personal Year, a cycle demanding introspection, analysis, and spiritual recalibration, amplifying his Pisces Sun's reflective nature. In his current 4 Personal Month, he is being pushed to ground these deep insights by focusing on diligent work, creating structure, and managing practical details.

#### Major Transits / Zones
Saturn and Neptune are both transiting his natal Pisces Sun, creating a powerful 'pressure cooker' for spiritual maturation, reality checks, and dissolving old ego structures (pressure/opportunity zone). Simultaneously, Pluto trining his Gemini Ascendant is empowering his voice and ability to communicate transformative ideas with authority (opportunity zone).

#### Suggested Messaging Tone
Respectful, thoughtful, and authentic. Appeal to his intellect and inner wisdom, giving him ample space to process. Avoid superficiality and high-pressure tactics; focus on substance and long-term vision.

#### Shadow → Activated State
*   **Shadow:** Controlling or Micromanaging (from a deep fear of fumbling his grand vision).
*   **Activated State:** Empowered Trustee (confidently delegating and trusting the process and others to co-create).

### What To Do With Them (CRM)

#### Opportunity Level
Neutral

#### Best Way to Influence / Motivate
Appeal to his legacy. Present well-researched, logical strategies that solve a complex problem or offer a clear path to greater mastery. Show him precisely how your proposal aligns with his deepest spiritual principles and practical ambitions.

#### Relationship Growth Path
Focus on building trust through intellectual respect and unwavering consistency. Engage in deep conversations about strategy, philosophy, and spirituality. Provide stability and demonstrate competence, proving you are a reliable pillar for his long-term vision.

#### 'Do' and 'Do Not' Approaches
*   **DO:** Give him space for reflection.
*   **DO:** Acknowledge his strategic mind.
*   **DO:** Speak with depth and authenticity.
*   **DON'T:** Rush him into decisions.
*   **DON'T:** Rely on emotional appeals.
*   **DON'T:** Challenge his authority directly; instead, present alternative data for his consideration.

#### Timing Recommendations
Plant conceptual seeds now for action in his next personal year. Present thoughtful proposals this month, but frame them as ideas for consideration. Suggest revisiting for a firm decision in 2-3 months to allow for his necessary internal processing.
          ` : undefined,
          updatedAt: new Date().toISOString()
        };
        setDoc(userDocRef, newProfile).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    // Listen to insights subcollection
    const insightsRef = collection(db, 'users', user.uid, 'insights');
    const qInsights = query(insightsRef, orderBy('timestamp', 'desc'));
    const unsubscribeInsights = onSnapshot(qInsights, (snapshot) => {
      const insights = snapshot.docs.map(d => d.data() as SavedInsight);
      setProfile(prev => ({ ...prev, savedInsights: insights }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/insights`));

    // Listen to listening history
    const historyRef = collection(db, 'listeningHistory');
    const qHistory = profile.role === 'admin'
      ? query(historyRef, orderBy('timestamp', 'desc'), limit(100))
      : query(historyRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(100));

    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      const history = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as ListeningEvent));
      setListeningHistory(history);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'listeningHistory'));

    // Listen to playlists
    const playlistsRef = collection(db, 'playlists');
    const qPlaylists = profile.role === 'admin'
      ? query(playlistsRef, orderBy('createdAt', 'desc'))
      : query(playlistsRef, where('isPublic', '==', true)); // Non-admins see public playlists

    const unsubscribePlaylists = onSnapshot(qPlaylists, (snapshot) => {
      const allPlaylists = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
      setPlaylists(allPlaylists);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'playlists'));

    return () => {
      unsubscribeProfile();
      unsubscribeInsights();
      unsubscribeHistory();
      unsubscribePlaylists();
    };
  }, [user, userData]);

  // Record Listening Event
  const recordListeningEvent = useCallback(async (trackId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'listeningHistory'), {
        userId: user.uid,
        trackId,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error recording listening event:", error);
    }
  }, [user]);

  // Track listening events when current track changes
  useEffect(() => {
    if (currentTrack) {
      recordListeningEvent(currentTrack.id);
    }
  }, [currentTrack?.id, recordListeningEvent]);

  // Playlist Management
  const handleCreatePlaylist = useCallback(async (title: string, isPublic: boolean) => {
    if (!user) return;
    try {
      const newPlaylist: Omit<Playlist, 'id'> = {
        userId: user.uid,
        title,
        trackIds: [],
        isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'playlists'), newPlaylist);
      showToast('Playlist created successfully', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'playlists');
    }
  }, [user, showToast]);

  const handleDeletePlaylist = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'playlists', id));
      showToast('Playlist deleted', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `playlists/${id}`);
    }
  }, [showToast]);

  const handleUpdatePlaylist = useCallback(async (id: string, updates: Partial<Playlist>) => {
    try {
      await updateDoc(doc(db, 'playlists', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `playlists/${id}`);
    }
  }, []);

  const handleAddToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    if (playlist.trackIds.includes(trackId)) {
      showToast('Track already in playlist', 'info');
      return;
    }

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        trackIds: [...playlist.trackIds, trackId],
        updatedAt: new Date().toISOString()
      });
      showToast('Track added to playlist', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  }, [playlists, showToast]);

  const handleRemoveFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        trackIds: playlist.trackIds.filter(id => id !== trackId),
        updatedAt: new Date().toISOString()
      });
      showToast('Track removed from playlist', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  }, [playlists, showToast]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in!', 'success');
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleAddToCart = (product: Product, size?: string, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
      );

      if (existing) {
        return prev.map(item => 
          item.id === product.id && 
          item.selectedSize === size && 
          item.selectedColor === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    showToast('Artifact added to collection', 'success');
  };

  const handleRemoveFromCart = (productId: string, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && 
        item.selectedSize === size && 
        item.selectedColor === color)
    ));
  };

  const handleUpdateCartQuantity = (productId: string, delta: number, size?: string, color?: string) => {
    setCart(prev => prev.map(item => 
      item.id === productId && 
      item.selectedSize === size && 
      item.selectedColor === color
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const handleCheckout = () => {
    showToast('Transaction protocol initiated...', 'info');
    setTimeout(() => {
      setCart([]);
      setIsCartOpen(false);
      showToast('Artifacts secured. Check your email for frequency codes.', 'success');
    }, 2000);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      showToast('Signed out successfully');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const {
    isPlaying,
    isLoading,
    error: audioError,
    currentTime,
    duration,
    volume,
    analyser,
    audio,
    togglePlay,
    playTrack,
    seek,
    updateVolume,
    audioRef
  } = useAudioPlayer();

  const handleTrackSelect = useCallback((track: Track) => {
    if (!track.mediaUrl) {
      showToast('This track has no audio source.', 'error');
      return;
    }
    setCurrentTrack(track);
    playTrack(track.mediaUrl);
    setActiveTab('player');
  }, [playTrack, showToast]);

  const toggleFavorite = async (trackId: string) => {
    if (!user) {
      handleSignIn();
      return;
    }

    const newLikedIds = (profile.likedTrackIds || []).includes(trackId)
      ? profile.likedTrackIds.filter(id => id !== trackId)
      : [...(profile.likedTrackIds || []), trackId];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        likedTrackIds: newLikedIds,
        updatedAt: new Date().toISOString()
      });
      showToast((profile.likedTrackIds || []).includes(trackId) ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const saveInsight = async (track: Track, content: string) => {
    if (!user) {
      handleSignIn();
      return;
    }

    const insightId = Math.random().toString(36).substr(2, 9);
    const newInsight: SavedInsight = {
      id: insightId,
      trackId: track.id,
      trackTitle: track.title,
      content,
      timestamp: Date.now()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'insights', insightId), {
        ...newInsight,
        uid: user.uid
      });
      showToast('Insight saved to profile', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/insights/${insightId}`);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      showToast('Profile updated', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const toggleTheme = () => {
    const newTheme = profile.settings.theme === 'light' ? 'gold' : 'light';
    updateProfile({
      settings: {
        ...profile.settings,
        theme: newTheme
      }
    });
  };

  const handleIntakeComplete = (data: { name: string; birthDate: string }) => {
    saveUserData(data);
    if (user) {
      updateProfile({ name: data.name, ...data } as any);
    }
  };

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handleTrackSelect(tracks[prevIndex]);
  }, [currentTrack.id, handleTrackSelect, tracks]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handleTrackSelect(tracks[nextIndex]);
  }, [currentTrack.id, handleTrackSelect, tracks]);

  useEffect(() => {
    if (!audio) return;
    
    const onEnded = () => handleNext();
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [handleNext, audio]);

  const generateTrackInsight = async () => {
    if (isGeneratingInsight) return;
    setIsGeneratingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY! });
      const response = await (ai as any).models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As a music philosopher, psychologist (Jungian), and numerologist (GG33), provide a deep, poetic 2-sentence insight into an AI-generated track titled "${currentTrack.title}" from the project "Fairway Dreams". 
        Incorporate insights from philosophers like Dolores Cannon, Carl Jung, the Monroe Institute, Nostradamus, and Mystic Rebels Astrology where appropriate. 
        Mention its vibe: ${currentTrack.genre.join(', ')}. Focus on consciousness and frequency.`,
      });
      setInsight(response.text || "The frequency resonates with the hidden geometry of the soul.");
    } catch (error) {
      console.error(error);
      setInsight("A digital echo of consciousness, vibrating at the frequency of pure potential.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  useEffect(() => {
    setInsight(null);
  }, [currentTrack]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          if (e.shiftKey) {
            handlePrev();
          } else {
            seek(Math.max(0, currentTime - 5));
          }
          break;
        case 'arrowright':
          if (e.shiftKey) {
            handleNext();
          } else {
            seek(Math.min(duration, currentTime + 5));
          }
          break;
        case 'm':
          updateVolume(volume === 0 ? 0.8 : 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handlePrev, handleNext, seek, currentTime, duration, volume, updateVolume]);

  return (
    <div 
      className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] selection:bg-gold/30 selection:text-gold relative"
      style={{
        '--primary': activeTheme.primary,
        '--secondary': activeTheme.secondary,
        '--accent': activeTheme.accent,
        '--glow': activeTheme.glow,
      } as React.CSSProperties}
    >
      <MilitaryDroneBackground />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[70] bg-[var(--header-bg)]/80 backdrop-blur-xl border-b border-[var(--panel-border)]">
        <div className="absolute bottom-0 left-0 w-full flex gap-0.5 h-0.5 items-end opacity-20">
          {Array.from({ length: 150 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [0.5, 2, 1, 1.5, 0.5] }}
              transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: i * 0.03 }}
              className="flex-1 bg-gold"
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between relative z-10">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="relative">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl gold-gradient flex items-center justify-center text-black shadow-lg shadow-gold/20 group-hover:scale-110 transition-transform relative z-10">
                <Drone size={16} />
              </div>
              
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 h-2 items-end opacity-0 group-hover:opacity-50 transition-opacity">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [2, 8, 4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    className="w-0.5 bg-gold rounded-full"
                  />
                ))}
              </div>
            </div>
            <span className="font-display text-sm md:text-lg text-[var(--text-primary)] tracking-[0.2em] uppercase">Fairway Dreams</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 overflow-x-auto custom-scrollbar pb-2 pt-2">
            {['home', 'player', 'live', 'store', 'oracle', 'personnel', 'music', 'artists', 'about', 'tools', 'mission', 'circle', 'licensing', 'faq', ...(profile.role === 'admin' ? ['admin', 'crm'] : [])].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative text-[9px] uppercase tracking-[0.2em] transition-all hover:text-gold group/tab ${
                  activeTab === tab ? 'text-gold' : 'text-[var(--text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--panel-bg)] text-[var(--text-secondary)] transition-colors"
              title={profile.settings.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {profile.settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">{profile.name}</span>
                  {profile.hebrewName && (
                    <span className="text-[9px] font-display text-gold/60 uppercase tracking-widest">{profile.hebrewName}</span>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-8 h-8 rounded-full border border-gold/30 overflow-hidden hover:scale-110 transition-transform"
                >
                  <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} alt="Profile" className="w-full h-full object-cover" />
                </button>
                <button onClick={handleSignOut} className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-colors">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gold hover:text-[var(--text-primary)] transition-colors"
              >
                <LogIn size={14} /> Sign In
              </button>
            )}

            <button 
              onClick={() => setActiveTab('join')}
              className="relative px-6 py-2 rounded-full gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-gold/20 transition-all group/join"
            >
              Join Circle
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--panel-bg)] text-[var(--text-secondary)] transition-colors"
            >
              {profile.settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="text-[var(--text-secondary)]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Global Announcement */}
      <AnimatePresence>
        {systemConfig?.announcement?.active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`relative z-30 border-b overflow-hidden ${
              systemConfig.announcement.type === 'warning' ? 'bg-orange-500/20 border-orange-500/30 text-orange-200' :
              systemConfig.announcement.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' :
              'bg-gold/10 border-gold/20 text-gold'
            }`}
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold">
              <Megaphone size={14} />
              <span>{systemConfig.announcement.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-[var(--bg-color)] pt-24 px-8 md:hidden overflow-y-auto"
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none flex gap-1 items-end">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [10, 300, 50, 200, 10] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                  className="flex-1 bg-gold"
                />
              ))}
            </div>
            
            <div className="flex flex-col gap-2 relative z-10 pb-20">
              {[
                { id: 'home', name: 'Home', icon: <Layout size={20} /> },
                { id: 'player', name: 'Player', icon: <Play size={20} /> },
                { id: 'oracle', name: 'Quantum Oracle', icon: <Sparkles size={20} /> },
                { id: 'personnel', name: 'Personnel', icon: <Users size={20} /> },
                { id: 'live', name: 'Live Stage', icon: <Radio size={20} className="text-red-500 animate-pulse" /> },
                { id: 'store', name: 'Artifact Store', icon: <ShoppingBag size={20} /> },
                { id: 'music', name: 'Signals', icon: <Radio size={20} /> },
                { id: 'artists', name: 'Artists', icon: <Star size={20} /> },
                { id: 'tools', name: 'Frequency Tools', icon: <Compass size={20} /> },
                { id: 'mission', name: 'Mission Control', icon: <Shield size={20} /> },
                { id: 'circle', name: 'Community', icon: <Users size={20} /> },
                { id: 'profile', name: 'My Profile', icon: <UserIcon size={20} /> },
                { id: 'about', name: 'The Vision', icon: <Info size={20} /> },
                { id: 'licensing', name: 'Licensing', icon: <FileText size={20} /> },
                { id: 'faq', name: 'Support', icon: <HelpCircle size={20} /> },
                ...(profile.role === 'admin' ? [
                  { id: 'admin', name: 'Admin Panel', icon: <Settings size={20} /> },
                  { id: 'crm', name: 'CRM', icon: <Users size={20} /> }
                ] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    activeTab === tab.id 
                    ? 'bg-gold/10 text-gold border border-gold/20' 
                    : 'text-zinc-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`${activeTab === tab.id ? 'text-gold' : 'text-zinc-500'}`}>
                    {tab.icon}
                  </div>
                  <span className="text-sm font-display uppercase tracking-widest">{tab.name}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTabMobile" className="ml-auto">
                      <ChevronRight size={16} />
                    </motion.div>
                  )}
                </button>
              ))}
              
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                {user ? (
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="text-sm font-display uppercase tracking-widest">Sign Out</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleSignIn}
                    className="flex items-center gap-4 p-4 rounded-2xl text-gold hover:bg-gold/10 transition-all"
                  >
                    <LogIn size={20} />
                    <span className="text-sm font-display uppercase tracking-widest">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-16 md:pt-20 pb-24 md:pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Hero Section */}
              <section className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col items-center justify-center text-center section-padding overflow-hidden">
                <motion.div 
                  style={{ y: heroY, opacity: heroOpacity }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(201,168,76,0.15),transparent_60%)]" 
                />
                
                {/* Ambient glowing orbs */}
                <motion.div 
                  className="absolute top-[20%] left-[20%] w-64 h-64 bg-gold/10 rounded-full blur-[100px]"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-zinc-700/20 rounded-full blur-[120px]"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ y: heroY }}
                  transition={{ duration: 1 }}
                  className="relative z-10 w-full"
                >
                  <img 
                    src="https://cdn2.suno.ai/30a77b97-fefe-42e9-bac2-64928fd1fec9.jpeg" 
                    alt="Avatar" 
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 border-gold mx-auto mb-6 md:mb-8 shadow-2xl shadow-gold/20 hover-zoom"
                  />
                  <p className="text-[var(--text-primary)] text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-4">AI-Generated Music · Suno · @fairwaydreams</p>
                  <h1 className="font-display text-responsive-h1 tracking-tighter mb-4 md:mb-6 bg-gradient-to-b from-[var(--text-primary)] to-zinc-500 bg-clip-text text-transparent px-4">
                    FAIRWAY DREAMS
                  </h1>
                  <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs md:text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em] max-w-2xl mx-auto mb-8 md:mb-12 px-6">
                    Where Consciousness Meets Sound
                  </p>

                  {/* Hero Signal Bars */}
                  <div className="flex justify-center gap-0.5 sm:gap-1 h-8 sm:h-12 items-end mb-8 md:mb-12 opacity-30">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: [8, 40, 15, 30, 8],
                        }}
                        transition={{ 
                          duration: 1 + Math.random(), 
                          repeat: Infinity,
                          delay: i * 0.05 
                        }}
                        className="w-1 sm:w-1.5 bg-gold rounded-full"
                      />
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-8 sm:px-0">
                    <button 
                      onClick={() => setActiveTab('player')}
                      className="w-full sm:w-auto px-10 py-4 rounded-full gold-gradient text-black text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold/10"
                    >
                      Enter Studio
                    </button>
                    <a 
                      href="https://suno.com/@fairwaydreams" 
                      target="_blank"
                      className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-center"
                    >
                      Suno Profile
                    </a>
                  </div>
                </motion.div>

                {/* Stats */}
                <motion.div 
                  style={{ y: statsY }}
                  className="absolute bottom-8 md:bottom-12 left-0 right-0 flex justify-center gap-8 sm:gap-12 md:gap-24"
                >
                  {[
                    { label: 'Plays', value: '26K+' },
                    { label: 'Tracks', value: '373' },
                    { label: 'Followers', value: '68' }
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <span className="block font-display text-lg sm:text-xl md:text-2xl text-gold mb-1">{stat.value}</span>
                      <span className="text-[7px] sm:text-[8px] uppercase tracking-widest text-zinc-600">{stat.label}</span>
                    </div>
                  ))}
                </motion.div>
              </section>
            </motion.div>
          )}

          {activeTab === 'player' && (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Player 
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                analyser={analyser}
                settings={vizSettings}
                theme={activeTheme}
                themeName={vizSettings.themeName}
                isFavorite={(profile.likedTrackIds || []).includes(currentTrack.id)}
                playlists={playlists.filter(p => p.userId === user?.uid || profile.role === 'admin')}
                onTogglePlay={() => togglePlay(currentTrack.mediaUrl)}
                onPrev={handlePrev}
                onNext={handleNext}
                onSeek={seek}
                onVolumeChange={updateVolume}
                onAddToPlaylist={handleAddToPlaylist}
                onSettingsChange={(s) => {
                  setVizSettings(s);
                  updateProfile({ settings: { ...profile.settings, vizSettings: s } });
                }}
                onThemeChange={(t) => {
                  const theme = THEMES[t as keyof typeof THEMES];
                  setActiveTheme(theme);
                  setVizSettings(prev => ({ ...prev, themeName: t }));
                  updateProfile({ settings: { ...profile.settings, theme: t } });
                }}
                onToggleFavorite={toggleFavorite}
                onGenerateInsight={generateTrackInsight}
                onSaveInsight={saveInsight}
                onClearInsight={() => setInsight(null)}
                currentInsight={insight}
                isGeneratingInsight={isGeneratingInsight}
                isLoading={isLoading}
                error={audioError}
              />

              <TrackList 
                tracks={tracks}
                currentTrackId={currentTrack.id}
                likedTrackIds={profile.likedTrackIds || []}
                playlists={playlists.filter(p => p.userId === user?.uid || profile.role === 'admin')}
                onSelect={handleTrackSelect}
                onToggleFavorite={toggleFavorite}
                onAddToPlaylist={handleAddToPlaylist}
              />
            </motion.div>
          )}

          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container-max section-padding"
            >
              <LiveStage 
                currentTrack={currentTrack} 
                user={user} 
                profile={profile}
                onSaveRiff={(midi, note) => saveRiff({ name: note || 'Live Riff', category: 'Live', midiData: midi, annotation: note })}
              />
            </motion.div>
          )}

          {activeTab === 'store' && (
            <motion.div 
              key="store" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <MerchStore 
                theme={activeTheme}
                cart={cart}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onOpenCart={() => setIsCartOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'crm' && (
            <motion.div key="crm-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-6 py-12">
              <CRMTool />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProfileView 
                profile={profile}
                playlists={playlists}
                listeningHistory={listeningHistory}
                onUpdateProfile={updateProfile}
                onSelectTrack={(track) => {
                  handleTrackSelect(track);
                  setActiveTab('player');
                }}
                onCreatePlaylist={handleCreatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onUpdatePlaylist={handleUpdatePlaylist}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                tracks={tracks}
              />
            </motion.div>
          )}

          {activeTab === 'oracle' && (
            <motion.div key="oracle-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-6 py-12">
              <QuantumOracle />
            </motion.div>
          )}

          {activeTab === 'personnel' && (
            <motion.div key="personnel-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-6 py-12">
              <PersonnelTool />
            </motion.div>
          )}

          {activeTab === 'music' && (
            <motion.div
              key="music"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container-max section-padding"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16">
                <div>
                  <p className="text-gold text-[8px] sm:text-[10px] uppercase tracking-[0.5em] mb-2 sm:mb-4">Full Catalog</p>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] tracking-widest">The Collections</h2>
                  <div className="h-px w-16 sm:w-24 gold-gradient mt-3 sm:mt-4" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Search signals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 sm:px-6 py-3 sm:py-4 md:py-3 text-sm text-white outline-none focus:border-gold transition-all"
                    />
                  </div>
                  <select 
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 sm:px-6 py-3 sm:py-4 md:py-3 text-sm text-zinc-400 outline-none focus:border-gold transition-all"
                  >
                    {['All', ...Array.from(new Set(tracks.flatMap(t => t.genre)))].map(genre => (
                      <option key={genre} value={genre} className="bg-[var(--bg-color)] text-[var(--text-primary)]">{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {tracks.filter(track => {
                  const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      track.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchesGenre = selectedGenre === 'All' || track.genre.includes(selectedGenre);
                  return matchesSearch && matchesGenre;
                }).length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-zinc-500 uppercase tracking-[0.3em] mb-4">No signals found matching your criteria</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                      className="text-gold text-[10px] uppercase tracking-widest border-b border-gold/30 pb-1"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  tracks.filter(track => {
                    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        track.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesGenre = selectedGenre === 'All' || track.genre.includes(selectedGenre);
                    return matchesSearch && matchesGenre;
                  }).map((track) => (
                    <motion.div
                      key={track.id}
                      whileHover={{ y: -10 }}
                      className="group glass-panel rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => handleTrackSelect(track)}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img src={track.art || '/src/assets/images/default_cover_1779345608057.png'} alt={track.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold/50 flex items-center justify-center backdrop-blur-sm">
                            <Play size={20} className="text-gold fill-gold ml-1" />
                          </div>
                          <span className="px-6 py-2 rounded-full border border-gold text-gold text-[10px] uppercase tracking-widest bg-black/40">Play Now</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-display text-sm text-[var(--text-primary)] tracking-widest truncate">{track.title}</h3>
                          <a 
                            href={track.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-gold/20 text-zinc-500 hover:text-gold transition-colors"
                            title="Open on Suno"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">{track.genre.join(' · ')}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gold text-[10px] uppercase tracking-widest">
                            Explore <ChevronRight size={12} className="ml-1" />
                          </div>
                          
                          <div className="flex gap-0.5 h-3 items-end opacity-20">
                            {[1, 2, 3, 4].map(i => (
                              <motion.div
                                key={i}
                                animate={{ height: [2, 12, 4, 8, 2] }}
                                transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: i * 0.1 }}
                                className="w-0.5 bg-gold rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto section-padding"
            >
              <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-24">
                <div>
                  <p className="text-gold text-[8px] sm:text-[10px] uppercase tracking-[0.5em] mb-4">The Vision</p>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] tracking-widest mb-6 md:mb-8">Sound as Intelligence</h2>
                  <div className="space-y-4 md:space-y-6 text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
                    <p>Fairway Dreams is an <span className="text-gold">AI music project</span> operating at the intersection of consciousness, frequency, and collective intelligence. Every track is intentionally composed — not randomly generated.</p>
                    <p>Built on the <span className="text-gold">GG33 numerology system</span>, the analytical depth of <span className="text-gold">Carl Jung</span>, and the metaphysical pioneering of <span className="text-gold">Dolores Cannon</span>. The music carries vibrational codes: Life Path frequencies, archetypal resonances, and insights from the <span className="text-gold">Monroe Institute</span> embedded into melody and rhythm.</p>
                    <p>By synthesizing the prophetic visions of <span className="text-gold">Nostradamus</span> with the precision of <span className="text-gold">Mystic Rebels Astrology</span>, Fairway Dreams creates a unique sonic fingerprint. From <span className="text-gold">SPI Physics anthems</span> to the sprawling universe of <span className="text-gold">The Book of Rav</span> — 26,000+ plays and counting. Every song is a signal.</p>
                  </div>

                  <div className="mt-8 flex gap-1 h-6 items-end opacity-20">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 24, 8, 16, 4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1 bg-gold rounded-full"
                      />
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 border border-gold/20 rounded-2xl" />
                  <img src="https://cdn2.suno.ai/30a77b97-fefe-42e9-bac2-64928fd1fec9.jpeg" alt="About" className="relative rounded-xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: <Sparkles />, title: 'Multi-Dimensional Coding', desc: 'Every release channels GG33 frameworks, Jungian archetypes, and Dolores Cannon\'s metaphysical teachings.' },
                  { icon: <Info />, title: 'Ancient & Modern', desc: 'Synthesizing Nostradamus\'s prophecy with Monroe Institute focus levels and Mystic Rebels Astrology.' },
                  { icon: <ShieldCheck />, title: 'AI-Native', desc: 'Fully created on Suno — Fairway Dreams is a pioneer of intentional AI music, coded for conscious evolution.' }
                ].map(item => (
                  <div key={item.title} className="glass-panel p-8 rounded-2xl group">
                    <div className="text-gold mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <h4 className="font-display text-sm text-white tracking-widest mb-3">{item.title}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-6">{item.desc}</p>
                    
                    <div className="flex gap-0.5 h-1 items-end opacity-10 group-hover:opacity-30 transition-opacity">
                      {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [1, 4, 2, 3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="flex-1 bg-gold rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container-max section-padding"
            >
              <div className="mb-10 md:mb-16">
                <p className="text-gold text-[8px] sm:text-[10px] uppercase tracking-[0.5em] mb-2 sm:mb-4">Interactive Alignment Systems</p>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] tracking-widest">Frequency Tools</h2>
                <div className="h-px w-16 sm:w-24 gold-gradient mt-3 sm:mt-4" />

                <div className="mt-6 md:mt-8 flex flex-wrap gap-3 sm:gap-4 md:gap-8 border-b border-white/5 pb-4">
                  {[
                    { id: 'mission', name: 'Mission Control' },
                    { id: 'report', name: 'Detailed Report' },
                    { id: 'astrology', name: 'Astrology' },
                    { id: 'numerology', name: 'Numerology' },
                    { id: 'chinese', name: 'Chinese' },
                    { id: 'letterology', name: 'Letterology' },
                    { id: 'gematria', name: 'Gematria' },
                    { id: 'jeopardy', name: 'Jeopardy' },
                    { id: 'tuner', name: 'Freq Tuner' },
                    { id: 'riff-library', name: 'Riff Library' },
                    { id: 'journal', name: 'Intention Coder' },
                    { id: 'external', name: 'Quantum App' }
                  ].map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`text-[10px] uppercase tracking-widest transition-all ${
                        activeTool === tool.id ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {!userData && !['tuner', 'journal'].includes(activeTool) ? (
                <UnifiedIntake onComplete={handleIntakeComplete} />
              ) : (
                <AnimatePresence mode="wait">
                  {activeTool === 'mission' && (
                    <motion.div key="mission" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <MissionControl userData={userData!} />
                    </motion.div>
                  )}
                  {activeTool === 'report' && (
                    <motion.div key="report" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <FrequencyReport userData={userData!} />
                    </motion.div>
                  )}
                  {activeTool === 'astrology' && (
                    <motion.div key="astrology" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <AstrologyTool userData={userData!} onReset={() => saveUserData(null)} />
                    </motion.div>
                  )}
                  {activeTool === 'numerology' && (
                    <motion.div key="numerology" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <NumerologyTool 
                        userData={userData!} 
                        onReset={() => saveUserData(null)} 
                        tracks={tracks}
                      />
                    </motion.div>
                  )}
                  {activeTool === 'chinese' && (
                    <motion.div key="chinese" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <ChineseAstrologyTool userData={userData!} onReset={() => saveUserData(null)} />
                    </motion.div>
                  )}
                  {activeTool === 'letterology' && (
                    <motion.div key="letterology" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <LetterologyTool userData={userData!} onReset={() => saveUserData(null)} />
                    </motion.div>
                  )}
                  {activeTool === 'gematria' && (
                    <motion.div key="gematria" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <GematriaTool userData={userData!} onReset={() => saveUserData(null)} />
                    </motion.div>
                  )}
                  {activeTool === 'jeopardy' && (
                    <motion.div key="jeopardy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <JeopardyTool userData={userData!} onReset={() => saveUserData(null)} />
                    </motion.div>
                  )}
                  {activeTool === 'tuner' && (
                    <motion.div key="tuner" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <FrequencyTuner />
                    </motion.div>
                  )}
                  {activeTool === 'riff-library' && (
                    <motion.div key="riff-library" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <RiffLibrary 
                        riffs={riffs}
                        onSaveRiff={saveRiff}
                        onDeleteRiff={deleteRiff}
                        onShareRiff={(midi, annotation) => {
                          showToast("Go to Live Stage tab to share riffs!");
                        }}
                      />
                    </motion.div>
                  )}
                  {activeTool === 'journal' && (
                    <motion.div key="journal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <ManifestationJournal />
                    </motion.div>
                  )}
                  {activeTool === 'external' && (
                    <motion.div key="external" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-white/10 bg-black">
                        <iframe 
                          src={externalAppUrl}
                          className="w-full h-full border-none"
                          title="Quantum App Integration"
                          allow="camera; microphone; geolocation"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {activeTab === 'mission' && (
            <motion.div
              key="mission-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 py-12"
            >
              {!userData ? (
                <UnifiedIntake onComplete={handleIntakeComplete} />
              ) : (
                <MissionControl userData={userData} />
              )}
            </motion.div>
          )}

          {activeTab === 'circle' && (
            <motion.div
              key="circle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CommunityCircle />
            </motion.div>
          )}

          {activeTab === 'licensing' && (
            <motion.div
              key="licensing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto px-6 py-12"
            >
              <div className="text-center mb-16">
                <p className="text-gold text-[10px] uppercase tracking-[0.5em] mb-4">Commercial Use</p>
                <h2 className="font-display text-4xl text-[var(--text-primary)] tracking-widest mb-6">License the Signal</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm">Elevate your content, brand, or course with consciousness-coded AI music. All licenses include full commercial rights.</p>
                
                <div className="mt-8 flex justify-center gap-1 h-4 items-end opacity-10">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 16, 6, 12, 4] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                      className="w-0.5 bg-gold rounded-full"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { tier: 'Creator', price: '$26', features: ['1 Track License', 'Online Content Use', 'Up to 100K Views', 'Attribution Required'] },
                  { tier: 'Professional', price: '$80', features: ['1 Track License', 'Unlimited Views', 'Course & Brand Use', 'No Attribution Required'], featured: true },
                  { tier: 'Enterprise', price: 'Custom', features: ['Full Catalog Access', 'Broadcast & Sync', 'White-Label Option', 'Priority Support'] }
                ].map(plan => (
                  <div key={plan.tier} className={`relative glass-panel p-10 rounded-3xl border ${plan.featured ? 'border-gold/50 shadow-2xl shadow-gold/5' : 'border-white/5'}`}>
                    {plan.featured && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full gold-gradient text-[8px] font-bold text-black uppercase tracking-widest">Most Popular</span>}
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-4">{plan.tier}</p>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="font-display text-4xl text-[var(--text-primary)]">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest">/track</span>}
                    </div>
                    <ul className="space-y-4 mb-10">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                          <ShieldCheck size={14} className="text-gold" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${plan.featured ? 'gold-gradient text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                      Get License
                    </button>
                    
                    <div className="mt-8 flex gap-0.5 h-1 items-end opacity-5">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [1, 4, 2, 3, 1] }}
                          transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.05 }}
                          className="flex-1 bg-gold"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <LicensingCalculator />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto px-6 py-12"
            >
              <ToolGuide />
            </motion.div>
          )}

          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-6 py-12"
            >
              <div className="mb-16">
                <p className="text-gold text-[10px] uppercase tracking-[0.5em] mb-4">Knowledge Base</p>
                <h2 className="font-display text-4xl text-[var(--text-primary)] tracking-widest">Frequency FAQ</h2>
                <div className="h-px w-24 gold-gradient mt-4" />
              </div>
              <div className="space-y-4">
                {[
                  { q: 'What is Fairway Dreams?', a: 'A multi-dimensional AI music project exploring consciousness via numerology (GG33), psychology (Jung), metaphysics (Dolores Cannon), and celestial guidance (Mystic Rebels).' },
                  { q: 'How is the music created?', a: 'Using Suno AI with intentional prompts based on GG33 frameworks, Monroe Institute Hemi-Sync concepts, and astrological alignments.' },
                  { q: 'What are the influences?', a: 'The system is built on GG33, Dolores Cannon, Carl Jung, the Monroe Institute, Nostradamus, and Mystic Rebels Astrology.' }
                ].map((item, i) => (
                  <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 hover-zoom">
                    <h4 className="text-[var(--text-primary)] font-bold text-sm mb-2 uppercase tracking-wide">{item.q}</h4>
                    <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'artists' && (
            <motion.div
              key="artists"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ArtistsView onSelectTrack={handleTrackSelect} />
            </motion.div>
          )}

          {activeTab === 'admin' && profile.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard />
            </motion.div>
          )}

          {activeTab === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 md:px-6 py-12"
            >
              <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden hover-zoom transition-transform duration-500">
                <div className="absolute top-0 left-0 w-full h-1 gold-gradient" />
                <p className="text-gold text-[10px] uppercase tracking-[0.5em] mb-6">Inner Circle</p>
                <h2 className="font-display text-3xl md:text-6xl text-[var(--text-primary)] tracking-widest mb-6 md:mb-8">Get Exclusive Drops</h2>
                <p className="text-[var(--text-secondary)] text-sm md:text-lg mb-8 md:mb-12 max-w-xl mx-auto leading-relaxed">
                  New music, unreleased tracks, licensing deals, and consciousness-coded content — delivered directly to your inbox.
                </p>

                <div className="absolute bottom-0 left-0 w-full flex gap-1 h-32 items-end opacity-5 pointer-events-none">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [10, 120, 40, 80, 10] }}
                      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: i * 0.05 }}
                      className="flex-1 bg-gold"
                    />
                  ))}
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto relative z-10">
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 outline-none focus:border-gold transition-colors"
                  />
                  <button className="px-8 py-4 rounded-2xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] hover:shadow-lg hover:shadow-gold/20 transition-all">
                    Join Now
                  </button>
                </div>
              </div>

              <div className="mt-24 grid md:grid-cols-2 gap-12">
                <div>
                  <h4 className="font-display text-xl text-[var(--text-primary)] tracking-widest mb-8">Contact Studio</h4>
                  <div className="space-y-6 mb-12">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-white/5 text-gold"><Mail size={20} /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Email</p>
                        <p className="text-[var(--text-secondary)]">studio@fairwaydreams.ai</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-white/5 text-gold"><Drone size={20} /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Suno</p>
                        <p className="text-[var(--text-secondary)]">suno.com/@fairwaydreams</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 h-3 items-end opacity-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [2, 12, 4, 8, 2] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-gold rounded-full"
                      />
                    ))}
                  </div>
                </div>
                <div className="glass-panel p-10 rounded-3xl">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-gold mb-6">Quick Message</h4>
                  <form className="space-y-4">
                    <input type="text" placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold" />
                    <textarea placeholder="Message" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold h-32" />
                    <button className="w-full py-4 rounded-xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px]">Send Signal</button>
                    
                    <div className="mt-4 flex gap-0.5 h-1 items-end opacity-10">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [1, 4, 2, 3, 1] }}
                          transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: i * 0.05 }}
                          className="flex-1 bg-gold"
                        />
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <StoreCart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onCheckout={handleCheckout}
        theme={activeTheme}
      />

      {/* Global Footer */}
      <footer className="border-t border-white/5 py-12 px-6 relative overflow-hidden bg-black">
        <div className="absolute top-0 left-0 w-full flex gap-0.5 h-1 items-end opacity-10">
          {Array.from({ length: 200 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [1, 4, 2, 3, 1] }}
              transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.02 }}
              className="flex-1 bg-gold"
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-black">
              <Drone size={16} />
            </div>
            <span className="font-display text-sm text-white tracking-widest uppercase">Fairway Dreams</span>
          </div>
          
          <div className="flex gap-8">
            {['home', 'player', 'music', 'about', 'tools', 'guide', 'circle', 'licensing', 'faq', ...(profile.role === 'admin' ? ['admin'] : [])].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="text-[10px] uppercase tracking-widest text-white hover:text-gold transition-colors">
                {tab}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-white uppercase tracking-widest">
            © 2026 Fairway Dreams · AI Music Studio
          </p>
        </div>
      </footer>

      {profile && <MascotGuide mascotType={profile.mascot} />}
    </div>
  );
}
