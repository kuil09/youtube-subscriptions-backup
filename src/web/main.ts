import { getAccessToken } from './auth';
import { listAllSubscriptions, bulkUnsubscribe, subscribeToChannel } from './youtube';
import type { SubscriptionItem, SubscriptionsExportV1 } from '../shared/types';
import { downloadTextFile, parseCsv, sleep, toCsv } from '../shared/util';
import { applyTranslations, getLang, setLang, t, type Lang } from './i18n';

const SCOPES_READONLY = ['https://www.googleapis.com/auth/youtube.readonly'];
const SCOPES_MANAGE = ['https://www.googleapis.com/auth/youtube'];

type ImportModel = {
  source: 'json' | 'csv';
  channelIds: string[];
  errors: string[];
  sampleTitles?: string[];
};

let currentImport: ImportModel | null = null;

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing element: #${id}`);
  return e as T;
}

function log(msg: string) {
  const target = el<HTMLDivElement>('log');
  const now = new Date().toISOString();
  target.textContent = `[${now}] ${msg}\n` + target.textContent;
}

function logT(key: string, params?: Record<string, string | number>) {
  log(t(key, params));
}

function setBusy(busy: boolean) {
  const ids = [
    'authReadonly',
    'authManage',
    'refreshCount',
    'exportJson',
    'exportCsv',
    'cleanupJson',
    'cleanupCsv',
    'applyImport',
  ];
  for (const id of ids) {
    const b = document.getElementById(id) as HTMLButtonElement | null;
    if (!b) continue;
    if (id === 'applyImport') {
      b.disabled = busy || !currentImport || currentImport.channelIds.length === 0;
    } else {
      b.disabled = busy;
    }
  }
  const file = document.getElementById('importFile') as HTMLInputElement | null;
  if (file) file.disabled = busy;
}

async function authorize(scopes: string[], prompt: '' | 'none' | 'consent') {
  const token = await getAccessToken({ scopes, prompt });
  logT('log_authorized_scopes', { scopes: scopes.join(' ') });
  return token;
}

async function getReadonlyToken(interactive = true) {
  return authorize(SCOPES_READONLY, interactive ? 'consent' : '');
}

async function getManageToken(interactive = true) {
  // requesting manage scope implies read permissions too
  return authorize(SCOPES_MANAGE, interactive ? 'consent' : '');
}

async function refreshCount() {
  setBusy(true);
  try {
    const token = await getReadonlyToken(true);
    const subs = await listAllSubscriptions(token);
    el<HTMLElement>('subsCount').textContent = String(subs.length);
    logT('log_fetched_subs', { count: subs.length });
  } finally {
    setBusy(false);
  }
}

function exportJsonFile(subs: SubscriptionItem[]) {
  const payload: SubscriptionsExportV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    items: subs.map(s => ({
      channelId: s.channelId,
      channelTitle: s.channelTitle,
      subscriptionId: s.subscriptionId,
    })),
  };
  const text = JSON.stringify(payload, null, 2);
  downloadTextFile(`youtube-subscriptions-${new Date().toISOString().slice(0, 10)}.json`, text, 'application/json');
}

