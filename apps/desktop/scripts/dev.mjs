import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import electron from 'electron';
import './copy-icon.mjs';
import './build-electron.mjs';
const vite = spawn(process.execPath, ['../../node_modules/vite/bin/vite.js'], { stdio: 'inherit' });
let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    ready = (await fetch('http://127.0.0.1:5173')).ok;
  } catch {}
  if (ready) break;
  await setTimeout(500);
}
if (!ready) {
  vite.kill();
  throw new Error('Vite did not start. Check the terminal output.');
}
const desktop = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, APPSCOUT_DEV_URL: 'http://127.0.0.1:5173' },
});
desktop.on('exit', (code) => {
  vite.kill();
  process.exitCode = code ?? 0;
});
process.on('SIGINT', () => {
  desktop.kill();
  vite.kill();
});
