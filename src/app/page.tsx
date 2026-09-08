import Link from 'next/link';
import { CampaignCard } from '@/app/_components/campaign-card';
import { ContinueRow } from '@/app/_components/continue-row';
import { ShelfRow } from '@/app/_components/shelf-row';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import { byId } from '@/data/art/catalog';
import type { ArtEntry } from '@/data/art/schema';
import {
  BANNER_ART_ID,
  CATALOG,
  catalogEntry,
  ROWS,
} from '@/data/campaigns/catalog';
import { CHARACTER_PRESETS } from '@/data/characters/presets';

export const dynamic = 'force-dynamic';

/**
 * The shelf: every campaign the table can pick. A featured cover on top,
 * the saved game if there is one, then rows by kind and mood.
 */
const HomePage = () => {
  const covers: Record<string, ArtEntry | undefined> = {};
  for (const c of CATALOG) covers[c.id] = byId(c.coverId);
  const featured = catalogEntry('icespire-act1') ?? CATALOG[0];
  if (!featured) return null;
  const hero = covers[featured.id];
  const banner = byId(BANNER_ART_ID);
  const titles = Object.fromEntries(CATALOG.map((c) => [c.id, c.title]));
  const names = Object.fromEntries(
    CHARACTER_PRESETS.map((c) => [c.id, c.shortName]),
  );
  const counts = {
    playable: CATALOG.filter((c) => c.available).length,
    total: CATALOG.length,
  };

  return (
    <main className="theme-beyond min-h-screen bg-charcoal-950 pb-20 text-white">
      {/* Hero */}
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {hero ? (
            // biome-ignore lint/performance/noImgElement: pre-sized local art
            <img
              alt=""
              className="h-full w-full animate-kenburns object-cover"
              height={hero.height}
              src={hero.src}
              style={{ objectPosition: featured.focus ?? '50% 40%' }}
              width={hero.width}
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(18,24,28,0.92) 0%, rgba(18,24,28,0.6) 45%, rgba(18,24,28,0.1) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(18,24,28,0.35) 0%, transparent 30%, transparent 60%, #12181c 100%)',
            }}
          />
        </div>

        <header className="mx-auto flex max-w-[1600px] items-center justify-between px-6 pt-6">
          <span className="font-nodesto text-2xl text-brass-pale uppercase tracking-wider">
            Role Master
          </span>
          <nav className="flex items-center gap-5 font-condensed text-[0.7rem] text-charcoal-300 uppercase tracking-widest">
            <span className="hidden sm:inline">
              {counts.playable} jugable · {counts.total - counts.playable}{' '}
              anunciadas
            </span>
            <Link className="hover:text-white" href="/design">
              Laboratorio
            </Link>
          </nav>
        </header>

        <div className="mx-auto flex max-w-[1600px] flex-col justify-end px-6 pt-[16vh] pb-16 sm:pt-[20vh]">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 font-condensed text-[0.7rem] text-brass-pale uppercase tracking-[0.3em]">
              <span>Destacada</span>
              <span className="h-px w-10 bg-brass/60" />
              <span>{featured.kind}</span>
              {featured.isNew ? (
                <span className="rounded-sm bg-brand-600 px-1.5 py-0.5 text-white tracking-wider">
                  Nueva
                </span>
              ) : null}
            </div>
            <h1 className="title-cover mt-4 text-[3rem] leading-[0.9] sm:text-[4.6rem] lg:text-[5.6rem]">
              <Caps>{featured.title}</Caps>
            </h1>
            <TaperedRule className="mt-4 h-4 w-[min(70vw,30rem)] text-red-bright drop-shadow" />
            <p className="mt-5 max-w-2xl font-book text-[1.15rem] text-parchment-text leading-relaxed drop-shadow">
              {featured.blurb}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-scaly text-charcoal-200 text-sm">
              <span>{featured.levelRange}</span>
              <span>{featured.duration.sessions} de 2-3 horas</span>
              <span>Dos jugadores, una pantalla</span>
              <span className="flex gap-1">
                {featured.tone.map((t) => (
                  <span
                    className="rounded-sm border border-white/15 px-1.5 py-0.5 font-condensed text-[0.6rem] uppercase tracking-wider"
                    key={t}
                  >
                    {t}
                  </span>
                ))}
              </span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="btn-beyond px-7 py-3.5 text-base uppercase"
                data-testid="hero-play"
                href={`/campaigns/${featured.id}`}
              >
                Jugar esta campaña
              </Link>
              <a
                className="btn-ghost px-5 py-3.5 text-sm uppercase backdrop-blur"
                href="#estanteria"
              >
                Ver todas
              </a>
            </div>
          </div>
        </div>
      </section>

      <div id="estanteria">
        <ContinueRow covers={covers} names={names} titles={titles} />

        {ROWS.slice(0, 1).map((row) => (
          <ShelfRow intro={row.intro} key={row.id} title={row.title}>
            {row.ids.flatMap((id) => {
              const entry = catalogEntry(id);
              return entry ? (
                <CampaignCard cover={covers[id]} entry={entry} key={id} />
              ) : (
                []
              );
            })}
          </ShelfRow>
        ))}

        {/* Banner */}
        {banner ? (
          <section className="mx-auto mt-6 max-w-[1600px] px-6">
            <Link
              className="group relative block overflow-hidden rounded-lg border border-brass/40"
              href={`/campaigns/${featured.id}`}
            >
              {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
              <img
                alt=""
                className="h-[16rem] w-full object-cover transition duration-1000 group-hover:scale-[1.03] sm:h-[20rem]"
                height={banner.height}
                loading="lazy"
                src={banner.src}
                style={{ objectPosition: '50% 45%' }}
                width={banner.width}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 via-charcoal-950/40 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center px-8">
                <div className="font-condensed text-[0.7rem] text-brass-pale uppercase tracking-[0.3em]">
                  Kit Esencial · Para uno o dos jugadores
                </div>
                <div className="mt-2 font-nodesto text-4xl text-white uppercase leading-none sm:text-5xl">
                  <Caps>Empieza en Phandalin</Caps>
                </div>
                <p className="mt-3 font-book text-[1.02rem] text-parchment-text leading-snug">
                  La única aventura oficial pensada para mesas pequeñas. Tres
                  encargos, un dragón y un pueblo que necesita a alguien.
                </p>
                <span className="btn-beyond mt-4 w-fit px-5 py-2.5 text-sm uppercase">
                  Elegir personajes
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {ROWS.slice(1).map((row) => (
          <ShelfRow intro={row.intro} key={row.id} title={row.title}>
            {row.ids.flatMap((id) => {
              const entry = catalogEntry(id);
              return entry ? (
                <CampaignCard cover={covers[id]} entry={entry} key={id} />
              ) : (
                []
              );
            })}
          </ShelfRow>
        ))}

        <footer className="mx-auto mt-10 flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 font-scaly text-charcoal-500 text-xs">
          <span>
            Las campañas anunciadas son portadas: su biblia aún no está escrita.
          </span>
          <Link className="hover:text-charcoal-300" href="/credits">
            Créditos de música y sonido
          </Link>
        </footer>
      </div>
    </main>
  );
};

export default HomePage;
