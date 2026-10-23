import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  nativeTheme,
  screen,
  type IpcMainInvokeEvent,
} from 'electron';
import updater from 'electron-updater';
const { autoUpdater } = updater;
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { release } from 'node:os';
import { z } from 'zod';
import { modeled } from '../src/model';
import { Cache } from './cache';
import { ScraperService } from './scraper';
import type { Result } from './contracts';
function csvCell(value: string | number | null | undefined) {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
const dir = dirname(fileURLToPath(import.meta.url));
const rendererFile = join(dir, '../dist/index.html');
const devURL = !app.isPackaged ? 'http://127.0.0.1:5173' : undefined;
const useDev = !!devURL && process.env.APPSCOUT_DEV_URL === devURL;
const idSchema = z
  .string()
  .min(1)
  .max(250)
  .regex(/^[a-zA-Z0-9._-]+$/);
const termSchema = z.string().trim().min(1).max(200);
const scenarioSchema = z
  .object({
    monthlyActiveLow: z.number().finite().min(0).max(1e12),
    monthlyActive: z.number().finite().min(0).max(1e12),
    monthlyActiveHigh: z.number().finite().min(0).max(1e12),
    payingPercent: z.number().min(0).max(100),
    monthlySpend: z.number().min(0).max(10000),
    impressions: z.number().min(0).max(100000),
    ecpm: z.number().min(0).max(1000),
  })
  .strict()
  .refine((s) => s.monthlyActiveLow <= s.monthlyActive && s.monthlyActive <= s.monthlyActiveHigh);
const settingsSchema = z
  .object({
    offline: z.boolean(),
    collapsed: z.boolean(),
    country: z.string().regex(/^[a-z]{2}$/),
    autoUpdates: z.boolean(),
  })
  .strict();
let win: BrowserWindow | null = null;
let splash: BrowserWindow | null = null;
let cache: Cache;
let scraper: ScraperService;
let daily: ReturnType<typeof setInterval> | undefined;
let downloaded = false;
let quitting = false;
const updateConfigured = () =>
  app.isPackaged && existsSync(join(process.resourcesPath, 'app-update.yml'));
function trusted(event: IpcMainInvokeEvent) {
  if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame)
    throw new Error('This request is not allowed.');
  const frame = event.senderFrame;
  if (
    useDev
      ? frame?.origin !== devURL
      : frame?.url.split('#')[0] !== pathToFileURL(rendererFile).href
  )
    throw new Error('This request is not allowed.');
}
function handle<T>(channel: string, handler: (...args: unknown[]) => Promise<T> | T) {
  ipcMain.handle(channel, async (event, ...args): Promise<Result<T>> => {
    try {
      trusted(event);
      return { ok: true, data: await handler(...args) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'The request failed. Please try again.',
      };
    }
  });
}
function registerIPC() {
  handle('scout:state', () => ({ ...cache.state(), updatesAvailable: updateConfigured() }));
  handle('scout:onboarding-complete', () => cache.setPreference('onboarded', true));
  handle('scout:beta-info', async () => {
    if (!win) throw new Error('The app window is not available.');
    await dialog.showMessageBox(win, {
      type: 'info',
      title: 'AppScout beta',
      message: 'AppScout is completely free.',
      detail: 'This app is in beta. You can use all current features for free.',
      buttons: ['Got it'],
      defaultId: 0,
      noLink: true,
    });
  });
  handle('scout:feed', (category, token) =>
    scraper.feed(
      z
        .enum(['All', 'Productivity', 'Tools', 'Games', 'Health', 'Education', 'Finance'])
        .parse(category),
      z.string().max(100).parse(token),
      (event) => {
        if (win && !win.isDestroyed()) win.webContents.send('scout:feed-event', event);
      },
    ),
  );
  handle('scout:keywords', (term) => scraper.keywords(termSchema.parse(term)));
  handle('scout:search', (term) => scraper.search(termSchema.parse(term)));
  handle('scout:developer', (id) => scraper.developer(termSchema.parse(id)));
  handle('scout:detail', (id) => scraper.detail(idSchema.parse(id)));
  handle('scout:reviews', (id) => scraper.reviews(idSchema.parse(id)));
  handle('scout:similar', (id) => scraper.similar(idSchema.parse(id)));
  handle('scout:history', (id) => cache.history(idSchema.parse(id)));
  handle('scout:watch', async (id, saved) => {
    const appID = idSchema.parse(id),
      enabled = z.boolean().parse(saved);
    if (enabled) cache.watch((await scraper.detail(appID)).value, true);
    else {
      const observed = cache.state().watchlist.find((a) => a.id === appID);
      if (observed) cache.watch(observed, false);
    }
    return { ...cache.state(), updatesAvailable: updateConfigured() };
  });
  handle('scout:scenario', (id, value) => {
    const appID = idSchema.parse(id),
      scenario = scenarioSchema.parse(value);
    cache.setPreference('scenarios', { ...cache.state().scenarios, [appID]: scenario });
  });
  handle('scout:settings', (value) => cache.setPreference('settings', settingsSchema.parse(value)));
  handle('scout:window', (action) => {
    switch (z.enum(['minimize', 'maximize', 'close']).parse(action)) {
      case 'minimize':
        win?.minimize();
        break;
      case 'maximize':
        if (win?.isMaximized()) win.unmaximize();
        else win?.maximize();
        break;
      case 'close':
        win?.close();
    }
  });
  handle('scout:store', async (id) => {
    await shell.openExternal(
      `https://play.google.com/store/apps/details?id=${encodeURIComponent(idSchema.parse(id))}`,
    );
  });
  handle('scout:csv', async (ids) => {
    if (!win) return false;
    const appIDs = z.array(idSchema).max(200).parse(ids);
    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'AppScout.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (result.canceled || !result.filePath) return false;
    const exportState = cache.state();
    const records = await Promise.all(
      appIDs.map(async (id) => {
        const observation = await scraper.detail(id, exportState.settings.country);
        const a = observation.value;
        const model = modeled(a, exportState.scenarios[id]);
        const inputs = model.inputs;
        const revenue = model.result.mid;
        return [
          a.name,
          a.id,
          a.category,
          a.developer,
          revenue,
          a.installs,
          a.rating,
          a.updated ? new Date(a.updated).toISOString() : '',
          a.fetchedAt,
          exportState.settings.country,
          [model.basis, model.note].filter(Boolean).join(' · '),
          observation.stale ? 'Stale cache' : observation.cached ? 'Cached' : 'Fresh',
          inputs.monthlyActive,
          inputs.payingPercent,
          inputs.monthlySpend,
          inputs.impressions,
          inputs.ecpm,
          'Modeled monthly revenue; not verified subscription MRR',
        ];
      }),
    );
    await writeFile(
      result.filePath,
      '\uFEFF' +
        [
          [
            'Name',
            'App ID',
            'Category',
            'Developer',
            'Estimated monthly revenue USD',
            'Minimum installs',
            'Rating',
            'Updated',
            'Observed at',
            'Market',
            'Scenario source',
            'Observation status',
            'Assumed MAU',
            'Assumed paid conversion percent',
            'Assumed monthly spend USD',
            'Assumed monthly impressions per user',
            'Assumed eCPM USD',
            'Revenue provenance',
          ],
          ...records,
        ]
          .map((row) => row.map(csvCell).join(','))
          .join('\r\n'),
      'utf8',
    );
    return true;
  });
  handle('scout:pdf', async () => {
    if (!win) return false;
    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'AppScout-report.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) return false;
    await writeFile(
      result.filePath,
      await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' }),
    );
    return true;
  });
  handle('scout:update', async () => {
    if (!updateConfigured()) return 'Update feed is not configured for this build.';
    if (cache.state().settings.offline) return 'Turn off offline mode to check for updates.';
    await autoUpdater.checkForUpdates();
    return 'Update check complete.';
  });
  handle('scout:install-update', () => {
    if (!downloaded) throw new Error('No downloaded update is ready.');
    autoUpdater.quitAndInstall();
  });
}
async function createWindow() {
  const mica = process.platform === 'win32' && Number(release().split('.')[2]) >= 22000;
  const { workArea } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    width: Math.min(1100, workArea.width),
    height: Math.min(700, workArea.height),
    minWidth: Math.min(800, workArea.width),
    minHeight: Math.min(550, workArea.height),
    x: workArea.x + Math.floor((workArea.width - Math.min(1100, workArea.width)) / 2),
    y: workArea.y + Math.floor((workArea.height - Math.min(700, workArea.height)) / 2),
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    fullscreen: false,
    show: false,
    backgroundColor: '#F7F8FA',
    ...(mica ? { backgroundMaterial: 'mica' as const } : {}),
    icon: join(dir, '../dist/icon.png'),
    webPreferences: {
      preload: join(dir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  splash = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    show: false,
    alwaysOnTop: true,
    backgroundColor: '#FFFFFF',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  const mainWindow = win;
  const splashWindow = splash;
  let splashShownAt = 0;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  function closeSplash() {
    if (!splashWindow.isDestroyed()) splashWindow.close();
    if (splash === splashWindow) splash = null;
  }
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== (useDev ? devURL : pathToFileURL(rendererFile).href))
      event.preventDefault();
  });
  mainWindow.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  mainWindow.webContents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
    if (!isMainFrame || code === -3 || mainWindow.isDestroyed()) return;
    clearTimeout(revealTimer);
    closeSplash();
    void dialog.showMessageBox({
      type: 'error',
      message: 'AppScout could not open. Reinstall the app or try restarting it.',
    });
  });
  mainWindow.once('ready-to-show', () => {
    if (mainWindow.isDestroyed()) return;
    revealTimer = setTimeout(
      () => {
        if (mainWindow.isDestroyed()) return;
        closeSplash();
        mainWindow.show();
      },
      Math.max(0, 2000 - (Date.now() - splashShownAt)),
    );
  });
  mainWindow.on('closed', () => {
    clearTimeout(revealTimer);
    closeSplash();
    if (win === mainWindow) win = null;
  });
  splashWindow.on('closed', () => {
    if (splash === splashWindow) splash = null;
  });
  await splashWindow.loadFile(join(dir, useDev ? '../public/splash.html' : '../dist/splash.html'));
  if (mainWindow.isDestroyed()) return;
  if (!splashWindow.isDestroyed()) {
    splashWindow.center();
    splashWindow.show();
  }
  splashShownAt = Date.now();
  if (useDev) await mainWindow.loadURL(devURL);
  else await mainWindow.loadFile(rendererFile);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (win?.isMinimized()) win.restore();
    win?.focus();
  });
  app
    .whenReady()
    .then(async () => {
      nativeTheme.themeSource = 'light';
      cache = new Cache(join(app.getPath('userData'), 'appscout.sqlite'));
      scraper = new ScraperService(cache);
      registerIPC();
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = false;
      for (const [event, message] of [
        ['update-available', 'Downloading update…'],
        ['update-not-available', 'You are up to date.'],
        ['update-downloaded', 'Update ready. Restart to install.'],
      ] as const)
        autoUpdater.on(event, () => {
          if (event === 'update-downloaded') downloaded = true;
          win?.webContents.send('scout:update-event', message);
        });
      autoUpdater.on('error', () =>
        win?.webContents.send('scout:update-event', 'Update check failed. Please try again.'),
      );
      await createWindow();
      if (quitting) return;
      await scraper.dailySnapshots();
      if (quitting) return;
      daily = setInterval(
        () => {
          void scraper.dailySnapshots();
        },
        60 * 60 * 1000,
      );
      if (
        updateConfigured() &&
        cache.state().settings.autoUpdates &&
        !cache.state().settings.offline
      )
        void autoUpdater.checkForUpdates().catch(() => {});
    })
    .catch((error) => {
      if (quitting) return;
      dialog.showErrorBox(
        'AppScout could not start',
        error instanceof Error ? error.message : 'Please reinstall the app.',
      );
      app.quit();
    });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    if (quitting) return;
    quitting = true;
    if (daily) clearInterval(daily);
    cache?.close();
  });
}
