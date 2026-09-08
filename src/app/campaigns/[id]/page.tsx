import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HomeMenu } from '@/app/_components/home-menu';
import { ArtImage } from '@/components/theme/art';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import { byId } from '@/data/art/catalog';
import { catalogEntry } from '@/data/campaigns/catalog';
import { CAMPAIGNS } from '@/data/campaigns/icespire-act1';
import { CHARACTER_PRESETS } from '@/data/characters/presets';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export const generateMetadata = async ({
  params,
}: {
  params: Params;
}): Promise<Metadata> => {
  const { id } = await params;
  const entry = catalogEntry(id);
  return {
    robots: { index: false },
    title: entry ? `Role Master — ${entry.title}` : 'Role Master',
  };
};

/**
 * One campaign: the cover, the table settings and the two doors into the
 * game. Announced campaigns show the same page without a way in.
 */
const CampaignPage = async ({ params }: { params: Params }) => {
  const { id } = await params;
  const entry = catalogEntry(id);
  if (!entry) notFound();
  const campaign = CAMPAIGNS[entry.id];
  const cover = byId(entry.coverId);
  const roster = CHARACTER_PRESETS.map((c) => ({
    id: c.id,
    name: c.shortName,
    role: `${c.race} · ${c.className}`,
    portrait: byId(c.portraitId),
  }));
  const [first, ...rest] = entry.title.split(' del ');
  const titleTop = first ?? entry.title;
  const titleBottom = rest.length > 0 ? `del ${rest.join(' del ')}` : '';

  return (
    <main className="theme-beyond relative min-h-screen">
      <div className="absolute inset-0 -z-10 max-h-[110vh]">
        <ArtImage
          alt=""
          art={cover}
          className="h-full w-full"
          loading="eager"
          position={entry.focus ?? '50% 40%'}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,24,28,0.55) 0%, rgba(18,24,28,0.75) 45%, #12181c 100%)',
          }}
        />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link
          className="font-nodesto text-2xl text-brass-pale uppercase tracking-wider"
          href="/"
        >
          Role Master
        </Link>
        <Link
          className="label-beyond rounded px-2 py-1 text-charcoal-300 text-xs hover:text-white"
          data-testid="back-to-shelf"
          href="/"
        >
          ← Todas las campañas
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <p className="font-caps text-brass-pale text-xl tracking-widest">
          {entry.kind === 'Original'
            ? 'Una campaña original del máster'
            : 'Una mesa de Dungeons & Dragons para dos'}
        </p>
        <h1 className="title-cover mt-3 text-[3.2rem] leading-[0.9] sm:text-[5rem] md:text-[6.5rem]">
          <Caps>{titleTop}</Caps>
          {titleBottom ? (
            <>
              <br />
              <Caps>{titleBottom}</Caps>
            </>
          ) : null}
        </h1>
        <TaperedRule className="mx-auto mt-4 h-4 w-[min(80vw,40rem)] text-red-bright drop-shadow" />
        <p className="mx-auto mt-5 max-w-3xl font-book text-[1.15rem] text-parchment-text leading-relaxed">
          {entry.blurb}
        </p>
      </section>

      {campaign && entry.available ? (
        <HomeMenu
          campaign={{
            id: campaign.id,
            title: campaign.title,
            tagline: campaign.tagline,
            levelRange: campaign.levelRange,
            duration: campaign.duration,
          }}
          roster={roster}
        />
      ) : (
        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <div className="rounded-lg border border-brass/40 bg-charcoal-950/70 p-8 backdrop-blur">
            <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Próximamente
            </div>
            <p className="mt-3 font-book text-[1.05rem] text-parchment-text leading-relaxed">
              {entry.levelRange} · {entry.duration.sessions} (
              {entry.duration.hours}). La biblia de esta campaña aún no está
              escrita. Mientras tanto, el Pico Escarcha espera.
            </p>
            <Link
              className="btn-beyond mt-6 inline-block px-6 py-3 text-base uppercase"
              href="/campaigns/icespire-act1"
            >
              Ir al Dragón del Pico Escarcha
            </Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default CampaignPage;
