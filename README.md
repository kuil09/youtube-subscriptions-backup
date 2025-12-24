# YouTube Subscriptions Manager (Static Web)

<p>
  <img src="public/logo-120.svg" width="120" height="120" alt="YouTube Subscriptions Manager logo" />
</p>

Read this in: **English** | [한국어](README.ko.md) | [日本語](README.ja.md)

A **static web app** that helps you back up and reorganize your **subscribed YouTube channels**.

Core features:
- Show **how many channels you’re subscribed to**
- **Export** your subscribed channels to a file (JSON/CSV)
- **Cleanup**: export first, then unsubscribe from all (requires explicit typed confirmation)
- **Import** an edited export file and subscribe to missing channels from the browser

The UI supports **Korean / English / Japanese** and defaults to your browser language (you can override it from the language selector).

## Tech
- Vite + TypeScript
- Google OAuth via **Google Identity Services (GIS) Token Client**
- YouTube Data API v3

## Legal (required for Google OAuth verification)
- Privacy Policy: `privacy.html`
- Terms of Service: `terms.html`

When deployed (e.g. GitHub Pages project site), these are typically:
- `https://<your-domain>/<your-path>/privacy.html`
- `https://<your-domain>/<your-path>/terms.html`

## Local development

```bash
npm install
npm run dev
```

This web app expects a build-time env var:

- `VITE_GOOGLE_OAUTH_CLIENT_ID`

For local development, set it before running Vite:

```bash
export VITE_GOOGLE_OAUTH_CLIENT_ID="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
npm run dev
```

Then open the URL printed by Vite.

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Google Cloud setup (required)

You need your own Google Cloud project and OAuth Client ID.

1) **Enable API**
- In Google Cloud Console, enable **YouTube Data API v3**.

2) **Create OAuth Client ID**
- Create an OAuth client of type **Web application**.
- Add your local/dev and production origins to **Authorized JavaScript origins**.
  - Examples: `http://localhost:5173`, `https://youtube.kuil09.dev`
  - ⚠️ **Important**: Add the EXACT domain where your app is hosted. Do NOT include paths (like `/index.html`).
  - ⚠️ **Do NOT add redirect URIs** - Google Identity Services (GIS) Token Client only requires JavaScript origins.

3) **Configure the Client ID**
- Set `VITE_GOOGLE_OAUTH_CLIENT_ID` as a build-time environment variable.
- For GitHub Pages deploy, add a GitHub Actions secret named `VITE_GOOGLE_OAUTH_CLIENT_ID` (the workflow injects it during `npm run build`).

## Troubleshooting OAuth errors

### Error 400: redirect_uri_mismatch

If you see an error like:
```
오류 400: redirect_uri_mismatch
앱이 Google의 OAuth 2.0 정책을 준수하지 않기 때문에 앱에 로그인할 수 없습니다.
redirect_uri=storagerelay://https/<your-domain>?id=auth...
```

**Cause**: This error occurs when your app's domain is not registered in Google Cloud Console as an authorized JavaScript origin.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Select your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, click **ADD URI**
4. Add your app's full origin (e.g., `https://youtube.kuil09.dev`)
   - For local development: `http://localhost:5173` (or the port Vite uses)
   - For production: Your exact deployment URL (without any path)
5. Click **SAVE**
6. Wait a few minutes for the changes to propagate
7. Clear your browser cache and try signing in again

**Note**: Google Identity Services uses an internal redirect URI format (`storagerelay://`) that you cannot and should not configure. You only need to add your domain to **Authorized JavaScript origins**.

## OAuth scopes
- Read-only operations use:
  - `https://www.googleapis.com/auth/youtube.readonly`
- Subscription changes (unsubscribe/subscribe) use:
  - `https://www.googleapis.com/auth/youtube`

## OAuth Security
This app implements OAuth best practices for security:
- **State parameter**: A cryptographically random state parameter is generated for each OAuth request to prevent CSRF attacks and session fixation
- **State validation**: The state is validated when the OAuth callback returns, rejecting mismatched or missing states
- **Session storage**: State values are stored in `sessionStorage` (tab-scoped) and consumed once after validation
- **Secure random generation**: Uses `crypto.getRandomValues()` with 256 bits of entropy for unpredictable state values

## Import format

### JSON (recommended)
The app’s JSON export includes `channelId` per entry. Import expects `channelId` (or a URL containing `/channel/<id>`).

### CSV
CSV should include at least a `channelId` column.

## Notes / safety
- **Unsubscribe/Subscribe actions change your real account immediately.** Always export a backup first.
- Large subscription lists may hit quota/rate limits; the app uses backoff and pacing but failures can still happen.

## Support
If this app helped you, consider supporting the project:
- `https://buymeacoffee.com/e3pbwto`

## Project structure
- `index.html` — main page
- `src/web/` — web app (OAuth, i18n, UI logic)
- `src/shared/` — shared utilities/types
