/**
 * Builds the sound library: downloads each job's items into `.audio-cache`,
 * measures loudness, transcodes to Opus (WebM) plus AAC (M4A) at a fixed
 * target per layer, and writes `src/data/sound/manifests/<job>.json`.
 *
 *   pnpm audio:sync                 # every job
 *   pnpm audio:sync --job oga       # one job (repeatable)
 *   pnpm audio:sync --limit 5       # first items only
 *   pnpm audio:sync --force         # redo items already in the manifest
 *
 * Needs ffmpeg/ffprobe on PATH and `unzip` for zipped packs.
 */
import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  type SoundEntry,
  type SoundLayer,
  type SoundManifest,
  soundManifestSchema,
} from '../../src/data/sound/schema';
import { type Item, JOBS } from './jobs';

const exec = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const CACHE = path.join(ROOT, '.audio-cache');
const OUT = path.join(ROOT, 'public/audio');
const MANIFESTS = path.join(ROOT, 'src/data/sound/manifests');
const UA = 'role-master/1.0 (private tabletop project)';

/**
 * Loudness target and Opus bitrate per layer. Opus only: Chrome, Firefox
 * and current Safari play it, and a second format would double the library.
 * 64 kb/s is transparent enough for music under narration; music is capped
 * at five minutes and beds at three.
 */
const PROFILE: Record<
  SoundLayer,
  { lufs: number; opus: string; stereo: boolean; maxSeconds?: number }
> = {
  music: { lufs: -18, opus: '64k', stereo: true, maxSeconds: 300 },
  bed: { lufs: -24, opus: '56k', stereo: true, maxSeconds: 180 },
  spot: { lufs: -20, opus: '40k', stereo: false },
  sfx: { lufs: -16, opus: '48k', stereo: false },
  ui: { lufs: -16, opus: '48k', stereo: false },
};

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const values = (name: string) =>
  args.flatMap((a, i) =>
    a === `--${name}` && args[i + 1] ? [args[i + 1] as string] : [],
  );
const onlyJobs = values('job');
const limit = Number(values('limit')[0] ?? Number.POSITIVE_INFINITY);
const force = flag('force');

const exists = async (p: string) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

const download = async (url: string, to: string) => {
  if (await exists(to)) return;
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok || !res.body) throw new Error(`${res.status} ${url}`);
  await mkdir(path.dirname(to), { recursive: true });
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(to));
};

/** Recursively lists files under a directory. */
const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
};

const unzipped = async (zip: string) => {
  const dir = zip.replace(/\.zip$/, '');
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
    await exec('unzip', ['-o', '-q', zip, '-d', dir]);
  }
  return dir;
};

const probe = async (file: string) => {
  const { stdout } = await exec('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    file,
  ]);
  return Number(
    (JSON.parse(stdout) as { format: { duration: string } }).format.duration,
  );
};

/** First pass of loudnorm, just to read the integrated loudness. */
const measure = async (file: string): Promise<number> => {
  const { stderr } = await exec(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      file,
      '-af',
      'loudnorm=print_format=json',
      '-f',
      'null',
      '-',
    ],
    { maxBuffer: 1 << 24 },
  );
  const json = /\{[\s\S]*\}/.exec(stderr)?.[0];
  if (!json) throw new Error(`sin medida de sonoridad para ${file}`);
  const i = Number((JSON.parse(json) as { input_i: string }).input_i);
  return Number.isFinite(i) ? i : -70;
};

/** Peak level in dBFS, for clips too short for an integrated loudness. */
const peak = async (file: string): Promise<number> => {
  const { stderr } = await exec(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      file,
      '-af',
      'volumedetect',
      '-f',
      'null',
      '-',
    ],
    { maxBuffer: 1 << 24 },
  );
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(stderr);
  return m ? Number(m[1]) : 0;
};

