'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';
import { Atmosphere, type AtmosphereKind } from './atmosphere';

type Speaker = { name: string; role: string };

/**
 * A scene plays as an ordered list of beats. Narration lives on the
 * parchment; a `line` is spoken by the scene's character, who steps into
 * frame the first time they speak (or when a narration beat `reveal`s a
 * creature).
 */
type Beat =
  | { kind: 'narration'; text: string; reveal?: boolean }
  | { kind: 'line'; text: string };

type Roll = {
  skill: string;
  modifier: number;
  dc: number;
};

/** What happens after a choice: an optional check, then beats per result. */
type Outcome = {
  roll?: Roll;
  success: Beat[];
  failure?: Beat[];
};

type SceneChoice = {
  label: string;
  hint?: string;
  who: 'bram' | 'nissa' | 'both';
  outcome?: Outcome;
};

type Scene = {
  id: string;
  label: string;
  place: string;
  chapter: string;
  time: string;
  background: ArtEntry | undefined;
  /** Where the background's focal point sits, as CSS object-position. */
  focus: string;
  /** Extra magnification, e.g. to push a watermark or a hard edge out of frame. */
  zoom?: number;
  figure: ArtEntry | undefined;
  figureSide: 'left' | 'right';
  figureKind: 'character' | 'creature';
  speaker: Speaker;
  beats: Beat[];
  choices: SceneChoice[];
  /** Beats played after a free-text action (the narrator riffs on it). */
  customOutcome?: Beat[];
  atmosphere: AtmosphereKind;
  /** Colour grade over the background. */
  grade: string;
  accent: string;
};

type Party = {
  id: 'bram' | 'nissa';
  name: string;
  color: string;
  portrait: ArtEntry | undefined;
  hp: number;
  maxHp: number;
}[];

type SceneStageProps = { scenes: Scene[]; party: Party };

const TYPE_MS = 16;

/**
 * Reveals text like a visual novel; click to finish instantly. `cue` restarts
 * the effect even when two consecutive beats share the same text.
 */
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

