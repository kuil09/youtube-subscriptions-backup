type TokenRecord = {
  accessToken: string;
  expiry: number; // epoch ms
  scopes: string[];
};

let cached: TokenRecord | null = null;
let loadingGis: Promise<void> | null = null;

export function getConfiguredClientId(): string {
  // NOTE: This is a client-side app (Vite). The value is injected at build-time.
  // Even if sourced from GitHub Secrets, the built artifact can still be inspected.
  // The goal here is to remove UI exposure and avoid end-user editing.
  const v = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return (typeof v === 'string' ? v : '').trim();
}

function getInitTokenClient() {
  return google?.accounts?.oauth2?.initTokenClient;
}

export async function ensureGisLoaded(): Promise<void> {
  if (getInitTokenClient()) return;
  if (loadingGis) return loadingGis;

  loadingGis = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis="true"]');
    if (existing) {
      // If the script already loaded before we attached listeners, the `load`
      // event may never fire again. Use a short poll as a fallback.
      if (getInitTokenClient()) {
        resolve();
        return;
      }

      const fail = () => reject(new Error('Failed to load Google Identity Services script.'));
      existing.addEventListener('load', () => {
        existing.dataset.gisLoaded = 'true';
        resolve();
      }, { once: true });
      existing.addEventListener('error', fail, { once: true });

      const start = Date.now();
      const timer = setInterval(() => {
        if (getInitTokenClient()) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - start > 5000) {
          clearInterval(timer);
          fail();
        }
      }, 50);
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.gis = 'true';
    s.onload = () => {
      s.dataset.gisLoaded = 'true';
      resolve();
    };
    s.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(s);
  });

  return loadingGis;
}

function hasScopes(current: string[], needed: string[]) {
  return needed.every(s => current.includes(s));
}

export async function getAccessToken(opts: {
  scopes: string[];
  prompt?: '' | 'none' | 'consent';
}): Promise<string> {
  const clientId = getConfiguredClientId();
  if (!clientId) {
    throw new Error('Missing OAuth Client ID (VITE_GOOGLE_OAUTH_CLIENT_ID). Configure it via build-time environment variables.');
  }

  const now = Date.now();
  if (cached && cached.expiry - 60_000 > now && hasScopes(cached.scopes, opts.scopes)) {
    return cached.accessToken;
  }

  await ensureGisLoaded();
  const initTokenClient = getInitTokenClient();
  if (!initTokenClient) throw new Error('Google Identity Services not available (script not loaded).');

  const scope = opts.scopes.join(' ');
  const token = await new Promise<{ access_token: string; expires_in?: number; scope?: string }>((resolve, reject) => {
    const client = initTokenClient({
      client_id: clientId,
      scope,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error([resp.error, resp.error_description].filter(Boolean).join(': ')));
          return;
        }
        const access_token = resp.access_token;
        if (!access_token) {
          reject(new Error('Auth failed: missing access_token'));
          return;
        }
        resolve({ access_token, expires_in: resp.expires_in, scope: resp.scope });
      }
    });
    client.requestAccessToken({ prompt: opts.prompt ?? 'consent' });
  });

  const expiresIn = Number(token.expires_in ?? 3600);
  const grantedScopes = (token.scope ?? scope).split(/\s+/).filter(Boolean);
  cached = {
    accessToken: token.access_token,
    expiry: Date.now() + expiresIn * 1000,
    scopes: grantedScopes
  };
  return cached.accessToken;
}

