async function saveClientId() {
  const el = document.getElementById('clientId') as HTMLInputElement;
  await chrome.storage.local.set({ oauth_client_id: el.value.trim() });
  alert('Saved Client ID');
}

async function loadClientId() {
  const { oauth_client_id } = await chrome.storage.local.get('oauth_client_id');
  (document.getElementById('clientId') as HTMLInputElement).value = oauth_client_id ?? '';
}

function renderStatusLine(subsCount: number, watchLaterCount: number) {
  const el = document.getElementById('status');
  if (!el) return;
  el.innerHTML = `<div><strong>Subscriptions:</strong> ${subsCount}</div><div><strong>Watch Later:</strong> ${watchLaterCount}</div>`;
}

async function refreshStatus() {
  const res = await chrome.runtime.sendMessage({ type: 'STATS' });
  if (res?.ok === false || res?.error) {
    alert(res.error ?? 'Failed to refresh status');
    return;
  }
  renderStatusLine(Number(res.subsCount ?? 0), Number(res.watchLaterCount ?? 0));
}

function loadRedirectUriHint() {
  const extEl = document.getElementById('extensionIdHint');
  const redirectEl = document.getElementById('redirectUriHint');
  if (!extEl && !redirectEl) return;
  try {
    if (extEl) extEl.textContent = `Extension ID (Item ID): ${chrome.runtime.id}`;
    if (redirectEl) redirectEl.textContent = `Redirect URI: ${chrome.identity.getRedirectURL()}`;
  } catch {
    // ignore (e.g. missing identity permission or unsupported context)
    if (extEl) extEl.textContent = '';
    if (redirectEl) redirectEl.textContent = '';
  }
}

async function testAuth() {
  const res = await chrome.runtime.sendMessage({ type: 'AUTH_ACQUIRE', scopes: ['https://www.googleapis.com/auth/youtube.readonly'] });
  if (res?.token) {
    alert('Auth OK');
    return;
  }
  const msg = (res?.error as string | undefined) ?? 'Auth failed';
  const hint = (res?.hint as string | undefined) ?? '';
  const debug = res?.debug ? `\n\nDebug:\n- extensionId: ${res.debug.extensionId}\n- redirectUri: ${res.debug.redirectUri}` : '';
  alert([msg, hint, debug].filter(Boolean).join('\n\n'));
}

async function exportSubsCsv() {
  const res = await chrome.runtime.sendMessage({ type: 'SUBS_EXPORT', format: 'csv' });
  if (res?.ok === false || res?.error) alert(res.error ?? 'Export failed');
}
async function exportSubsJson() {
  const res = await chrome.runtime.sendMessage({ type: 'SUBS_EXPORT', format: 'json' });
  if (res?.ok === false || res?.error) alert(res.error ?? 'Export failed');
}

async function cleanupSubscriptions(format: 'csv' | 'json') {
  // Step 1: list (preview)
  const list = await chrome.runtime.sendMessage({ type: 'SUBS_LIST_INTERNAL' });
  const items: any[] = Array.isArray(list?.items) ? list.items : [];
  const ids: string[] = items.map((x: any) => x.subscriptionId).filter(Boolean);
  const count = ids.length;
  if (!count) { alert('No subscriptions found.'); return; }
  const preview = items.slice(0, 8).map((x: any) => x.channelTitle).filter(Boolean).join(', ');

  // Step 2: export
  const exp = await chrome.runtime.sendMessage({ type: 'SUBS_EXPORT', format });
  if (exp?.ok === false || exp?.error) { alert(exp.error ?? 'Export failed'); return; }

  // Step 3: explicit confirm (typed)
  const ok1 = confirm(
    `Exported subscriptions (${count}).\n\nPreview (first ${Math.min(8, count)}): ${preview || '(n/a)'}\n\nNow unsubscribe ALL of them?`
  );
  if (!ok1) return;
  const typed = prompt(`Type "UNSUBSCRIBE ${count}" to confirm.`);
  if (typed !== `UNSUBSCRIBE ${count}`) { alert('Cancelled'); return; }

  // Step 4: bulk unsubscribe (write scope)
  const res = await chrome.runtime.sendMessage({ type: 'SUBS_BULK_UNSUB', subscriptionIds: ids });
  if (res?.ok === false || res?.error) { alert(res.error ?? 'Failed'); return; }
  const failedCount = Array.isArray(res.failed) ? res.failed.length : 0;
  alert(`Unsubscribe done. attempted=${res.attempted}, failed=${failedCount}${failedCount ? '\n(An unsubscribe-failures.json export was triggered.)' : ''}`);
}

async function listPlaylists() {
  const res = await chrome.runtime.sendMessage({ type: 'PLAYLISTS_LIST' });
  if (res?.ok === false || res?.error) {
    alert(res.error ?? 'Failed to list playlists');
    return;
  }
  const container = document.getElementById('playlists')!;
  container.innerHTML = '';
  for (const it of res.items ?? []) {
    const div = document.createElement('div');
    div.textContent = `${it.title} (${it.itemCount})`;
    container.appendChild(div);
  }
}

async function clearWatchLater() {
  const refresh = await chrome.runtime.sendMessage({ type: 'WL_REFRESH' });
  const count = Number(refresh?.count ?? 0);
  const ok1 = confirm(`This will delete ALL Watch Later items (count: ${count}). Continue?`);
  if (!ok1) return;
  const typed = prompt(`Type "DELETE ${count}" to confirm clearing Watch Later.`);
  if (typed !== `DELETE ${count}`) { alert('Cancelled'); return; }
  const res = await chrome.runtime.sendMessage({ type: 'WL_CLEAR_ALL' });
  if (res?.ok === false || res?.error) { alert(res.error ?? 'Failed'); return; }
  const failed = Array.isArray(res.failed) ? res.failed.length : 0;
  alert(`Cleared Watch Later. attempted=${res.attempted}, failed=${failed}`);
}

async function openReview() {
  const url = chrome.runtime.getURL('src/ui/review.html');
  await chrome.tabs.create({ url });
}

async function exportLogs() {
  await chrome.runtime.sendMessage({ type: 'EXPORT_LOGS' });
}

(document.getElementById('saveClientId') as HTMLButtonElement).addEventListener('click', saveClientId);
(document.getElementById('testAuth') as HTMLButtonElement).addEventListener('click', testAuth);
(document.getElementById('refreshStatus') as HTMLButtonElement).addEventListener('click', refreshStatus);
(document.getElementById('cleanupSubsCsv') as HTMLButtonElement).addEventListener('click', () => cleanupSubscriptions('csv'));
(document.getElementById('cleanupSubsJson') as HTMLButtonElement).addEventListener('click', () => cleanupSubscriptions('json'));
(document.getElementById('listPlaylists') as HTMLButtonElement).addEventListener('click', listPlaylists);
(document.getElementById('clearWatchLater') as HTMLButtonElement).addEventListener('click', clearWatchLater);
(document.getElementById('openReview') as HTMLButtonElement).addEventListener('click', openReview);
(document.getElementById('exportLogs') as HTMLButtonElement).addEventListener('click', exportLogs);

loadClientId();
loadRedirectUriHint();
refreshStatus();
