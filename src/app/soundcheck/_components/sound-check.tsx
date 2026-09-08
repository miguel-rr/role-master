'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MixerPanel } from '@/components/sound/mixer';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';
import type { SoundEntry } from '@/data/sound/schema';
import type { UiCue } from '@/data/sound/vocabulary';
import { loadGame } from '@/lib/game/storage';
import { soundEngine } from '@/lib/sound/engine';
import { useSound } from '@/lib/sound/use-sound';

type SoundCheckProps = {
  cover: ArtEntry | undefined;
  sampleBeds: SoundEntry[];
  sampleMusic: SoundEntry | null;
  ui: Partial<Record<UiCue, SoundEntry>>;
  stats: {
    music: number;
    beds: number;
    spots: number;
    sfx: number;
    ui: number;
    total: number;
  };
};

/**
 * Between the company and the first scene: one click to unlock the
 * browser's audio, a few seconds of tavern to prove the speakers work, the
 * faders, and two doors: with sound or without.
 */
const SoundCheck = ({
  cover,
  sampleBeds,
  sampleMusic,
  ui,
  stats,
}: SoundCheckProps) => {
  const router = useRouter();
  const { status, mix } = useSound();
  const [tested, setTested] = useState(false);
  const [hasGame, setHasGame] = useState<boolean | null>(null);

  useEffect(() => {
    setHasGame(!!loadGame());
  }, []);

  const test = async () => {
    const engine = soundEngine();
    const ok = await engine.unlock();
    if (!ok) return;
    engine.setEnabled(true);
    engine.playUi(ui.soundcheck);
    engine.setAmbience({ beds: sampleBeds, spots: [] }, { fade: 1.5 });
    if (sampleMusic) engine.playMusic(sampleMusic, { fade: 3 });
    setTested(true);
  };

  const go = (withSound: boolean) => {
    const engine = soundEngine();
    if (!withSound) engine.setEnabled(false);
    engine.stopAll();
    router.push('/play');
  };

  return (
    <main className="theme-beyond relative min-h-screen text-white">
      <div className="fixed inset-0 -z-10">
        {cover ? (
          // biome-ignore lint/performance/noImgElement: pre-sized local art
          <img
            alt=""
            className="h-full w-full object-cover"
            height={cover.height}
            src={cover.src}
            style={{ objectPosition: '50% 40%' }}
            width={cover.width}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,24,28,0.7) 0%, rgba(18,24,28,0.85) 50%, #12181c 100%)',
          }}
        />
      </div>

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
        <Link
          className="font-nodesto text-2xl text-brass-pale uppercase tracking-wider"
          href="/"
        >
          Role Master
        </Link>
        <span className="font-condensed text-[0.7rem] text-charcoal-300 uppercase tracking-widest">
          {stats.music} pistas · {stats.beds} ambientes ·{' '}
          {stats.sfx + stats.spots} efectos
        </span>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-14 pb-8 text-center">
        <p className="font-caps text-brass-pale text-xl tracking-widest">
          Antes de empezar
        </p>
        <h1 className="title-cover mt-2 text-[2.8rem] leading-[0.9] sm:text-[4rem]">
          <Caps>¿Se oye la taberna?</Caps>
        </h1>
        <TaperedRule className="mx-auto mt-4 h-4 w-[min(80vw,30rem)] text-red-bright drop-shadow" />
        <p className="mx-auto mt-4 max-w-xl font-book text-[1.1rem] text-parchment-text leading-relaxed">
          El navegador no deja sonar nada hasta que alguien pulsa. Pulsa una
          vez, sube el volumen del televisor y escucha: música, murmullo y
          fuego. Después, la partida.
        </p>
      </section>

      <section className="mx-auto grid max-w-3xl gap-6 px-6 pb-20 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-lg border border-brass/40 bg-charcoal-950/75 p-7 backdrop-blur">
          {!tested ? (
            <button
              className="btn-beyond w-full px-6 py-5 text-xl uppercase"
              data-testid="soundcheck-test"
              onClick={() => void test()}
              type="button"
            >
              Probar el sonido
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-brass/40 px-4 py-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${status === 'running' ? 'animate-ember bg-brass' : 'bg-brand-500'}`}
              />
              <span className="font-caps text-brass-pale text-lg">
                {status === 'running'
                  ? 'Sonando'
                  : 'El navegador ha bloqueado el audio'}
              </span>
              <button
                className="btn-ghost ml-auto px-3 py-1 text-[0.65rem] uppercase"
                onClick={() => void test()}
                type="button"
              >
                Otra vez
              </button>
            </div>
          )}
          {status === 'unsupported' ? (
            <p className="mt-3 font-scaly text-brand-200 text-sm">
              Este navegador no tiene Web Audio. La partida funciona igual, en
              silencio.
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3">
            <button
              className="btn-beyond px-6 py-3.5 text-base uppercase disabled:opacity-40"
              data-testid="soundcheck-continue"
              disabled={!tested || hasGame === false}
              onClick={() => go(true)}
              type="button"
            >
              Lo oigo, adelante
            </button>
            <button
              className="btn-ghost px-6 py-3 text-sm uppercase disabled:opacity-40"
              data-testid="soundcheck-silent"
              disabled={hasGame === false}
              onClick={() => go(false)}
              type="button"
            >
              Seguir sin sonido
            </button>
            {hasGame === false ? (
              <p className="font-scaly text-charcoal-400 text-xs">
                No hay partida preparada.{' '}
                <Link
                  className="text-brass-pale underline-offset-2 hover:underline"
                  href="/"
                >
                  Elige una campaña
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-charcoal-950/75 p-6 backdrop-blur">
          <MixerPanel />
          <p className="mt-4 font-scaly text-charcoal-400 text-xs">
            Se recuerda en este navegador. En la partida, el altavoz del
            marcador abre esta misma mesa; la tecla M silencia.
          </p>
          {!mix.enabled ? (
            <p className="mt-2 font-scaly text-brand-200 text-xs">
              El sonido está silenciado.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export { SoundCheck };
