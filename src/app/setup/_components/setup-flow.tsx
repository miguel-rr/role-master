'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CharacterSheet } from '@/app/design/_components/character-sheet';
import { Inventory, type Slot } from '@/app/design/_components/inventory';
import type { CoinArt } from '@/app/play/_components/party-overlay';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';
import {
  CHARACTER_PRESETS,
  type CharacterPreset,
} from '@/data/characters/presets';
import { newGameState, type RosterEntry, seatColor } from '@/lib/game/party';
import type { GameState } from '@/lib/game/schema';
import { clearGame, saveGame } from '@/lib/game/storage';

type SetupFlowProps = {
  campaign: { id: string; title: string };
  model: GameState['model'];
  death: GameState['death'];
  roster: RosterEntry[];
  itemArt: Record<string, ArtEntry>;
  coinArt: CoinArt;
  cover: ArtEntry | undefined;
};

/** The two people at the table, in the order they choose. */
const PLAYERS = ['Lon', 'Jato'] as const;

const Portrait = ({
  art,
  alt,
  className = '',
}: {
  art: ArtEntry | undefined;
  alt: string;
  className?: string;
}) =>
  art ? (
    // biome-ignore lint/performance/noImgElement: pre-sized local art
    <img
      alt={alt}
      className={`object-cover ${className}`}
      height={art.height}
      src={art.src}
      style={{ objectPosition: '50% 12%' }}
      width={art.width}
    />
  ) : (
    <div className={`bg-charcoal-800 ${className}`} />
  );

/**
 * Lon chooses, then Jato, then the company is presented and the story
 * begins. Every character opens as a dossier: portrait and story on the
 * left, the paper sheet and the pack on the right.
 */
