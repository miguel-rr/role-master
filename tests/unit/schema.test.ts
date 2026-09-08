import { describe, expect, it } from 'vitest';
import { mockTurn } from '@/lib/game/mock-narrator';
import { newGameState } from '@/lib/game/party';
import {
  gameStateSchema,
  sceneTurnSchema,
  strictSceneTurnSchemaFor,
  type TurnRequest,
} from '@/lib/game/schema';

const request = (overrides: Partial<TurnRequest> = {}): TurnRequest => ({
  campaignId: 'icespire-act1',
  model: 'claude-opus-5',
  death: 'unlikely',
  players: [
    { name: 'Lon', characterId: 'dagna' },
    { name: 'Jato', characterId: 'corran' },
  ],
  characters: [],
  memory: [],
  npcArt: {},
  history: [],
  action: { kind: 'start' },
  ...overrides,
});

describe('sceneTurnSchemaFor', () => {
  const schema = strictSceneTurnSchemaFor(['dagna', 'corran']);
  it('accepts the table ids and "both", rejects strangers', () => {
    const turn = mockTurn(request());
    expect(schema.safeParse(turn).success).toBe(true);
    const bad = {
      ...turn,
      choices: [{ ...turn.choices[0], who: 'bram' }, turn.choices[1]],
    };
    expect(schema.safeParse(bad).success).toBe(false);
    expect(sceneTurnSchema.safeParse(bad).success).toBe(true);
  });
  it('does not let effects land on "both"', () => {
    const turn = mockTurn(request());
    const bad = {
      ...turn,
      effects: { hp: [{ who: 'both', delta: -1 }], gold: [], items: [] },
    };
    expect(schema.safeParse(bad).success).toBe(false);
  });
});

describe('model-facing sound block', () => {
  it('is three flat strings that narrow into the strict block', async () => {
    const { sceneTurnSchemaFor, narrowTurn } = await import(
      '@/lib/game/schema'
    );
    const loose = sceneTurnSchemaFor(['dagna', 'corran']);
    const turn = mockTurn(request());
    const parsed = loose.parse({
      ...turn,
      sound: {
        music: 'exploration high',
        ambience: 'forest night rain',
        cues: ['1 owl', '2 nonsense'],
      },
    });
    const strict = narrowTurn(parsed);
    expect(strict.sound.music).toEqual({
      situation: 'exploration',
      tension: 'high',
    });
    expect(strict.sound.ambience).toEqual({
      place: 'forest',
      time: 'night',
      weather: 'rain',
    });
    expect(strict.sound.cues).toEqual([{ beat: 1, sfx: 'owl' }]);
    expect(
      narrowTurn(loose.parse({ ...turn, sound: { music: 'lo que sea' } })).sound
        .music.situation,
    ).toBe('keep');
  });
});

describe('gameStateSchema', () => {
  it('validates a fresh game and rejects an old save', () => {
    const state = newGameState({
      campaignId: 'icespire-act1',
      model: 'claude-fable-5-1',
      death: 'possible',
      players: [
        { name: 'Lon', characterId: 'bram' },
        { name: 'Jato', characterId: 'nissa' },
      ],
    });
    expect(gameStateSchema.safeParse(state).success).toBe(true);
    expect(state.characters.map((c) => c.id)).toEqual(['bram', 'nissa']);
    expect(gameStateSchema.safeParse({ ...state, version: 1 }).success).toBe(
      false,
    );
    expect(gameStateSchema.safeParse({ ...state, players: [] }).success).toBe(
      false,
    );
  });
});
