'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atmosphere } from '@/app/design/scenes/_components/atmosphere';
import { DiceModal, type DiceRequest } from '@/components/dice/dice-modal';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';
import { modifierFor, rollerFor, scoreRoll } from '@/lib/game/rolls';
import type {
  Choice,
  GameState,
  PlayerAction,
  ResolvedTurn,
  RollResult,
  TurnRequest,
  TurnResponse,
  Who,
} from '@/lib/game/schema';
import { saveGame } from '@/lib/game/storage';

type PartyMember = {
  id: 'bram' | 'nissa';
  name: string;
  color: string;
  portrait: ArtEntry | undefined;
};

type GameStageProps = {
  initial: GameState;
  party: PartyMember[];
  /** Backdrop while the very first turn is being written. */
  cover: ArtEntry | undefined;
};

const TYPE_MS = 16;

const useTypewriter = (text: string, cue: string) => {
  const [shown, setShown] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `cue` restarts the reveal on purpose
  useEffect(() => {
    setShown(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  who === 'both' ? 'Ambos' : (party.find((p) => p.id === who)?.name ?? who);

/**
 * The game screen: the scene stage from the design lab, fed by the narrator.
 * Owns the turn loop — show turn → players decide → (dice) → ask narrator →
 * next turn — and persists everything in the browser.
 */
const GameStage = ({ initial, party, cover }: GameStageProps) => {
  const router = useRouter();
  const [state, setState] = useState<GameState>(initial);
  const [step, setStep] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dice, setDice] = useState<
    | (DiceRequest & {
        choice: Choice;
        roller: 'bram' | 'nissa';
      })
    | null
  >(null);
  const [lastAction, setLastAction] = useState<PlayerAction | null>(null);
  const [customWho, setCustomWho] = useState<Who>('both');
  const [customText, setCustomText] = useState('');
  const [showStrip, setShowStrip] = useState(true);
  const stripTimer = useRef<number | null>(null);
  const startedRef = useRef(false);

  const last = state.history.at(-1);
  const turn: ResolvedTurn | undefined = last?.turn;
  const beats = useMemo(() => turn?.beats ?? [], [turn]);
  const current = beats[Math.min(step, Math.max(0, beats.length - 1))];
  const atEnd = step >= beats.length - 1;
  const { visible, done, finish } = useTypewriter(
    current?.text ?? '',
    `${turn?.id ?? ''}:${step}`,
  );
  const narrationSoFar = useMemo(
    () =>
      beats
        .slice(0, step + 1)
        .map((beat, i) => ({ beat, i }))
        .filter(({ beat }) => beat.kind === 'narration'),
    [beats, step],
  );
  const figureVisible =
    !!turn?.figureArt &&
    beats
      .slice(0, step + 1)
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
        characters: base.characters,
        memory: base.memory,
        npcArt: base.npcArt,
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
        const characters = base.characters.map((c) => {
          const hp = data.turn.effects.hp
            .filter((e) => e.who === c.id)
            .reduce((s, e) => s + e.delta, 0);
          const gold = data.turn.effects.gold
            .filter((e) => e.who === c.id)
            .reduce((s, e) => s + e.delta, 0);
          let items = [...c.items];
          for (const it of data.turn.effects.items) {
            if (it.who !== c.id) continue;
            if (it.add) items.push(it.add);
            if (it.remove) items = items.filter((x) => x !== it.remove);
          }
          return {
            ...c,
            hp: Math.max(0, Math.min(c.maxHp, c.hp + hp)),
            gold: Math.max(0, c.gold + gold),
            items,
          };
        });
        const next: GameState = {
          ...base,
          characters,
          memory: [...base.memory, ...data.turn.memory].slice(-60),
          npcArt: data.npcArt,
          history: [...base.history, { action, turn: data.turn }],
          updatedAt: new Date().toISOString(),
        };
        setState(next);
        saveGame(next);
        setStep(0);
        setCustomText('');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setThinking(false);
      }
    },
    [],
  );

  // First turn of a fresh campaign.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (initial.history.length === 0)
      void askNarrator({ kind: 'start' }, initial);
  }, [askNarrator, initial]);

  // ── Decisions ─────────────────────────────────────────────────────────
  const choose = (choice: Choice) => {
    if (thinking) return;
    if (choice.roll) {
      const roller = rollerFor(choice.who, choice.roll.skill);
      const member = party.find((p) => p.id === roller);
      const mod = modifierFor(roller, choice.roll.skill);
      const adv = choice.roll.advantage;
      setDice({
        choice,
        roller,
        playerName: member?.name ?? roller,
        color: member?.color ?? '#c3a76e',
        label: `${choice.roll.skill} · CD ${choice.roll.dc}${adv === 'advantage' ? ' · ventaja' : adv === 'disadvantage' ? ' · desventaja' : ''}`,
        notation: [adv === 'none' ? '1d20' : '2d20'],
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
    void askNarrator({ kind: 'custom', who: customWho, text }, state);
  };

  const advance = () => {
    if (thinking) return;
    if (!done) {
      finish();
      return;
    }
    if (!atEnd) setStep((s) => s + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
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

  const showChoices = !!turn && done && atEnd && !thinking && !dice;
  const hint = !done
    ? 'Pulsa para leer todo'
    : atEnd
      ? 'Decidid'
      : 'Continuar ▸';
  const lastRoll =
    lastAction?.kind === 'choice' && lastAction.roll ? lastAction.roll : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-charcoal-950 text-white">
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
        <div className="absolute inset-0 animate-bg-in" key={turn.id}>
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
          <div className="font-condensed text-[0.7rem] text-parchment-text uppercase tracking-[0.3em] drop-shadow">
            {turn?.chapter ?? 'Prólogo'}
          </div>
          <div className="mt-1 font-nodesto text-4xl text-white uppercase leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <Caps>{turn?.place ?? 'Phandalin'}</Caps>
          </div>
          <div className="mt-1 font-caps text-brass-pale text-lg drop-shadow">
            {turn?.time ?? ''}
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-white/10 bg-charcoal-950/55 px-3 py-2 backdrop-blur">
          {party.map((p) => {
            const c = state.characters.find((x) => x.id === p.id);
            const hp = c ? c.hp / c.maxHp : 1;
            return (
              <div className="flex items-center gap-2" key={p.id}>
                <div
                  className="h-11 w-11 overflow-hidden rounded-full ring-2"
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
                  <div className="font-caps text-base text-brass-pale leading-none">
                    {p.name}
                  </div>
                  <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-black/60">
                    <div
                      className="h-full"
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
                  <div className="font-scaly text-[0.65rem] text-charcoal-400">
                    {c ? `${c.hp}/${c.maxHp} PV · ${c.gold} po` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Speech */}
      {turn?.figureArt && turn.figure.kind === 'character' ? (
        <div
          className={`absolute top-[11vh] right-[calc(4vw+min(46vw,62vh)-6vw)] w-[min(36vw,32rem)] transition-all duration-500 ${speaking ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        >
          <div className="absolute -top-5 right-5 z-10 flex flex-col rounded-sm border border-brass/70 bg-charcoal-950 px-3 py-1.5 shadow-lg">
            <span className="font-caps text-brass-pale text-xl leading-none">
              {speakerName}
            </span>
            <span className="font-condensed text-[0.62rem] text-strapline uppercase tracking-wider">
              {speakerRole}
            </span>
          </div>
          <button
            className="relative block w-full cursor-pointer rounded-lg border border-brass/50 px-6 pt-8 pb-5 text-left"
            onClick={advance}
            style={{
              background:
                'linear-gradient(180deg, rgba(20,24,28,0.96), rgba(12,14,18,0.96))',
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6), 0 0 48px ${turn.accent}22`,
            }}
            type="button"
          >
            <span className="absolute top-14 -right-2 h-4 w-4 rotate-45 border-brass/50 border-t border-r bg-[#14181c]" />
            <p className="font-book text-[1.25rem] text-parchment-text leading-[1.5]">
              {speaking ? visible : current?.text}
            </p>
            <div className="mt-4 flex items-center justify-between font-condensed text-[0.65rem] uppercase tracking-widest">
              <span style={{ color: turn.accent }}>Habla {speakerName}</span>
              <span className="text-charcoal-400">{hint}</span>
            </div>
          </button>
        </div>
      ) : null}

      {/* Narration + decisions column */}
      <div className="absolute bottom-[4.5rem] left-[4vw] flex w-[min(60vw,58rem)] flex-col justify-end">
        {turn ? (
          <button
            className={`paper relative block w-full cursor-pointer rounded-[3px] px-9 pt-8 pb-7 text-left transition-all duration-500 ${speaking || thinking ? 'pointer-events-none max-h-0 translate-y-6 overflow-hidden opacity-0' : 'max-h-[60vh] opacity-100'}`}
            onClick={advance}
            type="button"
          >
            <div className="absolute -top-4 left-8 flex items-center gap-2 rounded-sm border border-brass/60 bg-charcoal-950 px-3 py-1 shadow-lg">
              <span className="font-caps text-brass-pale text-lg leading-none">
                Máster
              </span>
              <span className="font-condensed text-[0.65rem] text-strapline uppercase tracking-wider">
                Narración
              </span>
            </div>
            <div className="min-h-[5.5rem] space-y-3 font-book text-[1.22rem] text-ink leading-[1.5]">
              {narrationSoFar.map(({ beat, i }, n) => (
                <p
                  className={n === 0 ? 'dropcap-only' : ''}
                  key={`${turn.id}-${i}`}
                >
                  {i === step ? visible : beat.text}
                </p>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <TaperedRule className="h-2 w-40 text-rule-red" />
              <span className="font-condensed text-[0.7rem] text-ink-muted uppercase tracking-widest">
                {speaking ? `Habla ${speakerName}` : hint}
              </span>
            </div>
          </button>
        ) : null}

        {/* Last decision + roll, while the narrator writes and after */}
        {lastAction &&
        lastAction.kind !== 'start' &&
        (thinking || step === 0) ? (
          <div className="mt-3 flex animate-fade-in flex-wrap items-center gap-3 rounded-md border border-brass/40 bg-charcoal-950/85 px-4 py-2.5 backdrop-blur">
            <span
              className="font-condensed text-[0.65rem] uppercase tracking-wider"
              style={{
                color:
                  party.find((p) => p.id === lastAction.who)?.color ??
                  '#c3a76e',
              }}
            >
              {whoLabel(lastAction.who, party)}
            </span>
            <span className="font-book text-[1rem] text-parchment-text">
              {lastAction.kind === 'custom'
                ? `«${lastAction.text}»`
                : lastAction.text}
            </span>
            {lastRoll ? (
              <span className="ml-auto flex items-center gap-2 font-scaly text-charcoal-300 text-sm">
                <span>
                  {lastRoll.skill} · CD {lastRoll.dc}
                </span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[22%] border-2 font-nodesto text-lg ${lastRoll.critical === 'hit' ? 'border-brand-400 text-brand-400' : lastRoll.critical === 'miss' ? 'border-charcoal-500 text-charcoal-400' : 'border-brass text-brass-pale'}`}
                >
                  {lastRoll.result}
                </span>
                <span>
                  {lastRoll.modifier >= 0 ? '+' : '−'}
                  {Math.abs(lastRoll.modifier)} ={' '}
                  <b className="text-white">{lastRoll.total}</b>
                  <span
                    className={`ml-2 font-caps text-base ${lastRoll.success ? 'text-brass-pale' : 'text-brand-300'}`}
                  >
                    {lastRoll.critical === 'hit'
                      ? '¡Crítico!'
                      : lastRoll.critical === 'miss'
                        ? 'Pifia'
                        : lastRoll.success
                          ? 'Éxito'
                          : 'Fallo'}
                  </span>
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

        {thinking ? (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-white/10 bg-charcoal-950/70 px-4 py-3 backdrop-blur">
            <span className="h-2 w-2 animate-ember rounded-full bg-brass" />
            <span className="font-caps text-brass-pale text-lg">
              El máster piensa…
            </span>
            <span className="font-scaly text-charcoal-400 text-sm">
              Escribe la escena con calma. Suele tardar entre diez y treinta
              segundos.
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-brand-700/60 bg-brand-900/40 px-4 py-3 font-scaly text-sm">
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
          className={`mt-3 grid gap-2 transition-all duration-500 ${showChoices ? 'translate-y-0 opacity-100' : 'pointer-events-none max-h-0 translate-y-2 overflow-hidden opacity-0'}`}
        >
          {turn?.choices.map((c) => {
            const who = party.find((p) => p.id === c.who);
            return (
              <button
                className="flex items-center gap-3 rounded-md border border-white/15 bg-charcoal-950/70 px-4 py-2.5 text-left text-white backdrop-blur transition hover:border-brass/70"
                key={c.label}
                onClick={() => choose(c)}
                type="button"
              >
                <span
                  className="font-condensed text-[0.65rem] uppercase tracking-wider"
                  style={{ color: who?.color ?? '#c3a76e' }}
                >
                  {whoLabel(c.who, party)}
                </span>
                <span className="font-book text-[1.05rem]">{c.label}</span>
                <span className="ml-auto font-scaly text-charcoal-400 text-xs">
                  {c.roll
                    ? `${c.roll.skill} · CD ${c.roll.dc}${c.roll.advantage === 'advantage' ? ' · ventaja' : c.roll.advantage === 'disadvantage' ? ' · desventaja' : ''}`
                    : (c.hint ?? '')}
                </span>
              </button>
            );
          })}
          <form
            className="flex items-stretch gap-2 rounded-md border border-white/15 border-dashed bg-charcoal-950/60 px-2 py-2 backdrop-blur"
            onSubmit={submitCustom}
          >
            <div className="flex shrink-0 overflow-hidden rounded border border-white/15">
              {(['bram', 'nissa', 'both'] as const).map((w) => {
                const who = party.find((p) => p.id === w);
                const on = customWho === w;
                return (
                  <button
                    className="px-2.5 font-condensed text-[0.65rem] uppercase tracking-wider transition"
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
              className="min-w-0 flex-1 bg-transparent px-2 font-book text-[1.05rem] text-white placeholder:text-charcoal-400 focus:outline-none"
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Otra cosa: escribe lo que hace tu personaje…"
              value={customText}
            />
            <button
              className="btn-beyond shrink-0 px-4 py-1.5 text-xs uppercase disabled:opacity-40"
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
          className="btn-ghost px-3 py-1.5 text-[0.65rem] uppercase backdrop-blur"
          href="/"
        >
          ← Menú
        </Link>
        <span className="max-w-[60vw] truncate font-scaly text-[0.7rem] text-white/60">
          {state.history.length > 1
            ? `Anteriormente: ${state.history.at(-2)?.turn.summary ?? ''}`
            : 'Empieza la historia.'}
        </span>
        <button
          className="btn-ghost px-3 py-1.5 text-[0.65rem] uppercase backdrop-blur"
          onClick={() => router.refresh()}
          type="button"
        >
          Turno {state.history.length}
        </button>
      </nav>

      {dice ? <DiceModal onDone={onDice} request={dice} /> : null}
    </div>
  );
};

export { GameStage };
export type { PartyMember };
