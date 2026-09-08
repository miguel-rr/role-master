import { z } from 'zod';
import { artEntrySchema } from '@/data/art/schema';

/**
 * The contract between the narrator (Claude) and the stage. Everything the
 * model returns for a turn is validated against `sceneTurnSchema`; the server
 * then resolves art and hands the client a `ResolvedTurn`.
 *
 * Character ids are open strings here; the route narrows them to the two
 * characters at the table with `sceneTurnSchemaFor`.
 */

const atmosphereSchema = z.enum([
  'embers',
  'dust',
  'snow',
  'fireflies',
  'fog',
  'ash',
  'none',
]);

const moodSchema = z.enum(['warm', 'cold', 'dark', 'gold', 'green', 'blood']);

const beatSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('narration'),
    text: z.string().min(1),
    /** Brings the scene's figure into frame on this beat (creatures). */
    reveal: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('line'),
    text: z.string().min(1),
  }),
]);

const figureSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('character'),
    /** Stable id so the same NPC keeps the same face across turns. */
    npcId: z.string().min(1),
    name: z.string().min(1),
    role: z.string().min(1),
    race: z.string().optional(),
    gender: z.enum(['male', 'female']).optional(),
    /** Class or role tags from the portrait vocabulary. */
    tags: z.array(z.string()).default([]),
  }),
  z.object({
    kind: z.literal('creature'),
    npcId: z.string().min(1),
    name: z.string().min(1),
    role: z.string().min(1),
    /** One tag from the monster vocabulary (e.g. "goblin", "owlbear"). */
    monsterTag: z.string().min(1),
  }),
]);

/** A character id, or "both" for a shared decision. */
const whoSchema = z.string().min(1);
const BOTH = 'both';

const rollRequestSchema = z.object({
  /** Skill or save name in Spanish, from the rules vocabulary. */
  skill: z.string().min(1),
  dc: z.number().int().min(1).max(30),
  advantage: z.enum(['none', 'advantage', 'disadvantage']).default('none'),
});

/**
 * Builds the turn schema. `who` accepts a character id or "both"; `one`
 * accepts a character id only (effects always land on someone).
 */
const buildSceneTurnSchema = <
  W extends z.ZodType<string>,
  O extends z.ZodType<string>,
>(
  who: W,
  one: O,
) => {
  const choice = z.object({
    label: z.string().min(1),
    who,
    hint: z.string().optional(),
    roll: rollRequestSchema.optional(),
  });
  const effects = z.object({
    hp: z.array(z.object({ who: one, delta: z.number().int() })).default([]),
    gold: z.array(z.object({ who: one, delta: z.number().int() })).default([]),
    items: z
      .array(
        z.object({
          who: one,
          add: z.string().optional(),
          remove: z.string().optional(),
        }),
      )
      .default([]),
  });
  return z.object({
    place: z.string().min(1),
    chapter: z.string().min(1),
    time: z.string().min(1),
    /** Ordered preferences from the place vocabulary; first match wins. */
    sceneTags: z.array(z.string()).min(1).max(4),
    atmosphere: atmosphereSchema,
    mood: moodSchema,
    figure: figureSchema,
    beats: z.array(beatSchema).min(1).max(7),
    choices: z.array(choice).min(2).max(4),
    effects: effects.default({ hp: [], gold: [], items: [] }),
    /** Facts worth remembering for the rest of the campaign. */
    memory: z.array(z.string()).default([]),
    /** One line for the log ("Anteriormente en…"). */
    summary: z.string().min(1),
    /** True when the party reaches a natural stopping point. */
    sceneEnds: z.boolean().default(false),
  });
};

const sceneTurnSchema = buildSceneTurnSchema(whoSchema, whoSchema);
const choiceSchema = sceneTurnSchema.shape.choices.element;
const effectsSchema = sceneTurnSchema.shape.effects;

/** The same schema with `who` narrowed to the characters at the table. */
const sceneTurnSchemaFor = (characterIds: readonly string[]) => {
  const ids = [...characterIds] as [string, ...string[]];
  return buildSceneTurnSchema(z.enum([...ids, BOTH]), z.enum(ids));
};

const rollResultSchema = rollRequestSchema.extend({
  modifier: z.number().int(),
  result: z.number().int(),
  total: z.number().int(),
  success: z.boolean(),
  critical: z.enum(['hit', 'miss']).nullable(),
});

const playerActionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('start') }),
  z.object({
    kind: z.literal('choice'),
    who: whoSchema,
    text: z.string().min(1),
    roll: rollResultSchema.optional(),
  }),
  z.object({
    kind: z.literal('custom'),
    who: whoSchema,
    text: z.string().min(1),
  }),
]);

const resolvedTurnSchema = sceneTurnSchema.extend({
  id: z.string(),
  background: artEntrySchema.optional(),
  figureArt: artEntrySchema.optional(),
  focus: z.string(),
  grade: z.string(),
  accent: z.string(),
});

const characterStateSchema = z.object({
  id: z.string().min(1),
  hp: z.number().int(),
  maxHp: z.number().int(),
  gold: z.number().int(),
  items: z.array(z.string()),
});

/** A person at the table and the character they picked. */
const playerSchema = z.object({
  name: z.string().min(1),
  characterId: z.string().min(1),
});

const historyEntrySchema = z.object({
  action: playerActionSchema,
  turn: resolvedTurnSchema,
});

const gameStateSchema = z.object({
  version: z.literal(2),
  campaignId: z.string(),
  model: z.enum(['claude-opus-5', 'claude-fable-5-1']),
  death: z.enum(['never', 'unlikely', 'possible']),
  createdAt: z.string(),
  updatedAt: z.string(),
  players: z.array(playerSchema).length(2),
  characters: z.array(characterStateSchema),
  memory: z.array(z.string()),
  /** npcId → art id, so faces stay put. */
  npcArt: z.record(z.string(), z.string()),
  history: z.array(historyEntrySchema),
});

const turnRequestSchema = z.object({
  campaignId: z.string(),
  model: gameStateSchema.shape.model,
  death: gameStateSchema.shape.death,
  players: z.array(playerSchema).length(2),
  characters: z.array(characterStateSchema),
  memory: z.array(z.string()),
  npcArt: z.record(z.string(), z.string()),
  /** Recent history, oldest first (the server trims further). */
  history: z.array(
    z.object({
      action: playerActionSchema,
      turn: sceneTurnSchema
        .pick({
          place: true,
          chapter: true,
          time: true,
          figure: true,
          beats: true,
          choices: true,
          summary: true,
        })
        .extend({ backgroundId: z.string().optional() }),
    }),
  ),
  action: playerActionSchema,
});

const turnResponseSchema = z.object({
  turn: resolvedTurnSchema,
  npcArt: z.record(z.string(), z.string()),
  usage: z
    .object({ input: z.number(), output: z.number(), cached: z.number() })
    .optional(),
});

type Atmosphere = z.infer<typeof atmosphereSchema>;
type Mood = z.infer<typeof moodSchema>;
type Beat = z.infer<typeof beatSchema>;
type Figure = z.infer<typeof figureSchema>;
type Who = z.infer<typeof whoSchema>;
type RollRequest = z.infer<typeof rollRequestSchema>;
type RollResult = z.infer<typeof rollResultSchema>;
type Choice = z.infer<typeof choiceSchema>;
type Effects = z.infer<typeof effectsSchema>;
type SceneTurn = z.infer<typeof sceneTurnSchema>;
type ResolvedTurn = z.infer<typeof resolvedTurnSchema>;
type PlayerAction = z.infer<typeof playerActionSchema>;
type CharacterState = z.infer<typeof characterStateSchema>;
type Player = z.infer<typeof playerSchema>;
type GameState = z.infer<typeof gameStateSchema>;
type TurnRequest = z.infer<typeof turnRequestSchema>;
type TurnResponse = z.infer<typeof turnResponseSchema>;

export {
  atmosphereSchema,
  beatSchema,
  BOTH,
  characterStateSchema,
  choiceSchema,
  figureSchema,
  gameStateSchema,
  moodSchema,
  playerActionSchema,
  playerSchema,
  resolvedTurnSchema,
  rollRequestSchema,
  rollResultSchema,
  sceneTurnSchema,
  sceneTurnSchemaFor,
  turnRequestSchema,
  turnResponseSchema,
  whoSchema,
};
export type {
  Atmosphere,
  Beat,
  CharacterState,
  Choice,
  Effects,
  Figure,
  GameState,
  Mood,
  Player,
  PlayerAction,
  ResolvedTurn,
  RollRequest,
  RollResult,
  SceneTurn,
  TurnRequest,
  TurnResponse,
  Who,
};
