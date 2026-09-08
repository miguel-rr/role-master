'use client';

import { useEffect, useRef, useState } from 'react';
import { type Bus, soundEngine } from '@/lib/sound/engine';
import { useSound } from '@/lib/sound/use-sound';

const BUSES: { id: Bus; label: string; hint: string }[] = [
  { id: 'music', label: 'Música', hint: 'La banda sonora de la escena' },
  { id: 'ambience', label: 'Ambiente', hint: 'El lugar: gente, fuego, viento' },
  { id: 'effects', label: 'Efectos', hint: 'Puertas, truenos, acero' },
  { id: 'ui', label: 'Interfaz', hint: 'Páginas, dados, decisiones' },
];

/** Four faders and a mute, in a Beyond-style card. */
const MixerPanel = ({ compact = false }: { compact?: boolean }) => {
  const { mix, status } = useSound();
  const engine = soundEngine();
  return (
    <div className={compact ? 'w-72' : 'w-full'} data-testid="mixer">
      <div className="flex items-center justify-between">
        <span className="font-caps text-brass-pale text-lg">Sonido</span>
        <button
          className={`rounded-sm border px-2 py-0.5 font-condensed text-[0.65rem] uppercase tracking-wider transition ${mix.enabled ? 'border-brass/60 text-brass-pale' : 'border-brand-600 bg-brand-900/50 text-brand-100'}`}
          data-testid="mixer-toggle"
          onClick={() => engine.setEnabled(!mix.enabled)}
          type="button"
        >
          {mix.enabled ? 'Sonando · M silencia' : 'Silenciado · M activa'}
        </button>
      </div>
      {status === 'suspended' || status === 'idle' ? (
        <button
          className="btn-beyond mt-3 w-full px-3 py-2 text-xs uppercase"
          data-testid="mixer-unlock"
          onClick={() => void engine.unlock()}
          type="button"
        >
          Activar sonido
        </button>
      ) : null}
      <div className="mt-3 space-y-2.5">
        {BUSES.map((b) => (
          <label className="block" key={b.id}>
            <div className="flex items-baseline justify-between">
              <span className="font-scaly text-parchment-text text-sm">
                {b.label}
              </span>
              <span className="font-scaly text-[0.7rem] text-charcoal-400">
                {Math.round(mix[b.id] * 100)}
              </span>
            </div>
            <input
              aria-label={b.label}
              className="mt-1 w-full accent-[#e40712]"
              data-testid={`mixer-${b.id}`}
              max={100}
              min={0}
              onChange={(e) =>
                engine.setVolume(b.id, Number(e.target.value) / 100)
              }
              type="range"
              value={Math.round(mix[b.id] * 100)}
            />
            {!compact ? (
              <div className="font-scaly text-[0.68rem] text-charcoal-500">
                {b.hint}
              </div>
            ) : null}
          </label>
        ))}
      </div>
    </div>
  );
};

/** The speaker button of the HUD with the mixer as a flyout. */
const SoundButton = () => {
  const { mix, status, musicId } = useSound();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);
  const muted = !mix.enabled || status === 'suspended' || status === 'idle';
  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${muted ? 'border-brand-600/70 text-brand-300' : 'border-white/15 text-brass-pale hover:border-brass'}`}
        data-testid="sound-button"
        onClick={() => setOpen((o) => !o)}
        title={
          muted ? 'Sonido apagado' : musicId ? `Sonando: ${musicId}` : 'Sonido'
        }
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
        >
          <title>Sonido</title>
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {muted ? (
            <path d="M16 9l5 6M21 9l-5 6" />
          ) : (
            <>
              <path d="M16 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
            </>
          )}
        </svg>
      </button>
      {open ? (
        <div className="absolute top-11 right-0 z-[70] rounded-md border border-brass/50 bg-charcoal-950/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur">
          <MixerPanel compact />
        </div>
      ) : null}
    </div>
  );
};

export { MixerPanel, SoundButton };
