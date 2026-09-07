/**
 * Downloads the art catalogue from the wikis listed in `jobs.ts`, re-encodes
 * everything as WebP under `public/art/<outDir>/` and writes one manifest per
 * job to `src/data/art/manifests/<job>.json`.
 *
 *   pnpm art:sync                 # every job
 *   pnpm art:sync items scenes-fr # selected jobs
 *   pnpm art:sync items --limit 20   # smoke test
 *
 * Idempotent: files already in the manifest whose WebP exists are skipped.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  type ArtEntry,
  type ArtManifest,
  artManifestSchema,
} from '../../src/data/art/schema';
import { frTrimCats, JOBS, type Job, slugify } from './jobs';
import { makeWiki, politeFetch, type WikiFile } from './wiki';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const PUBLIC_ART = path.join(ROOT, 'public/art');
const MANIFESTS = path.join(ROOT, 'src/data/art/manifests');

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT =
  limitIdx >= 0 ? Number(args[limitIdx + 1]) : Number.POSITIVE_INFINITY;
const jobNames = args.filter(
  (a, i) => !a.startsWith('--') && (limitIdx < 0 || i !== limitIdx + 1),
);

const DOWNLOAD_CONCURRENCY = 3;
/** Static image hosts are CDNs; a lighter throttle than the API. */
const DOWNLOAD_INTERVAL_MS = 250;

const pageUrlFor = (job: Job, file: WikiFile) => {
  const title = encodeURIComponent(`File:${file.title.replace(/ /g, '_')}`);
  switch (job.site) {
    case 'bg3':
      return `https://bg3.wiki/wiki/${title}`;
    case 'fr':
      return `https://forgottenrealms.fandom.com/wiki/${title}`;
    case 'kingmaker':
      return `https://pathfinderkingmaker.fandom.com/wiki/${title}`;
    case 'commons':
      return `https://commons.wikimedia.org/wiki/${title}`;
  }
};

/** The URL to actually download, capped server-side where the wiki allows. */
const downloadUrlFor = (job: Job, file: WikiFile) => {
  const { info } = file;
  if (job.site === 'commons') return info.thumburl ?? info.url;
  if (job.site === 'fr' || job.site === 'kingmaker') {
    const cap = job.transform.maxSide;
    if (info.width > cap) {
      const [base, query] = info.url.split('?');
      return `${base}/scale-to-width-down/${cap}${query ? `?${query}` : ''}`;
    }
  }
  return info.url;
};

const isPublicDomain = (file: WikiFile) => {
  const licence = file.info.extmetadata?.LicenseShortName?.value ?? '';
  return /public domain|cc0|pd-/i.test(licence);
};

const artistOf = (file: WikiFile) => {
  const raw = file.info.extmetadata?.Artist?.value;
  if (raw) return raw.replace(/<[^>]+>/g, '').trim();
  const byCat = file.categories.find((c) => /^Images by /.test(c));
  return byCat?.replace(/^Images by /, '');
};

const loadManifest = async (job: Job): Promise<ArtManifest> => {
  const file = path.join(MANIFESTS, `${job.name}.json`);
  if (!existsSync(file)) {
    return { collection: job.name, generatedAt: '', entries: [] };
  }
  return artManifestSchema.parse(JSON.parse(await readFile(file, 'utf8')));
};

