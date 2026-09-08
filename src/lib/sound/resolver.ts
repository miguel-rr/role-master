import 'server-only';

import { seeded } from '@/data/art/catalog';
import type { SoundEntry } from '@/data/sound/schema';
import {
  PLACES,
  type Place,
  SITUATIONS,
  type Situation,
  type Weather,
} from '@/data/sound/vocabulary';
import type { Mood, SceneTurn, Soundtrack } from '@/lib/game/schema';
import { byLayer } from './library.server';

/**
 * Turns the narrator's sound direction into concrete pieces. Continuity
 * first: "keep" leaves the desk alone, and a new situation avoids the track
 * that was just playing. When the narrator says nothing (first turn), the
 * scene tags and mood decide.
 */

type Previous = {
  situation?: string;
  place?: string;
  time?: 'day' | 'night';
  weather?: Weather;
  musicId?: string;
};

/** Scene tags of the art vocabulary → ambience places. */
const PLACE_FROM_TAG: Record<string, Place> = {
  taverns: 'tavern',
  inns: 'inn-night',
  settlements: 'town-day',
  cities: 'town-day',
  buildings: 'interior',
  markets: 'market',
  temples: 'temple',
  castles: 'palace',
  towers: 'palace',
  libraries: 'library',
  prisons: 'dungeon',
  sewers: 'sewer',
  ruins: 'ruins',
  graveyards: 'graveyard',
  forests: 'forest',
  jungles: 'forest',
  swamps: 'swamp',
  mountains: 'mountain',
  snow: 'snow',
  rivers: 'river',
  lakes: 'lake',
  bridges: 'river',
  roads: 'road',
  deserts: 'desert',
  caves: 'cave',
  mines: 'mine',
  dungeons: 'dungeon',
  underdark: 'underdark',
  ships: 'ship',
  phandalin: 'town-day',
  neverwinter: 'harbour',
  barovia: 'graveyard',
};

const SITUATION_FROM_MOOD: Record<Mood, Situation> = {
  warm: 'rest',
  cold: 'travel',
  dark: 'mystery',
  gold: 'arrival',
  green: 'exploration',
  blood: 'combat-light',
};

/** Neighbouring situations to fall back on when a shelf is empty. */
const NEAR: Partial<Record<Situation, Situation[]>> = {
  arrival: ['exploration', 'travel'],
  exploration: ['travel', 'mystery'],
  travel: ['exploration', 'rest'],
  tavern: ['market', 'court', 'rest'],
  market: ['tavern', 'arrival'],
  court: ['tavern', 'ritual'],
  mystery: ['tension', 'exploration'],
  stealth: ['tension', 'mystery'],
  tension: ['mystery', 'combat-light'],
  chase: ['combat-light', 'tension'],
  'combat-light': ['combat-heavy', 'chase'],
  'combat-heavy': ['boss', 'combat-light'],
  boss: ['combat-heavy'],
  ritual: ['mystery', 'court'],
  revelation: ['mystery', 'sorrow'],
  sorrow: ['rest', 'revelation'],
  rest: ['travel', 'epilogue'],
  victory: ['arrival', 'epilogue'],
  epilogue: ['rest', 'victory'],
};

const pick = <T>(list: T[], seed: string): T | undefined => {
  if (list.length === 0) return undefined;
  const rnd = seeded(seed);
  return list[Math.floor(rnd() * list.length)];
};

const isSituation = (s: string): s is Situation =>
  (SITUATIONS as readonly string[]).includes(s);
const isPlace = (s: string): s is Place =>
  (PLACES as readonly string[]).includes(s);

const pickMusic = (
  situation: Situation,
  mood: Mood,
  seed: string,
  avoid?: string,
): SoundEntry | null => {
  const music = byLayer('music');
  const shelves = [situation, ...(NEAR[situation] ?? [])];
  for (const s of shelves) {
    const pool = music.filter(
      (e) => e.tags.situations.includes(s) && e.id !== avoid,
    );
    if (pool.length === 0) continue;
    const moody = pool.filter((e) => e.tags.moods.includes(mood));
    return pick(moody.length >= 2 ? moody : pool, seed) ?? null;
  }
  return (
    pick(
      music.filter((e) => e.id !== avoid),
      seed,
    ) ?? null
  );
};

