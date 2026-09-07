'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';
import { Atmosphere, type AtmosphereKind } from './atmosphere';

type Speaker = { name: string; role: string };

type SceneChoice = {
  label: string;
  hint?: string;
  who: 'bram' | 'nissa' | 'both';
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
  figure: ArtEntry | undefined;
  figureSide: 'left' | 'right';
  figureKind: 'character' | 'creature';
  speaker: Speaker;
  narration: string[];
  quote?: string;
  choices: SceneChoice[];
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

/** Reveals text like a visual novel; click to finish instantly. */
const useTypewriter = (text: string) => {
  const [shown, setShown] = useState(0);
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
  }, [text]);
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
  const [picked, setPicked] = useState<number | null>(null);
  const [showStrip, setShowStrip] = useState(true);
  const stripTimer = useRef<number | null>(null);
  const scene = scenes[index];
  const prevScene = prev != null ? scenes[prev] : undefined;

  const fullText = useMemo(() => {
    if (!scene) return '';
    const parts = [...scene.narration];
    if (scene.quote) parts.push(scene.quote);
    return parts.slice(0, step + 1).join('\n\n');
  }, [scene, step]);
  const totalSteps = scene ? scene.narration.length + (scene.quote ? 1 : 0) : 0;
  const { visible, done, finish } = useTypewriter(fullText);
  const atEnd = step >= totalSteps - 1;

  const go = useCallback(
    (next: number) => {
      if (!scenes.length) return;
      const n = (next + scenes.length) % scenes.length;
      if (n === index) return;
      setPrev(index);
      setIndex(n);
      setStep(0);
      setPicked(null);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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

  if (!scene) return null;

  const paragraphs = visible.split('\n\n');
  const quoteIndex = scene.quote ? scene.narration.length : -1;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-charcoal-950 text-white"
      style={{ ['--accent' as string]: scene.accent }}
    >
      {/* Backgrounds: current + previous for the crossfade */}
      {prevScene ? (
        <Backdrop
          key={`prev-${prevScene.id}`}
          scene={prevScene}
          state="leaving"
        />
      ) : null}
      <Backdrop key={scene.id} scene={scene} state="entering" />

      <Atmosphere key={`atm-${scene.id}`} kind={scene.atmosphere} />

      {/* Figure */}
      {scene.figure ? (
        <div
          className={`pointer-events-none absolute bottom-0 ${scene.figureSide === 'right' ? 'right-[4vw]' : 'left-[4vw]'} h-[88vh] w-[min(46vw,62vh)] animate-figure-in`}
          key={`fig-${scene.id}`}
        >
          <div
            className="absolute inset-0"
            style={{
              filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.65))',
            }}
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
          {/* Warm rim light matching the scene accent */}
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${scene.accent}55, transparent 70%)`,
            }}
          />
        </div>
      ) : null}

      {/* Top bar: place + party */}
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

      {/* Narration panel */}
      <div
        className={`absolute bottom-[4.5rem] ${scene.figureSide === 'right' ? 'left-[4vw]' : 'right-[4vw]'} w-[min(60vw,58rem)]`}
      >
        <button
          className="paper relative block w-full cursor-pointer rounded-[3px] px-9 pt-8 pb-7 text-left"
          onClick={advance}
          type="button"
        >
          <div className="absolute -top-4 left-8 flex items-center gap-2 rounded-sm border border-brass/60 bg-charcoal-950 px-3 py-1 shadow-lg">
            <span className="font-caps text-brass-pale text-lg leading-none">
              {scene.speaker.name}
            </span>
            <span className="font-condensed text-[0.65rem] text-strapline uppercase tracking-wider">
              {scene.speaker.role}
            </span>
          </div>
          <div className="min-h-[7.5rem] space-y-3 font-book text-[1.22rem] text-ink leading-[1.5]">
            {paragraphs.map((para, i) => (
              <p
                className={
                  i === quoteIndex ? 'italic' : i === 0 ? 'dropcap-only' : ''
                }
                key={`${scene.id}-${i}`}
              >
                {para}
              </p>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <TaperedRule className="h-2 w-40 text-rule-red" />
            <span className="font-condensed text-[0.7rem] text-ink-muted uppercase tracking-widest">
              {!done
                ? 'Pulsa para leer todo'
                : atEnd
                  ? 'Decidid'
                  : 'Continuar ▸'}
            </span>
          </div>
        </button>

        {/* Choices */}
        <div
          className={`mt-3 grid gap-2 transition-all duration-500 ${done && atEnd ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
        >
          {scene.choices.map((c, i) => {
            const who = party.find((p) => p.id === c.who);
            return (
              <button
                className={`flex items-center gap-3 rounded-md border px-4 py-2.5 text-left backdrop-blur transition ${picked === i ? 'border-transparent bg-charcoal-100 text-charcoal-900' : 'border-white/15 bg-charcoal-950/70 text-white hover:border-brass/70'}`}
                key={c.label}
                onClick={() => setPicked(i)}
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
      // biome-ignore lint/performance/noImgElement: pre-sized local art
      <img
        alt=""
        className="absolute inset-0 h-full w-full animate-kenburns object-cover"
        height={scene.background.height}
        src={scene.background.src}
        style={{ objectPosition: scene.focus }}
        width={scene.background.width}
      />
    ) : (
      <div className="absolute inset-0 bg-charcoal-900" />
    )}
    {/* Grade + vignette */}
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
export type { Scene, SceneChoice };
