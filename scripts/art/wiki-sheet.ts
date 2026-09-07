/**
 * Contact sheet straight from a Forgotten Realms Wiki category (thumbnails,
 * nothing is added to the catalogue). For choosing scene backgrounds by eye.
 *
 *   pnpm art:wiki-sheet "Images of palaces" [--min 1000] [--max 60]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { makeWiki, politeFetch } from './wiki';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const args = process.argv.slice(2);
const category = args[0] ?? '';
const opt = (n: string, d: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? (args[i + 1] ?? d) : d;
};
const MIN = Number(opt('--min', '1000'));
const MAX = Number(opt('--max', '60'));
const TILE_W = 200;
const TILE_H = 150;
const COLS = 6;

const main = async () => {
  const wiki = makeWiki({
    apiUrl: 'https://forgottenrealms.fandom.com/api.php',
  });
  const files = (await wiki.files(category, { withCategories: true }))
    .filter(
      (f) =>
        /^image\/(jpeg|png|webp)$/.test(f.info.mime) && f.info.width >= MIN,
    )
    .filter(
      (f) =>
        !f.categories.some((c) =>
          /Maps|Screenshots|Book covers|Miniatures|Comics|Logos|Symbols|Icons/i.test(
            c,
          ),
        ),
    )
    .sort((a, b) => b.info.width * b.info.height - a.info.width * a.info.height)
    .slice(0, MAX);
  const tiles = [];
  for (const [i, f] of files.entries()) {
    const [base, q] = f.info.url.split('?');
    const url = `${base}/scale-to-width-down/400${q ? `?${q}` : ''}`;
    try {
      const buf = Buffer.from(
        await (await politeFetch(url, { minIntervalMs: 250 })).arrayBuffer(),
      );
      const img = await sharp(buf)
        .resize(TILE_W, TILE_H, { fit: 'cover', position: 'attention' })
        .toBuffer();
      const label = Buffer.from(
        `<svg width="${TILE_W}" height="${TILE_H}"><rect width="34" height="22" fill="#000" fill-opacity="0.7"/><text x="6" y="16" font-family="Helvetica" font-size="14" font-weight="bold" fill="#fff">${i}</text></svg>`,
      );
      tiles.push({
        input: await sharp(img)
          .composite([{ input: label, left: 0, top: 0 }])
          .toBuffer(),
        left: (i % COLS) * TILE_W,
        top: Math.floor(i / COLS) * TILE_H,
      });
      console.log(`${i} → File:${f.title}  (${f.info.width}×${f.info.height})`);
    } catch (e) {
      console.warn(`${i} ✗ ${f.title}: ${(e as Error).message}`);
    }
  }
  const out = path.join(
    ROOT,
    '.sheets',
    `wiki-${category.replace(/[^a-z0-9]+/gi, '-')}.jpg`,
  );
  await sharp({
    create: {
      width: COLS * TILE_W,
      height: Math.max(1, Math.ceil(files.length / COLS)) * TILE_H,
      channels: 3,
      background: '#111',
    },
  })
    .composite(tiles)
    .jpeg({ quality: 82 })
    .toFile(out);
  console.log(`\n${files.length} → ${out}`);
};

await main();
