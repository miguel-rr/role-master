import type { Metadata } from 'next';
import Link from 'next/link';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { SoundEntry } from '@/data/sound/schema';
import { loadLibrary } from '@/lib/sound/library.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Créditos',
};

const LAYER_LABEL: Record<SoundEntry['layer'], string> = {
  music: 'Música',
  bed: 'Ambientes',
  spot: 'Sonidos puntuales',
  sfx: 'Efectos',
  ui: 'Interfaz',
};

/**
 * Every piece of sound the table uses, with its author and licence, as the
 * Creative Commons licences ask. Generated from the manifests.
 */
const CreditsPage = () => {
  const entries = loadLibrary();
  const byArtist = new Map<string, SoundEntry[]>();
  for (const e of entries)
    byArtist.set(e.artist, [...(byArtist.get(e.artist) ?? []), e]);
  const artists = [...byArtist.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  return (
    <main className="theme-beyond min-h-screen bg-charcoal-950 px-6 pt-10 pb-24 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          className="font-nodesto text-2xl text-brass-pale uppercase tracking-wider"
          href="/"
        >
          Role Master
        </Link>
        <h1 className="title-cover mt-8 text-[2.6rem] leading-[0.9] sm:text-[3.6rem]">
          <Caps>Créditos de sonido</Caps>
        </h1>
        <TaperedRule className="mt-4 h-4 w-[min(80vw,28rem)] text-red-bright" />
        <p className="mt-4 max-w-2xl font-book text-[1.05rem] text-parchment-text leading-relaxed">
          La música y los sonidos de la mesa son obra de otras personas, cedidos
          con licencias Creative Commons o equivalentes. Cada pieza, con su
          autor, su licencia y su origen.
          {entries.length} piezas en total.
        </p>
        {artists.map(([artist, list]) => (
          <section className="mt-10" key={artist}>
            <h2 className="font-caps text-2xl text-brass-pale">{artist}</h2>
            <p className="font-scaly text-charcoal-400 text-xs">
              {[...new Set(list.map((e) => e.license))].join(' · ')} ·{' '}
              {list.length} {list.length === 1 ? 'pieza' : 'piezas'}
            </p>
            <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {list
                .sort(
                  (a, b) =>
                    a.layer.localeCompare(b.layer) ||
                    a.title.localeCompare(b.title),
                )
                .map((e) => (
                  <li
                    className="flex items-baseline gap-2 font-scaly text-sm"
                    key={e.id}
                  >
                    <span className="w-24 shrink-0 font-condensed text-[0.6rem] text-strapline uppercase tracking-wider">
                      {LAYER_LABEL[e.layer]}
                    </span>
                    <a
                      className="truncate text-parchment-text underline-offset-2 hover:underline"
                      href={e.source.page}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {e.title}
                    </a>
                    <span className="ml-auto shrink-0 text-charcoal-500 text-xs">
                      {e.license}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        <p className="mt-12 font-scaly text-charcoal-500 text-xs">
          Kevin MacLeod (incompetech.com): Licensed under Creative Commons: By
          Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/
        </p>
      </div>
    </main>
  );
};

export default CreditsPage;
