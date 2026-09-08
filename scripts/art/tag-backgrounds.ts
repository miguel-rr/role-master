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
const SCENE_MANIFESTS = ['scenes-fr'];
const TAG = 'white-bg';
const MONO = 'mono';

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

/** Mean colour saturation (0-255) over a thumbnail: line art scores near 0. */
const saturation = async (file: string) => {
  const { data, info } = await sharp(file)
    .resize(64, 64, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  const n = info.width * info.height;
  for (let i = 0; i < n; i += 1) {
    const r = data[i * 3] ?? 0;
    const g = data[i * 3 + 1] ?? 0;
    const b = data[i * 3 + 2] ?? 0;
    sum += Math.max(r, g, b) - Math.min(r, g, b);
  }
  return sum / n;
};

const main = async () => {
  for (const name of SCENE_MANIFESTS) {
    const file = path.join(ROOT, 'src/data/art/manifests', `${name}.json`);
    const manifest = artManifestSchema.parse(
      JSON.parse(await readFile(file, 'utf8')),
    );
    let flagged = 0;
    for (const entry of manifest.entries) {
      let sat: number;
      try {
        sat = await saturation(path.join(ROOT, 'public', entry.src));
      } catch {
        continue;
      }
      entry.tags = entry.tags.filter((t) => t !== MONO);
      if (sat < 14) {
        entry.tags.push(MONO);
        flagged += 1;
      }
    }
    manifest.generatedAt = new Date().toISOString();
    await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
      `${name}: ${flagged}/${manifest.entries.length} en blanco y negro`,
    );
  }
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
