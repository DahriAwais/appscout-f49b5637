import {
  existsSync,
  mkdirSync,
  renameSync,
  symlinkSync,
  lstatSync,
  readFileSync,
  unlinkSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mobile = resolve(root, 'apps/mobile');
mkdirSync(mobile, { recursive: true });
// Metro route contexts need a real directory, not a directory symlink.
const routeSource = resolve(mobile, 'app');
const routeEntry = resolve(root, 'app');
if (existsSync(routeEntry) && lstatSync(routeEntry).isSymbolicLink()) unlinkSync(routeEntry);
if (existsSync(routeEntry) && lstatSync(routeEntry).isFile() && existsSync(routeSource)) {
  const text = readFileSync(routeEntry, 'utf8').trim().replaceAll('\\', '/');
  if (text === relative(root, routeSource).replaceAll('\\', '/')) unlinkSync(routeEntry);
}
if (existsSync(routeEntry) && !existsSync(routeSource)) renameSync(routeEntry, routeSource);
function addRouteEntries(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = resolve(folder, entry.name);
    if (entry.isDirectory()) addRouteEntries(file);
    else if (/\.[jt]sx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      const destination = resolve(routeEntry, relative(routeSource, file));
      mkdirSync(dirname(destination), { recursive: true });
      let modulePath = relative(dirname(destination), file).replaceAll('\\', '/');
      modulePath = modulePath.slice(0, -extname(modulePath).length);
      if (!modulePath.startsWith('.')) modulePath = `./${modulePath}`;
      const content = `// Expo compatibility entry; canonical screen lives in apps/mobile.\nexport { default } from '${modulePath}';\nexport * from '${modulePath}';\n`;
      if (!existsSync(destination) || readFileSync(destination, 'utf8') !== content)
        writeFileSync(destination, content);
    }
  }
}
if (existsSync(routeSource)) addRouteEntries(routeSource);
for (const name of ['assets', 'components', 'hooks', 'lib', 'global.css']) {
  const source = resolve(root, name),
    target = resolve(mobile, name);
  if (existsSync(source) && lstatSync(source).isSymbolicLink()) continue;
  // Git on Windows can check a symlink out as its small path-text file.
  if (existsSync(source) && existsSync(target) && lstatSync(source).isFile()) {
    const text = readFileSync(source, 'utf8').trim().replaceAll('\\', '/');
    if (text === relative(root, target).replaceAll('\\', '/')) unlinkSync(source);
  }
  if (existsSync(source) && !existsSync(target)) renameSync(source, target);
  if (!existsSync(source) && existsSync(target))
    symlinkSync(
      process.platform === 'win32' ? target : relative(root, target),
      source,
      name.endsWith('.css') ? 'file' : process.platform === 'win32' ? 'junction' : 'dir',
    );
}
