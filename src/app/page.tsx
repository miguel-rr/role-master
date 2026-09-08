import Link from 'next/link';
import { HomeMenu } from '@/app/_components/home-menu';
import { ArtImage } from '@/components/theme/art';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import { byId } from '@/data/art/catalog';
import { ICESPIRE_ACT1 } from '@/data/campaigns/icespire-act1';
import { CHARACTER_PRESETS } from '@/data/characters/presets';

export const dynamic = 'force-dynamic';

const HomePage = () => {
  const roster = CHARACTER_PRESETS.map((c) => ({
    id: c.id,
    name: c.shortName,
    role: `${c.race} · ${c.className}`,
    portrait: byId(c.portraitId),
  }));
  const cover = byId('scenes/fr/klauthen-vale');

  return (
    <main className="theme-beyond relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <ArtImage
          alt=""
          art={cover}
          className="h-full w-full"
          loading="eager"
          position="50% 40%"
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
        <span className="font-nodesto text-2xl text-brass-pale uppercase tracking-wider">
          Role Master
        </span>
        <Link
          className="label-beyond rounded px-2 py-1 text-charcoal-300 text-xs hover:text-white"
          href="/design"
        >
          Laboratorio de diseño
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <p className="font-caps text-brass-pale text-xl tracking-widest">
          Una mesa de Dungeons &amp; Dragons para dos
        </p>
        <h1 className="title-cover mt-3 text-[3.2rem] leading-[0.9] sm:text-[5rem] md:text-[6.5rem]">
          <Caps>El Dragón</Caps>
          <br />
          <Caps>del Pico Escarcha</Caps>
        </h1>
        <TaperedRule className="mx-auto mt-4 h-4 w-[min(80vw,40rem)] text-red-bright drop-shadow" />
      </section>

      <HomeMenu
        campaign={{
          id: ICESPIRE_ACT1.id,
          title: ICESPIRE_ACT1.title,
          tagline: ICESPIRE_ACT1.tagline,
          levelRange: ICESPIRE_ACT1.levelRange,
        }}
        roster={roster}
      />
    </main>
  );
};

export default HomePage;
