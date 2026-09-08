'use client';

import '@3d-dice/dice-box/dist/style.css';

import type DiceBoxType from '@3d-dice/dice-box';
import type { DieResult } from '@3d-dice/dice-box';
import { useEffect, useRef, useState } from 'react';

type DiceRequest = {
  /** Who rolls, for the colour and the label. */
  playerName: string;
  color: string;
  /** e.g. "Persuasión · CD 12" */
  label: string;
  /** Physical dice to throw, e.g. ["1d20"] or ["2d20"] with advantage. */
  notation: string[];
  modifier: number;
};

type DiceModalProps = {
  request: DiceRequest;
  /** Called with every die value once the roll settles and the player accepts. */
  onDone: (values: number[]) => void;
  /** The dice leave the hand. */
  onRoll?: () => void;
  /** The dice come to rest. */
  onSettled?: (values: number[]) => void;
};

const ROLL_TIMEOUT_MS = 9000;

/** Players (and tests) can ask for the flat dice: no WebGL, no wait. */
const prefers2d = () => {
  try {
    return localStorage.getItem('role-master:dice-2d') === '1';
  } catch {
    return false;
  }
};

const supportsWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

const randomInt = (sides: number) => 1 + Math.floor(Math.random() * sides);

/**
 * The table's dice tray, opened when the narrator asks for a check. Rolls the
 * 3D dice (2D fallback), reads them, and hands the values back.
 */
