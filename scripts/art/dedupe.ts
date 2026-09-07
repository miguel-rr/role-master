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
/**
 * Bits of difference tolerated. Within the Owlcat series the re-uploads are
 * the same painting at another resolution or with a colour variant, so the
 * bar is lower; across series a looser match would pair unrelated art.
 */
const DISTANCE_SAME_OWLCAT = 11;
const DISTANCE_SAME_WIZARDS = 10;
const DISTANCE_CROSS = 6;

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

/** Same hash on the central 70 % of the picture: catches re-framed copies. */
const centerHash = async (file: string): Promise<bigint> => {
  const { width = 0, height = 0 } = await sharp(file).metadata();
  const cw = Math.max(9, Math.floor(width * 0.7));
  const ch = Math.max(8, Math.floor(height * 0.7));
  const { data } = await sharp(file)
    .extract({
      left: Math.floor((width - cw) / 2),
      top: Math.floor(height * 0.1),
      width: cw,
      height: Math.min(ch, height - Math.floor(height * 0.1)),
    })
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

/**
 * Owlcat re-paints named characters in variants (artbook, evil, undead,
 * scarred, before/after) that a hash may not pair. Group those by character
 * name and keep one. Generic portraits ("PlayerFighter02", "DwarfMaleRogue")
 * reduce to an empty key and are left to the hash pass.
 */
const OWLCAT_STRIP = [
  'artbook',
  'player',
  'female',
  'male',
  'nogender',
  'human',
  'elf',
  'dwarf',
  'gnome',
  'halfling',
  'halfelf',
  'halforc',
  'aasimar',
  'tiefling',
  'dhampir',
  'kitsune',
  'oread',
  'halfsuccubus',
  'succubus',
  'demonlord',
  'demonic',
  'demon',
  'devil',
  'undead',
  'lich',
  'angel',
  'azata',
  'aeon',
  'trickster',
  'golddragon',
  'dragon',
  'mongrel',
  'android',
  'mythic',
  'locust',
  'swarm',
  'goddess',
  'evil',
  'good',
  'magic',
  'twin',
  'scars',
  'scar',
  'blind',
  'oldversion',
  'old',
  'version',
  'hide',
  'show',
  'corrupted',
  'pet',
  'sentient',
  'weapon',
  'hellknight',
  'witheye',
  'nohand',
  'now',
  'before',
  'witch',
  'shaman',
  'oracle',
  'mage',
  'tank',
  'archer',
  'noble',
  'priest',
  'rogue',
  'fighter',
  'monk',
  'zen',
  'ranger',
  'paladin',
  'cleric',
  'wizard',
  'bard',
  'druid',
  'sorcerer',
  'warlock',
  'slayer',
  'bloodrager',
  'magus',
  'alchemist',
  'inquisitor',
  'kineticist',
  'hunter',
  'warrior',
  'knight',
  'trapmaster',
  'barbarian',
  'community',
];

const owlcatCharacterKey = (id: string) => {
  let key = (id.split('/').at(-1) ?? '')
    .toLowerCase()
    .replace(/[-_]/g, '')
    .replace(/\d+$/, '');
  for (const w of OWLCAT_STRIP) key = key.replaceAll(w, '');
  return key.length >= 3 ? key : null;
};

const VARIANT =
  /artbook|evil|undead|demonic|scar|blind|old|before|now|corrupted|hide|witheye|nohand/i;

const main = async () => {
  const all: {
    entry: ArtEntry;
    manifest: string;
    hash: bigint;
    center: bigint;
  }[] = [];
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
        const file = path.join(ROOT, 'public', entry.src);
        const hash = await dhash(file);
        const center = await centerHash(file);
        all.push({ entry, manifest: name, hash, center });
      } catch {
        /* unreadable file: leave as is */
      }
    }
  }

  // Best copy first: Owlcat over Wizards; within Owlcat the regular portrait
  // framing over the artbook scan (same painting, and favourites point at
  // the regular ids); then more pixels.
  const score = (e: ArtEntry) =>
    (e.source.site === 'kingmaker' ? 1e10 : 0) +
    (e.tags.includes('artbook') ? 0 : 1e9) +
    e.width * e.height;
  all.sort((a, b) => score(b.entry) - score(a.entry));

  const distance = (a: (typeof all)[number], b: (typeof all)[number]) =>
    Math.min(
      hamming(a.hash, b.hash),
      hamming(a.center, b.center),
      hamming(a.hash, b.center),
      hamming(a.center, b.hash),
    );
  const limit = (a: ArtEntry, b: ArtEntry) => {
    const owl = (e: ArtEntry) => e.source.site === 'kingmaker';
    if (owl(a) && owl(b)) return DISTANCE_SAME_OWLCAT;
    if (!owl(a) && !owl(b)) return DISTANCE_SAME_WIZARDS;
    return DISTANCE_CROSS;
  };

  const kept: typeof all = [];
  let dupes = 0;
  for (const item of all) {
    const twin = kept.find(
      (k) => distance(k, item) <= limit(k.entry, item.entry),
    );
    if (twin) {
      item.entry.tags.push(TAG);
      dupes += 1;
      console.log(`  ${item.entry.id}  ≈  ${twin.entry.id}`);
    } else {
      kept.push(item);
    }
  }

  // Second pass: one portrait per named Owlcat character.
  const groups = new Map<string, ArtEntry[]>();
  for (const k of kept) {
    if (k.entry.source.site !== 'kingmaker') continue;
    const key = owlcatCharacterKey(k.entry.id);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), k.entry]);
  }
  for (const [key, entries] of groups) {
    if (entries.length < 2) continue;
    const ranked = [...entries].sort((a, b) => {
      const av = VARIANT.test(a.id) ? 1 : 0;
      const bv = VARIANT.test(b.id) ? 1 : 0;
      if (av !== bv) return av - bv;
      return a.id.length - b.id.length;
    });
    for (const extra of ranked.slice(1)) {
      extra.tags.push(TAG);
      dupes += 1;
      console.log(`  ${extra.id}  ≈  ${ranked[0]?.id}  (personaje: ${key})`);
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
