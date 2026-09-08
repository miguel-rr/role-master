'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Caps } from '@/components/theme/display';
import type { ArtEntry } from '@/data/art/schema';
import type { GameState } from '@/lib/game/schema';
import { loadGame } from '@/lib/game/storage';

type HomeMenuProps = {
  campaign: {
    id: string;
    title: string;
    tagline: string;
    levelRange: string;
    duration: { sessions: string; hours: string; note: string };
  };
  roster: {
    id: string;
    name: string;
    role: string;
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
const HomeMenu = ({ campaign, roster }: HomeMenuProps) => {
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
    const params = new URLSearchParams({ model, death, campaign: campaign.id });
    router.push(`/setup?${params.toString()}`);
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
        <p
          className="mt-1 font-scaly text-charcoal-400 text-sm"
          data-testid="campaign-duration"
          title={campaign.duration.note}
        >
          Duración estimada: {campaign.duration.sessions} de 2-3 horas (
          {campaign.duration.hours}).
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
                  data-testid={`model-${m.id}`}
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
                  data-testid={`death-${d.id}`}
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
            data-testid="start-campaign"
            onClick={startNew}
            type="button"
          >
            {confirmNew
              ? 'Sí, dejar la partida guardada atrás'
              : 'Elegir personajes y empezar'}
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
              Empezar de nuevo borra la partida guardada al confirmar la
              compañía.
            </span>
          ) : null}
        </div>
      </section>

      {/* Roster + continue */}
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-white/10 bg-charcoal-950/70 p-6 backdrop-blur">
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Seis personajes esperan
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {roster.map((p) => (
              <div
                className="flex flex-col items-center text-center"
                key={p.id}
              >
                <div className="frame-brass h-20 w-16 overflow-hidden rounded-sm">
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
                <div className="mt-1.5 font-caps text-base text-brass-pale leading-none">
                  {p.name}
                </div>
                <div className="font-condensed text-[0.6rem] text-strapline uppercase tracking-wider">
                  {p.role}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-scaly text-charcoal-400 text-xs">
            Loncio elige primero, JasspeR después. Cada uno ve la ficha completa
            y lo que la campaña guarda para su personaje.
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
                {saved.players
                  .map(
                    (p) =>
                      `${p.name} lleva a ${roster.find((r) => r.id === p.characterId)?.name ?? p.characterId}`,
                  )
                  .join(' · ')}
              </div>
              <div className="mt-1 font-scaly text-charcoal-400 text-xs">
                Guardado {new Date(saved.updatedAt).toLocaleString('es-ES')} ·{' '}
                {saved.model === 'claude-opus-5' ? 'Opus 5' : 'Fable 5.1'}
              </div>
              <button
                className="btn-beyond mt-4 w-full px-5 py-3 uppercase"
                data-testid="continue-campaign"
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
