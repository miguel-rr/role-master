'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atmosphere } from '@/app/design/scenes/_components/atmosphere';
import { DiceModal, type DiceRequest } from '@/components/dice/dice-modal';
import { LoreText } from '@/components/lore/lore-text';
import { SoundButton } from '@/components/sound/mixer';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';
import type { SoundEntry } from '@/data/sound/schema';
import type { UiCue } from '@/data/sound/vocabulary';
import { mergeLore, parseLoreNotes, revealWorldLore } from '@/lib/game/lore';
import { paginate } from '@/lib/game/pages';
import { applyEffects, type PartyMember } from '@/lib/game/party';
import { modifierFor, rollerFor, scoreRoll } from '@/lib/game/rolls';
import {
  BOTH,
  type Choice,
  type GameState,
  type PlayerAction,
  type ResolvedTurn,
  type RollResult,
  type TurnRequest,
  type TurnResponse,
  type Who,
} from '@/lib/game/schema';
import { saveGame } from '@/lib/game/storage';
import { cueNamed, pageNamesCue } from '@/lib/sound/cue-words';
import { soundEngine } from '@/lib/sound/engine';
import { useSound } from '@/lib/sound/use-sound';
import { Glossary } from './glossary';
import { NotesDrawer } from './notes-drawer';
import { type CoinArt, PartyOverlay } from './party-overlay';
import { ReadingLog } from './reading-log';

type GameStageProps = {
  initial: GameState;
  party: PartyMember[];
  /** Backdrop while the very first turn is being written. */
  cover: ArtEntry | undefined;
  itemArt: Record<string, ArtEntry>;
  coinArt: CoinArt;
  /** Interface sounds by cue. */
  ui: Partial<Record<UiCue, SoundEntry>>;
  /** What the players read before the first scene. */
  intro: string[];
};

const TYPE_MS = 16;

const useTypewriter = (text: string, cue: string, instant = false) => {
  const [shown, setShown] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `cue` restarts the reveal on purpose
  useEffect(() => {
    setShown(0);
    if (
      instant ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(text.length);
      return;
    }
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          return n;
        }
        return Math.min(text.length, n + 2);
      });
    }, TYPE_MS);
    return () => window.clearInterval(id);
  }, [text, cue]);
  return {
    visible: text.slice(0, shown),
    done: shown >= text.length,
    finish: () => setShown(text.length),
  };
};

const whoLabel = (who: Who, party: PartyMember[]) =>
  who === BOTH ? 'Ambos' : (party.find((p) => p.id === who)?.name ?? who);

const rollLabel = (roll: {
  skill: string;
  dc: number;
  advantage: 'none' | 'advantage' | 'disadvantage';
}) =>
  `${roll.skill} · CD ${roll.dc}${roll.advantage === 'advantage' ? ' · ventaja' : roll.advantage === 'disadvantage' ? ' · desventaja' : ''}`;

const verdict = (r: RollResult) =>
  r.critical === 'hit'
    ? '¡Crítico!'
    : r.critical === 'miss'
      ? 'Pifia'
      : r.success
        ? 'Éxito'
        : 'Fallo';

/**
 * The game screen: the scene stage from the design lab, fed by the narrator.
 * Owns the turn loop — show turn → players decide → (dice) → ask narrator →
 * next turn — and persists everything in the browser.
 */
