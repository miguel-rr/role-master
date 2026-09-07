'use client';

import '@3d-dice/dice-box/dist/style.css';

import type DiceBoxType from '@3d-dice/dice-box';
import type { DieResult } from '@3d-dice/dice-box';
import { useCallback, useEffect, useRef, useState } from 'react';

type Player = { id: string; name: string; color: string };

type DiceTrayProps = {
  players: [Player, Player];
};

type Outcome = {
  notation: string;
  label: string;
  total: number;
  dice: { sides: number; value: number; dropped?: boolean }[];
  crit: 'hit' | 'miss' | null;
  player: Player;
};

const THEMES = [
  { id: 'default', label: 'Resina' },
  { id: 'rock', label: 'Piedra' },
  { id: 'wooden', label: 'Madera' },
  { id: 'gemstone', label: 'Gema' },
] as const;

const ROLLS = [
  { label: 'd20', notation: '1d20', mod: 0 },
  { label: 'Ataque +5', notation: '1d20', mod: 5 },
  { label: 'Ventaja', notation: '2d20', mod: 0, keep: 'high' as const },
  { label: 'Desventaja', notation: '2d20', mod: 0, keep: 'low' as const },
  { label: 'Espada larga', notation: '1d8', mod: 3 },
  { label: 'Ataque furtivo', notation: '1d8+1d6', mod: 3 },
  { label: 'Bola de fuego', notation: '8d6', mod: 0 },
  { label: 'd100', notation: '1d100', mod: 0 },
] as const;

/** 3D physics dice in a tray, one colour per player, results read for you. */
const DiceTray = ({ players }: DiceTrayProps) => {
  const boxRef = useRef<DiceBoxType | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [player, setPlayer] = useState<Player>(players[0]);
  const [theme, setTheme] = useState<(typeof THEMES)[number]['id']>('default');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<Outcome[]>([]);

  const initialColor = players[0].color;
  const startedRef = useRef(false);
  useEffect(() => {
    // One engine per mount. StrictMode runs effects twice; the box owns a
    // worker and a WebGL context, so the second run must be a no-op.
    if (startedRef.current) return;
    startedRef.current = true;
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
        await box.init();
        // The engine sizes its canvas once; nudge it to the tray's real size.
        window.dispatchEvent(new Event('resize'));
        setReady(true);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [initialColor]);

  const roll = useCallback(
    async (spec: (typeof ROLLS)[number]) => {
      const box = boxRef.current;
      if (!box || rolling) return;
      setRolling(true);
      setOutcome(null);
      try {
        box.clear();
        const rolled: DieResult[] = await box.roll(spec.notation.split('+'), {
          theme,
          themeColor: player.color,
        });
        const dice: Outcome['dice'] = rolled.map((r) => ({
          sides: r.sides,
          value: r.value,
        }));
        let total = 0;
        let crit: Outcome['crit'] = null;
        if ('keep' in spec && spec.keep) {
          const values = dice.map((d) => d.value);
          const kept =
            spec.keep === 'high' ? Math.max(...values) : Math.min(...values);
          const keptIdx = values.indexOf(kept);
          dice.forEach((d, i) => {
            d.dropped = i !== keptIdx;
          });
          total = kept + spec.mod;
          crit = kept === 20 ? 'hit' : kept === 1 ? 'miss' : null;
        } else {
          total = dice.reduce((s, d) => s + d.value, 0) + spec.mod;
          const d20 = dice.find((d) => d.sides === 20);
          crit = d20
            ? d20.value === 20
              ? 'hit'
              : d20.value === 1
                ? 'miss'
                : null
            : null;
        }
        const out: Outcome = {
          notation: spec.mod ? `${spec.notation}+${spec.mod}` : spec.notation,
          label: spec.label,
          total,
          dice,
          crit,
          player,
        };
        setOutcome(out);
        setHistory((h) => [out, ...h].slice(0, 6));
      } finally {
        setRolling(false);
      }
    },
    [player, theme, rolling],
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="relative overflow-hidden rounded-lg border border-brass/30 bg-charcoal-950">
        {/* Felt */}
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
        />

        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center font-caps text-brass-pale text-xl">
            Preparando la bandeja…
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center font-scaly text-brand-300 text-sm">
            La bandeja 3D no ha podido iniciarse: {error}
          </div>
        ) : null}

        {outcome ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
            <div>
              <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
                {outcome.player.name} · {outcome.label} · {outcome.notation}
              </div>
              <div className="mt-1 flex items-baseline gap-3">
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
                  {outcome.dice.map((d, i) => (
                    <span
                      className={d.dropped ? 'line-through opacity-50' : ''}
                      key={`${d.sides}-${i}-${d.value}`}
                    >
                      {i > 0 ? ' + ' : ''}
                      {d.value}
                    </span>
                  ))}
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
      </div>

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
            Material
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                className={`rounded-full border px-3 py-1 font-condensed text-xs uppercase tracking-wider ${theme === t.id ? 'border-brass bg-brass/20 text-brass-pale' : 'border-charcoal-600 text-charcoal-300'}`}
                key={t.id}
                onClick={() => setTheme(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Tiradas
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ROLLS.map((r) => (
              <button
                className="btn-ghost px-2 py-2 text-xs uppercase disabled:opacity-40"
                disabled={!ready || rolling}
                key={r.label}
                onClick={() => roll(r)}
                type="button"
              >
                {r.label}
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
                  key={`${h.notation}-${i}-${h.total}`}
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
