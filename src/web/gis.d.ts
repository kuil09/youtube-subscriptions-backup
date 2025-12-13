export {};

declare global {
  // Minimal Google Identity Services typings for Token Client usage.
  // Loaded from: https://accounts.google.com/gsi/client
  const google: undefined | {
    accounts?: {
      oauth2?: {
        initTokenClient?: (cfg: {
          client_id: string;
          scope: string;
          callback: (resp: {
            access_token?: string;
            expires_in?: number;
            scope?: string;
            token_type?: string;
            error?: string;
            error_description?: string;
          }) => void;
        }) => {
          requestAccessToken: (opts?: { prompt?: '' | 'none' | 'consent' }) => void;
        };
      };
    };
  };
}