const fits = (e: SoundEntry, time: 'day' | 'night', weather: string) =>
  (e.tags.time.length === 0 || e.tags.time.includes(time)) &&
  (e.tags.weather.length === 0 || e.tags.weather.includes(weather));

const pickAmbience = (
  place: Place,
  time: 'day' | 'night',
  weather: string,
  seed: string,
): { beds: SoundEntry[]; spots: SoundEntry[] } => {
  const beds = byLayer('bed');
  const spots = byLayer('spot');
  const placeBeds = beds.filter(
    (e) => e.tags.places.includes(place) && fits(e, time, weather),
  );
  const chosen: SoundEntry[] = [];
  const main = pick(placeBeds, `${seed}:bed`);
  if (main) chosen.push(main);
  // A second, different bed thickens the scene (fire under the crowd…).
  const second = pick(
    placeBeds.filter((e) => e.id !== main?.id),
    `${seed}:bed2`,
  );
  if (second && chosen.length < 2) chosen.push(second);
  // Weather sits on top of any place.
  if (weather !== 'clear') {
    const w = pick(
      beds.filter(
        (e) => e.tags.places.length === 0 && e.tags.weather.includes(weather),
      ),
      `${seed}:weather`,
    );
    if (w) chosen.push(w);
  }
  const placeSpots = spots.filter(
    (e) =>
      (e.tags.places.includes(place) ||
        (e.tags.places.length === 0 && e.tags.weather.includes(weather))) &&
      fits(e, time, weather),
  );
  return { beds: chosen, spots: placeSpots.slice(0, 8) };
};

const cueEntry = (sfx: string, seed: string): SoundEntry | undefined =>
  pick(
    byLayer('sfx').filter((e) => e.tags.cue === sfx),
    seed,
  );

const resolveSound = (
  turn: SceneTurn,
  seed: string,
  previous?: Previous,
): Soundtrack => {
  const d = turn.sound;
  // ── Music ──
  let music: Soundtrack['music'] = 'keep';
  let situation = previous?.situation;
  const wantsMusic = d.music.situation;
  if (wantsMusic === 'none') {
    music = null;
    situation = undefined;
  } else if (wantsMusic !== 'keep' || !previous?.musicId) {
    const s: Situation = isSituation(wantsMusic)
      ? wantsMusic
      : previous?.situation && isSituation(previous.situation)
        ? previous.situation
        : SITUATION_FROM_MOOD[turn.mood];
    if (s !== previous?.situation || !previous?.musicId) {
      music = pickMusic(s, turn.mood, `${seed}:music`, previous?.musicId);
      situation = s;
    }
  }
  // ── Ambience ──
  let ambience: Soundtrack['ambience'] = 'keep';
  let place = previous?.place;
  let time = previous?.time;
  let weather = previous?.weather;
  const wantsPlace = d.ambience.place;
  if (wantsPlace === 'none') {
    ambience = null;
    place = undefined;
  } else {
    const fromTags = turn.sceneTags.map((t) => PLACE_FROM_TAG[t]).find(Boolean);
    const p: Place | undefined = isPlace(wantsPlace)
      ? wantsPlace
      : previous?.place && isPlace(previous.place)
        ? previous.place
        : fromTags;
    const changed =
      p !== previous?.place ||
      d.ambience.time !== previous?.time ||
      d.ambience.weather !== previous?.weather ||
      !previous?.place;
    if (p && (wantsPlace !== 'keep' || changed)) {
      ambience = pickAmbience(
        p,
        d.ambience.time,
        d.ambience.weather,
        `${seed}:amb`,
      );
      place = p;
      time = d.ambience.time;
      weather = d.ambience.weather;
    }
  }
  // ── Cues ──
  const cues = d.cues.flatMap((c, i) => {
    const entry = cueEntry(c.sfx, `${seed}:cue:${i}`);
    return entry ? [{ beat: c.beat, sfx: c.sfx, entry }] : [];
  });
  return { situation, place, time, weather, music, ambience, cues };
};

export { PLACE_FROM_TAG, resolveSound };
