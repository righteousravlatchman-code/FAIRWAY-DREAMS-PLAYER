export type MediaType = 'audio' | 'video' | 'image';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string; // Link to Suno/External
  mediaUrl: string; // Direct link to file
  art: string;
  genre: string[];
  description?: string;
  playlist?: string;
  bpm?: number;
  key?: string;
  numerologyCode?: string;
  theme?: string;
  isLive?: boolean;
  streamUrl?: string;
}

export interface LiveMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: any;
}

export interface Track extends MediaItem {}

export interface Playlist {
  id: string;
  userId?: string; // Owner of the playlist
  title: string;
  description?: string;
  art?: string;
  trackIds: string[];
  isPublic: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'particles' | 'mirror' | 'scope';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export interface VisualizerSettings {
  mode: VisualizerMode;
  themeName: string;
  speed: number;
  sensitivity: number;
  intensity: number;
  customColor?: string;
}

export interface SavedInsight {
  id: string;
  trackId: string;
  trackTitle: string;
  content: string;
  timestamp: number;
}

export interface ListeningEvent {
  id: string;
  userId: string;
  trackId: string;
  timestamp: any;
}

export interface UserProfile {
  uid?: string;
  name: string;
  hebrewName?: string;
  bio: string;
  avatar: string;
  role: 'admin' | 'user';
  likedTrackIds: string[];
  savedInsights: SavedInsight[];
  frequencyReport?: string;
  settings: {
    theme: string;
    vizSettings: VisualizerSettings;
  };
  updatedAt?: string;
}
