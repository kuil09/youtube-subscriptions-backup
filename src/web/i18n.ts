export type Lang = 'ko' | 'en' | 'ja';

const LANG_KEY = 'lang';

type Dict = Record<string, { ko: string; en: string; ja: string }>;

export const I18N: Dict = {
  app_title: {
    ko: 'YouTube Subscriptions Manager',
    en: 'YouTube Subscriptions Manager',
    ja: 'YouTube Subscriptions Manager',
  },
  app_tag_pill: { ko: '구독 목록', en: 'Subscriptions', ja: 'チャンネル登録' },
  app_intro_1: {
    ko: '이 서비스는 {pill}만 집중합니다. 내 구독 채널 수를 확인하고, 목록을 파일로 내려받아(Export) 정리한 뒤, 다시 Import 해서 브라우저에서 구독을 추가/정리할 수 있습니다.',
    en: 'This service focuses only on {pill}. Check how many channels you subscribe to, export the list as a file, edit it, then import to subscribe/restore from the browser.',
    ja: 'このサービスは {pill} のみを対象にします。登録チャンネル数を確認し、リストをファイルとしてエクスポートして整理し、インポートしてブラウザから登録を追加/復元できます。',
  },
  app_intro_2: {
    ko: '주의: {strong}는 실제 계정에 즉시 반영됩니다. 반드시 Export 백업 후 진행하세요.',
    en: 'Warning: {strong} takes effect on your account immediately. Always export a backup first.',
    ja: '注意: {strong} はアカウントに即時反映されます。必ず先にエクスポートしてバックアップしてください。',
  },
  app_intro_strong: { ko: '구독 취소/추가', en: 'Unsubscribe/Subscribe', ja: '登録解除/登録' },

  lang_label: { ko: '언어', en: 'Language', ja: '言語' },

  sec1_title: { ko: '1) Google OAuth Client ID', en: '1) Google OAuth Client ID', ja: '1) Google OAuth Client ID' },
  sec1_desc: {
    ko: 'Google Cloud Console에서 {strong}을 만들고 Client ID를 붙여넣으세요.',
    en: 'Create an {strong} in Google Cloud Console, then paste the Client ID here.',
    ja: 'Google Cloud Console で {strong} を作成し、Client ID を貼り付けてください。',
  },
  sec1_strong: { ko: 'OAuth Client (Web application)', en: 'OAuth Client (Web application)', ja: 'OAuth Client (Web application)' },
  client_id_placeholder: {
    ko: 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
    en: 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
    ja: 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
  },
  btn_save: { ko: '저장', en: 'Save', ja: '保存' },
  btn_auth_readonly: { ko: '권한 요청 (읽기)', en: 'Authorize (readonly)', ja: '認可 (読み取り)' },
  btn_auth_manage: { ko: '권한 요청 (관리)', en: 'Authorize (manage)', ja: '認可 (管理)' },
  sec1_hint: {
    ko: 'API: YouTube Data API v3 / 권한: readonly = {ro}, manage = {mg}',
    en: 'API: YouTube Data API v3 / scopes: readonly = {ro}, manage = {mg}',
    ja: 'API: YouTube Data API v3 / スコープ: readonly = {ro}, manage = {mg}',
  },

  sec2_title: { ko: '2) 내 구독 현황', en: '2) Subscription status', ja: '2) 登録状況' },
  btn_refresh_count: { ko: '갯수 새로고침', en: 'Refresh count', ja: '件数を更新' },
  subs_label: { ko: '구독', en: 'Subscriptions', ja: '登録' },
  sec2_desc: {
    ko: '구독 수는 {code} 페이지네이션으로 계산됩니다.',
    en: 'The count is computed by paginating {code}.',
    ja: '件数は {code} をページングして計算します。',
  },

  sec3_title: { ko: '3) Export (다운로드)', en: '3) Export (download)', ja: '3) エクスポート (ダウンロード)' },
  sec3_desc: {
    ko: '현재 구독 목록을 JSON/CSV 파일로 내려받습니다.',
    en: 'Download your current subscriptions as JSON/CSV.',
    ja: '現在の登録リストを JSON/CSV としてダウンロードします。',
  },
  btn_export_json: { ko: 'Export JSON', en: 'Export JSON', ja: 'JSON をエクスポート' },
  btn_export_csv: { ko: 'Export CSV', en: 'Export CSV', ja: 'CSV をエクスポート' },

  sec4_title: { ko: '4) Cleanup (전체 구독 취소)', en: '4) Cleanup (unsubscribe all)', ja: '4) クリーンアップ (全て解除)' },
  sec4_desc: {
    ko: 'Export를 먼저 수행한 뒤, typed confirm으로 한 번 더 확인하고 전체 구독을 취소합니다.',
    en: 'Exports first, then requires a typed confirmation before unsubscribing from everything.',
    ja: '先にエクスポートし、入力確認(typed confirm)の後に全て解除します。',
  },
  btn_cleanup_json: { ko: 'Export 후 Cleanup (JSON)', en: 'Cleanup after Export (JSON)', ja: 'エクスポート後に解除 (JSON)' },
  btn_cleanup_csv: { ko: 'Export 후 Cleanup (CSV)', en: 'Cleanup after Export (CSV)', ja: 'エクスポート後に解除 (CSV)' },

  sec5_title: { ko: '5) Import (파일을 적용해서 구독 추가)', en: '5) Import (subscribe from file)', ja: '5) インポート (ファイルから登録)' },
  sec5_desc: {
    ko: 'Export한 파일(JSON/CSV)을 수정해서 업로드하면, 현재 구독 목록과 비교 후 부족한 채널을 구독 추가합니다.',
    en: 'Upload an edited JSON/CSV export, then subscribe to channels that are missing from your current list.',
    ja: 'エクスポートした JSON/CSV を編集してアップロードすると、現在の登録と比較して不足分を登録します。',
  },
  btn_apply_import: { ko: 'Import 적용 (구독 추가)', en: 'Apply import (subscribe)', ja: 'インポート適用 (登録)' },
  import_no_file: { ko: '파일이 로드되지 않았습니다.', en: 'No file loaded.', ja: 'ファイルが読み込まれていません。' },
  logs_title: { ko: 'Logs', en: 'Logs', ja: 'ログ' },
  logs_ready: { ko: 'Ready.', en: 'Ready.', ja: '準備完了。' },

  // runtime messages (alerts/confirms/logs)
  msg_initialized: { ko: '초기화 완료.', en: 'Initialized.', ja: '初期化しました。' },
  msg_saved_client_id: { ko: 'client_id 저장됨.', en: 'Saved client_id.', ja: 'client_id を保存しました。' },
  alert_saved_client_id: { ko: 'Client ID를 저장했습니다.', en: 'Saved Client ID', ja: 'Client ID を保存しました。' },
  alert_auth_ok_ro: { ko: '인증 성공 (읽기 권한)', en: 'Auth OK (readonly)', ja: '認証OK (読み取り)' },
  alert_auth_ok_manage: { ko: '인증 성공 (관리 권한)', en: 'Auth OK (manage)', ja: '認証OK (管理)' },
  log_authorized_scopes: { ko: '권한 승인: {scopes}', en: 'Authorized scopes: {scopes}', ja: '認可スコープ: {scopes}' },
  log_fetched_subs: { ko: '구독 목록 조회: count={count}', en: 'Fetched subscriptions: count={count}', ja: '登録取得: count={count}' },
  log_exported: { ko: 'Export 완료 ({format}): count={count}', en: 'Exported ({format}): count={count}', ja: 'エクスポート完了 ({format}): count={count}' },
  log_no_subs: { ko: '구독이 없습니다.', en: 'No subscriptions found.', ja: '登録が見つかりません。' },
  confirm_cleanup_1: {
    ko: 'Exported subscriptions ({count}).\n\nPreview (first {n}): {preview}\n\nNow unsubscribe ALL of them?',
    en: 'Exported subscriptions ({count}).\n\nPreview (first {n}): {preview}\n\nNow unsubscribe ALL of them?',
    ja: 'エクスポートしました ({count}).\n\nプレビュー (最初の {n} 件): {preview}\n\n全て解除しますか？',
  },
  confirm_cleanup_cancel_1: { ko: 'Cleanup 취소 (confirm)', en: 'Cleanup cancelled (confirm).', ja: '解除をキャンセル (confirm)。' },
  prompt_cleanup_typed: {
    ko: '확인을 위해 \"UNSUBSCRIBE {count}\" 를 입력하세요.',
    en: 'Type \"UNSUBSCRIBE {count}\" to confirm.',
    ja: '確認のため \"UNSUBSCRIBE {count}\" を入力してください。',
  },
  confirm_cleanup_cancel_2: { ko: 'Cleanup 취소 (입력 불일치)', en: 'Cleanup cancelled (typed confirm mismatch).', ja: '解除をキャンセル (入力不一致)。' },
  log_cleanup_done: { ko: 'Cleanup 완료. attempted={attempted}, failed={failed}', en: 'Cleanup done. attempted={attempted}, failed={failed}', ja: '解除完了. attempted={attempted}, failed={failed}' },
  alert_unsub_done_no_fail: {
    ko: '구독 취소 완료. attempted={attempted}, failed=0',
    en: 'Unsubscribe done. attempted={attempted}, failed=0',
    ja: '解除完了. attempted={attempted}, failed=0',
  },
  alert_unsub_done_with_fail: {
    ko: '구독 취소가 일부 실패했습니다: {failed}\n\n실패 리포트 JSON을 다운로드했습니다.',
    en: 'Unsubscribe completed with failures: {failed}\n\nA failure report JSON was downloaded.',
    ja: '解除に失敗しました: {failed}\n\n失敗レポート(JSON)をダウンロードしました。',
  },

  alert_import_no_channel_ids: { ko: 'Import에 channelId가 없습니다.', en: 'Import has no channelIds.', ja: 'インポートに channelId がありません。' },
  log_loaded_import: {
    ko: 'Import 파일 로드: {name} (channels={channels}, errors={errors})',
    en: 'Loaded import file: {name} (channels={channels}, errors={errors})',
    ja: 'インポート読み込み: {name} (channels={channels}, errors={errors})',
  },
  import_preview_source: { ko: 'source: {source}', en: 'source: {source}', ja: 'source: {source}' },
  import_preview_channels: { ko: 'channels: {count}', en: 'channels: {count}', ja: 'channels: {count}' },
  import_preview_sample_titles: { ko: 'sampleTitles: {titles}', en: 'sampleTitles: {titles}', ja: 'sampleTitles: {titles}' },
  import_preview_errors_none: { ko: 'errors: none', en: 'errors: none', ja: 'errors: none' },
  import_preview_errors: { ko: 'errors({count}):\n- {list}', en: 'errors({count}):\n- {list}', ja: 'errors({count}):\n- {list}' },
  log_import_applied: { ko: 'Import 적용. {json}', en: 'Import applied. {json}', ja: 'インポート適用. {json}' },
  alert_import_done: {
    ko: 'Import 완료.\n\nattempted={attempted}\nsucceeded={succeeded}\nskipped={skipped}\nfailed={failed}',
    en: 'Import done.\n\nattempted={attempted}\nsucceeded={succeeded}\nskipped={skipped}\nfailed={failed}',
    ja: 'インポート完了。\n\nattempted={attempted}\nsucceeded={succeeded}\nskipped={skipped}\nfailed={failed}',
  },
};