const SetupFlow = ({
  campaign,
  model,
  death,
  roster,
  itemArt,
  coinArt,
  cover,
}: SetupFlowProps) => {
  const router = useRouter();
  const [picks, setPicks] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [dossierView, setDossierView] = useState<'story' | 'sheet' | 'pack'>(
    'story',
  );
  const seat = Math.min(picks.length, PLAYERS.length - 1);
  const choosing = picks.length < PLAYERS.length;
  const player = PLAYERS[seat] ?? 'Lon';
  const portraitOf = (id: string) => roster.find((r) => r.id === id)?.portrait;

  const opened = open ? CHARACTER_PRESETS.find((c) => c.id === open) : null;
  const artFor = useMemo(() => {
    const map = new Map<string, ArtEntry | undefined>();
    for (const c of CHARACTER_PRESETS) {
      for (const it of c.inventory) map.set(it.icon, itemArt[it.icon]);
    }
    return map;
  }, [itemArt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (id: string) => {
    if (!choosing || picks.includes(id)) return;
    setPicks([...picks, id]);
    setOpen(null);
    setDossierView('story');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const undo = () => {
    setPicks(picks.slice(0, -1));
    setOpen(null);
  };

  const begin = () => {
    clearGame();
    const state = newGameState({
      campaignId: campaign.id,
      model,
      death,
      players: PLAYERS.map((name, i) => ({
        name,
        characterId: picks[i] ?? '',
      })),
    });
    saveGame(state);
    router.push('/play');
  };

  const slotsOf = (c: CharacterPreset): Slot[] =>
    c.inventory.map((item) => ({ item, art: artFor.get(item.icon) }));

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
            style={{ objectPosition: '50% 35%' }}
            width={cover.width}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,24,28,0.6) 0%, rgba(18,24,28,0.86) 40%, #12181c 100%)',
          }}
        />
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6">
        <Link
          className="font-nodesto text-2xl text-brass-pale uppercase tracking-wider"
          href="/"
        >
          Role Master
        </Link>
        <div className="flex items-center gap-4 font-condensed text-[0.7rem] text-charcoal-300 uppercase tracking-widest">
          {PLAYERS.map((name, i) => {
            const chosen = picks[i];
            const c = chosen
              ? CHARACTER_PRESETS.find((x) => x.id === chosen)
              : null;
            const active = choosing && i === seat;
            return (
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1 ${active ? 'border-brass text-brass-pale' : 'border-white/15'}`}
                data-testid={`seat-${name}`}
                key={name}
                style={{ color: c ? seatColor(i) : undefined }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: seatColor(i) }}
                />
                {name}
                {c ? (
                  <span className="font-caps text-sm normal-case tracking-normal">
                    · {c.shortName}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </header>

      {/* Title */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-8 text-center">
        <p className="font-caps text-brass-pale text-xl tracking-widest">
          {campaign.title}
        </p>
        <h1 className="title-cover mt-2 text-[2.8rem] leading-[0.9] sm:text-[4.2rem]">
          {choosing ? (
            <>
              <Caps>{player}</Caps>
              <span className="text-brass-pale">, </span>
              <Caps>elige a tu personaje</Caps>
            </>
          ) : (
            <Caps>La compañía</Caps>
          )}
        </h1>
        <TaperedRule className="mx-auto mt-4 h-4 w-[min(80vw,36rem)] text-red-bright drop-shadow" />
        <p className="mx-auto mt-4 max-w-2xl font-book text-[1.1rem] text-parchment-text leading-relaxed">
          {choosing
            ? seat === 0
              ? 'Seis aventureros de nivel 1 han llegado a Phandalin esta semana. Cada uno trae una historia y una razón para quedarse. Abre a quien te llame la atención: verás su ficha completa y lo que la campaña le guarda.'
              : `Lon ya ha elegido. Ahora te toca a ti, ${player}: el personaje que escojas será el tuyo durante toda la campaña.`
            : 'Dos personajes, dos historias que se cruzan en el Ciervo Dormido. Si todo está en orden, la partida empieza.'}
        </p>
      </section>

      {/* Gallery or company */}
      {choosing ? (
        <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {CHARACTER_PRESETS.map((c) => {
            const taken = picks.indexOf(c.id);
            const takenBy = taken >= 0 ? PLAYERS[taken] : null;
            return (
              <button
                className={`group relative flex overflow-hidden rounded-lg border bg-charcoal-950/70 text-left backdrop-blur transition ${takenBy ? 'cursor-default border-white/10 opacity-60' : 'border-brass/40 hover:-translate-y-1 hover:border-brass hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]'}`}
                data-testid={`card-${c.id}`}
                disabled={!!takenBy}
                key={c.id}
                onClick={() => {
                  setOpen(c.id);
                  setDossierView('story');
                }}
                type="button"
              >
                <div className="relative h-56 w-40 shrink-0 overflow-hidden">
                  <Portrait
                    alt={c.name}
                    art={portraitOf(c.id)}
                    className="h-full w-full transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-charcoal-950 to-transparent" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="font-condensed text-[0.65rem] text-strapline uppercase tracking-widest">
                    {c.race} · {c.className}
                  </div>
                  <div className="mt-1 font-nodesto text-2xl text-brass-pale uppercase leading-none">
                    <Caps>{c.name}</Caps>
                  </div>
                  <p className="mt-2 font-book text-[0.98rem] text-parchment-text leading-snug">
                    {c.pitch}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                    {c.strengths.map((s) => (
                      <span
                        className="rounded-sm border border-white/15 px-1.5 py-0.5 font-condensed text-[0.6rem] text-charcoal-200 uppercase tracking-wider"
                        key={s}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {takenBy ? (
                  <div
                    className="absolute top-3 right-3 rounded-sm px-2 py-0.5 font-condensed text-[0.65rem] text-charcoal-950 uppercase tracking-wider"
                    style={{ background: seatColor(taken) }}
                  >
                    Elegido por {takenBy}
                  </div>
                ) : null}
              </button>
            );
          })}
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-2">
            {picks.map((id, i) => {
              const c = CHARACTER_PRESETS.find((x) => x.id === id);
              if (!c) return null;
              return (
                <article
                  className="flex overflow-hidden rounded-lg border border-brass/40 bg-charcoal-950/75 backdrop-blur"
                  data-testid={`company-${c.id}`}
                  key={id}
                >
                  <div className="relative w-44 shrink-0">
                    <Portrait
                      alt={c.name}
                      art={portraitOf(c.id)}
                      className="h-full w-full"
                    />
                    <div
                      className="absolute top-3 left-3 rounded-sm px-2 py-0.5 font-condensed text-[0.65rem] text-charcoal-950 uppercase tracking-wider"
                      style={{ background: seatColor(i) }}
                    >
                      {PLAYERS[i]}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="font-condensed text-[0.65rem] text-strapline uppercase tracking-widest">
                      {c.race} · {c.className} {c.level} · {c.background}
                    </div>
                    <div className="mt-1 font-nodesto text-3xl text-brass-pale uppercase leading-none">
                      <Caps>{c.name}</Caps>
                    </div>
                    <p className="mt-3 font-book text-[0.98rem] text-parchment-text leading-snug">
                      {c.hook}
                    </p>
                    <div className="mt-auto flex items-center gap-4 pt-4 font-scaly text-charcoal-300 text-xs">
                      <span>PV {c.hp.max}</span>
                      <span>CA {c.armorClass}</span>
                      <span>{c.coins.gp} po</span>
                      <button
                        className="btn-ghost ml-auto px-2 py-1 text-[0.65rem] uppercase"
                        onClick={() => {
                          setOpen(c.id);
                          setDossierView('sheet');
                        }}
                        type="button"
                      >
                        Ver ficha
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              className="btn-beyond px-8 py-3.5 text-lg uppercase"
              data-testid="begin-adventure"
              onClick={begin}
              type="button"
            >
              Empezar la aventura
            </button>
            <button
              className="btn-ghost px-4 py-3 text-sm uppercase"
              onClick={undo}
              type="button"
            >
              Cambiar el personaje de Jato
            </button>
          </div>
          <p className="mt-4 text-center font-scaly text-charcoal-400 text-xs">
            Narrador {model === 'claude-opus-5' ? 'Opus 5' : 'Fable 5.1'} ·
            Muerte permanente:{' '}
            {death === 'never'
              ? 'no'
              : death === 'unlikely'
                ? 'altamente improbable'
                : 'puede pasar'}
          </p>
        </section>
      )}

      {choosing && picks.length > 0 ? (
        <div className="fixed bottom-4 left-4">
          <button
            className="btn-ghost px-3 py-1.5 text-[0.65rem] uppercase backdrop-blur"
            onClick={undo}
            type="button"
          >
            ← Lon vuelve a elegir
          </button>
        </div>
      ) : null}

      {/* Dossier */}
      {opened ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
          data-testid="dossier"
        >
          <div className="flex items-center gap-3 border-brass/30 border-b bg-charcoal-950/90 px-5 py-3">
            <div className="min-w-0">
              <div className="font-condensed text-[0.65rem] text-strapline uppercase tracking-widest">
                {opened.race} · {opened.className} {opened.level} ·{' '}
                {opened.background}
              </div>
              <div className="truncate font-nodesto text-2xl text-brass-pale uppercase leading-none">
                <Caps>{opened.name}</Caps>
              </div>
            </div>
            <div className="ml-6 flex overflow-hidden rounded border border-white/15">
              {(
                [
                  ['story', 'Historia'],
                  ['sheet', 'Ficha'],
                  ['pack', 'Mochila'],
                ] as const
              ).map(([id, label]) => (
                <button
                  className={`px-3 py-1.5 font-condensed text-[0.7rem] uppercase tracking-wider ${dossierView === id ? 'bg-white/15 text-white' : 'text-charcoal-300 hover:text-white'}`}
                  data-testid={`dossier-${id}`}
                  key={id}
                  onClick={() => setDossierView(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {choosing && !picks.includes(opened.id) ? (
                <button
                  className="btn-beyond px-5 py-2 text-sm uppercase"
                  data-testid="pick-character"
                  onClick={() => pick(opened.id)}
                  type="button"
                >
                  {player} juega con {opened.shortName}
                </button>
              ) : null}
              <button
                className="btn-ghost px-3 py-2 text-xs uppercase"
                data-testid="dossier-close"
                onClick={() => setOpen(null)}
                type="button"
              >
                Cerrar · Esc
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
            {dossierView === 'story' ? (
              <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
                <div className="frame-brass relative aspect-[3/4] overflow-hidden rounded-sm">
                  <Portrait
                    alt={opened.name}
                    art={portraitOf(opened.id)}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/70 to-transparent p-4 pt-12">
                    <div className="font-caps text-brass-pale text-lg">
                      {opened.pitch}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {opened.strengths.map((s) => (
                        <span
                          className="rounded-sm border border-white/20 px-1.5 py-0.5 font-condensed text-[0.6rem] text-charcoal-200 uppercase tracking-wider"
                          key={s}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="paper rounded-[3px] px-8 py-7 text-ink md:px-10">
                  <div className="font-caps text-ink-muted text-sm tracking-widest">
                    Quién es
                  </div>
                  <h2 className="h-manual text-3xl">{opened.name}</h2>
                  {opened.backstory.split('\n\n').map((para, i) => (
                    <p
                      className={`mt-3 font-book text-[1.08rem] leading-[1.55] ${i === 0 ? 'dropcap-only' : ''}`}
                      key={para.slice(0, 24)}
                    >
                      {para}
                    </p>
                  ))}
                  <div className="my-5 h-[2px] bg-gold-rule" />
                  <div className="font-caps text-ink-muted text-sm tracking-widest">
                    Lo que la campaña le guarda
                  </div>
                  <h3 className="h-manual text-2xl">
                    En {campaign.title.replace(/^El /, 'el ')}
                  </h3>
                  <p className="mt-2 font-book text-[1.08rem] leading-[1.55]">
                    {opened.hook}
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {[
                      ['Rasgos', opened.traits],
                      ['Ideal', opened.ideals],
                      ['Vínculo', opened.bonds],
                      ['Defecto', opened.flaws],
                    ].map(([t, v]) => (
                      <div
                        className="rounded-md border border-ink/40 bg-paper-light/60 px-3 py-2"
                        key={t}
                      >
                        <div className="font-scaly text-[0.6rem] text-ink-muted uppercase tracking-widest">
                          {t}
                        </div>
                        <p className="font-book text-[0.92rem] italic leading-snug">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : dossierView === 'sheet' ? (
              <div className="mx-auto max-w-[1400px]">
                <CharacterSheet
                  character={opened}
                  itemArt={artFor}
                  player={
                    picks.includes(opened.id)
                      ? PLAYERS[picks.indexOf(opened.id)]
                      : player
                  }
                  portrait={portraitOf(opened.id)}
                />
              </div>
            ) : (
              <div className="mx-auto max-w-4xl">
                <Inventory
                  coinArt={coinArt}
                  coins={opened.coins}
                  owner={opened.shortName}
                  slots={slotsOf(opened)}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
};

export { SetupFlow };
