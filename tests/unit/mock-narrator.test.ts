import { describe, expect, it } from 'vitest';
import { mockTurn } from '@/lib/game/mock-narrator';
import { applyEffects, newGameState } from '@/lib/game/party';
import {
  type PlayerAction,
  type SceneTurn,
  sceneTurnSchemaFor,
  type TurnRequest,
} from '@/lib/game/schema';

const players = [
  { name: 'Lon', characterId: 'thokk' },
  { name: 'Jato', characterId: 'sariel' },
];

/** Plays the scripted story to the end, always taking the first choice. */
const playThrough = (succeed: boolean) => {
  const state = newGameState({
    campaignId: 'icespire-act1',
    model: 'claude-opus-5',
    death: 'never',
    players,
  });
  const schema = sceneTurnSchemaFor(players.map((p) => p.characterId));
  const history: TurnRequest['history'] = [];
  let action: PlayerAction = { kind: 'start' };
  let characters = state.characters;
  const turns: SceneTurn[] = [];
  for (let i = 0; i < 6; i += 1) {
    const req: TurnRequest = {
      ...state,
      characters,
      history,
      action,
    };
    const turn = schema.parse(mockTurn(req));
    turns.push(turn);
    characters = applyEffects(characters, turn.effects);
    history.push({
      action,
      turn: {
        place: turn.place,
        chapter: turn.chapter,
        time: turn.time,
        figure: turn.figure,
        beats: turn.beats,
        choices: turn.choices,
        summary: turn.summary,
      },
    });
    const choice = turn.choices[0];
    if (!choice) throw new Error('no choices');
    action = choice.roll
      ? {
          kind: 'choice',
          who: choice.who,
          text: choice.label,
          roll: {
            ...choice.roll,
            modifier: 0,
            result: succeed ? 19 : 2,
            total: succeed ? 19 : 2,
            success: succeed,
            critical: null,
          },
        }
      : { kind: 'choice', who: choice.who, text: choice.label };
  }
  return { turns, characters };
};

describe('mockTurn', () => {
  it('tells a complete story with several places, a talker and a creature', () => {
    const { turns } = playThrough(true);
    const places = new Set(turns.map((t) => t.place));
    expect(places.size).toBeGreaterThanOrEqual(4);
    expect(turns.some((t) => t.figure.kind === 'character')).toBe(true);
    expect(turns.some((t) => t.figure.kind === 'creature')).toBe(true);
    expect(turns.some((t) => t.beats.some((b) => b.kind === 'line'))).toBe(
      true,
    );
    expect(
      turns.some((t) =>
        t.beats.some((b) => b.kind === 'narration' && b.reveal),
      ),
    ).toBe(true);
    expect(new Set(turns.map((t) => t.atmosphere)).size).toBeGreaterThanOrEqual(
      4,
    );
    expect(turns.some((t) => t.sceneEnds)).toBe(true);
    // Every roll it asks for names a skill the rules know.
    for (const t of turns)
      for (const c of t.choices)
        if (c.roll) expect(c.roll.skill.length).toBeGreaterThan(0);
  });
  it('branches on failure: damage lands, gold and items still flow', () => {
    const good = playThrough(true);
    const bad = playThrough(false);
    const hp = (r: typeof good) => r.characters.reduce((s, c) => s + c.hp, 0);
    expect(hp(bad)).toBeLessThan(hp(good));
    expect(
      good.characters.some((c) =>
        c.items.includes('Poción de curación de Adabra'),
      ),
    ).toBe(true);
    expect(good.characters.find((c) => c.id === 'thokk')?.gold).toBe(15 + 25);
  });
  it('speaks about the characters at the table, not the defaults', () => {
    const req: TurnRequest = {
      ...newGameState({
        campaignId: 'icespire-act1',
        model: 'claude-opus-5',
        death: 'never',
        players,
      }),
      history: [],
      action: { kind: 'start' },
    };
    const text = JSON.stringify(mockTurn(req));
    expect(text).toContain('Thokk');
    expect(text).toContain('Sariel');
    expect(text).not.toContain('Bram');
  });
});
