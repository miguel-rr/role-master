'use client';

import { MAX_DICE_SCALE, MIN_DICE_SCALE } from '@/lib/dice/scale';

/** The "Tamaño" fader of the tray. */
const DiceScaleSlider = ({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) => (
  <label
    className={`flex items-center gap-2 ${compact ? '' : 'rounded-md border border-white/10 px-3 py-1.5'}`}
  >
    <span className="font-condensed text-[0.7rem] text-strapline uppercase tracking-wider">
      Tamaño
    </span>
    <input
      aria-label="Tamaño de los dados"
      className="w-28 accent-[#e40712]"
      data-testid="dice-scale"
      max={MAX_DICE_SCALE}
      min={MIN_DICE_SCALE}
      onChange={(e) => onChange(Number(e.target.value))}
      step={1}
      type="range"
      value={value}
    />
    <span className="w-6 font-scaly text-charcoal-300 text-xs tabular-nums">
      {value}
    </span>
  </label>
);

export { DiceScaleSlider };
