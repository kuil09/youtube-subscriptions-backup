import { defineConfig } from 'vite';

export default defineConfig({
  // static hosting friendly (relative assets)
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true
  },
  server: {
    // default Vite dev server; no extension-specific CORS hacks needed
  }
});
