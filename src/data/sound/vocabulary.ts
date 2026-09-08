/**
 * The closed vocabularies the narrator, the resolver and the library share.
 * Spanish is for the interface; these ids are English on purpose.
 */

const SITUATIONS = [
  'arrival',
  'exploration',
  'travel',
  'tavern',
  'market',
  'court',
  'mystery',
  'stealth',
  'tension',
  'chase',
  'combat-light',
  'combat-heavy',
  'boss',
  'ritual',
  'revelation',
  'sorrow',
  'rest',
  'victory',
  'epilogue',
] as const;

const PLACES = [
  'tavern',
  'inn-night',
  'town-day',
  'market',
  'harbour',
  'temple',
  'palace',
  'library',
  'dungeon',
  'sewer',
  'ruins',
  'graveyard',
  'forest',
  'swamp',
  'mountain',
  'snow',
  'river',
  'lake',
  'road',
  'desert',
  'cave',
  'mine',
  'underdark',
  'ship',
  'camp',
  'farm',
  'mill',
  'interior',
] as const;

const TIMES = ['day', 'night'] as const;
const WEATHERS = ['clear', 'rain', 'storm', 'wind', 'snow', 'fog'] as const;
const TENSIONS = ['low', 'mid', 'high'] as const;

/** Scene cues the narrator may fire on a beat; each maps to sfx entries. */
const CUES = [
  'door-wood-open',
  'door-wood-close',
  'door-iron',
  'lock',
  'footsteps-stone',
  'footsteps-wood',
  'coin',
  'coins-pour',
  'mug',
  'glass-break',
  'sword-draw',
  'sword-clash',
  'arrow',
  'bow-draw',
  'impact',
  'body-fall',
  'fire-ignite',
  'torch',
  'candle-out',
  'thunder',
  'wind-gust',
  'bell',
  'gong',
  'roar',
  'growl',
  'wings',
  'crow',
  'wolf',
  'owl',
  'scream-far',
  'laugh',
  'applause',
  'water-drip',
  'splash',
  'rockfall',
  'chain',
  'book-close',
  'parchment',
  'spell',
  'heal',
  'arcane-spark',
  'heartbeat',
] as const;

/** Interface sounds, fixed set. */
const UI_CUES = [
  'page-turn',
  'choice',
  'open-sheet',
  'close-sheet',
  'item-card',
  'dice-rattle',
  'dice-land',
  'crit',
  'fumble',
  'reveal',
  'soundcheck',
  'heartbeat',
] as const;

type Situation = (typeof SITUATIONS)[number];
type Place = (typeof PLACES)[number];
type TimeOfDay = (typeof TIMES)[number];
type Weather = (typeof WEATHERS)[number];
type Tension = (typeof TENSIONS)[number];
type Cue = (typeof CUES)[number];
type UiCue = (typeof UI_CUES)[number];

export { CUES, PLACES, SITUATIONS, TENSIONS, TIMES, UI_CUES, WEATHERS };
export type { Cue, Place, Situation, Tension, TimeOfDay, UiCue, Weather };
