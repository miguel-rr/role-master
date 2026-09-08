'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Caps } from '@/components/theme/display';
import type { ArtEntry } from '@/data/art/schema';
import { DEMO_CHARACTERS } from '@/data/demo/characters';
import type { GameState } from '@/lib/game/schema';
import { clearGame, loadGame, saveGame } from '@/lib/game/storage';

type HomeMenuProps = {
  campaign: { id: string; title: string; tagline: string; levelRange: string };
  party: {
    id: 'bram' | 'nissa';
    name: string;
    role: string;
    color: string;
    portrait: ArtEntry | undefined;
  }[];
};

const MODELS = [
  {
    id: 'claude-opus-5',
    label: 'Opus 5',
    note: 'Rápido y muy bueno. Unos 2-4 € por sesión de dos horas.',
  },
  {
    id: 'claude-fable-5-1',
    label: 'Fable 5.1',
    note: 'El más capaz. Más lento y el doble de caro.',
  },
] as const;

const DEATHS = [
  {
    id: 'never',
    label: 'No',
    note: 'Nadie muere. Caer tiene consecuencias, no final.',
  },
  {
    id: 'unlikely',
    label: 'Altamente improbable',
    note: 'Solo tras tres salvaciones fallidas y avisos claros.',
  },
  {
    id: 'possible',
    label: 'Puede pasar',
    note: 'Reglas sin red. Se avisa del peligro, y se cumple.',
  },
] as const;

/** New campaign or continue: the only two doors into the game. */
const HomeMenu = ({ campaign, party }: HomeMenuProps) => {
  const router = useRouter();
  const [saved, setSaved] = useState<GameState | null>(null);
  const [model, setModel] = useState<GameState['model']>('claude-opus-5');
  const [death, setDeath] = useState<GameState['death']>('unlikely');
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    setSaved(loadGame());
  }, []);

  const startNew = () => {
    if (saved && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    clearGame();
    const now = new Date().toISOString();
    const state: GameState = {
      version: 1,
      campaignId: campaign.id,
      model,
      death,
      createdAt: now,
      updatedAt: now,
      characters: DEMO_CHARACTERS.map((c) => ({
        id: c.id as 'bram' | 'nissa',
        hp: c.hp.max,
        maxHp: c.hp.max,
        gold: c.coins.gp,
        items: c.inventory.map((i) => i.name),
      })),
      memory: [],
      npcArt: {},
      history: [],
    };
    saveGame(state);
    router.push('/play');
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[1.2fr_1fr]">
      {/* New campaign */}
      <section className="rounded-lg border border-brass/40 bg-charcoal-950/70 p-8 backdrop-blur">
        <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
          Nueva campaña
        </div>
        <h2 className="mt-1 font-nodesto text-4xl text-brass-pale uppercase leading-none">
          <Caps>{campaign.title}</Caps>
        </h2>
        <p className="mt-2 font-book text-[1.05rem] text-parchment-text leading-relaxed">
          {campaign.tagline}
        </p>
        <p className="mt-1 font-scaly text-charcoal-400 text-sm">
          {campaign.levelRange}
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Narrador
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {MODELS.map((m) => (
                <button
                  className={`rounded-md border px-3 py-2 text-left transition ${model === m.id ? 'border-brass bg-brass/15' : 'border-charcoal-600 hover:border-brass/60'}`}
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  type="button"
                >
                  <div className="font-caps text-brass-pale text-lg leading-none">
                    {m.label}
                  </div>
                  <div className="mt-1 font-scaly text-charcoal-400 text-xs">
                    {m.note}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Muerte permanente
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {DEATHS.map((d) => (
                <button
                  className={`rounded-md border px-3 py-2 text-left transition ${death === d.id ? 'border-brass bg-brass/15' : 'border-charcoal-600 hover:border-brass/60'}`}
                  key={d.id}
                  onClick={() => setDeath(d.id)}
                  type="button"
                >
                  <div className="font-caps text-brass-pale text-lg leading-none">
                    {d.label}
                  </div>
                  <div className="mt-1 font-scaly text-charcoal-400 text-xs">
                    {d.note}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="btn-beyond px-6 py-3 text-base uppercase"
            onClick={startNew}
            type="button"
          >
            {confirmNew
              ? 'Sí, borrar la partida y empezar'
              : 'Empezar la campaña'}
          </button>
          {confirmNew ? (
            <button
              className="btn-ghost px-4 py-3 text-sm uppercase"
              onClick={() => setConfirmNew(false)}
              type="button"
            >
              Cancelar
            </button>
          ) : null}
          {saved && !confirmNew ? (
            <span className="font-scaly text-charcoal-400 text-sm">
              Empezar de nuevo borra la partida guardada.
            </span>
          ) : null}
        </div>
      </section>

      {/* Party + continue */}
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-white/10 bg-charcoal-950/70 p-6 backdrop-blur">
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Los personajes
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {party.map((p) => (
              <div className="flex items-center gap-3" key={p.id}>
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-charcoal-950"
                  style={{ ['--tw-ring-color' as string]: p.color }}
                >
                  {p.portrait ? (
                    // biome-ignore lint/performance/noImgElement: pre-sized local art
                    <img
                      alt={p.name}
                      className="h-full w-full object-cover object-[50%_15%]"
                      height={p.portrait.height}
                      src={p.portrait.src}
                      width={p.portrait.width}
                    />
                  ) : null}
                </div>
                <div>
                  <div className="font-caps text-brass-pale text-xl leading-none">
                    {p.name}
                  </div>
                  <div className="font-condensed text-strapline text-xs uppercase tracking-wider">
                    {p.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-scaly text-charcoal-400 text-xs">
            Presets para novatos. El creador de personajes llegará después.
          </p>
        </section>

        <section className="rounded-lg border border-white/10 bg-charcoal-950/70 p-6 backdrop-blur">
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Continuar
          </div>
          {saved ? (
            <>
              <div className="mt-2 font-book text-parchment-text">
                Turno {saved.history.length} ·{' '}
                {saved.history.at(-1)?.turn.place ?? 'Prólogo'}
              </div>
              <div className="mt-1 font-scaly text-charcoal-400 text-xs">
                Guardado {new Date(saved.updatedAt).toLocaleString('es-ES')} ·{' '}
                {saved.model === 'claude-opus-5' ? 'Opus 5' : 'Fable 5.1'}
              </div>
              <button
                className="btn-beyond mt-4 w-full px-5 py-3 uppercase"
                onClick={() => router.push('/play')}
                type="button"
              >
                Continuar la partida
              </button>
            </>
          ) : (
            <p className="mt-2 font-scaly text-charcoal-400 text-sm">
              No hay partida guardada en este navegador.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export { HomeMenu };