const saveManifest = async (manifest: ArtManifest) => {
  await mkdir(MANIFESTS, { recursive: true });
  manifest.generatedAt = new Date().toISOString();
  manifest.entries.sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(
    path.join(MANIFESTS, `${manifest.collection}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
};

type Candidate = { file: WikiFile; tags: string[]; category: string };

/** Lists every category of the job and returns deduplicated, tagged candidates. */
const collectCandidates = async (job: Job): Promise<Candidate[]> => {
  const wiki = makeWiki({ apiUrl: job.apiUrl });
  const byPage = new Map<number, Candidate>();

  for (const spec of job.categories) {
    let tree: Map<string, string[]>;
    try {
      tree = spec.depth
        ? await wiki.categoryTree(spec.name, spec.depth)
        : new Map([[spec.name, []]]);
    } catch (err) {
      console.warn(`  ! ${spec.name}: ${(err as Error).message}`);
      continue;
    }

    const specCandidates: Candidate[] = [];
    for (const [category, ancestors] of tree) {
      let files: WikiFile[];
      try {
        files = await wiki.files(category, {
          withCategories: job.site !== 'bg3',
          thumbWidth: job.thumbWidth,
        });
      } catch (err) {
        console.warn(`  ! ${category}: ${(err as Error).message}`);
        continue;
      }
      for (const file of files) {
        if (job.excludeTitles?.test(file.title)) continue;
        if (job.minWidth && file.info.width < job.minWidth) continue;
        if (job.requirePublicDomain && !isPublicDomain(file)) continue;
        if (
          job.excludeCategories?.some((re) =>
            file.categories.some((c) => re.test(c)),
          )
        ) {
          continue;
        }
        const tags = job.tag(file, { category, path: ancestors });
        if (!tags) continue;
        specCandidates.push({
          file,
          tags: [...new Set([...(spec.tags ?? []), ...tags])],
          category,
        });
      }
    }

    if (spec.max && specCandidates.length > spec.max) {
      const rank = job.rank ?? (() => 0);
      specCandidates.sort(
        (a, b) => rank(b.file, b.tags) - rank(a.file, a.tags),
      );
      specCandidates.length = spec.max;
    }
    console.log(`  ${spec.name}: ${specCandidates.length} candidates`);

    for (const c of specCandidates) {
      const prev = byPage.get(c.file.pageid);
      if (prev) {
        prev.tags = [...new Set([...prev.tags, ...c.tags])];
      } else {
        byPage.set(c.file.pageid, c);
      }
    }
  }
  return [...byPage.values()];
};

const encode = async (job: Job, input: Buffer) => {
  const { maxSide, quality, alpha } = job.transform;
  const pipeline = sharp(input, { animated: false }).rotate().resize({
    width: maxSide,
    height: maxSide,
    fit: 'inside',
    withoutEnlargement: true,
  });
  if (!alpha) pipeline.flatten({ background: '#1b1512' });
  return pipeline
    .webp({ quality, alphaQuality: 92, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
};

const processCandidate = async (
  job: Job,
  candidate: Candidate,
  usedSlugs: Set<string>,
): Promise<ArtEntry | null> => {
  const { file, tags } = candidate;
  const title = file.title.replace(/\.[a-z0-9]+$/i, '');
  let slug = slugify(title.replace(/ (Icon|Faded)$/i, ''));
  if (!slug) slug = String(file.pageid);
  if (usedSlugs.has(slug)) slug = `${slug}-${file.pageid}`;
  usedSlugs.add(slug);

  const relDir = job.outDir;
  const outPath = path.join(PUBLIC_ART, relDir, `${slug}.webp`);
  await mkdir(path.dirname(outPath), { recursive: true });

  const res = await politeFetch(downloadUrlFor(job, file), {
    minIntervalMs: DOWNLOAD_INTERVAL_MS,
  });
  const input = Buffer.from(await res.arrayBuffer());
  const { data, info } = await encode(job, input);
  await writeFile(outPath, data);

  return {
    id: `${relDir}/${slug}`,
    src: `/art/${relDir}/${slug}.webp`,
    width: info.width,
    height: info.height,
    title: title.replace(/ (Icon|Faded)$/i, ''),
    tags,
    cats: job.site === 'fr' ? frTrimCats(file.categories) : [],
    artist: artistOf(file),
    source: { site: job.site, page: pageUrlFor(job, file) },
  };
};

const runJob = async (job: Job) => {
  console.log(`\n▶ ${job.name} (${job.site})`);
  const manifest = await loadManifest(job);
  const have = new Map(manifest.entries.map((e) => [e.source.page, e]));
  const usedSlugs = new Set(
    manifest.entries.map((e) => e.id.split('/').at(-1) ?? ''),
  );

  const candidates = await collectCandidates(job);
  const todo = candidates
    .filter((c) => {
      const prev = have.get(pageUrlFor(job, c.file));
      if (!prev) return true;
      // Refresh tags cheaply without re-downloading.
      prev.tags = [...new Set([...prev.tags, ...c.tags])];
      return !existsSync(path.join(ROOT, 'public', prev.src));
    })
    .slice(0, LIMIT);
  console.log(`  ${candidates.length} candidates, ${todo.length} to download`);

  let done = 0;
  let failed = 0;
  const queue = [...todo];
  const worker = async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      try {
        const entry = await processCandidate(job, next, usedSlugs);
        if (entry) {
          manifest.entries = manifest.entries.filter((e) => e.id !== entry.id);
          manifest.entries.push(entry);
        }
      } catch (err) {
        failed += 1;
        console.warn(`  ✗ ${next.file.title}: ${(err as Error).message}`);
      }
      done += 1;
      if (done % 25 === 0) {
        console.log(`  … ${done}/${todo.length}`);
        await saveManifest(manifest);
      }
    }
  };
  await Promise.all(
    Array.from({ length: DOWNLOAD_CONCURRENCY }, () => worker()),
  );
  await saveManifest(manifest);
  console.log(
    `✔ ${job.name}: ${manifest.entries.length} entries (${failed} failed)`,
  );
};

const main = async () => {
  const selected =
    jobNames.length > 0 ? JOBS.filter((j) => jobNames.includes(j.name)) : JOBS;
  const unknown = jobNames.filter((n) => !JOBS.some((j) => j.name === n));
  if (unknown.length > 0) {
    console.error(`Unknown jobs: ${unknown.join(', ')}`);
    console.error(`Available: ${JOBS.map((j) => j.name).join(', ')}`);
    process.exit(1);
  }
  for (const job of selected) await runJob(job);
};

await main();