const encode = async (input: string, item: Item, gainDb: number) => {
  const profile = PROFILE[item.layer];
  const filters = `volume=${gainDb.toFixed(2)}dB,alimiter=limit=0.95:level=false`;
  const channels = profile.stereo ? [] : ['-ac', '1'];
  const trim = profile.maxSeconds ? ['-t', String(profile.maxSeconds)] : [];
  const webm = path.join(OUT, `${item.id}.webm`);
  await mkdir(path.dirname(webm), { recursive: true });
  await exec('ffmpeg', [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    input,
    ...trim,
    '-vn',
    '-af',
    filters,
    ...channels,
    '-c:a',
    'libopus',
    '-b:a',
    profile.opus,
    webm,
  ]);
  return { webm };
};

const loadManifest = async (name: string): Promise<SoundManifest> => {
  const file = path.join(MANIFESTS, `${name}.json`);
  if (!(await exists(file)))
    return {
      collection: name,
      generatedAt: new Date().toISOString(),
      entries: [],
    };
  return soundManifestSchema.parse(JSON.parse(await readFile(file, 'utf8')));
};

const main = async () => {
  await mkdir(CACHE, { recursive: true });
  await mkdir(MANIFESTS, { recursive: true });
  for (const job of JOBS) {
    if (onlyJobs.length > 0 && !onlyJobs.includes(job.name)) continue;
    console.log(`\n== ${job.name}`);
    const manifest = await loadManifest(job.name);
    const known = new Map(manifest.entries.map((e) => [e.id, e]));
    const items = (await job.list()).slice(0, limit);
    console.log(`${items.length} piezas listadas`);
    let done = 0;
    for (const item of items) {
      if (!force && known.has(item.id)) continue;
      try {
        const ext = path.extname(new URL(item.url).pathname) || '.bin';
        const raw = path.join(
          CACHE,
          job.name,
          `${item.id.replace(/\//g, '__')}${item.zipEntry ? '' : ''}${ext}`,
        );
        const packPath = item.zipEntry
          ? path.join(
              CACHE,
              job.name,
              `${path.basename(new URL(item.url).pathname)}`,
            )
          : raw;
        await download(item.url, packPath);
        let input = packPath;
        if (item.zipEntry) {
          const dir = await unzipped(packPath);
          const re = new RegExp(item.zipEntry);
          const found = (await walk(dir)).find((f) =>
            re.test(f.replace(/\\/g, '/')),
          );
          if (!found) {
            console.warn(`  ${item.id}: no está ${item.zipEntry} en el zip`);
            continue;
          }
          input = found;
        }
        const duration = await probe(input);
        // Integrated loudness needs a few seconds; short clips go by peak.
        const short = duration < 3;
        const lufs = short ? await peak(input) : await measure(input);
        const target = short
          ? -3 + (item.gain ?? 0)
          : PROFILE[item.layer].lufs + (item.gain ?? 0);
        const gainDb = Math.max(-20, Math.min(20, target - lufs));
        const { webm } = await encode(input, item, gainDb);
        const cap = PROFILE[item.layer].maxSeconds ?? duration;
        const entry: SoundEntry = {
          id: item.id,
          layer: item.layer,
          src: `/audio/${path.relative(OUT, webm)}`,
          duration: Math.round(Math.min(duration, cap) * 10) / 10,
          gain: 0,
          lufs: Math.round(lufs * 10) / 10,
          title: item.title,
          artist: item.artist,
          license: item.license,
          source: { site: job.name, page: item.page },
          tags: item.tags,
        };
        known.set(item.id, entry);
        done += 1;
        console.log(
          `  ✓ ${item.id} (${entry.duration}s, ${lufs.toFixed(1)} LUFS → ${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB)`,
        );
      } catch (e) {
        console.warn(`  ✗ ${item.id}: ${(e as Error).message}`);
      }
      manifest.entries = [...known.values()].sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      manifest.generatedAt = new Date().toISOString();
      await writeFile(
        path.join(MANIFESTS, `${job.name}.json`),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );
    }
    console.log(`${done} nuevas, ${manifest.entries.length} en total`);
  }
};

await main();