function exportCsvFile(subs: SubscriptionItem[]) {
  const csv = toCsv(subs.map(s => ({
    channelId: s.channelId,
    channelTitle: s.channelTitle,
    subscriptionId: s.subscriptionId,
  })));
  downloadTextFile(`youtube-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
}

async function exportSubs(format: 'json' | 'csv') {
  setBusy(true);
  try {
    const token = await getReadonlyToken(true);
    const subs = await listAllSubscriptions(token);
    if (format === 'json') exportJsonFile(subs);
    else exportCsvFile(subs);
    el<HTMLElement>('subsCount').textContent = String(subs.length);
    logT('log_exported', { format, count: subs.length });
  } finally {
    setBusy(false);
  }
}

async function cleanupSubscriptions(format: 'json' | 'csv') {
  setBusy(true);
  try {
    // Step 1: list
    const roToken = await getReadonlyToken(true);
    const subs = await listAllSubscriptions(roToken);
    if (!subs.length) {
      logT('log_no_subs');
      return;
    }
    const preview = subs.slice(0, 8).map(s => s.channelTitle).filter(Boolean).join(', ');

    // Step 2: export (download)
    if (format === 'json') exportJsonFile(subs);
    else exportCsvFile(subs);

    // Step 3: explicit confirm
    const ok1 = confirm(t('confirm_cleanup_1', {
      count: subs.length,
      n: Math.min(8, subs.length),
      preview: preview || '(n/a)',
    }));
    if (!ok1) {
      logT('confirm_cleanup_cancel_1');
      return;
    }
    const typed = prompt(t('prompt_cleanup_typed', { count: subs.length }));
    if (typed !== `UNSUBSCRIBE ${subs.length}`) {
      logT('confirm_cleanup_cancel_2');
      return;
    }

    // Step 4: unsubscribe (manage scope)
    const token = await getManageToken(true);
    const ids = subs.map(s => s.subscriptionId).filter(Boolean);
    const res = await bulkUnsubscribe(token, ids);

    const failedCount = res.failed.length;
    logT('log_cleanup_done', { attempted: res.attempted, failed: failedCount });
    if (failedCount) {
      downloadTextFile(
        `unsubscribe-failures-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(res, null, 2),
        'application/json'
      );
      alert(t('alert_unsub_done_with_fail', { failed: failedCount }));
    } else {
      alert(t('alert_unsub_done_no_fail', { attempted: res.attempted }));
    }
    await refreshCount();
  } finally {
    setBusy(false);
  }
}

function extractChannelIdFromUrl(url: string): string | null {
  // support typical export values: https://www.youtube.com/channel/UCxxxx
  const m = url.match(/\/channel\/([a-zA-Z0-9_-]{10,})/);
  return m?.[1] ?? null;
}

function normalizeChannelId(id: string): string {
  return id.trim();
}

function parseImportJson(text: string): ImportModel {
  const errors: string[] = [];
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch (e: any) {
    return { source: 'json', channelIds: [], errors: [`JSON parse error: ${String(e?.message ?? e)}`] };
  }
  const items: any[] = Array.isArray(obj) ? obj : Array.isArray(obj?.items) ? obj.items : [];
  if (!items.length) {
    errors.push('JSON has no items array (expected array or {items: []}).');
  }

  const channelIds: string[] = [];
  const sampleTitles: string[] = [];
  for (const it of items) {
    const channelId = typeof it?.channelId === 'string' ? it.channelId : '';
    const url = typeof it?.channel_url === 'string' ? it.channel_url : (typeof it?.channelUrl === 'string' ? it.channelUrl : '');
    const derived = channelId || (url ? extractChannelIdFromUrl(url) : null) || '';
    if (!derived) {
      errors.push(`Missing channelId (and no /channel/<id> url) in item: ${JSON.stringify(it).slice(0, 200)}`);
      continue;
    }
    channelIds.push(normalizeChannelId(derived));
    if (typeof it?.channelTitle === 'string' && sampleTitles.length < 8) sampleTitles.push(it.channelTitle);
  }

  const unique = Array.from(new Set(channelIds)).filter(Boolean);
  return { source: 'json', channelIds: unique, errors, sampleTitles };
}

function parseImportCsv(text: string): ImportModel {
  const { rows, errors } = parseCsv(text);
  const channelIds: string[] = [];
  const sampleTitles: string[] = [];

  for (const r of rows) {
    const channelId = (r.channelId ?? r.channel_id ?? '').trim();
    const url = (r.channelUrl ?? r.channel_url ?? r.channelURL ?? '').trim();
    const title = (r.channelTitle ?? r.channel_title ?? r.channelName ?? r.channel_name ?? '').trim();
    const derived = channelId || (url ? extractChannelIdFromUrl(url) : null) || '';
    if (!derived) {
      errors.push(`Missing channelId in CSV row: ${JSON.stringify(r)}`);
      continue;
    }
    channelIds.push(normalizeChannelId(derived));
    if (title && sampleTitles.length < 8) sampleTitles.push(title);
  }

  const unique = Array.from(new Set(channelIds)).filter(Boolean);
  return { source: 'csv', channelIds: unique, errors, sampleTitles };
}

function renderImportPreview(model: ImportModel | null) {
  const target = el<HTMLDivElement>('importPreview');
  if (!model) {
    target.textContent = t('import_no_file');
    return;
  }
  const lines = [
    t('import_preview_source', { source: model.source }),
    t('import_preview_channels', { count: model.channelIds.length }),
    model.sampleTitles?.length ? t('import_preview_sample_titles', { titles: model.sampleTitles.join(', ') }) : '',
    model.errors.length
      ? t('import_preview_errors', { count: model.errors.length, list: model.errors.join('\n- ') })
      : t('import_preview_errors_none'),
  ].filter(Boolean);
  target.textContent = lines.join('\n');
}

