import './types';
import { ensureAccessToken } from './auth';
import { exportAsCsv, exportAsJson } from './downloads';
import { listAllSubscriptions, bulkUnsubscribe, listOwnedPlaylists, insertToPlaylist, listWatchLater, deletePlaylistItem, createPlaylist, countWatchLater } from './youtube';
import { handleScrapedWatchLater } from './wl-ingest';
import { classifyVideosWithAI } from './ai';
import { getLogs, logEvent } from './logs';
import { enqueueJobs, runJobs } from './jobs';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[YouTube Organizer] installed');
});

// Simple message bus
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'PING':
          sendResponse({ ok: true });
          return;
        case 'AUTH_ACQUIRE': {
          try {
            const token = await ensureAccessToken(message.scopes as string[]);
            sendResponse({ token });
          } catch (err: any) {
            const msg = typeof err?.message === 'string' ? err.message : String(err);
            let redirectUri = '';
            try { redirectUri = chrome.identity.getRedirectURL(); } catch { /* ignore */ }
            const extensionId = chrome.runtime?.id ?? '';
            const lower = msg.toLowerCase();
            const hint =
              lower.includes('redirect_uri_mismatch') || lower.includes('redirect uri mismatch')
                ? [
                    'Google OAuth 설정(redirect URI / 확장 ID)이 일치하지 않습니다.',
                    `- Extension ID(= 항목 ID): ${extensionId || '(unknown)'}`,
                    `- Redirect URI: ${redirectUri || '(unknown)'}`,
                    '',
                    '해결:',
                    '- (권장) OAuth 클라이언트를 "웹 애플리케이션"으로 만들고, Authorized redirect URI에 위 Redirect URI를 그대로 추가하세요.',
                    '- 또는 OAuth 클라이언트 유형이 "Chrome 확장 프로그램"이면, 항목 ID에 위 Extension ID를 입력하고 다시 생성하세요.',
                    '- 공식 Redirect URI 형식: https://<extension-id>.chromiumapp.org/',
                  ].join('\n')
                : '';
            sendResponse({
              token: null,
              error: msg,
              hint,
              debug: { extensionId, redirectUri }
            });
          }
          return;
        }
        case 'SUBS_EXPORT': {
          const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube.readonly']);
          const subs = await listAllSubscriptions(token);
        await logEvent('SUBS_LISTED', { count: subs.length, export: message.format });
          if (message.format === 'csv') {
            await exportAsCsv('subscriptions.csv', subs.map(s => ({
              channel_name: s.channelTitle,
              channel_url: `https://www.youtube.com/channel/${s.channelId}`
            })));
          } else {
            await exportAsJson('subscriptions.json', subs.map(s => ({
              channel_name: s.channelTitle,
              channel_url: `https://www.youtube.com/channel/${s.channelId}`
            })));
          }
          sendResponse({ count: subs.length });
          return;
        }
        case 'SUBS_LIST_INTERNAL': {
          const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube.readonly']);
          const subs = await listAllSubscriptions(token);
          sendResponse({ items: subs });
          return;
        }
        case 'SUBS_BULK_UNSUB': {
          const ids = message.subscriptionIds as string[];
          const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube']);
        const res = await bulkUnsubscribe(token, ids);
        await logEvent('SUBS_BULK_UNSUB', { attempted: res.attempted, failed: res.failed.length });
        if (res.failed.length) {
          await exportAsJson('unsubscribe-failures.json', { failedSubscriptionIds: res.failed });
        }
        sendResponse({ ok: true, attempted: res.attempted, failed: res.failed });
          return;
        }
        case 'PLAYLISTS_LIST': {
          const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube.readonly']);
          const lists = await listOwnedPlaylists(token);
          sendResponse({ items: lists });
          return;
        }
      case 'STATS': {
        const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube.readonly']);
        const [subs, wlCount] = await Promise.all([
          listAllSubscriptions(token),
          countWatchLater(token),
        ]);
        await logEvent('STATS', { subsCount: subs.length, watchLaterCount: wlCount });
        sendResponse({ ok: true, subsCount: subs.length, watchLaterCount: wlCount });
        return;
      }
      case 'WL_REFRESH': {
        const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube.readonly']);
        const videos = await listWatchLater(token);
        await chrome.storage.local.set({ wl_items: videos, wl_items_at: Date.now() });
        await logEvent('WL_LISTED', { count: videos.length });
        sendResponse({ ok: true, count: videos.length });
        return;
      }
      case 'WL_GET': {
        const { wl_items, wl_items_at } = await chrome.storage.local.get(['wl_items', 'wl_items_at']);
        sendResponse({ ok: true, items: wl_items ?? [], at: wl_items_at ?? null });
        return;
      }
      case 'WL_CLEAR_ALL': {
        const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube']);
        // Fetch fresh list so we delete the right playlistItemIds
        const videos = await listWatchLater(token);
        const failures: { playlistItemId: string; videoId: string; error: string }[] = [];
        for (const v of videos) {
          try {
            await deletePlaylistItem(token, v.playlistItemId);
          } catch (e: any) {
            failures.push({ playlistItemId: v.playlistItemId, videoId: v.videoId, error: String(e?.message ?? e) });
          }
        }
        await chrome.storage.local.set({ wl_items: [], wl_items_at: Date.now() });
        await logEvent('WL_CLEARED', { attempted: videos.length, failed: failures.length });
        if (failures.length) {
          await exportAsJson('watch-later-delete-failures.json', failures);
        }
        sendResponse({ ok: true, attempted: videos.length, failed: failures });
        return;
      }
        case 'WL_SCRAPED': {
          await handleScrapedWatchLater(message.payload);
          await logEvent('WL_SCRAPED', { count: (message.payload?.videos ?? []).length });
          sendResponse({ ok: true });
          return;
        }
        case 'AI_CLASSIFY': {
          const videos = (message.payload?.videos ?? []) as any[];
          const existing = (message.payload?.existingPlaylists ?? []) as string[];
          const items = await classifyVideosWithAI(videos, existing);
          sendResponse({ items });
          return;
        }
        case 'MOVE_VIDEO': {
          const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube']);
        const { videoId, playlistId, playlistItemId } = message.payload;
          await insertToPlaylist(token, playlistId, videoId);
        const wlId = playlistItemId || (await (async () => {
          const { wl_items } = await chrome.storage.local.get('wl_items');
          const found = (wl_items as any[] | undefined)?.find(x => x?.videoId === videoId);
          return found?.playlistItemId as string | undefined;
        })());
        if (wlId) {
          await deletePlaylistItem(token, wlId);
        }
        await logEvent('MOVE_VIDEO', { videoId, playlistId, removedFromWatchLater: !!wlId });
          sendResponse({ ok: true });
          return;
        }
      case 'PLAYLIST_CREATE': {
        const token = await ensureAccessToken(['https://www.googleapis.com/auth/youtube']);
        const { title, description, privacyStatus } = message.payload ?? {};
        const id = await createPlaylist(token, String(title ?? '').slice(0, 120), description ? String(description) : undefined, privacyStatus ?? 'private');
        await logEvent('PLAYLIST_CREATED', { id, title });
        sendResponse({ ok: true, id });
        return;
      }
        case 'EXPORT_LOGS': {
          const logs = await getLogs();
          await exportAsJson('action-logs.json', logs);
          sendResponse({ count: logs.length });
          return;
        }
        case 'WL_REMOVE': {
          // forward to the active WL tab if present
          const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
          if (!tab?.id) { sendResponse({ ok: false, error: 'no active tab' }); return; }
          const resp = await chrome.tabs.sendMessage(tab.id, { type: 'WL_REMOVE_VIDEO', videoId: message.videoId });
          sendResponse(resp);
          return;
        }
        default:
          sendResponse({ error: 'unknown message' });
      }
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : String(err);
      sendResponse({ ok: false, error: msg });
    }
  })();
  return true;
});
