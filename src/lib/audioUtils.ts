/**
 * Normalizes audio URLs, specifically handling Suno.com links
 * to convert them to direct CDN links when possible.
 */
export function normalizeAudioUrl(url: string): string {
  if (!url) return '';

  // Handle Suno song links
  // Patterns: 
  // https://suno.com/song/[uuid]
  // https://suno.com/@username/song/[uuid]
  const sunoSongRegex = /suno\.com\/(?:@[^/]+\/)?song\/([a-f0-9-]{36})/;
  const songMatch = url.match(sunoSongRegex);
  
  if (songMatch && songMatch[1]) {
    const songId = songMatch[1];
    // Suno uses multiple CDNs, cdn1 is common
    return `https://cdn1.suno.ai/${songId}.mp3`;
  }

  // Detect Suno playlists - these cannot be played directly
  if (url.includes('suno.com/playlist/')) {
    console.warn("Suno playlists cannot be played directly. Please use individual song links.");
    return url; // Return as is, player will show error
  }

  // Handle Suno direct CDN links that might be missing .mp3 or have query params
  // Pattern: https://cdn1.suno.ai/[uuid]
  if (url.includes('suno.ai') && !url.endsWith('.mp3') && !url.includes('.mp3?')) {
    const uuidRegex = /([a-f0-9-]{36})/;
    const uuidMatch = url.match(uuidRegex);
    if (uuidMatch) {
      const baseUrl = url.split('?')[0].split('#')[0];
      if (baseUrl.endsWith(uuidMatch[1])) {
        return `${baseUrl}.mp3`;
      }
    }
  }

  // If it's a suno.com link but didn't match the song regex, it's likely a page or playlist
  if (url.includes('suno.com') && !url.includes('cdn')) {
    console.warn("Detected suno.com link that is not a direct audio source. Audio player may fail.");
  }

  return url;
}
