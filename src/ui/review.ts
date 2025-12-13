import type { WatchLaterVideo } from '../background/types';

type ActionLog = { at: number; type: string; detail?: any };

async function getVideos(): Promise<WatchLaterVideo[]> {
  // Prefer API-fetched Watch Later items stored by background (WL_REFRESH)
  const { wl_items } = await chrome.storage.local.get('wl_items');
  return (wl_items as WatchLaterVideo[]) ?? [];
}

async function getActionLogs(): Promise<ActionLog[]> {
  const { action_logs } = await chrome.storage.local.get('action_logs');
  return (action_logs as ActionLog[]) ?? [];
}

function renderLogs(logs: ActionLog[]) {
  const el = document.getElementById('logs');
  if (!el) return;
  const last = logs.slice(-80).reverse();
  el.textContent = last.map(l => {
    const ts = new Date(l.at).toISOString();
    const detail = l.detail ? ` ${JSON.stringify(l.detail)}` : '';
    return `[${ts}] ${l.type}${detail}`;
  }).join('\n');
}

async function getPlaylists(): Promise<{ id: string; title: string }[]> {
  const res = await chrome.runtime.sendMessage({ type: 'PLAYLISTS_LIST' });
  return (res.items ?? []).map((x: any) => ({ id: x.id, title: x.title }));
}

async function classify(videos: WatchLaterVideo[], playlists: { id: string; title: string }[]) {
  const titles = playlists.map(p => p.title);
  const res = await chrome.runtime.sendMessage({ type: 'AI_CLASSIFY', payload: { videos, existingPlaylists: titles } });
  return res.items as { videoId: string; suggestedPlaylistTitle: string; confidence: number }[];
}

function render(videos: WatchLaterVideo[], playlists: { id: string; title: string }[], suggestions: any[]) {
  const list = document.getElementById('list')!;
  list.innerHTML = '';
  const titleToId = new Map(playlists.map(p => [p.title, p.id] as const));

  for (const v of videos) {
    const sug = suggestions.find(s => s.videoId === v.videoId);
    const div = document.createElement('div');
    div.className = 'video';
    const sel = document.createElement('select');
    for (const p of playlists) {
      const opt = document.createElement('option');
      opt.value = p.id; opt.text = p.title;
      if (sug && titleToId.get(sug.suggestedPlaylistTitle) === p.id) opt.selected = true;
      sel.appendChild(opt);
    }
    // If AI suggests a playlist that doesn't exist, allow creating it (user approval required).
    if (sug && sug.suggestedPlaylistTitle && !titleToId.has(sug.suggestedPlaylistTitle)) {
      const opt = document.createElement('option');
      opt.value = `__create__:${String(sug.suggestedPlaylistTitle).slice(0, 120)}`;
      opt.text = `Create new: ${String(sug.suggestedPlaylistTitle).slice(0, 60)}`;
      opt.selected = true;
      sel.appendChild(opt);
    }
    const btn = document.createElement('button');
    btn.textContent = 'Move';
    btn.addEventListener('click', async () => {
      let playlistId = sel.value;
      if (playlistId.startsWith('__create__:')) {
        const suggestedTitle = playlistId.slice('__create__:'.length);
        const title = prompt('Create new playlist title:', suggestedTitle) ?? '';
        if (!title.trim()) { alert('Cancelled'); return; }
        const ok = confirm(`Create playlist "${title.trim()}" and move this video?`);
        if (!ok) return;
        const created = await chrome.runtime.sendMessage({ type: 'PLAYLIST_CREATE', payload: { title: title.trim(), privacyStatus: 'private' } });
        if (created?.ok === false || created?.error || !created?.id) {
          alert(created?.error ?? 'Failed to create playlist');
          return;
        }
        playlistId = created.id;
      }
      const res = await chrome.runtime.sendMessage({ type: 'MOVE_VIDEO', payload: { videoId: v.videoId, playlistId, playlistItemId: (v as any).playlistItemId } });
      if (res?.ok === false || res?.error) {
        alert(res.error ?? 'Move failed');
        return;
      }
      await refresh();
    });
    const meta = [
      v.channelName ? `Channel: ${v.channelName}` : '',
      v.durationText ? `Duration: ${v.durationText}` : '',
      v.publishedText ? `Published: ${v.publishedText}` : '',
      (v as any).addedText ? `Added: ${(v as any).addedText}` : '',
    ].filter(Boolean).join(' · ');
    div.innerHTML = `<div><strong>${v.title}</strong><br/><small>${meta}</small></div>`;
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.appendChild(sel);
    actions.appendChild(btn);
    div.appendChild(actions);
    list.appendChild(div);
  }
}

async function refresh() {
  // Refresh Watch Later from API before reading from storage
  await chrome.runtime.sendMessage({ type: 'WL_REFRESH' });
  const videos = await getVideos();
  const playlists = await getPlaylists();
  const suggestions = await classify(videos, playlists);
  render(videos, playlists, suggestions);
}

async function autoApply() {
  const thr = Number((document.getElementById('threshold') as HTMLInputElement).value || '0.7');
  await chrome.runtime.sendMessage({ type: 'WL_REFRESH' });
  const videos = await getVideos();
  const playlists = await getPlaylists();
  const suggestions = await classify(videos, playlists);
  const titleToId = new Map(playlists.map(p => [p.title, p.id] as const));
  for (const s of suggestions) {
    if (s.confidence >= thr) {
      const playlistId = titleToId.get(s.suggestedPlaylistTitle);
      // Only auto-apply when playlist already exists (creating new requires explicit user approval).
      if (playlistId) {
        const v = videos.find(vv => vv.videoId === s.videoId);
        await chrome.runtime.sendMessage({ type: 'MOVE_VIDEO', payload: { videoId: s.videoId, playlistId, playlistItemId: (v as any)?.playlistItemId } });
      }
    }
  }
  alert('Auto-move complete for suggestions above threshold');
}

(document.getElementById('refresh') as HTMLButtonElement).addEventListener('click', refresh);
(document.getElementById('autoApply') as HTMLButtonElement).addEventListener('click', autoApply);
(document.getElementById('refreshLogs') as HTMLButtonElement).addEventListener('click', async () => {
  const logs = await getActionLogs();
  renderLogs(logs);
});

refresh();
getActionLogs().then(renderLogs);
