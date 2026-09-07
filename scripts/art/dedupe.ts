/**
 * Marks visually duplicated portraits with a `duplicate` tag so the UI can
 * skip them, keeping the highest-resolution copy of each painting. Uses a
 * 64-bit difference hash; two images closer than MAX_DISTANCE bits are the
 * same picture (re-uploads, artbook versions, minor crops).
 *
 *   pnpm art:dedupe
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { type ArtEntry, artManifestSchema } from '../../src/data/art/schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const MANIFESTS = ['portraits-kingmaker', 'portraits-fr', 'npcs-fr'];
const TAG = 'duplicate';
const MAX_DISTANCE = 6;

/** dHash: 9×8 greyscale, each bit = left pixel brighter than its right neighbour. */
const dhash = async (file: string): Promise<bigint> => {
  const { data } = await sharp(file)
    .greyscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let hash = 0n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = data[y * 9 + x] ?? 0;
      const right = data[y * 9 + x + 1] ?? 0;
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
};

const hamming = (a: bigint, b: bigint) => {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
};

const main = async () => {
  const all: { entry: ArtEntry; manifest: string; hash: bigint }[] = [];
  const manifests = new Map<
    string,
    ReturnType<typeof artManifestSchema.parse>
  >();

  for (const name of MANIFESTS) {
    const file = path.join(ROOT, 'src/data/art/manifests', `${name}.json`);
    const manifest = artManifestSchema.parse(
      JSON.parse(await readFile(file, 'utf8')),
    );
    manifests.set(name, manifest);
    for (const entry of manifest.entries) {
      entry.tags = entry.tags.filter((t) => t !== TAG);
      try {
        const hash = await dhash(path.join(ROOT, 'public', entry.src));
        all.push({ entry, manifest: name, hash });
      } catch {
        /* unreadable file: leave as is */
      }
    }
  }

  // Best copy first: Owlcat over Wizards, then more pixels.
  const score = (e: ArtEntry) =>
    (e.source.site === 'kingmaker' ? 1e9 : 0) + e.width * e.height;
  all.sort((a, b) => score(b.entry) - score(a.entry));

  const kept: typeof all = [];
  let dupes = 0;
  for (const item of all) {
    const twin = kept.find((k) => hamming(k.hash, item.hash) <= MAX_DISTANCE);
    if (twin) {
      item.entry.tags.push(TAG);
      dupes += 1;
      console.log(`  ${item.entry.id}  ≈  ${twin.entry.id}`);
    } else {
      kept.push(item);
    }
  }

  for (const [name, manifest] of manifests) {
    manifest.generatedAt = new Date().toISOString();
    await writeFile(
      path.join(ROOT, 'src/data/art/manifests', `${name}.json`),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
  console.log(`✔ ${dupes} duplicados marcados de ${all.length} retratos`);
};

await main();
