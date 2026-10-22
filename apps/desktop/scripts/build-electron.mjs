import { build } from 'esbuild';
const common = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  external: ['electron', 'better-sqlite3', 'google-play-scraper', 'electron-updater'],
};
await Promise.all([
  build({
    ...common,
    entryPoints: ['electron/main.ts'],
    outfile: 'dist-electron/main.mjs',
    format: 'esm',
  }),
  build({
    ...common,
    entryPoints: ['electron/preload.ts'],
    outfile: 'dist-electron/preload.cjs',
    format: 'cjs',
  }),
]);
