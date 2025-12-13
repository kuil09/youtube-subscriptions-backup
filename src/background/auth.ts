const STORAGE_KEY = 'google_oauth';

export async function ensureAccessToken(scopes: string[]): Promise<string> {
  const existing = await chrome.storage.local.get(STORAGE_KEY);
  const record = existing[STORAGE_KEY] as { access_token: string; expiry: number; scopes: string[] } | undefined;
  const now = Date.now();
  const cacheOk = !!(record && record.access_token && record.expiry - 60_000 > now && hasScopes(record.scopes, scopes));
  if (cacheOk) {
    return record.access_token;
  }
  return await acquireToken(scopes);
}

function hasScopes(current: string[], needed: string[]) {
  return needed.every(s => current.includes(s));
}

async function acquireToken(scopes: string[]): Promise<string> {
  const clientId = await getClientId();
  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('prompt', 'consent');

  // IMPORTANT: Do NOT retry auth UI flows. If this fails, it's usually a configuration issue
  // (e.g. redirect_uri_mismatch) and retrying only creates a worse UX.
  const redirect = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true }, (redirectUrl) => {
      const lastErr = chrome.runtime.lastError?.message;
      if (lastErr) {
        reject(new Error(`${lastErr}\n\nOAuth debug:\n- client_id: ${clientId}\n- redirect_uri: ${redirectUri}`));
        return;
      }
      if (!redirectUrl) {
        reject(new Error(`Auth failed: no redirect\n\nOAuth debug:\n- client_id: ${clientId}\n- redirect_uri: ${redirectUri}`));
        return;
      }
      resolve(redirectUrl);
    });
  });
  if (!redirect) throw new Error('Auth failed: no redirect');
  const hash = new URL(redirect).hash.slice(1);
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const expires_in = Number(params.get('expires_in') || '3600');
  if (!access_token) throw new Error('Auth failed: no access_token');
  const expiry = Date.now() + expires_in * 1000;
  await chrome.storage.local.set({ [STORAGE_KEY]: { access_token, expiry, scopes } });
  return access_token;
}

async function getClientId(): Promise<string> {
  const { oauth_client_id } = await chrome.storage.local.get('oauth_client_id');
  if (!oauth_client_id || typeof oauth_client_id !== 'string') {
    throw new Error('Missing Google OAuth Client ID. Set it in Popup > Settings.');
  }
  return oauth_client_id;
}
