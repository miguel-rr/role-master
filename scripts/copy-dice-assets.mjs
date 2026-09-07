// @3d-dice/dice-box loads its WASM physics engine and themes from a public
// URL at runtime, so its assets must live under public/. Runs on install.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules/@3d-dice/dice-box/dist/assets');
const dest = path.join(root, 'public/assets/dice-box');

if (!existsSync(src)) {
  console.warn('dice-box assets not found; skipping copy');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`dice-box assets → ${path.relative(root, dest)}`);
