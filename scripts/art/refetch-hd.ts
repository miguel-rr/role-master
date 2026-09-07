/**
 * Re-downloads specific Forgotten Realms scenes at up to 1920 px for
 * full-screen use (the bulk sync caps scenes at 1500).
 *
 *   pnpm art:hd scenes/fr/crimman-club scenes/fr/klauthen-vale …
 *   pnpm art:hd "File:Underdark Forest AFR.jpg"   # adds a new scene entry
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { artManifestSchema } from '../../src/data/art/schema';
import { slugify } from './jobs';
import { politeFetch } from './wiki';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const MAX_SIDE = 1920;
const ids = process.argv.slice(2);

const main = async () => {
  const file = path.join(ROOT, 'src/data/art/manifests/scenes-fr.json');
  const manifest = artManifestSchema.parse(
    JSON.parse(await readFile(file, 'utf8')),
  );
  for (const id of ids) {
    let entry = manifest.entries.find((e) => e.id === id);
    let title: string;
    if (entry) {
      title = decodeURIComponent(entry.source.page.split('/wiki/')[1] ?? '');
    } else if (id.startsWith('File:')) {
      // A hand-picked wiki file the bulk sync did not bring: add it.
      title = id;
      const stem = id.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
      const slug = slugify(stem);
      entry = {
        id: `scenes/fr/${slug}`,
        src: `/art/scenes/fr/${slug}.webp`,
        width: 1,
        height: 1,
        title: stem,
        tags: ['scene', 'picked'],
        cats: [],
        source: {
          site: 'fr',
          page: `https://forgottenrealms.fandom.com/wiki/${encodeURIComponent(id.replace(/ /g, '_'))}`,
        },
      };
      manifest.entries.push(entry);
    } else {
      console.warn(`! ${id}: no está en scenes-fr`);
      continue;
    }
    const api = `https://forgottenrealms.fandom.com/api.php?${new URLSearchParams(
      {
        action: 'query',
        format: 'json',
        formatversion: '2',
        titles: title,
        prop: 'imageinfo',
        iiprop: 'url|size',
      },
    )}`;
    const data = (await (await politeFetch(api)).json()) as {
      query?: { pages?: { imageinfo?: { url: string; width: number }[] }[] };
    };
    const info = data.query?.pages?.[0]?.imageinfo?.[0];
    if (!info) {
      console.warn(`! ${id}: sin imageinfo`);
      continue;
    }
    const [base, query] = info.url.split('?');
    const url =
      info.width > MAX_SIDE
        ? `${base}/scale-to-width-down/${MAX_SIDE}${query ? `?${query}` : ''}`
        : info.url;
    const buf = Buffer.from(
      await (await politeFetch(url, { minIntervalMs: 400 })).arrayBuffer(),
    );
    const { data: out, info: meta } = await sharp(buf)
      .rotate()
      .resize({
        width: MAX_SIDE,
        height: MAX_SIDE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: '#1b1512' })
      .webp({ quality: 80, effort: 4, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    await writeFile(path.join(ROOT, 'public', entry.src), out);
    entry.width = meta.width;
    entry.height = meta.height;
    console.log(
      `✔ ${id} → ${meta.width}×${meta.height} (${Math.round(out.length / 1024)} KB)`,
    );
  }
  manifest.generatedAt = new Date().toISOString();
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
};

await main();
