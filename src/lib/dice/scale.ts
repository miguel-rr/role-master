/**
 * How big the dice are on the tray. Remembered per browser: a television
 * across the room wants them twice the size of a laptop.
 */
const KEY = 'role-master:dice-scale';
const DEFAULT_DICE_SCALE = 12;
const MIN_DICE_SCALE = 5;
const MAX_DICE_SCALE = 22;

const loadDiceScale = (): number => {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isFinite(v) && v >= MIN_DICE_SCALE && v <= MAX_DICE_SCALE
      ? v
      : DEFAULT_DICE_SCALE;
  } catch {
    return DEFAULT_DICE_SCALE;
  }
};

const saveDiceScale = (v: number) => {
  try {
    localStorage.setItem(KEY, String(v));
  } catch {
    /* private mode */
  }
};

export {
  DEFAULT_DICE_SCALE,
  loadDiceScale,
  MAX_DICE_SCALE,
  MIN_DICE_SCALE,
  saveDiceScale,
};