const DiceModal = ({ request, onDone, onRoll, onSettled }: DiceModalProps) => {
  const boxRef = useRef<DiceBoxType | null>(null);
  const startedRef = useRef(false);
  const [engine, setEngine] = useState<'loading' | '3d' | '2d'>('loading');
  const [rolling, setRolling] = useState(false);
  const [values, setValues] = useState<number[] | null>(null);
  const [spin, setSpin] = useState<number[] | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (
      prefers2d() ||
      !supportsWebGL() ||
      typeof Worker === 'undefined' ||
      document.hidden
    ) {
      setEngine('2d');
      return;
    }
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        setEngine('2d');
      }
    }, 15000);
    (async () => {
      try {
        const { default: DiceBox } = await import('@3d-dice/dice-box');
        const box = new DiceBox({
          container: '#dice-modal-tray',
          assetPath: '/assets/dice-box/',
          theme: 'default',
          themeColor: request.color,
          scale: 6,
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
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        window.dispatchEvent(new Event('resize'));
        setEngine('3d');
      } catch {
        if (!settled) {
          settled = true;
          window.clearTimeout(timeout);
          setEngine('2d');
        }
      }
    })();
  }, [request.color]);

  const sidesOf = (n: string) => Number(n.split('d')[1] ?? 20);
  const countOf = (n: string) => Number(n.split('d')[0] ?? 1);
  const expected = request.notation.flatMap((n) =>
    Array.from({ length: countOf(n) }, () => sidesOf(n)),
  );

  const roll2d = async () => {
    const start = performance.now();
    while (performance.now() - start < 900) {
      setSpin(expected.map((s) => randomInt(s)));
      await new Promise((r) => setTimeout(r, 70));
    }
    setSpin(null);
    const vals = expected.map((s) => randomInt(s));
    setValues(vals);
    onSettled?.(vals);
  };

  const roll = async () => {
    if (rolling) return;
    setRolling(true);
    setValues(null);
    onRoll?.();
    try {
      const box = boxRef.current;
      if (engine !== '3d' || !box || document.hidden) {
        await roll2d();
        return;
      }
      box.clear();
      const settled = await Promise.race<DieResult[] | 'timeout'>([
        box.roll(request.notation, { themeColor: request.color }),
        new Promise<'timeout'>((r) =>
          setTimeout(() => r('timeout'), ROLL_TIMEOUT_MS),
        ),
      ]);
      let vals =
        settled === 'timeout'
          ? box
              .getRollResults()
              .flatMap((g) => (g.rolls ?? []).map((d) => d.value))
          : settled.map((d) => d.value);
      if (vals.length < expected.length) {
        vals = [
          ...vals,
          ...expected.slice(vals.length).map((s) => randomInt(s)),
        ];
      }
      const finalVals = vals.slice(0, expected.length);
      setValues(finalVals);
      onSettled?.(finalVals);
    } catch {
      await roll2d();
    } finally {
      setRolling(false);
    }
  };

  const faces = spin ?? (engine === '2d' ? values : null);
  const kept =
    values && values.length > 1
      ? request.notation[0]?.startsWith('2d') &&
        request.label.includes('desventaja')
        ? Math.min(...values)
        : Math.max(...values)
      : values?.[0];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      data-testid="dice-modal"
    >
      <div className="relative w-[min(92vw,64rem)] overflow-hidden rounded-lg border border-brass/40 bg-charcoal-950 shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-brass/30 border-b px-6 py-3">
          <div>
            <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Tirada de {request.playerName}
            </div>
            <div className="font-caps text-2xl text-brass-pale">
              {request.label}
            </div>
          </div>
          <div className="font-scaly text-charcoal-400 text-sm">
            {request.notation.join(' + ')}{' '}
            {request.modifier
              ? `${request.modifier > 0 ? '+' : '−'} ${Math.abs(request.modifier)}`
              : ''}
          </div>
        </div>

        <div className="relative">
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
            className="relative h-[22rem] w-full md:h-[26rem]"
            id="dice-modal-tray"
          />

          {engine === 'loading' ? (
            <div className="absolute inset-0 flex items-center justify-center font-caps text-brass-pale text-xl">
              <span className="animate-ember">Preparando los dados…</span>
            </div>
          ) : null}

          {faces ? (
            <div className="absolute inset-0 flex flex-wrap content-center items-center justify-center gap-4">
              {faces.map((v, i) => (
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-[22%] border-2 font-nodesto text-4xl shadow-lg ${spin ? 'animate-pulse' : ''}`}
                  key={`${i}-${v}`}
                  style={{
                    borderColor: request.color,
                    color: request.color,
                    background: '#12181c',
                  }}
                >
                  {v}
                </div>
              ))}
            </div>
          ) : null}

          {values && kept !== undefined ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-charcoal-950/95 to-transparent p-5">
              <div className="flex items-baseline gap-3">
                <span
                  className="font-nodesto text-[4rem] leading-none"
                  style={{
                    color:
                      kept === 20
                        ? '#fe4736'
                        : kept === 1
                          ? '#75838b'
                          : '#ecddac',
                    textShadow:
                      kept === 20
                        ? '0 0 24px rgba(228,7,18,0.8)'
                        : '0 2px 8px rgba(0,0,0,0.8)',
                  }}
                >
                  {kept + request.modifier}
                </span>
                <span className="font-scaly text-charcoal-300 text-sm">
                  d20 {values.join(' / ')}
                  {request.modifier
                    ? ` ${request.modifier > 0 ? '+' : '−'} ${Math.abs(request.modifier)}`
                    : ''}
                </span>
              </div>
              {kept === 20 || kept === 1 ? (
                <span
                  className={`font-caps text-3xl ${kept === 20 ? 'text-brand-400' : 'text-charcoal-400'}`}
                >
                  {kept === 20 ? '¡Crítico!' : 'Pifia'}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-brass/30 border-t px-6 py-3">
          {values ? (
            <button
              className="btn-beyond px-6 py-2.5 uppercase"
              data-testid="dice-accept"
              onClick={() => onDone(values)}
              type="button"
            >
              Aceptar el resultado
            </button>
          ) : (
            <button
              className="btn-beyond px-6 py-2.5 uppercase disabled:opacity-40"
              data-testid="dice-roll"
              disabled={engine === 'loading' || rolling}
              onClick={roll}
              type="button"
            >
              {rolling ? 'Rodando…' : 'Tirar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { DiceModal };
export type { DiceRequest };
