# AppScout MRR — Windows desktop

Electron + React DOM + Vite + TypeScript. The mobile app is preserved in `apps/mobile`; domain logic lives in `packages/core`. Root compatibility route entries and asset/module links keep the existing Expo entry and configuration working. Desktop does not call the cloud scraper.

## Run from the repository root

Use Node 22 LTS and npm 10+. On Windows enable Developer Mode before the first install: the monorepo setup creates directory junctions and a `global.css` compatibility symlink.

```sh
npm install
npm run desktop:check
npm run desktop:dev
npm run desktop:build
npm run desktop:package
```

The last command produces an unsigned Windows x64 NSIS installer in `apps/desktop/release`. Build and smoke-test it on Windows. `desktop:dev` builds the main/preload scripts once, starts Vite and launches Electron; renderer has hot reload. Restart the command after changing main/preload code.

Mobile continues to use the root Expo scripts, or `npm run start -w @appscout/mobile`. App source/assets/components/hooks/lib are physically under `apps/mobile`. Root Expo/Babel/Metro configuration and publish identity are intentionally preserved; mobile dependencies remain root-managed for preview compatibility.

## Source layout

- `packages/core/src`: pure estimator, insights, review-trend logic, types, scraper adapter and config constants.
- `apps/desktop/electron`: main process, scraper service, SQLite cache, validated typed IPC and sandboxed preload.
- `apps/desktop/src`: desktop React UI, styling, charts and interactions.

## Data and estimates

Google Play scraper runs only in the main process. Three concurrent jobs, 350–600 ms delay, up to three attempts with exponential backoff, in-flight deduplication and 24-hour country-scoped SQLite cache. Lists contain about 50 apps and detail cards fill progressively. Listing keyword search fetches up to 50 Google Play candidates and matches their title, summary and description; it is not store-wide ASO ranking data. Scraper endpoints: app details, search, top-free category charts, recent dated reviews, developer and similar apps.

SQLite is at Electron's `app.getPath('userData')/appscout.sqlite`. Offline mode returns cached observations (including expired ones, labeled stale). Data not previously cached remains unavailable. No account required. Images use public Google Play URLs and may still need a network connection; offline metadata is supported, media downloading is not implemented.

Watchlist observations are country-scoped and refreshed on launch and hourly while running; the 24-hour cache gates fresh network data. Snapshots are keyed by the app's **actual observation date**, never today's date for stale cached data. No synthetic past observations and no closed-app-day backfill. Rating growth needs at least seven observations covering six days.

Default paid conversion is **6% for apps with listed IAP**, not a measured benchmark. No listed ads/IAP or missing installs means automatic estimate unavailable, not $0. Saved custom scenarios can explicitly model streams. Headline shows a **single estimate**, overriding the earlier range brief. Internal range math is unchanged; chart bands show assumption uncertainty only. Purchases + ads are modeled monthly revenue, **not verified subscription MRR**. Review-activity charts are labeled proxies; when dated evidence is insufficient, the card uses an explicitly labeled conversion/eCPM sensitivity graph, not invented history. DAU assumes 20% of modeled MAU. Install charts show observed public lower bounds, not exact total downloads. No invented benchmarks, ASO rankings or growth history.

## Desktop behavior

240px sidebar collapses to 72px; minimum window size 1024×700. Ctrl+K opens search/command palette (apps, developer search, listing keyword search and page jumps); Ctrl+D toggles current app watchlist; Esc closes drawer/palette or returns to results; Left/Right switches result apps. Compare accepts 2–4 apps. Grid and sortable table include filters and column visibility. CSV exports source dates, market, stale/cache status, scenario source and assumption inputs, and escapes formula injection. Dated review lists are virtualized. PDF exports the visible report using Electron print styles. Screenshots are 240×426 and horizontally scrollable.

Windows 11 Mica is requested where supported; the app body stays white. Windows 10 uses a normal light window. Main process validates trusted top-frame senders and Zod inputs. Renderer has context isolation, sandboxing, no Node integration, denied permissions and external navigation blocked. Google Play links are opened through a constrained main-process action. Preload exposes no arbitrary channel, SQL, filesystem path or shell execution.

## Release and automatic updates

Default packaging is unsigned and has **no active update feed**. Update controls are disabled in that build. Copy `electron-builder.release.example.json` to a private release config, replace the publisher and HTTPS update URL, and configure certificate credentials through the CI secret store (`CSC_LINK`, `CSC_KEY_PASSWORD`) or your signing service. Never commit a certificate or password. Publish `latest.yml`, installer and `.blockmap` to the same feed, then package with:

```sh
npm run build -w @appscout/desktop
cd apps/desktop
npx electron-builder --win nsis --config electron-builder.release.json --publish never
```

The example enforces signing. After configuring `electron-builder.release.json`, `npm run package:release -w @appscout/desktop` runs this release path. `electron-updater` checks only packaged builds with `app-update.yml`. It can check/download, reports errors, and installs only after the user chooses Restart & install. On-launch checks are opt-in. Do not ship the example URL. The supplied GitHub Actions workflow is a **manual unsigned build** for smoke testing; configure signing/feed separately for release.

## Windows acceptance checks

Verify installer/uninstaller, SQLite native module loading, fresh/cached/offline feeds, country switching, watchlist snapshot date after 24h, scraper failure/retry, long app names, all detail sections at 1024×700 and 1920×1080, Ctrl+K/D/Esc/arrows, context menu, compare limit, CSV and PDF exports, and signed updater download/restart. Windows runtime, Mica, NSIS installation and update delivery cannot be validated in the mobile web preview. Source checks and renderer/main bundles do not substitute for Windows smoke tests.