export function detectLang(): Lang {
  const candidates: string[] = [];
  try {
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
  } catch {
    // ignore
  }
  const lowered = candidates.map(s => s.toLowerCase());
  for (const l of lowered) {
    if (l.startsWith('ko')) return 'ko';
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

export function getSavedLang(): Lang | null {
  const v = localStorage.getItem(LANG_KEY);
  if (v === 'ko' || v === 'en' || v === 'ja') return v;
  return null;
}

export function setSavedLang(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang);
}

let currentLang: Lang = getSavedLang() ?? detectLang();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  setSavedLang(lang);
}

export function t(key: keyof typeof I18N | string, params?: Record<string, string | number>): string {
  const entry = (I18N as Dict)[key];
  const base = entry ? entry[currentLang] : String(key);
  if (!params) return base;
  return base.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, k) => {
    const v = params[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

function resolveParams(params?: Record<string, any>): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' && v.startsWith('i18n:')) {
      out[k] = t(v.slice('i18n:'.length));
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Applies translations for elements with [data-i18n] and optional [data-i18n-params] JSON.
// For attributes, set [data-i18n-attr="placeholder,title,..."].
export function applyTranslations(root: ParentNode = document) {
  const nodes = root.querySelectorAll<HTMLElement>('[data-i18n]');
  nodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (!key) return;

    let params: Record<string, string | number> | undefined;
    const rawParams = node.dataset.i18nParams;
    if (rawParams) {
      try {
        params = resolveParams(JSON.parse(rawParams));
      } catch {
        params = undefined;
      }
    }

    const text = t(key, params);

    const attrList = (node.dataset.i18nAttr ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (attrList.length) {
      for (const attr of attrList) {
        node.setAttribute(attr, text);
      }
    } else {
      node.textContent = text;
    }
  });

  // Update document <html lang="">
  if (root === document) {
    document.documentElement.lang = currentLang;
    const titleKey = 'app_title';
    document.title = t(titleKey);
  }
}

