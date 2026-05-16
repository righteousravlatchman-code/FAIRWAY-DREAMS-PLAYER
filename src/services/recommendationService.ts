import { Track, ListeningEvent, UserProfile } from '../types';

export class RecommendationService {
  /**
   * Generates a "For You" list of tracks based on user's liked songs and listening history.
   */
  static getRecommendations(
    allTracks: Track[],
    profile: UserProfile,
    history: ListeningEvent[]
  ): Track[] {
    if (allTracks.length === 0) return [];

    // 1. Get IDs of tracks the user already likes or has listened to recently
    const likedIds = new Set(profile.likedTrackIds);
    const historyIds = new Set(history.map(h => h.trackId));
    const knownIds = new Set([...likedIds, ...historyIds]);

    // 2. Analyze favorite genres from liked tracks
    const likedTracks = allTracks.filter(t => likedIds.has(t.id));
    const genreCounts: Record<string, number> = {};
    
    likedTracks.forEach(track => {
      track.genre.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    // 3. Sort genres by frequency
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // 4. Find tracks in top genres that user hasn't interacted with much
    let recommendations = allTracks.filter(t => !knownIds.has(t.id));

    if (topGenres.length > 0) {
      recommendations.sort((a, b) => {
        const aMatch = a.genre.some(g => topGenres.includes(g)) ? 1 : 0;
        const bMatch = b.genre.some(g => topGenres.includes(g)) ? 1 : 0;
        return bMatch - aMatch;
      });
    } else {
      // If no data, just shuffle or return recent
      recommendations = recommendations.sort(() => Math.random() - 0.5);
    }

    return recommendations.slice(0, 10);
  }

  /**
   * Generates a "Discover Weekly" style playlist.
   * This could be more experimental, picking tracks from genres the user *might* like.
   */
  static getDiscoverWeekly(
    allTracks: Track[],
    profile: UserProfile
  ): Track[] {
    // Pick random tracks or tracks from related genres
    // For now, let's just pick 10 random tracks that aren't liked
    const unliked = allTracks.filter(t => !profile.likedTrackIds.includes(t.id));
    return unliked.sort(() => Math.random() - 0.5).slice(0, 10);
  }
}
