'use client';

import '@3d-dice/dice-box/dist/style.css';

import type DiceBoxType from '@3d-dice/dice-box';
import type { DieResult } from '@3d-dice/dice-box';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Player = { id: string; name: string; color: string };

type DiceTrayProps = {
  players: [Player, Player];
};

/** Die types you can pick. d2 and d3 are virtual: rolled on a d4/d6 and halved. */
const DIE_TYPES = [2, 3, 4, 6, 8, 10, 12, 20, 100] as const;
type DieType = (typeof DIE_TYPES)[number];

/** Physical die used by the engine for each type, and how to read it. */
const PHYSICAL: Record<
  DieType,
  { sides: 4 | 6 | 8 | 10 | 12 | 20 | 100; map: (v: number) => number }
> = {
  2: { sides: 4, map: (v) => Math.ceil(v / 2) },
  3: { sides: 6, map: (v) => Math.ceil(v / 2) },
  4: { sides: 4, map: (v) => v },
  6: { sides: 6, map: (v) => v },
  8: { sides: 8, map: (v) => v },
  10: { sides: 10, map: (v) => v },
  12: { sides: 12, map: (v) => v },
  20: { sides: 20, map: (v) => v },
  100: { sides: 100, map: (v) => v },
};

type Group = { qty: number; type: DieType };

type GroupResult = {
  type: DieType;
  values: number[];
  raw: number[];
  subtotal: number;
};

type Outcome = {
  label: string;
  groups: GroupResult[];
  modifier: number;
  total: number;
  crit: 'hit' | 'miss' | null;
  player: Player;
  engine: '3d' | '2d';
};

const THEMES = [
  { id: 'default', label: 'Resina' },
  { id: 'rock', label: 'Piedra' },
  { id: 'wooden', label: 'Madera' },
  { id: 'gemstone', label: 'Gema' },
] as const;

const PRESETS: { label: string; groups: Group[]; modifier: number }[] = [
  { label: 'd20', groups: [{ qty: 1, type: 20 }], modifier: 0 },
  { label: 'Ataque +5', groups: [{ qty: 1, type: 20 }], modifier: 5 },
  { label: 'Espada larga', groups: [{ qty: 1, type: 8 }], modifier: 3 },
  {
    label: 'Ataque furtivo',
    groups: [
      { qty: 1, type: 8 },
      { qty: 1, type: 6 },
    ],
    modifier: 3,
  },
  { label: 'Bola de fuego', groups: [{ qty: 8, type: 6 }], modifier: 0 },
  {
    label: '6d6 + 2d3',
    groups: [
      { qty: 6, type: 6 },
      { qty: 2, type: 3 },
    ],
    modifier: 0,
  },
];

const notationOf = (groups: Group[], modifier: number) => {
  const parts = groups.map((g) => `${g.qty}d${g.type}`);
  let text = parts.join(' + ');
  if (modifier) text += ` ${modifier > 0 ? '+' : '−'} ${Math.abs(modifier)}`;
  return text;
};

const randomInt = (sides: number) => 1 + Math.floor(Math.random() * sides);

/** Physics can stall (a die off the table, a hidden tab): never wait forever. */
const ROLL_TIMEOUT_MS = 9000;
const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  new Promise<T | 'timeout'>((resolve) => {
    const t = window.setTimeout(() => resolve('timeout'), ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      () => {
        window.clearTimeout(t);
        resolve('timeout');
      },
    );
  });

const supportsWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * 3D physics dice with a builder for any combination (6d6 + 2d3…), one
 * colour per player, and an honest 2D fallback when WebGL or the physics
 * worker are not available.
 */
