/**
 * Adds a `white-bg` tag to portrait entries whose corners are near-white
 * (the PHB-style cut-out illustrations), so the UI can prefer paintings with
 * a real background. Works on the files already downloaded; no network.
 *
 *   pnpm art:tag-backgrounds
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { artManifestSchema } from '../../src/data/art/schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const MANIFESTS = ['portraits-fr', 'npcs-fr', 'monsters-fr'];
const TAG = 'white-bg';

/** Mean luminance (0-255) of a small patch at each corner. */
const cornerLuminance = async (file: string) => {
  const img = sharp(file);
  const { width = 0, height = 0 } = await img.metadata();
  const s = Math.max(4, Math.floor(Math.min(width, height) * 0.04));
  const patches = [
    { left: 0, top: 0 },
    { left: width - s, top: 0 },
    { left: 0, top: height - s },
    { left: width - s, top: height - s },
  ];
  const values: number[] = [];
  for (const p of patches) {
    const { data } = await sharp(file)
      .extract({ ...p, width: s, height: s })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let sum = 0;
    for (const b of data) sum += b;
    values.push(sum / data.length);
  }
  return values;
};

const main = async () => {
  for (const name of MANIFESTS) {
    const file = path.join(ROOT, 'src/data/art/manifests', `${name}.json`);
    const manifest = artManifestSchema.parse(
      JSON.parse(await readFile(file, 'utf8')),
    );
    let flagged = 0;
    for (const entry of manifest.entries) {
      const abs = path.join(ROOT, 'public', entry.src);
      let lum: number[];
      try {
        lum = await cornerLuminance(abs);
      } catch {
        continue;
      }
      const whiteCorners = lum.filter((v) => v > 232).length;
      const isWhite = whiteCorners >= 3;
      entry.tags = entry.tags.filter((t) => t !== TAG);
      if (isWhite) {
        entry.tags.push(TAG);
        flagged += 1;
      }
    }
    manifest.generatedAt = new Date().toISOString();
    await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
      `${name}: ${flagged}/${manifest.entries.length} con fondo blanco`,
    );
  }
};

await main();
