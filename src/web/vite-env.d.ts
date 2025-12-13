/// <reference types="vite/client" />

export {};

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string;
  }
}

