// Shared types for background scripts

export type SubscriptionItem = {
  subscriptionId: string;
  channelId: string;
  channelTitle: string;
};

export type PlaylistItem = {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
};

export type WatchLaterVideo = {
  // YouTube playlistItems resource id (needed for playlistItems.delete)
  playlistItemId: string;
  videoId: string;
  title: string;
  channelName?: string;
  durationText?: string;
  // ISO datetime for when the video was published (from YouTube API)
  publishedText?: string;
  // ISO datetime for when it was added to Watch Later (from playlistItems.snippet.publishedAt)
  addedText?: string;
};

export type ClassifiedSuggestion = {
  videoId: string;
  suggestedPlaylistTitle: string;
  confidence: number; // 0..1
  rationale?: string;
};
