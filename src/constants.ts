import { Track } from './types';

export const TRACKS: Track[] = [
  {
    id: '1',
    title: "The Book of Rav",
    type: 'audio',
    playlist: "The Book of Rav",
    art: "/src/assets/images/default_cover_1779345608057.png",
    url: "https://suno.com/playlist/0677708d-d02e-455a-b43c-851d8c5e85a1",
    mediaUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73456.mp3",
    genre: ['consciousness', 'hip-hop', 'r&b'],
    description: "A sprawling universe of consciousness-coded tracks exploring the depths of the human experience.",
    bpm: 92,
    key: "A Minor",
    numerologyCode: "8-33-11"
  },
  {
    id: '2',
    title: "// SPI Physics //",
    type: 'audio',
    playlist: "SPI Physics",
    art: "/src/assets/images/default_cover_1779345608057.png",
    url: "https://suno.com/playlist/fe650ac6-a142-4583-ab07-8787e69d2ca1",
    mediaUrl: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3",
    genre: ['education', 'physics'],
    description: "Educational anthems designed to help sonography students master complex physics concepts.",
    bpm: 128,
    key: "C Major",
    numerologyCode: "7-22"
  },
  {
    id: '3',
    title: "BETTER",
    type: 'audio',
    playlist: "BETTER",
    art: "/src/assets/images/default_cover_1779345608057.png",
    url: "https://suno.com/playlist/553e2bff-ba16-46a9-8525-036074fb896c",
    mediaUrl: "https://cdn.pixabay.com/audio/2021/11/25/audio_91b132f0fc.mp3",
    genre: ['vibes', 'motivation'],
    description: "High-vibration motivational tracks to elevate your daily frequency.",
    bpm: 105,
    key: "E Major",
    numerologyCode: "5-11"
  },
  {
    id: '4',
    title: "// SPI Physics // Extended",
    type: 'audio',
    playlist: "SPI Physics Extended",
    art: "/src/assets/images/default_cover_1779345608057.png",
    url: "https://suno.com/playlist/064abc81-e9f5-4f88-b25c-3889d4952be4",
    mediaUrl: "https://cdn.pixabay.com/audio/2022/03/15/audio_69b5f2107a.mp3",
    genre: ['education', 'physics'],
    description: "Deep cuts and extended versions of the SPI Physics educational series.",
    bpm: 124,
    key: "D Minor",
    numerologyCode: "7-44"
  },
  {
    id: '5',
    title: "Fairway Dreams",
    type: 'audio',
    playlist: "Fairway Dreams",
    art: "/src/assets/images/default_cover_1779345608057.png",
    url: "https://suno.com/song/fairway-dreams",
    mediaUrl: "https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3",
    genre: ['lo-fi', 'synthwave', 'chill'],
    description: "A neon-soaked journey through digital landscapes and tranquil fairways.",
    bpm: 88,
    key: "G Major",
    numerologyCode: "6-22",
    theme: "cyberpunk"
  }
];

export const THEMES = {
  gold: {
    primary: '#d4af37', // Deeper rich gold
    secondary: '#aa8024',
    accent: '#fdfbf7', // Brighter peak
    glow: 'rgba(212, 175, 55, 0.6)'
  },
  blue: {
    primary: '#00f0ff', // Cyber cyan
    secondary: '#0055ff', // Deep neon blue
    accent: '#ffffff',
    glow: 'rgba(0, 240, 255, 0.6)'
  },
  violet: {
    primary: '#b026ff', // Neon purple
    secondary: '#5c0099',
    accent: '#f4dbff',
    glow: 'rgba(176, 38, 255, 0.6)'
  },
  emerald: {
    primary: '#00ff88', // Toxic green
    secondary: '#004d26',
    accent: '#d9ffe8',
    glow: 'rgba(0, 255, 136, 0.6)'
  },
  cyberpunk: {
    primary: '#ff0055', // Hot neon pink
    secondary: '#4b0082', // Deep indigo
    accent: '#00ffcc', // Cyber teal
    glow: 'rgba(255, 0, 85, 0.6)'
  },
  day: {
    primary: '#111111', 
    secondary: '#e5e5d3', 
    accent: '#ffffff', 
    glow: 'rgba(17, 17, 17, 0.3)'
  }
};
