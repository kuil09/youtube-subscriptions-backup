export type Lang = 'ko' | 'en' | 'ja';

const LANG_KEY = 'lang';

type Dict = Record<string, { ko: string; en: string; ja: string }>;

export const I18N: Dict = {
  app_title: {
    ko: 'YouTube Subscriptions Manager',
    en: 'YouTube Subscriptions Manager',
    ja: 'YouTube Subscriptions Manager',
  },
  app_logo_alt: {
    ko: 'YouTube 구독 관리자 로고',
    en: 'YouTube Subscriptions Manager logo',
    ja: 'YouTube Subscriptions Manager のロゴ',
  },
  app_tag_pill: { ko: '구독 목록', en: 'Subscriptions', ja: 'チャンネル登録' },
  app_intro_1: {
    ko: '{pill}을 백업하고 정리하는 도구입니다. 구독 수를 확인하고, 파일로 내려받아(Export) 보관한 뒤, 필요하면 Import로 다시 구독을 추가할 수 있어요.',
    en: 'A simple tool to back up and reorganize your {pill}. Check the count, export a backup file, and import later to subscribe again.',
    ja: '{pill} をバックアップして整理するためのツールです。件数を確認し、ファイルとしてエクスポートして保管し、必要に応じてインポートして再登録できます。',
  },
  app_intro_2: {
    ko: '주의: {strong}는 실제 계정에 즉시 반영됩니다. 시작하기 전에 Export로 백업을 만들어 두세요.',
    en: 'Warning: {strong} affects your real account immediately. Export a backup first.',
    ja: '注意: {strong} は実アカウントに即時反映されます。先にエクスポートしてバックアップしてください。',
  },
  app_intro_strong: { ko: '구독 취소/추가', en: 'Unsubscribe/Subscribe', ja: '登録解除/登録' },

  lang_label: { ko: '언어', en: 'Language', ja: '言語' },

  sec1_title: { ko: '1) 로그인', en: '1) Sign in', ja: '1) ログイン' },
  sec1_desc: {
    ko: 'YouTube 구독 목록을 다루려면 Google 로그인이 필요합니다. 아래에서 로그인/권한 허용을 진행하세요.',
    en: 'To manage your YouTube subscriptions, you need to sign in with Google. Use the buttons below to continue.',
    ja: 'YouTube の登録を扱うには Google ログインが必要です。下のボタンから認可してください。',
  },
  btn_auth_readonly: { ko: '로그인 (조회/다운로드)', en: 'Sign in (view/export)', ja: 'ログイン (閲覧/エクスポート)' },
  btn_auth_manage: { ko: '로그인 (구독 변경)', en: 'Sign in (change subscriptions)', ja: 'ログイン (登録を変更)' },
  sec1_help_summary: { ko: '로그인이 안 되나요?', en: 'Having trouble signing in?', ja: 'ログインできませんか？' },
  sec1_help_desc: {
    ko: '이 페이지가 “승인된 출처”로 등록되어 있지 않으면 로그인이 차단될 수 있습니다. (특히 직접 배포한 경우) Google Cloud Console → OAuth 클라이언트 설정에서 **Authorized JavaScript origins**에 아래 값을 추가하세요.',
    en: 'If this site is not registered as an authorized origin, Google may block sign-in (especially for self-hosted deployments). In Google Cloud Console → OAuth client settings, add the value below to **Authorized JavaScript origins**.',
    ja: 'このサイトが「承認済みの出所」として登録されていない場合、ログインがブロックされることがあります（特に自分でデプロイした場合）。Google Cloud Console の OAuth クライアント設定で **Authorized JavaScript origins** に下の値を追加してください。',
  },
  sec1_help_origin_label: { ko: '현재 사이트 출처(Origin)', en: 'This site origin', ja: 'このサイトの Origin' },
  sec1_help_note: {
    ko: '참고: Origin은 `https://도메인` 형태이며, `/경로`는 포함하지 않습니다.',
    en: 'Note: An origin looks like `https://domain` (no `/path`).',
    ja: '注: Origin は `https://ドメイン` の形式で、`/パス` は含みません。',
  },

  sec2_title: { ko: '2) 구독 수 확인', en: '2) Check your subscription count', ja: '2) 登録数を確認' },
  btn_refresh_count: { ko: '구독 수 확인', en: 'Check count', ja: '件数を確認' },
  subs_label: { ko: '구독', en: 'Subscriptions', ja: '登録' },

  sec3_title: { ko: '3) 백업 다운로드', en: '3) Download a backup', ja: '3) バックアップをダウンロード' },
  sec3_desc: {
    ko: '현재 구독 목록을 파일로 내려받아 보관하세요.',
    en: 'Download your current subscriptions as a backup file.',
    ja: '現在の登録リストをバックアップとしてダウンロードします。',
  },
  btn_export_json: { ko: 'JSON 다운로드', en: 'Download JSON', ja: 'JSON をダウンロード' },
  btn_export_csv: { ko: 'CSV 다운로드', en: 'Download CSV', ja: 'CSV をダウンロード' },

  sec4_title: { ko: '4) 전체 구독 취소', en: '4) Unsubscribe from everything', ja: '4) 全て登録解除' },
  sec4_desc: {
    ko: '위에서 백업을 내려받은 뒤 진행하세요. 확인 문구를 직접 입력해야 실행됩니다.',
    en: 'Export a backup first. You must type a confirmation phrase to proceed.',
    ja: '先にバックアップをダウンロードしてください。確認文を入力しないと実行されません。',
  },
  btn_cleanup_json: { ko: 'JSON 백업 후 전체 취소', en: 'Backup JSON & unsubscribe all', ja: 'JSON をバックアップして全解除' },
  btn_cleanup_csv: { ko: 'CSV 백업 후 전체 취소', en: 'Backup CSV & unsubscribe all', ja: 'CSV をバックアップして全解除' },

  sec5_title: { ko: '5) 파일로 구독 추가', en: '5) Subscribe from a file', ja: '5) ファイルから登録' },
  sec5_desc: {
    ko: '백업 파일(JSON/CSV)을 업로드하면, 현재 구독에 없는 채널만 골라서 구독을 추가합니다.',
    en: 'Upload a JSON/CSV backup file to subscribe to channels that are not in your current subscriptions.',
    ja: 'バックアップ(JSON/CSV)をアップロードすると、現在未登録のチャンネルだけを追加で登録します。',
  },
  btn_apply_import: { ko: '파일 적용해서 구독 추가', en: 'Apply file & subscribe', ja: 'ファイルを適用して登録' },
  import_no_file: { ko: '파일이 로드되지 않았습니다.', en: 'No file loaded.', ja: 'ファイルが読み込まれていません。' },

  support_title: { ko: '후원', en: 'Support', ja: 'サポート' },
  support_desc: {
    ko: '이 앱이 도움이 되었다면 프로젝트를 후원해 주세요:',
    en: 'If this app helped you, consider supporting the project:',
    ja: '役に立ったらプロジェクトをサポートしてください:',
  },
  support_buymeacoffee_aria: {
    ko: 'Buy Me a Coffee에서 후원하기',
    en: 'Support on Buy Me a Coffee',
    ja: 'Buy Me a Coffee でサポート',
  },
  legal_privacy: { ko: '개인정보처리방침', en: 'Privacy Policy', ja: 'プライバシーポリシー' },
  legal_terms: { ko: '서비스 약관', en: 'Terms of Service', ja: '利用規約' },

  // runtime messages (alerts/confirms/logs)
  msg_initialized: { ko: '초기화 완료.', en: 'Initialized.', ja: '初期化しました。' },
  alert_auth_ok_ro: { ko: '로그인 완료(조회/다운로드).', en: 'Signed in (view/export).', ja: 'ログイン完了 (閲覧/エクスポート)。' },
  alert_auth_ok_manage: { ko: '로그인 완료(구독 변경).', en: 'Signed in (change subscriptions).', ja: 'ログイン完了 (登録の変更)。' },
  log_authorized_scopes: { ko: '로그인 성공.', en: 'Signed in.', ja: 'ログイン成功。' },
  log_fetched_subs: { ko: '구독 수를 확인했습니다: {count}', en: 'Checked subscription count: {count}', ja: '登録数を確認しました: {count}' },
  log_exported: { ko: '백업을 다운로드했습니다({format}): {count}', en: 'Downloaded backup ({format}): {count}', ja: 'バックアップをダウンロードしました ({format}): {count}' },
  log_no_subs: { ko: '구독이 없습니다.', en: 'No subscriptions found.', ja: '登録が見つかりません。' },
  confirm_cleanup_1: {
    ko: '백업을 다운로드했습니다 (총 {count}).\n\n예시(최대 {n}개): {preview}\n\n정말로 전체 구독을 취소할까요?',
    en: 'Downloaded a backup (total {count}).\n\nPreview (up to {n}): {preview}\n\nDo you want to unsubscribe from all of them?',
    ja: 'バックアップをダウンロードしました (合計 {count}).\n\nプレビュー(最大 {n} 件): {preview}\n\n全て登録解除しますか？',
  },
  confirm_cleanup_cancel_1: { ko: '전체 취소를 중단했습니다.', en: 'Cancelled.', ja: 'キャンセルしました。' },
  prompt_cleanup_typed: {
    ko: '확인을 위해 다음 문구를 그대로 입력하세요:\n\nUNSUBSCRIBE {count}',
    en: 'To confirm, type the following exactly:\n\nUNSUBSCRIBE {count}',
    ja: '確認のため、次の文をそのまま入力してください:\n\nUNSUBSCRIBE {count}',
  },
  confirm_cleanup_cancel_2: { ko: '문구가 일치하지 않아 중단했습니다.', en: 'Cancelled (phrase mismatch).', ja: '文が一致しないため中断しました。' },
  log_cleanup_done: { ko: '전체 취소 완료. 시도={attempted}, 실패={failed}', en: 'Unsubscribe completed. attempted={attempted}, failed={failed}', ja: '解除完了. attempted={attempted}, failed={failed}' },
  alert_unsub_done_no_fail: {
    ko: '전체 구독을 취소했습니다. (총 {attempted})',
    en: 'Unsubscribed from all. (total {attempted})',
    ja: '全て解除しました。(合計 {attempted})',
  },
  alert_unsub_done_with_fail: {
    ko: '일부 구독 취소에 실패했습니다: {failed}\n\n실패 목록(JSON)을 다운로드했습니다.',
    en: 'Some unsubscribes failed: {failed}\n\nA JSON report was downloaded.',
    ja: '一部解除に失敗しました: {failed}\n\n失敗レポート(JSON)をダウンロードしました。',
  },

  alert_import_no_channel_ids: { ko: 'Import에 channelId가 없습니다.', en: 'Import has no channelIds.', ja: 'インポートに channelId がありません。' },
  log_loaded_import: {
    ko: 'Import 파일 로드: {name} (channels={channels}, errors={errors})',
    en: 'Loaded import file: {name} (channels={channels}, errors={errors})',
    ja: 'インポート読み込み: {name} (channels={channels}, errors={errors})',
  },
  import_preview_source: { ko: '파일 형식: {source}', en: 'File type: {source}', ja: 'ファイル形式: {source}' },
  import_preview_channels: { ko: '추가할 채널 수: {count}', en: 'Channels to add: {count}', ja: '追加するチャンネル数: {count}' },
  import_preview_sample_titles: { ko: '예시 채널: {titles}', en: 'Sample channels: {titles}', ja: '例: {titles}' },
  import_preview_errors_none: { ko: '확인 필요 항목: 없음', en: 'Issues: none', ja: '問題: なし' },
  import_preview_errors: { ko: '확인 필요 항목({count}):\n- {list}', en: 'Issues ({count}):\n- {list}', ja: '問題 ({count}):\n- {list}' },
  log_import_applied: { ko: '파일을 적용했습니다.', en: 'Applied file.', ja: 'ファイルを適用しました。' },
  alert_import_done: {
    ko: '구독 추가를 완료했습니다.\n\n시도: {attempted}\n성공: {succeeded}\n이미 구독 중(건너뜀): {skipped}\n실패: {failed}',
    en: 'Subscription update finished.\n\nAttempted: {attempted}\nSucceeded: {succeeded}\nSkipped (already subscribed): {skipped}\nFailed: {failed}',
    ja: '登録の追加が完了しました。\n\n試行: {attempted}\n成功: {succeeded}\nスキップ(既に登録済み): {skipped}\n失敗: {failed}',
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