const DiceTray = ({ players }: DiceTrayProps) => {
  const boxRef = useRef<DiceBoxType | null>(null);
  const startedRef = useRef(false);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const [engine, setEngine] = useState<'loading' | '3d' | '2d'>('loading');
  const [engineNote, setEngineNote] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [player, setPlayer] = useState<Player>(players[0]);
  const [theme, setTheme] = useState<(typeof THEMES)[number]['id']>('default');
  const [groups, setGroups] = useState<Group[]>([{ qty: 1, type: 20 }]);
  const [modifier, setModifier] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<Outcome[]>([]);
  const [spinning, setSpinning] = useState<
    { type: DieType; value: number }[] | null
  >(null);

  const loadedThemes = useRef(new Set<string>(['default']));

  /** Themes must be loaded before a roll uses them, or the engine throws. */
  const ensureTheme = useCallback(async (id: string): Promise<string> => {
    const box = boxRef.current;
    if (!box || loadedThemes.current.has(id)) return id;
    try {
      await box.loadTheme(id);
      loadedThemes.current.add(id);
      return id;
    } catch {
      setEngineNote(`El material «${id}» no ha cargado; se usa resina.`);
      setTheme('default');
      return 'default';
    }
  }, []);

  const initialColor = players[0].color;

  // ── Engine boot ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!supportsWebGL() || typeof Worker === 'undefined') {
      setEngine('2d');
      setEngineNote('Este navegador no tiene WebGL: dados en 2D.');
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      setEngine('2d');
      setEngineNote(
        'El motor 3D tarda demasiado en arrancar: dados en 2D por ahora.',
      );
    }, 20000);

    (async () => {
      try {
        const { default: DiceBox } = await import('@3d-dice/dice-box');
        const box = new DiceBox({
          container: '#dice-tray',
          assetPath: '/assets/dice-box/',
          theme: 'default',
          themeColor: initialColor,
          scale: 5,
          gravity: 1.6,
          throwForce: 6,
          spinForce: 5,
          lightIntensity: 0.9,
          enableShadows: true,
          shadowTransparency: 0.7,
          settleTimeout: 4000,
          offscreen: false,
        });
        boxRef.current = box;
        if (process.env.NODE_ENV === 'development') {
          // Handy for poking the engine from the console while iterating.
          (window as unknown as { __diceBox?: DiceBoxType }).__diceBox = box;
        }
        await box.init();
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        // The engine sizes canvas and world from the container once; make
        // sure that happens with the real layout.
        window.dispatchEvent(new Event('resize'));
        setEngine('3d');
        // Warm the other materials so switching never stalls a roll.
        for (const t of THEMES) {
          if (t.id !== 'default') await ensureTheme(t.id);
        }
      } catch (e) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        setEngine('2d');
        setEngineNote(
          `El motor 3D no ha arrancado (${(e as Error).message}): dados en 2D.`,
        );
      }
    })();
  }, [initialColor, ensureTheme]);

  // Keep the 3D canvas in step with the tray size.
  useEffect(() => {
    if (engine !== '3d' || !trayRef.current) return;
    const ro = new ResizeObserver(() =>
      window.dispatchEvent(new Event('resize')),
    );
    ro.observe(trayRef.current);
    return () => ro.disconnect();
  }, [engine]);

  // ── Builder ─────────────────────────────────────────────────────────────
  const addDie = (type: DieType) =>
    setGroups((gs) => {
      const i = gs.findIndex((g) => g.type === type);
      if (i >= 0) {
        return gs.map((g, j) =>
          j === i ? { ...g, qty: Math.min(g.qty + 1, 30) } : g,
        );
      }
      return [...gs, { qty: 1, type }];
    });
  const removeDie = (type: DieType) =>
    setGroups((gs) =>
      gs
        .map((g) => (g.type === type ? { ...g, qty: g.qty - 1 } : g))
        .filter((g) => g.qty > 0),
    );
  const clear = () => {
    setGroups([]);
    setModifier(0);
  };
  const totalDice = groups.reduce((s, g) => s + g.qty, 0);
  const notation = useMemo(
    () => notationOf(groups, modifier),
    [groups, modifier],
  );

  // ── Rolling ─────────────────────────────────────────────────────────────
  const finish = useCallback(
    (label: string, results: GroupResult[], eng: Outcome['engine']) => {
      const total = results.reduce((s, g) => s + g.subtotal, 0) + modifier;
      const d20 = results.find((g) => g.type === 20 && g.values.length === 1);
      const crit: Outcome['crit'] = d20
        ? d20.values[0] === 20
          ? 'hit'
          : d20.values[0] === 1
            ? 'miss'
            : null
        : null;
      const out: Outcome = {
        label,
        groups: results,
        modifier,
        total,
        crit,
        player,
        engine: eng,
      };
      setOutcome(out);
      setHistory((h) => [out, ...h].slice(0, 8));
    },
    [modifier, player],
  );

  const roll2d = useCallback(
    async (label: string, gs: Group[]) => {
      // Spin numbers for a moment, then settle.
      const start = performance.now();
      while (performance.now() - start < 900) {
        setSpinning(
          gs.flatMap((g) =>
            Array.from({ length: g.qty }, () => ({
              type: g.type,
              value: randomInt(g.type),
            })),
          ),
        );
        await new Promise((r) => setTimeout(r, 70));
      }
      setSpinning(null);
      const results: GroupResult[] = gs.map((g) => {
        const values = Array.from({ length: g.qty }, () => randomInt(g.type));
        return {
          type: g.type,
          values,
          raw: values,
          subtotal: values.reduce((s, v) => s + v, 0),
        };
      });
      finish(label, results, '2d');
    },
    [finish],
  );

  const roll3d = useCallback(
    async (label: string, gs: Group[]) => {
      const box = boxRef.current;
      // A hidden tab pauses the render loop, so the 3D roll would never settle.
      if (!box || document.hidden) return roll2d(label, gs);
      box.clear();
      const notations = gs.map((g) => `${g.qty}d${PHYSICAL[g.type].sides}`);
      const loadedTheme = await ensureTheme(theme);
      const settled = await withTimeout(
        box.roll(notations, { theme: loadedTheme, themeColor: player.color }),
        ROLL_TIMEOUT_MS,
      );
      let rolled: DieResult[];
      let degraded = false;
      if (settled === 'timeout') {
        // Take whatever has landed; invent the rest so the table never hangs.
        rolled = box.getRollResults().flatMap((g) => g.rolls ?? []);
        degraded = true;
      } else {
        rolled = settled;
      }
      let cursor = 0;
      const results: GroupResult[] = gs.map((g, i) => {
        const byGroup = rolled
          .filter((d) => d.groupId === i)
          .map((d) => d.value);
        // If the engine did not tag groups, slice the flat list in order.
        let raw =
          byGroup.length === g.qty
            ? byGroup
            : rolled.slice(cursor, cursor + g.qty).map((d) => d.value);
        cursor += g.qty;
        if (raw.length < g.qty) {
          degraded = true;
          raw = [
            ...raw,
            ...Array.from({ length: g.qty - raw.length }, () =>
              randomInt(PHYSICAL[g.type].sides),
            ),
          ];
        }
        const values = raw.map(PHYSICAL[g.type].map);
        return {
          type: g.type,
          values,
          raw,
          subtotal: values.reduce((s, v) => s + v, 0),
        };
      });
      if (degraded) {
        setEngineNote(
          'Algún dado no se asentó a tiempo; se ha resuelto por sorteo.',
        );
      }
      finish(label, results, '3d');
    },
    [ensureTheme, finish, player.color, roll2d, theme],
  );

  const roll = useCallback(
    async (label: string, gs: Group[]) => {
      if (rolling || gs.length === 0) return;
      setRolling(true);
      setOutcome(null);
      try {
        if (engine === '3d') await roll3d(label, gs);
        else await roll2d(label, gs);
      } catch (e) {
        // One bad roll (a theme hiccup, a lost die) is resolved in 2D; the
        // 3D engine stays for the next one.
        setEngineNote(
          `Fallo en la tirada 3D (${(e as Error).message}); resuelta en 2D.`,
        );
        await roll2d(label, gs);
      } finally {
        setRolling(false);
      }
    },
    [engine, roll2d, roll3d, rolling],
  );

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setGroups(p.groups);
    setModifier(p.modifier);
    void roll(p.label, p.groups);
  };

  // 2D faces: while spinning, and as the final face whenever the roll was
  // resolved without the 3D engine (no WebGL, hidden tab, timeout).
  const faces =
    spinning ??
    (outcome?.engine === '2d'
      ? outcome.groups.flatMap((g) =>
          g.values.map((value) => ({ type: g.type, value })),
        )
      : null);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_22rem]">
      {/* Tray */}
      <div className="relative overflow-hidden rounded-lg border border-brass/30 bg-charcoal-950">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, #2a1a16 0%, #1a100e 55%, #0d0908 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-3 rounded-md border border-brass/25"
          style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }}
        />
        <div
          className="relative h-[26rem] w-full md:h-[30rem]"
          id="dice-tray"
          ref={trayRef}
        />

        {engine === 'loading' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 font-caps text-brass-pale text-xl">
            <span className="animate-ember">Preparando la bandeja…</span>
            <span className="font-scaly text-charcoal-400 text-sm">
              Cargando el motor de física (unos segundos la primera vez).
            </span>
          </div>
        ) : null}

        {faces ? (
          <div className="absolute inset-0 flex flex-wrap content-center items-center justify-center gap-3 p-8">
            {faces.map((d, i) => (
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-[22%] border-2 font-nodesto text-3xl shadow-lg ${spinning ? 'animate-pulse' : ''}`}
                key={`${d.type}-${i}-${d.value}`}
                style={{
                  borderColor: player.color,
                  color: player.color,
                  background: '#12181c',
                }}
              >
                {d.value}
              </div>
            ))}
          </div>
        ) : null}

        {outcome ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-charcoal-950/90 to-transparent p-5">
            <div>
              <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
                {outcome.player.name} · {outcome.label}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-4">
                <span
                  className="font-nodesto text-[4.5rem] leading-none"
                  style={{
                    color:
                      outcome.crit === 'hit'
                        ? '#fe4736'
                        : outcome.crit === 'miss'
                          ? '#75838b'
                          : '#ecddac',
                    textShadow:
                      outcome.crit === 'hit'
                        ? '0 0 24px rgba(228,7,18,0.8)'
                        : '0 2px 8px rgba(0,0,0,0.8)',
                  }}
                >
                  {outcome.total}
                </span>
                <span className="font-scaly text-charcoal-300 text-sm">
                  {outcome.groups.map((g) => (
                    <span className="mr-3 inline-block" key={g.type}>
                      <b className="text-brass-pale">
                        {g.values.length}d{g.type}
                      </b>{' '}
                      [{g.values.join(', ')}] = {g.subtotal}
                    </span>
                  ))}
                  {outcome.modifier ? (
                    <span>
                      {outcome.modifier > 0 ? '+' : '−'}{' '}
                      {Math.abs(outcome.modifier)}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
            {outcome.crit ? (
              <div
                className={`font-caps text-3xl ${outcome.crit === 'hit' ? 'text-brand-400' : 'text-charcoal-400'}`}
              >
                {outcome.crit === 'hit' ? '¡Crítico!' : 'Pifia'}
              </div>
            ) : null}
          </div>
        ) : null}

        {engineNote ? (
          <div className="absolute top-3 left-3 rounded bg-charcoal-950/80 px-2 py-1 font-scaly text-[0.7rem] text-charcoal-300">
            {engineNote}
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <aside className="flex flex-col gap-4 rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
        <div>
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Quién tira
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {players.map((p) => (
              <button
                className={`rounded-md border px-3 py-2 font-caps text-lg transition ${player.id === p.id ? 'text-charcoal-900' : 'border-charcoal-600 text-charcoal-200 hover:border-brass/60'}`}
                key={p.id}
                onClick={() => setPlayer(p)}
                style={
                  player.id === p.id
                    ? { background: p.color, borderColor: p.color }
                    : undefined
                }
                type="button"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Elige los dados
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {DIE_TYPES.map((t) => {
              const qty = groups.find((g) => g.type === t)?.qty ?? 0;
              return (
                <button
                  className={`relative flex h-12 flex-col items-center justify-center rounded-md border font-nodesto text-lg transition ${qty > 0 ? 'border-brass bg-brass/20 text-brass-pale' : 'border-charcoal-600 text-charcoal-200 hover:border-brass/60'}`}
                  key={t}
                  onClick={() => addDie(t)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    removeDie(t);
                  }}
                  title={
                    t === 2 || t === 3
                      ? `d${t}: se tira con un d${PHYSICAL[t].sides} y se divide`
                      : `Añadir d${t}`
                  }
                  type="button"
                >
                  d{t}
                  {qty > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 font-condensed text-[0.7rem] text-white">
                      {qty}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 font-scaly text-[0.7rem] text-charcoal-500">
            Pulsa para añadir; clic derecho para quitar uno.
          </p>
        </div>

        <div className="rounded-md border border-charcoal-700 bg-charcoal-900/60 p-3">
          <div className="flex items-center justify-between">
            <span className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Tirada
            </span>
            <button
              className="font-condensed text-charcoal-400 text-xs uppercase hover:text-white"
              onClick={clear}
              type="button"
            >
              Limpiar
            </button>
          </div>
          <div className="mt-1 min-h-8 font-nodesto text-2xl text-brass-pale">
            {groups.length > 0 ? notation : '—'}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-charcoal-600 px-2 py-0.5 font-scaly text-charcoal-200 text-xs"
                key={g.type}
              >
                <button
                  className="px-1 text-charcoal-400 hover:text-white"
                  onClick={() => removeDie(g.type)}
                  type="button"
                >
                  −
                </button>
                {g.qty}d{g.type}
                <button
                  className="px-1 text-charcoal-400 hover:text-white"
                  onClick={() => addDie(g.type)}
                  type="button"
                >
                  +
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 font-scaly text-sm">
            <span className="text-charcoal-400">Modificador</span>
            <button
              className="btn-ghost h-7 w-7 text-base"
              onClick={() => setModifier((m) => m - 1)}
              type="button"
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-white tabular-nums">
              {modifier > 0 ? `+${modifier}` : modifier}
            </span>
            <button
              className="btn-ghost h-7 w-7 text-base"
              onClick={() => setModifier((m) => m + 1)}
              type="button"
            >
              +
            </button>
          </div>
          <button
            className="btn-beyond mt-3 w-full px-4 py-3 text-base uppercase disabled:opacity-40"
            disabled={engine === 'loading' || rolling || totalDice === 0}
            onClick={() => roll(notation, groups)}
            type="button"
          >
            {rolling
              ? 'Rodando…'
              : `Tirar ${totalDice} ${totalDice === 1 ? 'dado' : 'dados'}`}
          </button>
        </div>

        <div>
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Atajos
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                className="btn-ghost px-2 py-1.5 text-xs uppercase disabled:opacity-40"
                disabled={engine === 'loading' || rolling}
                key={p.label}
                onClick={() => applyPreset(p)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Material
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                className={`rounded-full border px-3 py-1 font-condensed text-xs uppercase tracking-wider ${theme === t.id ? 'border-brass bg-brass/20 text-brass-pale' : 'border-charcoal-600 text-charcoal-300'}`}
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  void ensureTheme(t.id);
                }}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 ? (
          <div className="mt-auto">
            <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Últimas
            </div>
            <ul className="mt-2 space-y-1 font-scaly text-sm">
              {history.map((h, i) => (
                <li
                  className="flex items-center justify-between text-charcoal-300"
                  key={`${h.label}-${i}-${h.total}`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: h.player.color }}
                    />
                    {h.label}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${h.crit === 'hit' ? 'text-brand-400' : 'text-white'}`}
                  >
                    {h.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
};

export { DiceTray };
