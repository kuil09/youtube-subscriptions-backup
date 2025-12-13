# YouTube Subscriptions Manager (Static Web)

Read this in: **English** | [한국어](README.ko.md) | [日本語](README.ja.md)

A **static web app** that helps you back up and reorganize your YouTube subscriptions.

Core features:
- Show **how many channels you’re subscribed to**
- **Export** your subscriptions to a file (JSON/CSV)
- **Cleanup**: export first, then unsubscribe from all (requires explicit typed confirmation)
- **Import** an edited export file and subscribe to missing channels from the browser

The UI supports **Korean / English / Japanese** and defaults to your browser language (you can override it from the language selector).

## Tech
- Vite + TypeScript
- Google OAuth via **Google Identity Services (GIS) Token Client**
- YouTube Data API v3

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
  - Examples: `http://localhost:5173`, your deployed domain.

3) **Configure the Client ID**
- Set `VITE_GOOGLE_OAUTH_CLIENT_ID` as a build-time environment variable.
- For GitHub Pages deploy, add a GitHub Actions secret named `VITE_GOOGLE_OAUTH_CLIENT_ID` (the workflow injects it during `npm run build`).

## OAuth scopes
- Read-only operations use:
  - `https://www.googleapis.com/auth/youtube.readonly`
- Subscription changes (unsubscribe/subscribe) use:
  - `https://www.googleapis.com/auth/youtube`

## Import format

### JSON (recommended)
The app’s JSON export includes `channelId` per entry. Import expects `channelId` (or a URL containing `/channel/<id>`).

### CSV
CSV should include at least a `channelId` column.

## Notes / safety
- **Unsubscribe/Subscribe actions change your real account immediately.** Always export a backup first.
- Large subscription lists may hit quota/rate limits; the app uses backoff and pacing but failures can still happen.

## Project structure
- `index.html` — main page
- `src/web/` — web app (OAuth, i18n, UI logic)
- `src/shared/` — shared utilities/types
