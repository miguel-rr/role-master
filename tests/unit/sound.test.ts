import { describe, expect, it } from 'vitest';
import { mockTurn } from '@/lib/game/mock-narrator';
import { newGameState } from '@/lib/game/party';
import type { TurnRequest } from '@/lib/game/schema';
import { byLayer, libraryStats } from '@/lib/sound/library.server';
import { resolveSound } from '@/lib/sound/resolver';

const players = [
  { name: 'Loncio', characterId: 'bram' },
  { name: 'JasspeR', characterId: 'nissa' },
];
const base: TurnRequest = {
  ...newGameState({
    campaignId: 'icespire-act1',
    model: 'claude-opus-5',
    death: 'never',
    players,
  }),
  loreNames: [],
  history: [],
  action: { kind: 'start' },
};

describe('sound library', () => {
  it('has music, beds and interface sounds', () => {
    const s = libraryStats();
    expect(s.music).toBeGreaterThan(20);
    expect(s.beds).toBeGreaterThan(5);
    expect(s.ui).toBeGreaterThan(5);
    for (const e of byLayer('music'))
      expect(e.tags.situations.length).toBeGreaterThan(0);
    for (const e of byLayer('ui')) expect(e.tags.cue).toBeTruthy();
  });
});

describe('resolveSound', () => {
  it('opens the tavern with music, beds and a door', () => {
    const turn = mockTurn(base);
    const st = resolveSound(turn, 'seed', undefined);
    expect(st.situation).toBe('tavern');
    expect(st.music).not.toBe('keep');
    expect(st.music).not.toBeNull();
    expect(st.ambience).not.toBe('keep');
    if (st.ambience && st.ambience !== 'keep') {
      expect(st.ambience.beds.length).toBeGreaterThan(0);
      expect(
        st.ambience.beds.some(
          (b) =>
            b.tags.weather.includes('rain') || b.tags.places.includes('tavern'),
        ),
      ).toBe(true);
    }
    expect(st.cues.map((c) => c.sfx)).toContain('door-wood-close');
  });
  it('keeps the desk still when the narrator says keep', () => {
    const turn = mockTurn(base);
    const prev = {
      situation: 'tavern',
      place: 'tavern',
      time: 'night' as const,
      weather: 'rain' as const,
      musicId: 'x',
    };
    const st = resolveSound(
      {
        ...turn,
        sound: {
          music: { situation: 'keep', tension: 'low' },
          ambience: { place: 'keep', time: 'night', weather: 'rain' },
          cues: [],
        },
      },
      'seed',
      prev,
    );
    expect(st.music).toBe('keep');
    expect(st.ambience).toBe('keep');
    expect(st.situation).toBe('tavern');
  });
  it('changes track when the situation changes and avoids the last one', () => {
    const turn = mockTurn(base);
    const first = resolveSound(
      {
        ...turn,
        sound: {
          ...turn.sound,
          music: { situation: 'combat-heavy', tension: 'high' },
        },
      },
      'a',
    );
    const firstId =
      first.music && first.music !== 'keep' ? first.music.id : undefined;
    const second = resolveSound(
      {
        ...turn,
        sound: {
          ...turn.sound,
          music: { situation: 'travel', tension: 'low' },
        },
      },
      'a',
      { situation: 'combat-heavy', musicId: firstId },
    );
    expect(second.situation).toBe('travel');
    if (second.music && second.music !== 'keep')
      expect(second.music.id).not.toBe(firstId);
  });
  it('silences on none and derives a place from the scene tags', () => {
    const turn = mockTurn(base);
    const st = resolveSound(
      {
        ...turn,
        sceneTags: ['forests'],
        sound: {
          music: { situation: 'none', tension: 'low' },
          ambience: { place: 'keep', time: 'day', weather: 'clear' },
          cues: [],
        },
      },
      'z',
    );
    expect(st.music).toBeNull();
    expect(st.place).toBe('forest');
  });
});

describe('phase 3', () => {
  it('reads time and weather from the scene line', async () => {
    const { inferFromTime } = await import('@/lib/sound/resolver');
    expect(inferFromTime('Anochecer · Lluvia fina')).toEqual({
      time: 'night',
      weather: 'rain',
    });
    expect(inferFromTime('Mediodía · Cielo blanco')).toEqual({
      time: 'day',
      weather: undefined,
    });
    expect(inferFromTime('Amanecer · Niebla baja')).toEqual({
      time: 'day',
      weather: 'fog',
    });
    expect(inferFromTime('Sin pistas')).toEqual({
      time: undefined,
      weather: undefined,
    });
  });
  it('climbs a step when tension is high and keeps the place', () => {
    const turn = mockTurn(base);
    const prev = {
      situation: 'exploration',
      place: 'forest',
      time: 'day' as const,
      weather: 'clear' as const,
      musicId: 'x',
    };
    const st = resolveSound(
      {
        ...turn,
        time: 'Tarde',
        sound: {
          music: { situation: 'keep', tension: 'high' },
          ambience: { place: 'keep', time: 'day', weather: 'clear' },
          cues: [],
        },
      },
      'seed',
      prev,
    );
    expect(st.situation).toBe('tension');
    expect(st.music).not.toBe('keep');
    expect(st.ambience).toBe('keep');
  });
  it('re-picks the ambience when the scene turns to night without a new place', () => {
    const turn = mockTurn(base);
    const prev = {
      situation: 'tavern',
      place: 'forest',
      time: 'day' as const,
      weather: 'clear' as const,
      musicId: 'x',
    };
    const st = resolveSound(
      {
        ...turn,
        time: 'Noche cerrada',
        sound: {
          music: { situation: 'keep', tension: 'low' },
          ambience: { place: 'keep', time: 'day', weather: 'clear' },
          cues: [],
        },
      },
      'seed',
      prev,
    );
    expect(st.place).toBe('forest');
    expect(st.time).toBe('night');
    expect(st.ambience).not.toBe('keep');
  });
});
