/**
 * Removes the black-and-white backgrounds from the catalogue for good: the
 * `mono`-tagged scenes and the Doré engravings. Deletes the files too, and
 * marks the hand-picked backgrounds of the design lab as `featured`.
 *
 *   pnpm art:prune-mono
 */
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { artManifestSchema } from '../../src/data/art/schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const MANIFESTS = path.join(ROOT, 'src/data/art/manifests');

/** Backgrounds chosen by hand for /design/scenes: the bar for the rest. */
const FEATURED = [
  'scenes/fr/crimman-club',
  'scenes/fr/wave-echo-cave-entrance',
  'scenes/fr/underdark-forest-afr',
  'scenes/fr/cloister-of-sombre-embrace7',
  'scenes/fr/neverwinter-wood-drizzl',
  'scenes/fr/klauthen-vale',
  'scenes/fr/triboar-trail-klaus-pillon',
  'scenes/fr/castle-ravenloft-5e',
];

const load = async (name: string) =>
  artManifestSchema.parse(
    JSON.parse(await readFile(path.join(MANIFESTS, `${name}.json`), 'utf8')),
  );

const save = async (
  name: string,
  manifest: Awaited<ReturnType<typeof load>>,
) => {
  manifest.generatedAt = new Date().toISOString();
  await writeFile(
    path.join(MANIFESTS, `${name}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
};

const unlink = async (src: string) => {
  await rm(path.join(ROOT, 'public', src), { force: true });
};

const main = async () => {
  // 1. Mono scenes in the Forgotten Realms collection.
  const fr = await load('scenes-fr');
  const mono = fr.entries.filter((e) => e.tags.includes('mono'));
  for (const e of mono) await unlink(e.src);
  fr.entries = fr.entries.filter((e) => !e.tags.includes('mono'));
  let featured = 0;
  for (const e of fr.entries) {
    e.tags = e.tags.filter((t) => t !== 'featured');
    if (FEATURED.includes(e.id)) {
      e.tags.push('featured');
      featured += 1;
    }
  }
  await save('scenes-fr', fr);
  console.log(
    `scenes-fr: ${mono.length} fondos en blanco y negro eliminados, ${fr.entries.length} quedan, ${featured} destacados`,
  );

  // 2. The Doré engravings: all ink, all out.
  try {
    const dore = await load('scenes-dore');
    for (const e of dore.entries) await unlink(e.src);
    await rm(path.join(MANIFESTS, 'scenes-dore.json'), { force: true });
    await rm(path.join(ROOT, 'public/art/scenes/dore'), {
      recursive: true,
      force: true,
    });
    console.log(`scenes-dore: ${dore.entries.length} grabados eliminados`);
  } catch {
    console.log('scenes-dore: ya no existe');
  }
};

await main();