const GameStage = ({
  initial,
  party,
  cover,
  itemArt,
  coinArt,
  ui,
  intro,
}: GameStageProps) => {
  const sound = useSound();
  const engine = soundEngine();
  const firedCues = useRef(new Set<string>());
  const [state, setState] = useState<GameState>(initial);
  const [step, setStep] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dice, setDice] = useState<
    (DiceRequest & { choice: Choice; roller: string }) | null
  >(null);
  const [lastAction, setLastAction] = useState<PlayerAction | null>(null);
  const [customWho, setCustomWho] = useState<Who>(BOTH);
  const [customText, setCustomText] = useState('');
  const [showStrip, setShowStrip] = useState(true);
  const [overlay, setOverlay] = useState<string | null>(null);
  /** Furthest page reached in this turn: pages before it are re-reads. */
  const [maxStep, setMaxStep] = useState(0);
  const [log, setLog] = useState(false);
  const [glossary, setGlossary] = useState<{ focus?: string } | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const openGlossary = (focus?: string) => setGlossary({ focus });
  const stripTimer = useRef<number | null>(null);
  const startedRef = useRef(false);
  const ids = useMemo(() => party.map((p) => p.id), [party]);

  const last = state.history.at(-1);
  const turn: ResolvedTurn | undefined = last?.turn;
  const beats = useMemo(() => turn?.beats ?? [], [turn]);
  // Short pages, big type: the text is read from the sofa.
  const pages = useMemo(() => paginate(beats), [beats]);
  const current = pages[Math.min(step, Math.max(0, pages.length - 1))];
  const atEnd = step >= pages.length - 1;
  const rereading = step < maxStep;
  const { visible, done, finish } = useTypewriter(
    current?.text ?? '',
    `${turn?.id ?? ''}:${step}`,
    rereading,
  );
  const currentBeat = current?.beat ?? 0;
  const figureVisible =
    !!turn?.figureArt &&
    beats
      .slice(0, currentBeat + 1)
      .some((b) => b.kind === 'line' || (b.kind === 'narration' && b.reveal));
  const speaking = current?.kind === 'line' && !thinking;
  const speakerName =
    turn?.figure.kind === 'none' ? 'Máster' : (turn?.figure.name ?? 'Máster');
  const speakerRole =
    turn?.figure.kind === 'none' ? 'Narración' : (turn?.figure.role ?? '');

  // ── Narrator call ─────────────────────────────────────────────────────
  const askNarrator = useCallback(
    async (action: PlayerAction, base: GameState) => {
      setThinking(true);
      setError(null);
      setLastAction(action);
      const body: TurnRequest = {
        campaignId: base.campaignId,
        model: base.model,
        death: base.death,
        players: base.players,
        characters: base.characters,
        memory: base.memory,
        npcArt: base.npcArt,
        loreNames: base.lore.map((e) => e.name),
        history: base.history.slice(-10).map((h) => ({
          action: h.action,
          turn: {
            place: h.turn.place,
            chapter: h.turn.chapter,
            time: h.turn.time,
            figure: h.turn.figure,
            beats: h.turn.beats,
            choices: h.turn.choices,
            summary: h.turn.summary,
            backgroundId: h.turn.background?.id,
          },
        })),
        action,
      };
      try {
        const res = await fetch('/api/turn', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as TurnResponse & { error?: string };
        if (!res.ok || !data.turn) {
          throw new Error(data.error ?? `Error ${res.status}`);
        }
        const next: GameState = {
          ...base,
          characters: applyEffects(base.characters, data.turn.effects),
          memory: [...base.memory, ...data.turn.memory].slice(-60),
          npcArt: data.npcArt,
          history: [...base.history, { action, turn: data.turn }],
          lore: mergeLore(
            revealWorldLore(
              base.lore,
              base.campaignId,
              [
                ...data.turn.beats.map((b) => b.text),
                ...data.turn.choices.map((c) => c.label),
              ].join(' '),
              base.history.length + 1,
              `${data.turn.chapter} · ${data.turn.place}`,
            ),
            parseLoreNotes(data.turn.lore),
            base.history.length + 1,
            `${data.turn.chapter} · ${data.turn.place}`,
          ),
          updatedAt: new Date().toISOString(),
        };
        setState(next);
        saveGame(next);
        setStep(0);
        setMaxStep(0);
        setCustomText('');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setThinking(false);
      }
    },
    [],
  );

  // ── Sound: the desk follows the scene ──────────────────────────────
  useEffect(() => {
    engine.registerUi(ui);
  }, [engine, ui]);

  // Someone under a quarter of their hit points: a pulse under the scene.
  const inDanger = state.characters.some(
    (c) => c.hp > 0 && c.hp / c.maxHp <= 0.25,
  );
  useEffect(() => {
    engine.setHeartbeat(inDanger && sound.status === 'running');
  }, [engine, inDanger, sound.status]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new turn id is the cue; the rest is stable
  useEffect(() => {
    if (!turn) return;
    const st = turn.soundtrack;
    if (state.history.length > 1) engine.playUi(ui['page-turn']);
    if (!st) return;
    // "keep" means "what was already sounding": after a reload that has to
    // be recovered from earlier turns, so walk back to the last real value.
    const soundtracks = state.history.map((h) => h.turn.soundtrack);
    const music = [...soundtracks]
      .reverse()
      .find((x) => x && x.music !== 'keep')?.music;
    const ambience = [...soundtracks]
      .reverse()
      .find((x) => x && x.ambience !== 'keep')?.ambience;
    if (music !== undefined && music !== 'keep')
      engine.playMusic(music, { fade: 5 });
    if (ambience !== undefined && ambience !== 'keep')
      engine.setAmbience(ambience, { fade: 3 });
    engine.preload(st.cues.map((c) => c.entry));
  }, [turn?.id]);

  // A cue fires on the page of its beat that names it, the moment the
  // typewriter reveals the word; a page that never names it fires on open.
  useEffect(() => {
    if (!turn?.soundtrack || !current) return;
    for (const c of turn.soundtrack.cues) {
      if (c.beat !== currentBeat) continue;
      const key = `${turn.id}:${c.beat}:${c.sfx}`;
      if (firedCues.current.has(key)) continue;
      const beatPages = pages.filter((p) => p.beat === c.beat);
      const target =
        beatPages.find((p) => pageNamesCue(c.sfx, p.text)) ?? beatPages[0];
      if (!target || target !== current) continue;
      const named = pageNamesCue(c.sfx, current.text);
      if (!named || rereading || cueNamed(c.sfx, visible)) {
        firedCues.current.add(key);
        engine.playSfx(c.entry);
      }
    }
  }, [turn, current, currentBeat, pages, visible, rereading, engine]);

  const creatureShown = useRef<string | null>(null);
  useEffect(() => {
    if (!turn || turn.figure.kind !== 'creature' || !figureVisible) return;
    if (creatureShown.current === turn.id) return;
    creatureShown.current = turn.id;
    engine.playUi(ui.reveal);
  }, [turn, figureVisible, engine, ui.reveal]);

  // Leaving the table stops the desk.
  useEffect(() => () => engine.stopAll(), [engine]);

  // ── Introduction: the minimum lore, read before the first scene ────
  const introPages = useMemo(
    () => [
      ...intro.map((text, i) => ({
        title: i === 0 ? 'Lo que sabéis al llegar' : null,
        text,
      })),
      ...party.map((p) => ({
        title: `${p.playerName} lleva a ${p.character.name}`,
        text: `${p.character.pitch} ${p.character.hook}`,
      })),
    ],
    [intro, party],
  );
  const [introStep, setIntroStep] = useState(0);
  const inIntro = state.history.length === 0 && !thinking;
  const introPage = introPages[Math.min(introStep, introPages.length - 1)];
  const introLast = introStep >= introPages.length - 1;
  const introText = useTypewriter(
    inIntro ? (introPage?.text ?? '') : '',
    `intro:${introStep}`,
  );

  /** The first narrator turn, once the introduction has been read. */
  const startAdventure = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    engine.playUi(ui['page-turn']);
    void askNarrator({ kind: 'start' }, initial);
  };

  const introAdvance = () => {
    if (!introText.done) {
      introText.finish();
      return;
    }
    if (!introLast) setIntroStep((s) => s + 1);
  };

  // ── Decisions ─────────────────────────────────────────────────────────
  const choose = (choice: Choice) => {
    if (thinking) return;
    engine.playUi(ui.choice);
    if (choice.roll) {
      // The tray opens; nothing is rolled until a player presses "Tirar".
      const roller = rollerFor(choice.who, choice.roll.skill, ids);
      const member = party.find((p) => p.id === roller);
      const mod = modifierFor(roller, choice.roll.skill);
      setDice({
        choice,
        roller,
        playerName: member ? `${member.name} (${member.playerName})` : roller,
        color: member?.color ?? '#c3a76e',
        label: rollLabel(choice.roll),
        notation: [choice.roll.advantage === 'none' ? '1d20' : '2d20'],
        modifier: mod,
      });
      return;
    }
    void askNarrator(
      { kind: 'choice', who: choice.who, text: choice.label },
      state,
    );
  };

  const onDice = (values: number[]) => {
    if (!dice?.choice.roll) return;
    const result: RollResult = scoreRoll(
      dice.choice.roll,
      values,
      dice.modifier,
    );
    const action: PlayerAction = {
      kind: 'choice',
      who: dice.choice.who,
      text: dice.choice.label,
      roll: result,
    };
    setDice(null);
    void askNarrator(action, state);
  };

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customText.trim();
    if (!text || thinking) return;
    // Give the keyboard back to the stage: Space/Enter advance the next scene.
    (document.activeElement as HTMLElement | null)?.blur();
    void askNarrator({ kind: 'custom', who: customWho, text }, state);
  };

  const advance = () => {
    if (thinking) return;
    if (!done) {
      finish();
      return;
    }
    if (!atEnd) {
      setStep((s) => {
        setMaxStep((m) => Math.max(m, s + 1));
        return s + 1;
      });
    }
  };

  /** One page back to re-read; before the first page, the whole log. */
  const back = () => {
    if (thinking) return;
    if (step > 0) setStep((s) => s - 1);
    else setLog(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (overlay || dice || log || glossary) return;
      if (e.key === 'g') {
        openGlossary();
        return;
      }
      if (e.key === 'n') {
        setNotesOpen((o) => !o);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (inIntro) introAdvance();
        else advance();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        if (inIntro) setIntroStep((s) => Math.max(0, s - 1));
        else back();
      } else if (e.key === 'i' || e.key === 'f') {
        setOverlay(ids[0] ?? null);
      } else if (e.key === 'm') {
        engine.setEnabled(!sound.mix.enabled);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const wake = () => {
      setShowStrip(true);
      if (stripTimer.current) window.clearTimeout(stripTimer.current);
      stripTimer.current = window.setTimeout(() => setShowStrip(false), 4000);
    };
    wake();
    window.addEventListener('mousemove', wake);
    return () => {
      window.removeEventListener('mousemove', wake);
      if (stripTimer.current) window.clearTimeout(stripTimer.current);
    };
  }, []);

  const openOverlay = (id: string | null) => {
    engine.playUi(id ? ui['open-sheet'] : ui['close-sheet']);
    setOverlay(id);
  };

  const showChoices = !!turn && done && atEnd && !thinking && !dice;
  const hint = rereading
    ? 'Releyendo · Continuar ▸'
    : !done
      ? 'Mostrar todo'
      : atEnd
        ? 'Decidid'
        : 'Continuar ▸';
  const lastRoll =
    lastAction?.kind === 'choice' && lastAction.roll ? lastAction.roll : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-charcoal-950 text-white"
      data-ambience={sound.bedIds.join(',')}
      data-heartbeat={inDanger ? 'on' : 'off'}
      data-last-cue={sound.lastCue ?? ''}
      data-music={sound.musicId ?? ''}
      data-sound={sound.status}
      data-testid="game-stage"
      data-turn={state.history.length}
    >
      {/* Backdrop */}
      {!turn && cover ? (
        <div className="absolute inset-0 animate-bg-in">
          {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
          <img
            alt=""
            className="absolute inset-0 h-full w-full animate-kenburns object-cover"
            height={cover.height}
            src={cover.src}
            style={{ objectPosition: '50% 40%' }}
            width={cover.width}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(18,24,28,0.45), rgba(9,8,9,0.85))',
            }}
          />
        </div>
      ) : null}
      {turn ? (
        <div
          className="absolute inset-0 animate-bg-in"
          data-background={turn.background?.id ?? ''}
          data-testid="backdrop"
          key={turn.id}
        >
          {turn.background ? (
            // biome-ignore lint/performance/noImgElement: pre-sized local art
            <img
              alt=""
              className="absolute inset-0 h-full w-full animate-kenburns object-cover"
              height={turn.background.height}
              src={turn.background.src}
              style={{ objectPosition: turn.focus }}
              width={turn.background.width}
            />
          ) : (
            <div className="absolute inset-0 bg-charcoal-900" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: turn.grade }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[45vh]"
            style={{
              background:
                'linear-gradient(to top, rgba(9,8,9,0.85), rgba(9,8,9,0))',
            }}
          />
        </div>
      ) : null}
      {turn && turn.atmosphere !== 'none' ? (
        <Atmosphere key={`atm-${turn.id}`} kind={turn.atmosphere} />
      ) : null}

      {/* Figure */}
      {turn?.figureArt && figureVisible ? (
        <div
          className="pointer-events-none absolute right-[4vw] bottom-0 h-[88vh] w-[min(46vw,62vh)] animate-figure-in transition-[filter] duration-700"
          data-testid="figure"
          key={`fig-${turn.id}`}
          style={{
            filter:
              speaking || turn.figure.kind === 'creature'
                ? 'none'
                : 'brightness(0.72) saturate(0.85)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.65))' }}
          >
            {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
            <img
              alt=""
              className="h-full w-full object-cover object-top"
              height={turn.figureArt.height}
              src={turn.figureArt.src}
              style={{
                maskImage:
                  'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                WebkitMaskComposite: 'source-in',
              }}
              width={turn.figureArt.width}
            />
          </div>
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${turn.accent}55, transparent 70%)`,
            }}
          />
        </div>
      ) : null}

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
        <div className="animate-fade-in">
          <div className="font-condensed text-[clamp(0.807rem,1.04vw,1.33rem)] text-parchment-text uppercase tracking-[0.3em] drop-shadow">
            {turn?.chapter ?? 'Prólogo'}
          </div>
          <div
            className="mt-1 font-nodesto text-[clamp(2.38rem,3.32vw,4.27rem)] text-white uppercase leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            data-testid="place"
          >
            <Caps>{turn?.place ?? 'Phandalin'}</Caps>
          </div>
          <div className="mt-1 font-caps text-[clamp(1.23rem,1.61vw,1.99rem)] text-brass-pale drop-shadow">
            {turn?.time ?? ''}
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-white/10 bg-charcoal-950/55 p-1.5 backdrop-blur">
          {party.map((p) => {
            const c = state.characters.find((x) => x.id === p.id);
            const hp = c ? c.hp / c.maxHp : 1;
            return (
              <button
                className="group flex items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-white/10"
                data-testid={`hud-${p.id}`}
                key={p.id}
                onClick={() => openOverlay(p.id)}
                title={`Ficha e inventario de ${p.name}`}
                type="button"
              >
                <div
                  className="h-[clamp(3rem,4.2vw,5.2rem)] w-[clamp(3rem,4.2vw,5.2rem)] overflow-hidden rounded-full ring-2"
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
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-caps text-[clamp(1.09rem,1.52vw,1.9rem)] text-brass-pale leading-none">
                      {p.name}
                    </span>
                    <span className="font-condensed text-[clamp(0.665rem,0.855vw,1.09rem)] text-charcoal-400 uppercase tracking-wider">
                      {p.playerName}
                    </span>
                  </div>
                  <div className="mt-1 h-[clamp(0.4rem,0.5vw,0.7rem)] w-[clamp(6rem,8vw,10rem)] overflow-hidden rounded-full bg-black/60">
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${hp * 100}%`,
                        background:
                          hp > 0.5
                            ? '#6c8a3c'
                            : hp > 0.25
                              ? '#e69a28'
                              : '#e40712',
                      }}
                    />
                  </div>
                  <div
                    className="font-scaly text-[clamp(0.76rem,1.04vw,1.33rem)] text-charcoal-400"
                    data-testid={`hud-stats-${p.id}`}
                  >
                    {c ? `${c.hp}/${c.maxHp} PV · ${c.gold} po` : ''}
                  </div>
                </div>
              </button>
            );
          })}
          <span className="hidden self-center px-2 font-condensed text-[clamp(0.617rem,0.807vw,0.997rem)] text-charcoal-500 uppercase tracking-wider lg:block">
            Ficha
            <br />
            tecla I
          </span>
          <SoundButton />
        </div>
      </header>
      {sound.mix.enabled &&
      sound.status !== 'running' &&
      sound.status !== 'unsupported' ? (
        <button
          className="pointer-events-auto absolute top-[clamp(6rem,7.6vw,9.6rem)] right-6 flex items-center gap-2 rounded-md border border-brass/60 bg-charcoal-950/85 px-3 py-2 font-caps text-[clamp(0.95rem,1.23vw,1.52rem)] text-brass-pale backdrop-blur transition hover:border-brass"
          data-testid="sound-unlock"
          onClick={() => void engine.unlock()}
          type="button"
        >
          <span className="h-2 w-2 animate-ember rounded-full bg-brass" />
          Activar sonido
        </button>
      ) : null}

      {/* Speech */}
      {turn?.figure.kind === 'character' ? (
        <div
          className={`absolute top-[11vh] transition-all duration-500 ${turn.figureArt ? 'right-[calc(4vw+min(46vw,62vh)-6vw)] w-[min(36vw,32rem)]' : 'right-[4vw] w-[min(42vw,38rem)]'} ${speaking ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
          data-testid="speech"
        >
          <button
            aria-label="Releer la página anterior"
            className="absolute top-1/2 -left-14 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brass/50 bg-charcoal-950/85 font-nodesto text-2xl text-brass-pale backdrop-blur transition hover:border-brass hover:text-white"
            data-testid="page-back-speech"
            onClick={back}
            title={
              step > 0 ? 'Página anterior (←)' : 'Lo leído hasta ahora (←)'
            }
            type="button"
          >
            ‹
          </button>
          <div className="absolute -top-[1.1em] right-5 z-10 flex flex-col rounded-sm border border-brass/70 bg-charcoal-950 px-3 py-1.5 shadow-lg">
            <span className="font-caps text-[clamp(1.38rem,1.8vw,2.28rem)] text-brass-pale leading-none">
              {speakerName}
            </span>
            <span className="font-condensed text-[clamp(0.76rem,0.997vw,1.23rem)] text-strapline uppercase tracking-wider">
              {speakerRole}
            </span>
          </div>
          <div
            className="relative block w-full select-text rounded-lg border border-brass/50 px-6 pt-[clamp(2.8rem,3.4vw,4.4rem)] pb-5 text-left"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,24,28,0.96), rgba(12,14,18,0.96))',
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6), 0 0 48px ${turn.accent}22`,
            }}
          >
            <span className="absolute top-14 -right-2 h-4 w-4 rotate-45 border-brass/50 border-t border-r bg-[#14181c]" />
            <p className="font-book text-[clamp(1.47rem,2.04vw,2.61rem)] text-parchment-text leading-[1.32]">
              <LoreText
                currentTurn={state.history.length}
                lore={state.lore}
                onOpenGlossary={openGlossary}
                resetKey={`${turn.id}:${step}`}
                text={speaking ? visible : (current?.text ?? '')}
              />
            </p>
            <div className="mt-4 flex items-center justify-between font-condensed text-[clamp(0.807rem,1.09vw,1.38rem)] uppercase tracking-widest">
              <span style={{ color: turn.accent }}>Habla {speakerName}</span>
              <button
                className="rounded-sm px-2 py-1 text-charcoal-300 transition hover:bg-white/10 hover:text-white"
                data-testid="page-next-speech"
                onClick={advance}
                type="button"
              >
                {hint}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Introduction */}
      {inIntro && introPage ? (
        <div
          className="absolute bottom-[4.5rem] left-[4vw] w-[min(64vw,74rem)]"
          data-testid="intro"
        >
          <div className="relative">
            {introStep > 0 ? (
              <button
                aria-label="Página anterior"
                className="absolute top-1/2 -left-14 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brass/50 bg-charcoal-950/85 font-nodesto text-2xl text-brass-pale backdrop-blur transition hover:border-brass hover:text-white"
                onClick={() => setIntroStep((s) => Math.max(0, s - 1))}
                type="button"
              >
                ‹
              </button>
            ) : null}
            <div
              className="paper relative block w-full select-text rounded-[3px] px-9 pt-8 pb-7 text-left"
              data-testid="intro-page"
            >
              <div className="absolute -top-4 left-8 flex items-center gap-2 rounded-sm border border-brass/60 bg-charcoal-950 px-3 py-1 shadow-lg">
                <span className="font-caps text-[clamp(1.23rem,1.71vw,2.18rem)] text-brass-pale leading-none">
                  Antes de empezar
                </span>
                <span className="font-condensed text-[clamp(0.76rem,0.997vw,1.23rem)] text-strapline uppercase tracking-wider">
                  Introducción
                </span>
              </div>
              {introPage.title ? (
                <div className="mb-2 font-caps text-[clamp(1.38rem,1.9vw,2.47rem)] text-maroon">
                  {introPage.title}
                </div>
              ) : null}
              <p
                className={`min-h-[6rem] font-book text-[clamp(1.52rem,2.23vw,2.85rem)] text-ink leading-[1.32] ${introStep === 0 ? 'dropcap-only' : ''}`}
              >
                <LoreText
                  lore={state.lore}
                  onOpenGlossary={openGlossary}
                  resetKey={`intro:${introStep}`}
                  text={introText.visible}
                />
              </p>
              <div className="mt-3 flex items-center justify-between">
                <TaperedRule className="h-2 w-40 text-rule-red" />
                <span className="flex items-center gap-3 font-condensed text-[clamp(0.902rem,1.19vw,1.52rem)] text-ink-muted uppercase tracking-widest">
                  <span>
                    {introStep + 1} / {introPages.length}
                  </span>
                  <button
                    className="rounded-sm px-2 py-1 transition hover:bg-ink/10 hover:text-ink"
                    data-testid="intro-next"
                    onClick={introAdvance}
                    type="button"
                  >
                    {!introText.done
                      ? 'Mostrar todo'
                      : introLast
                        ? 'Cuando queráis'
                        : 'Continuar ▸'}
                  </button>
                </span>
              </div>
            </div>
          </div>
          {introLast && introText.done ? (
            <div className="mt-3 flex justify-end">
              <button
                className="btn-beyond px-7 py-3.5 text-[clamp(0.95rem,1.23vw,1.52rem)] uppercase"
                data-testid="start-adventure"
                onClick={startAdventure}
                type="button"
              >
                Empezar la aventura
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Narration + decisions column */}
      <div className="absolute bottom-[4.5rem] left-[4vw] flex max-h-[calc(100vh-6rem)] w-[min(64vw,74rem)] flex-col justify-end">
        {turn ? (
          <div
            className={`relative transition-all duration-500 ${speaking || thinking ? 'pointer-events-none max-h-0 translate-y-6 overflow-hidden opacity-0' : 'max-h-[60vh] opacity-100'}`}
          >
            <button
              aria-label="Releer la página anterior"
              className="absolute top-1/2 -left-14 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brass/50 bg-charcoal-950/85 font-nodesto text-2xl text-brass-pale backdrop-blur transition hover:border-brass hover:text-white"
              data-testid="page-back"
              onClick={back}
              title={
                step > 0 ? 'Página anterior (←)' : 'Lo leído hasta ahora (←)'
              }
              type="button"
            >
              ‹
            </button>
            <div
              className="paper relative block w-full select-text rounded-[3px] px-9 pt-8 pb-7 text-left"
              data-testid="narration"
            >
              <div className="absolute -top-4 left-8 flex items-center gap-2 rounded-sm border border-brass/60 bg-charcoal-950 px-3 py-1 shadow-lg">
                <span className="font-caps text-[clamp(1.23rem,1.71vw,2.18rem)] text-brass-pale leading-none">
                  Máster
                </span>
                <span className="font-condensed text-[clamp(0.76rem,0.997vw,1.23rem)] text-strapline uppercase tracking-wider">
                  Narración
                </span>
              </div>
              <div className="max-h-[34vh] min-h-[6rem] overflow-y-auto pr-2 font-book text-[clamp(1.52rem,2.23vw,2.85rem)] text-ink leading-[1.32]">
                {current && current.kind === 'narration' ? (
                  <p
                    className={current.first ? 'dropcap-only' : ''}
                    key={`${turn.id}-${step}`}
                  >
                    <LoreText
                      currentTurn={state.history.length}
                      lore={state.lore}
                      onOpenGlossary={openGlossary}
                      resetKey={`${turn.id}:${step}`}
                      text={visible}
                    />
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <TaperedRule className="h-2 w-40 text-rule-red" />
                <span className="flex items-center gap-3 font-condensed text-[clamp(0.902rem,1.19vw,1.52rem)] text-ink-muted uppercase tracking-widest">
                  {pages.length > 1 ? (
                    <span data-testid="page-counter">
                      {Math.min(step, pages.length - 1) + 1} / {pages.length}
                    </span>
                  ) : null}
                  <button
                    className="rounded-sm px-2 py-1 transition hover:bg-ink/10 hover:text-ink"
                    data-testid="page-next"
                    onClick={advance}
                    type="button"
                  >
                    {speaking ? `Habla ${speakerName}` : hint}
                  </button>
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* What was just decided (and rolled), while the narrator writes and on the first beat after */}
        {lastAction &&
        lastAction.kind !== 'start' &&
        (thinking || step === 0) ? (
          <div
            className="mt-3 flex animate-fade-in flex-wrap items-center gap-3 rounded-md border border-brass/40 bg-charcoal-950/85 px-4 py-2.5 backdrop-blur"
            data-testid="last-decision"
          >
            <span className="font-condensed text-[clamp(0.712rem,0.902vw,1.14rem)] text-charcoal-400 uppercase tracking-wider">
              Última decisión
            </span>
            <span
              className="font-condensed text-[clamp(0.76rem,0.997vw,1.23rem)] uppercase tracking-wider"
              style={{
                color:
                  party.find((p) => p.id === lastAction.who)?.color ??
                  '#c3a76e',
              }}
            >
              {whoLabel(lastAction.who, party)}
            </span>
            <span className="font-book text-[clamp(1.09rem,1.42vw,1.8rem)] text-parchment-text">
              {lastAction.kind === 'custom'
                ? `«${lastAction.text}»`
                : lastAction.text}
            </span>
            {lastRoll ? (
              <span
                className="ml-auto flex items-center gap-2 font-scaly text-[clamp(0.95rem,1.19vw,1.47rem)] text-charcoal-300"
                data-testid="last-roll"
              >
                <span>
                  {lastRoll.skill} · CD {lastRoll.dc}
                </span>
                <span
                  className={`flex h-[clamp(2.25rem,2.8vw,3.4rem)] w-[clamp(2.25rem,2.8vw,3.4rem)] items-center justify-center rounded-[22%] border-2 font-nodesto text-[clamp(1.07rem,1.33vw,1.66rem)] ${lastRoll.critical === 'hit' ? 'border-brand-400 text-brand-400' : lastRoll.critical === 'miss' ? 'border-charcoal-500 text-charcoal-400' : 'border-brass text-brass-pale'}`}
                >
                  {lastRoll.result}
                </span>
                <span>
                  {lastRoll.modifier >= 0 ? '+' : '−'}
                  {Math.abs(lastRoll.modifier)} ={' '}
                  <b className="text-white">{lastRoll.total}</b>
                  <span
                    className={`ml-2 font-caps text-[clamp(0.95rem,1.23vw,1.52rem)] ${lastRoll.success ? 'text-brass-pale' : 'text-brand-300'}`}
                    data-testid="last-roll-verdict"
                  >
                    {verdict(lastRoll)}
                  </span>
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

        {thinking ? (
          <div
            className="mt-3 flex items-center gap-4 rounded-md border border-white/10 bg-charcoal-950/70 px-5 py-4 backdrop-blur"
            data-testid="thinking"
          >
            <span className="h-3 w-3 animate-ember rounded-full bg-brass" />
            <span className="font-caps text-[clamp(1.33rem,1.99vw,2.47rem)] text-brass-pale">
              El máster piensa…
            </span>
            <span className="font-scaly text-[clamp(0.95rem,1.23vw,1.52rem)] text-charcoal-400">
              Escribe la escena con calma. Suele tardar entre diez y treinta
              segundos.
            </span>
          </div>
        ) : null}

        {error ? (
          <div
            className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-brand-700/60 bg-brand-900/40 px-4 py-3 font-scaly text-sm"
            data-testid="error"
          >
            <span className="text-brand-100">{error}</span>
            {lastAction ? (
              <button
                className="btn-ghost ml-auto px-3 py-1 text-xs uppercase"
                onClick={() => void askNarrator(lastAction, state)}
                type="button"
              >
                Reintentar
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Choices */}
        <div
          className={`mt-3 grid gap-1.5 transition-all duration-500 ${showChoices ? 'max-h-[42vh] translate-y-0 overflow-y-auto opacity-100' : 'pointer-events-none max-h-0 translate-y-2 overflow-hidden opacity-0'}`}
          data-testid="choices"
        >
          {turn?.choices.map((c) => {
            const who = party.find((p) => p.id === c.who);
            return (
              <button
                className="flex items-center gap-3 rounded-md border border-white/15 bg-charcoal-950/70 px-4 py-1.5 text-left text-white backdrop-blur transition hover:border-brass/70"
                data-roll={c.roll ? 'yes' : 'no'}
                data-testid="choice"
                key={c.label}
                onClick={() => choose(c)}
                type="button"
              >
                <span
                  className="font-condensed text-[clamp(0.76rem,0.997vw,1.23rem)] uppercase tracking-wider"
                  style={{ color: who?.color ?? '#c3a76e' }}
                >
                  {whoLabel(c.who, party)}
                </span>
                <span className="font-book text-[clamp(1.09rem,1.42vw,1.76rem)] leading-tight">
                  {c.label}
                </span>
                <span className="ml-auto shrink-0 whitespace-nowrap font-scaly text-[clamp(0.807rem,0.997vw,1.23rem)] text-charcoal-400">
                  {c.roll ? `Tirada: ${rollLabel(c.roll)}` : (c.hint ?? '')}
                </span>
              </button>
            );
          })}
          <form
            className="flex items-stretch gap-2 rounded-md border border-white/15 border-dashed bg-charcoal-950/60 px-2 py-2 backdrop-blur"
            data-testid="custom-form"
            onSubmit={submitCustom}
          >
            <div className="flex shrink-0 overflow-hidden rounded border border-white/15">
              {[...ids, BOTH].map((w) => {
                const who = party.find((p) => p.id === w);
                const on = customWho === w;
                return (
                  <button
                    className="px-2.5 font-condensed text-[clamp(0.76rem,0.997vw,1.23rem)] uppercase tracking-wider transition"
                    data-testid={`custom-who-${w}`}
                    key={w}
                    onClick={() => setCustomWho(w)}
                    style={{
                      background: on
                        ? (who?.color ?? '#c3a76e')
                        : 'transparent',
                      color: on ? '#12181c' : (who?.color ?? '#c3a76e'),
                    }}
                    type="button"
                  >
                    {whoLabel(w, party)}
                  </button>
                );
              })}
            </div>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 font-book text-[clamp(1.14rem,1.52vw,1.9rem)] text-white placeholder:text-charcoal-400 focus:outline-none"
              data-testid="custom-input"
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Otra cosa: escribe lo que hace tu personaje…"
              value={customText}
            />
            <button
              className="btn-beyond shrink-0 px-4 py-2 text-[clamp(0.855rem,1.09vw,1.38rem)] uppercase disabled:opacity-40"
              disabled={!customText.trim()}
              type="submit"
            >
              Actuar
            </button>
          </form>
        </div>
      </div>

      {/* Bottom strip: log + exits */}
      <nav
        className={`absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-3 transition-all duration-500 ${showStrip ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <Link
          className="btn-ghost px-3 py-1.5 text-[clamp(0.665rem,0.855vw,1.04rem)] uppercase backdrop-blur"
          href="/"
        >
          ← Menú
        </Link>
        <span className="max-w-[60vw] truncate font-scaly text-[clamp(0.76rem,0.95vw,1.19rem)] text-white/60">
          {turn?.sceneEnds && done && atEnd ? 'Fin de la escena. ' : ''}
          {state.history.length > 1
            ? `Anteriormente: ${state.history.at(-2)?.turn.summary ?? ''}`
            : 'Empieza la historia.'}
        </span>
        <span className="flex items-center gap-2">
          <button
            className="btn-ghost px-3 py-1.5 text-[clamp(0.665rem,0.855vw,1.04rem)] uppercase backdrop-blur"
            data-testid="notes-toggle"
            onClick={() => setNotesOpen((o) => !o)}
            type="button"
          >
            Notas · N
          </button>
          <button
            className="btn-ghost px-3 py-1.5 text-[clamp(0.665rem,0.855vw,1.04rem)] uppercase backdrop-blur"
            data-testid="open-glossary"
            onClick={() => openGlossary()}
            type="button"
          >
            Glosario · G
          </button>
          <button
            className="btn-ghost px-3 py-1.5 text-[clamp(0.665rem,0.855vw,1.04rem)] uppercase backdrop-blur"
            onClick={() => openOverlay(ids[0] ?? null)}
            type="button"
          >
            Turno {state.history.length} · Fichas
          </button>
        </span>
      </nav>

      <NotesDrawer
        notes={state.notes}
        onChange={(text) => {
          setState((prev) => {
            const next = { ...prev, notes: text };
            saveGame(next);
            return next;
          });
        }}
        onToggle={() => setNotesOpen((o) => !o)}
        open={notesOpen}
      />
      {glossary ? (
        <Glossary
          focusId={glossary.focus}
          lore={state.lore}
          onClose={() => setGlossary(null)}
        />
      ) : null}

      {dice ? (
        <DiceModal
          onDone={onDice}
          onRoll={() => engine.playUi(ui['dice-rattle'])}
          onSettled={(values) => {
            engine.playUi(ui['dice-land']);
            const kept = dice.choice.roll
              ? scoreRoll(dice.choice.roll, values, dice.modifier).result
              : values[0];
            if (kept === 20) engine.playUi(ui.crit);
            else if (kept === 1) engine.playUi(ui.fumble);
          }}
          request={dice}
        />
      ) : null}
      {log ? (
        <ReadingLog
          currentUpTo={pages.slice(0, maxStep + 1)}
          history={state.history}
          lore={state.lore}
          onClose={() => setLog(false)}
          party={party}
        />
      ) : null}
      {overlay ? (
        <PartyOverlay
          characters={state.characters}
          coinArt={coinArt}
          focus={overlay}
          itemArt={itemArt}
          onClose={() => openOverlay(null)}
          party={party}
        />
      ) : null}
    </div>
  );
};

export { GameStage };
