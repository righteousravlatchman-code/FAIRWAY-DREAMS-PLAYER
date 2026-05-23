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

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'particles' | 'mirror' | 'scope' | 'tunnel' | 'nebula' | 'vortex' | 'matrix' | 'kaleidoscope' | 'liquid' | 'dna' | 'galaxy' | 'atom' | 'blackhole' | 'constellation' | 'cymatics' | 'sacred-geometry' | 'hologram';

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
  showCenterImage?: boolean;
}

export interface SavedInsight {
  id: string;
  trackId: string;
  trackTitle: string;
  content: string;
  timestamp: number;
}

export interface Riff {
  id: string;
  name: string;
  category: string;
  midiData: number[];
  annotation?: string;
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
  mascot?: string;
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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  sizes?: string[];
  colors?: string[];
  features?: string[];
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
  };
  createdAt: any;
}
