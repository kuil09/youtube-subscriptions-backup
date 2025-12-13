import { sleep, withBackoff } from './util';
import type { PlaylistItem, SubscriptionItem, WatchLaterVideo } from './types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

function isoDurationToText(iso?: string): string | undefined {
  if (!iso || typeof iso !== 'string') return undefined;
  // PT#H#M#S (YouTube videos.list contentDetails.duration)
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return undefined;
  const h = Number(m[1] || '0');
  const min = Number(m[2] || '0');
  const s = Number(m[3] || '0');
  const pad2 = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad2(min)}:${pad2(s)}`;
  return `${min}:${pad2(s)}`;
}

async function ytFetch(token: string, url: string, init?: RequestInit): Promise<any> {
  const resp = await withBackoff(() => fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  }));
  if (!resp.ok) {
    const text = await resp.text();
    // Try to provide actionable guidance for common GCP setup errors
    try {
      const data = JSON.parse(text);
      const reason = data?.error?.details?.[0]?.metadata?.reason ?? data?.error?.details?.[0]?.reason;
      const activationUrl = data?.error?.details?.[0]?.metadata?.activationUrl;
      const service = data?.error?.details?.[0]?.metadata?.service;
      if (resp.status === 403 && (reason === 'SERVICE_DISABLED' || String(data?.error?.errors?.[0]?.reason) === 'accessNotConfigured')) {
        throw new Error(
          [
            `YouTube Data API v3가 비활성화되어 있습니다(SERVICE_DISABLED).`,
            `GCP 프로젝트에서 YouTube Data API v3를 Enable 한 뒤 다시 시도하세요.`,
            activationUrl ? `Enable 링크: ${activationUrl}` : '',
            service ? `service: ${service}` : '',
          ].filter(Boolean).join('\n')
        );
      }
    } catch {
      // ignore JSON parse errors; fall back to raw text
    }
    throw new Error(`YouTube API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function fetchVideoDurations(token: string, videoIds: string[]): Promise<Map<string, string | undefined>> {
  const map = new Map<string, string | undefined>();
  if (!videoIds.length) return map;
  // videos.list supports up to 50 ids
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL(`${YT_BASE}/videos`);
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', batch.join(','));
    const data = await ytFetch(token, url.toString());
    for (const it of data.items ?? []) {
      map.set(String(it.id), isoDurationToText(it.contentDetails?.duration));
    }
  }
  return map;
}

export async function listAllSubscriptions(token: string): Promise<SubscriptionItem[]> {
  const items: SubscriptionItem[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const url = new URL(`${YT_BASE}/subscriptions`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('mine', 'true');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await ytFetch(token, url.toString());
    for (const it of data.items ?? []) {
      items.push({
        subscriptionId: it.id,
        channelId: it.snippet?.resourceId?.channelId,
        channelTitle: it.snippet?.title
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

export async function listWatchLater(token: string): Promise<WatchLaterVideo[]> {
  const items: WatchLaterVideo[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', 'WL');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await ytFetch(token, url.toString());
    for (const it of data.items ?? []) {
      const playlistItemId = String(it.id ?? '');
      const videoId = String(it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId ?? '');
      if (!playlistItemId || !videoId) continue;
      items.push({
        playlistItemId,
        videoId,
        title: String(it.snippet?.title ?? ''),
        channelName: String(it.snippet?.videoOwnerChannelTitle ?? it.snippet?.channelTitle ?? ''),
        publishedText: it.contentDetails?.videoPublishedAt ? String(it.contentDetails.videoPublishedAt) : undefined,
        addedText: it.snippet?.publishedAt ? String(it.snippet.publishedAt) : undefined,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  // Enrich with durations (videos.list)
  const durations = await fetchVideoDurations(token, items.map(i => i.videoId));
  for (const it of items) {
    it.durationText = durations.get(it.videoId);
  }
  return items;
}

export async function countWatchLater(token: string): Promise<number> {
  let count = 0;
  let pageToken: string | undefined = undefined;
  do {
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'id');
    url.searchParams.set('playlistId', 'WL');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await ytFetch(token, url.toString());
    count += (data.items?.length ?? 0);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return count;
}

export async function deletePlaylistItem(token: string, playlistItemId: string): Promise<void> {
  const url = new URL(`${YT_BASE}/playlistItems`);
  url.searchParams.set('id', playlistItemId);
  await ytFetch(token, url.toString(), { method: 'DELETE' });
}

export async function bulkUnsubscribe(token: string, subscriptionIds: string[]) {
  const failures: string[] = [];
  for (const id of subscriptionIds) {
    try {
      const url = new URL(`${YT_BASE}/subscriptions`);
      url.searchParams.set('id', id);
      const resp = await withBackoff(() => fetch(url.toString(), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (e) {
      failures.push(id);
    } finally {
      // best-effort pacing to reduce rate-limit bursts
      await sleep(100);
    }
  }
  return { attempted: subscriptionIds.length, failed: failures };
}

export async function listOwnedPlaylists(token: string): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const url = new URL(`${YT_BASE}/playlists`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('mine', 'true');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await ytFetch(token, url.toString());
    for (const it of data.items ?? []) {
      items.push({
        id: it.id,
        title: it.snippet?.title,
        description: it.snippet?.description,
        itemCount: it.contentDetails?.itemCount ?? 0
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

export async function insertToPlaylist(token: string, playlistId: string, videoId: string) {
  const url = `${YT_BASE}/playlistItems?part=snippet`;
  await ytFetch(token, url, {
    method: 'POST',
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: { kind: 'youtube#video', videoId }
      }
    })
  });
}

export async function createPlaylist(token: string, title: string, description?: string, privacyStatus: 'private' | 'public' | 'unlisted' = 'private'): Promise<string> {
  const url = `${YT_BASE}/playlists?part=snippet,status`;
  const data = await ytFetch(token, url, {
    method: 'POST',
    body: JSON.stringify({
      snippet: { title, description },
      status: { privacyStatus }
    })
  });
  return data.id as string;
}