const SceneStage = ({ scenes, party }: SceneStageProps) => {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | 'custom' | null>(null);
  const [customWho, setCustomWho] = useState<'bram' | 'nissa' | 'both'>('both');
  const [customText, setCustomText] = useState('');
  const [customSent, setCustomSent] = useState<string | null>(null);
  const [showStrip, setShowStrip] = useState(true);
  const stripTimer = useRef<number | null>(null);
  const scene = scenes[index];
  const prevScene = prev != null ? scenes[prev] : undefined;

  /** After a decision: the chip with the roll, then the follow-up beats. */
  type Resolution = {
    label: string;
    who: 'bram' | 'nissa' | 'both';
    roll?: Roll & { result: number; total: number; success: boolean };
    beats: Beat[];
    phase: 'rolling' | 'settled' | 'playing';
  };
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [dieFace, setDieFace] = useState(1);

  const beats = useMemo(
    () =>
      resolution?.phase === 'playing' ? resolution.beats : (scene?.beats ?? []),
    [resolution, scene],
  );
  const current = beats[Math.min(step, beats.length - 1)];
  const atEnd = step >= beats.length - 1;
  const { visible, done, finish } = useTypewriter(
    current?.text ?? '',
    `${scene?.id ?? ''}:${step}`,
  );

  /** Narration beats up to the current step; the current one may still be typing. */
  const narrationSoFar = useMemo(
    () =>
      beats
        .slice(0, step + 1)
        .map((beat, i) => ({ beat, i }))
        .filter(({ beat }) => beat.kind === 'narration'),
    [beats, step],
  );
  const figureVisible = beats
    .slice(0, step + 1)
    .some((b) => b.kind === 'line' || (b.kind === 'narration' && b.reveal));
  const speaking =
    current?.kind === 'line' && !(resolution && resolution.phase !== 'playing');

  const go = useCallback(
    (next: number) => {
      if (!scenes.length) return;
      const n = (next + scenes.length) % scenes.length;
      if (n === index) return;
      setPrev(index);
      setIndex(n);
      setStep(0);
      setPicked(null);
      setCustomText('');
      setCustomSent(null);
      setResolution(null);
      window.setTimeout(() => setPrev(null), 1000);
    },
    [index, scenes.length],
  );

  const advance = () => {
    if (!done) {
      finish();
      return;
    }
    if (!atEnd) setStep((s) => s + 1);
  };

  const DEFAULT_CUSTOM: Beat[] = [
    {
      kind: 'narration',
      text: 'El máster se queda un segundo en silencio, que es lo más parecido a un elogio que vais a sacarle. Luego mueve las piezas.',
    },
  ];

  /** Collapses the choices into a chip, rolls if needed, then plays the follow-up. */
  const resolve = (
    label: string,
    who: 'bram' | 'nissa' | 'both',
    outcome: Outcome | undefined,
    fallbackBeats: Beat[],
  ) => {
    if (!scene) return;
    if (!outcome?.roll) {
      setResolution({
        label,
        who,
        beats: outcome?.success ?? fallbackBeats,
        phase: 'settled',
      });
      window.setTimeout(
        () => setResolution((r) => (r ? { ...r, phase: 'playing' } : r)),
        900,
      );
      setStep(0);
      return;
    }
    const roll = outcome.roll;
    const result = 1 + Math.floor(Math.random() * 20);
    const total = result + roll.modifier;
    const success = result === 20 || (result !== 1 && total >= roll.dc);
    setResolution({
      label,
      who,
      roll: { ...roll, result, total, success },
      beats: success ? outcome.success : (outcome.failure ?? outcome.success),
      phase: 'rolling',
    });
    // Spin the die for a moment, then settle and play.
    let ticks = 0;
    const spin = window.setInterval(() => {
      setDieFace(1 + Math.floor(Math.random() * 20));
      ticks += 1;
      if (ticks >= 14) {
        window.clearInterval(spin);
        setDieFace(result);
        setResolution((r) => (r ? { ...r, phase: 'settled' } : r));
        window.setTimeout(() => {
          setStep(0);
          setResolution((r) => (r ? { ...r, phase: 'playing' } : r));
        }, 1300);
      }
    }, 80);
  };

  const restart = () => {
    setResolution(null);
    setPicked(null);
    setCustomText('');
    setCustomSent(null);
    setStep(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Hide the scene strip after a few idle seconds; any mouse move brings it back.
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

  if (!scene || !current) return null;

  const right = scene.figureSide === 'right';
  const showChoices = done && atEnd && !resolution;
  const playing = resolution?.phase === 'playing';
  const outcomeDone = playing && done && atEnd;
  const hint = !done
    ? 'Pulsa para leer todo'
    : atEnd
      ? playing
        ? 'Fin de la muestra'
        : 'Decidid'
      : 'Continuar ▸';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-charcoal-950 text-white"
      style={{ ['--accent' as string]: scene.accent }}
    >
      {prevScene ? (
        <Backdrop
          key={`prev-${prevScene.id}`}
          scene={prevScene}
          state="leaving"
        />
      ) : null}
      <Backdrop key={scene.id} scene={scene} state="entering" />
      <Atmosphere key={`atm-${scene.id}`} kind={scene.atmosphere} />

      {/* Figure: steps in the first time it speaks or is revealed */}
      {scene.figure && figureVisible ? (
        <div
          className={`pointer-events-none absolute bottom-0 ${right ? 'right-[4vw]' : 'left-[4vw]'} h-[88vh] w-[min(46vw,62vh)] animate-figure-in transition-[filter] duration-700`}
          key={`fig-${scene.id}`}
          style={{
            filter:
              speaking || scene.figureKind === 'creature'
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
              height={scene.figure.height}
              src={scene.figure.src}
              style={{
                maskImage:
                  'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                WebkitMaskComposite: 'source-in',
              }}
              width={scene.figure.width}
            />
          </div>
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${scene.accent}55, transparent 70%)`,
            }}
          />
        </div>
      ) : null}

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
        <div className="animate-fade-in">
          <div className="font-condensed text-[0.7rem] text-parchment-text uppercase tracking-[0.3em] drop-shadow">
            {scene.chapter}
          </div>
          <div className="mt-1 font-nodesto text-4xl text-white uppercase leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <Caps>{scene.place}</Caps>
          </div>
          <div className="mt-1 font-caps text-brass-pale text-lg drop-shadow">
            {scene.time}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-charcoal-950/55 px-3 py-2 backdrop-blur">
          {party.map((p) => (
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
                      width: `${(p.hp / p.maxHp) * 100}%`,
                      background: p.hp / p.maxHp > 0.5 ? '#6c8a3c' : '#e69a28',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Speech: the character's words come from the character */}
      {scene.figure && scene.figureKind === 'character' ? (
        <div
          className={`absolute top-[11vh] w-[min(36vw,32rem)] transition-all duration-500 ${right ? 'right-[calc(4vw+min(46vw,62vh)-6vw)]' : 'left-[calc(4vw+min(46vw,62vh)-6vw)]'} ${speaking ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        >
          {/* Name plate, on the edge nearest the figure */}
          <div
            className={`absolute -top-5 z-10 flex flex-col rounded-sm border border-brass/70 bg-charcoal-950 px-3 py-1.5 shadow-lg ${right ? 'right-5' : 'left-5'}`}
          >
            <span className="font-caps text-brass-pale text-xl leading-none">
              {scene.speaker.name}
            </span>
            <span className="font-condensed text-[0.62rem] text-strapline uppercase tracking-wider">
              {scene.speaker.role}
            </span>
          </div>
          <button
            className="relative block w-full cursor-pointer rounded-lg border border-brass/50 px-6 pt-8 pb-5 text-left"
            onClick={advance}
            style={{
              background:
                'linear-gradient(180deg, rgba(20,24,28,0.96), rgba(12,14,18,0.96))',
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6), 0 0 48px ${scene.accent}22`,
            }}
            type="button"
          >
            {/* Tail towards the figure */}
            <span
              className={`absolute top-14 h-4 w-4 rotate-45 border-brass/50 bg-[#14181c] ${right ? '-right-2 border-t border-r' : '-left-2 border-b border-l'}`}
            />
            <p className="font-book text-[1.25rem] text-parchment-text leading-[1.5]">
              {speaking ? visible : current.text}
            </p>
            <div className="mt-4 flex items-center justify-between font-condensed text-[0.65rem] uppercase tracking-widest">
              <span style={{ color: scene.accent }}>
                Habla {scene.speaker.name}
              </span>
              <span className="text-charcoal-400">{hint}</span>
            </div>
          </button>
        </div>
      ) : null}

      {/* Narration on parchment + choices, bottom column opposite the figure */}
      <div
        className={`absolute bottom-[4.5rem] flex w-[min(60vw,58rem)] flex-col justify-end ${right ? 'left-[4vw]' : 'right-[4vw]'}`}
      >
        <button
          className={`paper relative block w-full cursor-pointer rounded-[3px] px-9 pt-8 pb-7 text-left transition-all duration-500 ${speaking || (resolution && resolution.phase !== 'playing') ? 'pointer-events-none max-h-0 translate-y-6 overflow-hidden opacity-0' : 'max-h-[60vh] opacity-100'}`}
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
                key={`${scene.id}-${i}`}
              >
                {i === step ? visible : beat.text}
              </p>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <TaperedRule className="h-2 w-40 text-rule-red" />
            <span className="font-condensed text-[0.7rem] text-ink-muted uppercase tracking-widest">
              {speaking ? `Habla ${scene.speaker.name}` : hint}
            </span>
          </div>
        </button>

        {/* Decision reminder + roll */}
        {resolution ? (
          <div className="mt-3 flex animate-fade-in flex-wrap items-center gap-3 rounded-md border border-brass/40 bg-charcoal-950/85 px-4 py-2.5 backdrop-blur">
            <span
              className="font-condensed text-[0.65rem] uppercase tracking-wider"
              style={{
                color:
                  party.find((p) => p.id === resolution.who)?.color ??
                  '#c3a76e',
              }}
            >
              {resolution.who === 'both'
                ? 'Ambos'
                : party.find((p) => p.id === resolution.who)?.name}
            </span>
            <span className="font-book text-[1rem] text-parchment-text">
              {resolution.label}
            </span>
            {resolution.roll ? (
              <span className="ml-auto flex items-center gap-2 font-scaly text-charcoal-300 text-sm">
                <span>
                  {resolution.roll.skill} · CD {resolution.roll.dc}
                </span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[22%] border-2 font-nodesto text-lg ${resolution.phase === 'rolling' ? 'animate-pulse border-brass/60 text-brass-pale' : resolution.roll.result === 20 ? 'border-brand-400 text-brand-400' : resolution.roll.result === 1 ? 'border-charcoal-500 text-charcoal-400' : 'border-brass text-brass-pale'}`}
                >
                  {dieFace}
                </span>
                {resolution.phase !== 'rolling' ? (
                  <span>
                    {resolution.roll.modifier >= 0 ? '+' : '−'}
                    {Math.abs(resolution.roll.modifier)} ={' '}
                    <b className="text-white">{resolution.roll.total}</b>
                    <span
                      className={`ml-2 font-caps text-base ${resolution.roll.success ? 'text-brass-pale' : 'text-brand-300'}`}
                    >
                      {resolution.roll.result === 20
                        ? '¡Crítico!'
                        : resolution.roll.result === 1
                          ? 'Pifia'
                          : resolution.roll.success
                            ? 'Éxito'
                            : 'Fallo'}
                    </span>
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="ml-auto font-scaly text-charcoal-400 text-sm">
                Sin tirada
              </span>
            )}
          </div>
        ) : null}
        {outcomeDone ? (
          <div className="mt-3 flex justify-end">
            <button
              className="btn-ghost px-4 py-2 text-xs uppercase backdrop-blur"
              onClick={restart}
              type="button"
            >
              Volver al inicio de la escena
            </button>
          </div>
        ) : null}

        {/* Choices */}
        <div
          className={`mt-3 grid gap-2 transition-all duration-500 ${showChoices ? 'translate-y-0 opacity-100' : 'pointer-events-none max-h-0 translate-y-2 overflow-hidden opacity-0'}`}
        >
          {scene.choices.map((c, i) => {
            const who = party.find((p) => p.id === c.who);
            return (
              <button
                className={`flex items-center gap-3 rounded-md border px-4 py-2.5 text-left backdrop-blur transition ${picked === i ? 'border-transparent bg-charcoal-100 text-charcoal-900' : 'border-white/15 bg-charcoal-950/70 text-white hover:border-brass/70'}`}
                key={c.label}
                onClick={() => {
                  setPicked(i);
                  resolve(c.label, c.who, c.outcome, [
                    {
                      kind: 'narration',
                      text: 'El máster asiente y la escena sigue su curso.',
                    },
                  ]);
                }}
                style={
                  picked === i && who
                    ? { boxShadow: `inset 4px 0 0 ${who.color}` }
                    : undefined
                }
                type="button"
              >
                <span
                  className="font-condensed text-[0.65rem] uppercase tracking-wider"
                  style={{
                    color: picked === i ? '#374045' : (who?.color ?? '#c3a76e'),
                  }}
                >
                  {c.who === 'both' ? 'Ambos' : who?.name}
                </span>
                <span className="font-book text-[1.05rem]">{c.label}</span>
                {c.hint ? (
                  <span
                    className={`ml-auto font-scaly text-xs ${picked === i ? 'text-charcoal-600' : 'text-charcoal-400'}`}
                  >
                    {c.hint}
                  </span>
                ) : null}
              </button>
            );
          })}

          <form
            className={`flex items-stretch gap-2 rounded-md border px-2 py-2 backdrop-blur transition ${picked === 'custom' ? 'border-brass bg-charcoal-950/85' : 'border-white/15 border-dashed bg-charcoal-950/60'}`}
            onSubmit={(e) => {
              e.preventDefault();
              const text = customText.trim();
              if (!text) return;
              setPicked('custom');
              setCustomSent(text);
              resolve(
                `«${text}»`,
                customWho,
                undefined,
                scene.customOutcome ?? DEFAULT_CUSTOM,
              );
            }}
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
                    {w === 'both' ? 'Ambos' : who?.name}
                  </button>
                );
              })}
            </div>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 font-book text-[1.05rem] text-white placeholder:text-charcoal-400 focus:outline-none"
              onChange={(e) => {
                setCustomText(e.target.value);
                if (customSent) setCustomSent(null);
              }}
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
          {customSent ? (
            <p className="px-2 font-book text-[0.95rem] text-parchment-text italic">
              {customWho === 'both'
                ? 'Los dos'
                : party.find((p) => p.id === customWho)?.name}
              {': '}«{customSent}». El máster toma nota.
            </p>
          ) : null}
        </div>
      </div>

      {/* Scene strip */}
      <nav
        className={`absolute inset-x-0 bottom-0 flex items-end justify-center gap-2 px-4 pb-3 transition-all duration-500 ${showStrip ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <Link
          className="btn-ghost mr-2 px-3 py-1.5 text-[0.65rem] uppercase backdrop-blur"
          href="/design"
        >
          ← Laboratorio
        </Link>
        {scenes.map((s, i) => (
          <button
            className={`group relative h-12 w-20 overflow-hidden rounded-sm border transition ${i === index ? 'border-brass ring-2 ring-brass/40' : 'border-white/20 opacity-70 hover:opacity-100'}`}
            key={s.id}
            onClick={() => go(i)}
            title={s.label}
            type="button"
          >
            {s.background ? (
              // biome-ignore lint/performance/noImgElement: pre-sized local art
              <img
                alt=""
                className="h-full w-full object-cover"
                src={s.background.src}
                style={{ objectPosition: s.focus }}
              />
            ) : null}
            <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center font-condensed text-[0.55rem] text-white uppercase tracking-wider">
              {s.label}
            </span>
          </button>
        ))}
        <span className="ml-2 font-condensed text-[0.6rem] text-white/60 uppercase tracking-wider">
          ← → cambiar · espacio avanzar
        </span>
      </nav>
    </div>
  );
};

const Backdrop = ({
  scene,
  state,
}: {
  scene: Scene;
  state: 'entering' | 'leaving';
}) => (
  <div
    className={`absolute inset-0 ${state === 'leaving' ? 'animate-bg-out' : 'animate-bg-in'}`}
  >
    {scene.background ? (
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${scene.zoom ?? 1})`,
          transformOrigin: scene.focus,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
        <img
          alt=""
          className="absolute inset-0 h-full w-full animate-kenburns object-cover"
          height={scene.background.height}
          src={scene.background.src}
          style={{ objectPosition: scene.focus }}
          width={scene.background.width}
        />
      </div>
    ) : (
      <div className="absolute inset-0 bg-charcoal-900" />
    )}
    <div className="absolute inset-0" style={{ background: scene.grade }} />
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
        background: 'linear-gradient(to top, rgba(9,8,9,0.85), rgba(9,8,9,0))',
      }}
    />
  </div>
);

export { SceneStage };
export type { Beat, Outcome, Roll, Scene, SceneChoice };
