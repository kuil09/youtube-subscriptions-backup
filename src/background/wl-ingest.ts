import type { WatchLaterVideo } from './types';

export async function handleScrapedWatchLater(payload: { videos: WatchLaterVideo[] }) {
  const key = 'wl_last_scrape';
  await chrome.storage.local.set({ [key]: payload.videos, wl_last_scrape_at: Date.now() });
}
