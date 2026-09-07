import { ArtImage } from '@/components/theme/art';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';

type HeroProps = {
  scene: ArtEntry | undefined;
  players: { name: string; role: string; portrait: ArtEntry | undefined }[];
};

/**
 * Proposal: the campaign cover. A full-bleed painted scene fading into
 * charcoal, the title set like a 5e book cover, the two heroes underneath.
 */
const Hero = ({ scene, players }: HeroProps) => (
  <section
    className="relative isolate min-h-[92vh] overflow-hidden"
    id="portada"
  >
    <div className="absolute inset-0 -z-10">
      <ArtImage
        alt=""
        art={scene}
        className="h-full w-full"
        loading="eager"
        position="50% 35%"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,24,28,0.55) 0%, rgba(18,24,28,0.15) 30%, rgba(18,24,28,0.35) 60%, #12181c 96%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 60%, transparent 40%, rgba(9,8,9,0.55) 100%)',
        }}
      />
    </div>

    <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-end px-6 pb-16 text-center">
      <div className="mb-auto pt-24">
        <p className="font-caps text-brass-pale text-xl tracking-widest drop-shadow md:text-2xl">
          Una campaña de Dungeons &amp; Dragons
        </p>
      </div>

      <h1 className="title-cover text-[3.4rem] leading-[0.88] sm:text-[5rem] md:text-[7rem] lg:text-[8.5rem]">
        <Caps>El Dragón</Caps>
        <br />
        <Caps>del Pico Escarcha</Caps>
      </h1>
      <TaperedRule className="mt-3 h-4 w-[min(90vw,44rem)] text-red-bright drop-shadow" />
      <p className="mt-4 max-w-2xl font-book text-lg text-parchment-text italic md:text-xl">
        Dos héroes recién llegados a Phandalin, una ciudad minera con más
        problemas que vecinos, y un dragón blanco que ha decidido que la montaña
        es suya.
      </p>

      <div className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-6">
        {players.map((p) => (
          <div
            className="flex items-center gap-4 rounded-lg border border-brass/30 bg-charcoal-950/70 p-3 text-left backdrop-blur-sm"
            key={p.name}
          >
            <div className="frame-brass h-20 w-20 shrink-0 overflow-hidden rounded-full">
              <ArtImage
                alt={p.name}
                art={p.portrait}
                className="h-full w-full"
              />
            </div>
            <div className="min-w-0">
              <div className="font-caps text-brass-pale text-xl leading-tight">
                {p.name}
              </div>
              <div className="font-condensed text-sm text-strapline uppercase tracking-wider">
                {p.role}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          className="btn-beyond px-6 py-3 text-base uppercase"
          type="button"
        >
          Continuar la partida
        </button>
        <button
          className="btn-ghost px-5 py-3 text-base uppercase"
          type="button"
        >
          Anteriormente en…
        </button>
      </div>
    </div>
  </section>
);

export { Hero };