async function onImportFileSelected(file: File | null) {
  currentImport = null;
  renderImportPreview(null);
  if (!file) return;

  const text = await file.text();
  const isJson = file.name.toLowerCase().endsWith('.json') || file.type.includes('json');
  const model = isJson ? parseImportJson(text) : parseImportCsv(text);
  currentImport = model;
  renderImportPreview(model);
  logT('log_loaded_import', { name: file.name, channels: model.channelIds.length, errors: model.errors.length });
}

async function applyImport() {
  if (!currentImport) return;
  if (!currentImport.channelIds.length) {
    alert(t('alert_import_no_channel_ids'));
    return;
  }

  setBusy(true);
  try {
    const token = await getManageToken(true);
    const existing = await listAllSubscriptions(token);
    const existingSet = new Set(existing.map(s => s.channelId));

    const toAdd = currentImport.channelIds.filter(id => !existingSet.has(id));
    const skipped = currentImport.channelIds.length - toAdd.length;

    const failures: Array<{ channelId: string; error: string }> = [];
    let succeeded = 0;

    for (const channelId of toAdd) {
      try {
        await subscribeToChannel(token, channelId);
        succeeded++;
      } catch (e: any) {
        failures.push({ channelId, error: String(e?.message ?? e) });
      } finally {
        await sleep(120);
      }
    }

    const summary = {
      attempted: toAdd.length,
      succeeded,
      skippedAlreadySubscribed: skipped,
      failed: failures.length,
      failures,
    };
    logT('log_import_applied', { json: JSON.stringify(summary) });

    if (failures.length) {
      downloadTextFile(
        `import-failures-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(summary, null, 2),
        'application/json'
      );
    }
    alert(t('alert_import_done', {
      attempted: summary.attempted,
      succeeded: summary.succeeded,
      skipped: summary.skippedAlreadySubscribed,
      failed: summary.failed,
    }));
    await refreshCount();
  } finally {
    setBusy(false);
  }
}

function initLanguage() {
  const langSel = document.getElementById('lang') as HTMLSelectElement | null;
  if (!langSel) return;

  langSel.value = getLang();
  applyTranslations();

  langSel.addEventListener('change', () => {
    const v = langSel.value as Lang;
    if (v !== 'ko' && v !== 'en' && v !== 'ja') return;
    setLang(v);
    applyTranslations();
    renderImportPreview(currentImport);
  });
}

function init() {
  initLanguage();

  el<HTMLButtonElement>('authReadonly').addEventListener('click', async () => {
    setBusy(true);
    try {
      await authorize(SCOPES_READONLY, 'consent');
      alert(t('alert_auth_ok_ro'));
    } finally {
      setBusy(false);
    }
  });

  el<HTMLButtonElement>('authManage').addEventListener('click', async () => {
    setBusy(true);
    try {
      await authorize(SCOPES_MANAGE, 'consent');
      alert(t('alert_auth_ok_manage'));
    } finally {
      setBusy(false);
    }
  });

  el<HTMLButtonElement>('refreshCount').addEventListener('click', refreshCount);
  el<HTMLButtonElement>('exportJson').addEventListener('click', () => exportSubs('json'));
  el<HTMLButtonElement>('exportCsv').addEventListener('click', () => exportSubs('csv'));
  el<HTMLButtonElement>('cleanupJson').addEventListener('click', () => cleanupSubscriptions('json'));
  el<HTMLButtonElement>('cleanupCsv').addEventListener('click', () => cleanupSubscriptions('csv'));

  el<HTMLInputElement>('importFile').addEventListener('change', async (ev) => {
    setBusy(true);
    try {
      const input = ev.target as HTMLInputElement;
      const file = input.files?.[0] ?? null;
      await onImportFileSelected(file);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      log(`Import file error: ${msg}`);
      alert(`Failed to read import file.\n\n${msg}`);
    } finally {
      setBusy(false);
    }
  });

  el<HTMLButtonElement>('applyImport').addEventListener('click', applyImport);

  setBusy(false);
  logT('msg_initialized');
}

init();

