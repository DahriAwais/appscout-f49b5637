import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const setup = spawnSync(
  process.execPath,
  [fileURLToPath(new URL('./setup-mobile.mjs', import.meta.url))],
  { stdio: 'inherit' },
);
if (setup.status !== 0) process.exit(setup.status ?? 1);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const script of ['desktop:check', 'desktop:build']) {
  const result = spawnSync(npm, ['run', script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
