/**
 * Renders a numbered contact sheet of catalogue entries so a human can pick
 * the best pieces for a scene by eye.
 *
 *   pnpm art:sheet <manifest> <tag>[,<tag>…] [--max 40] [--out file.jpg]
 *   pnpm art:sheet scenes-fr taverns,inns --max 40
 *
 * Prints `index → id` so the choice can be copied into code.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { artManifestSchema } from '../../src/data/art/schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');

const args = process.argv.slice(2);
const [manifestName, tagList] = args;
const opt = (name: string, def: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};
const MAX = Number(opt('--max', '40'));
const OUT = opt(
  '--out',
  path.join(
    ROOT,
    '.sheets',
    `${manifestName}-${(tagList ?? 'all').replace(/[^a-z0-9]+/gi, '-')}.jpg`,
  ),
);
const TILE_W = 200;
const TILE_H = 150;
const COLS = 6;

const main = async () => {
  if (!manifestName) throw new Error('manifest name required');
  const manifest = artManifestSchema.parse(
    JSON.parse(
      await readFile(
        path.join(ROOT, 'src/data/art/manifests', `${manifestName}.json`),
        'utf8',
      ),
    ),
  );
  const tags = tagList ? tagList.split(',') : [];
  const entries = manifest.entries
    .filter((e) => tags.length === 0 || tags.some((t) => e.tags.includes(t)))
    .filter((e) => !e.tags.includes('duplicate'))
    .slice(0, MAX);

  const tiles = [];
  for (const [i, e] of entries.entries()) {
    const img = await sharp(path.join(ROOT, 'public', e.src))
      .resize(TILE_W, TILE_H, { fit: 'cover', position: 'attention' })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${TILE_W}" height="${TILE_H}"><rect x="0" y="0" width="34" height="22" fill="#000" fill-opacity="0.7"/><text x="6" y="16" font-family="Helvetica" font-size="14" font-weight="bold" fill="#fff">${i}</text></svg>`,
    );
    const tile = await sharp(img)
      .composite([{ input: label, left: 0, top: 0 }])
      .toBuffer();
    tiles.push({
      input: tile,
      left: (i % COLS) * TILE_W,
      top: Math.floor(i / COLS) * TILE_H,
    });
    console.log(`${i} → ${e.id}  (${e.width}×${e.height}) ${e.title}`);
  }
  await sharp({
    create: {
      width: COLS * TILE_W,
      height: Math.max(1, Math.ceil(tiles.length / COLS)) * TILE_H,
      channels: 3,
      background: '#111',
    },
  })
    .composite(tiles)
    .jpeg({ quality: 82 })
    .toFile(OUT);
  console.log(`\n${entries.length} tiles → ${OUT}`);
};

await main();
