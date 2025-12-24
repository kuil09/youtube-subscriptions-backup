type TokenRecord = {
  accessToken: string;
  expiry: number; // epoch ms
  scopes: string[];
};

let cached: TokenRecord | null = null;
let loadingGis: Promise<void> | null = null;

const STATE_STORAGE_KEY = 'oauth_state';

/**
 * Generate a cryptographically secure random state parameter for OAuth.
 * Uses base64url encoding to ensure URL safety.
 */
function generateState(): string {
  const array = new Uint8Array(32); // 256 bits of entropy
  crypto.getRandomValues(array);
  // Convert to base64url (URL-safe base64)
  // Using Array.from to avoid stack overflow with spread operator on large arrays
  const base64 = btoa(Array.from(array, byte => String.fromCharCode(byte)).join(''));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Store the state parameter in sessionStorage for later validation.
 * Using sessionStorage ensures state is tab-scoped and cleared on tab close.
 */
function storeState(state: string): void {
  try {
    sessionStorage.setItem(STATE_STORAGE_KEY, state);
  } catch (error) {
    // sessionStorage may be unavailable in private browsing mode or when storage is full
    console.error('Failed to store OAuth state in sessionStorage:', error);
    throw new Error('OAuth state storage failed. Please ensure your browser allows session storage and try again.');
  }
}

/**
 * Retrieve and remove the stored state parameter.
 * This ensures one-time use of the state value.
 */
function consumeState(): string | null {
  try {
    const state = sessionStorage.getItem(STATE_STORAGE_KEY);
    if (state) {
      sessionStorage.removeItem(STATE_STORAGE_KEY);
    }
    return state;
  } catch (error) {
    // sessionStorage may be unavailable in private browsing mode
    console.error('Failed to retrieve OAuth state from sessionStorage:', error);
    return null;
  }
}

/**
 * Validate that the received state matches the stored state.
 * Throws an error if validation fails.
 */
function validateState(receivedState: string | undefined): void {
  const storedState = consumeState();
  
  if (!storedState) {
    throw new Error('OAuth state validation failed: no stored state found. Possible CSRF attack or session expired.');
  }
  
  if (!receivedState) {
    throw new Error('OAuth state validation failed: no state parameter received from OAuth provider.');
  }
  
  if (storedState !== receivedState) {
    throw new Error('OAuth state validation failed: state parameter mismatch. Possible CSRF attack.');
  }
}

type InitTokenClient = (cfg: {
  client_id: string;
  scope: string;
  callback: (resp: {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
    state?: string;
  }) => void;
  state?: string;
}) => {
  requestAccessToken: (opts?: { prompt?: '' | 'none' | 'consent' }) => void;
};

export function getConfiguredClientId(): string {
  // NOTE: This is a client-side app (Vite). The value is injected at build-time.
  // Even if sourced from GitHub Secrets, the built artifact can still be inspected.
  // The goal here is to remove UI exposure and avoid end-user editing.
  const v = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return (typeof v === 'string' ? v : '').trim();
}

function getInitTokenClient() {
  // IMPORTANT: Do not reference `google` directly. If the GIS script hasn't loaded yet,
  // the identifier doesn't exist and would throw a ReferenceError.
  const g = (globalThis as any).google as any;
  return g?.accounts?.oauth2?.initTokenClient as InitTokenClient | undefined;
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

  // Generate and store state parameter for CSRF protection
  const state = generateState();
  storeState(state);

  const scope = opts.scopes.join(' ');
  const token = await new Promise<{ access_token: string; expires_in?: number; scope?: string }>((resolve, reject) => {
    const client = initTokenClient({
      client_id: clientId,
      scope,
      state, // Add state parameter to OAuth request
      callback: (resp) => {
        // Validate state parameter first
        try {
          validateState(resp.state);
        } catch (error) {
          reject(error);
          return;
        }

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

