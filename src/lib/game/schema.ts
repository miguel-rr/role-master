import { z } from 'zod';
import { artEntrySchema } from '@/data/art/schema';
import { soundEntrySchema } from '@/data/sound/schema';
import {
  CUES,
  PLACES,
  SITUATIONS,
  TENSIONS,
  TIMES,
  WEATHERS,
} from '@/data/sound/vocabulary';

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

/**
 * What the scene should sound like. "keep" is the normal answer: music and
 * ambience only move when the story does. Cues fire on a given beat.
 */
const soundDirectionSchema = z.object({
  music: z
    .object({
      situation: z.enum([...SITUATIONS, 'keep', 'none']).default('keep'),
      tension: z.enum(TENSIONS).default('low'),
    })
    .default({ situation: 'keep', tension: 'low' }),
  ambience: z
    .object({
      place: z.enum([...PLACES, 'keep', 'none']).default('keep'),
      time: z.enum(TIMES).default('day'),
      weather: z.enum(WEATHERS).default('clear'),
    })
    .default({ place: 'keep', time: 'day', weather: 'clear' }),
  cues: z
    .array(
      z.object({ beat: z.number().int().min(0).max(6), sfx: z.enum(CUES) }),
    )
    .max(4)
    .default([]),
});

/**
 * The sound block as the model writes it: three flat strings. Nested objects
 * and enums blow up the structured-output grammar ("compiled grammar is too
 * large"), so the vocabulary lives in the prompt and `sanitizeSound` parses:
 *   music:    "keep" | "none" | "<situation>" | "<situation> high"
 *   ambience: "keep" | "none" | "<place>" | "<place> night rain"
 *   cues:     ["1 door-wood-open", "3 thunder"]
 */
const looseSoundDirectionSchema = z.object({
  music: z.string().default('keep'),
  ambience: z.string().default('keep'),
  cues: z.array(z.string()).max(4).default([]),
});

type LooseSound = z.infer<typeof looseSoundDirectionSchema>;

const oneOf = <T extends string>(
  list: readonly T[],
  words: string[],
  fallback: T,
): T => words.find((w): w is T => list.includes(w as T)) ?? fallback;

/** Parses the flat strings; anything outside the vocabulary means "keep". */
const sanitizeSound = (loose: LooseSound): SoundDirection => {
  const words = (v: string) =>
    v
      .toLowerCase()
      .split(/[\s,;:/|]+/)
      .filter(Boolean);
  const m = words(loose.music);
  const a = words(loose.ambience);
  return {
    music: {
      situation: oneOf([...SITUATIONS, 'keep', 'none'] as const, m, 'keep'),
      tension: oneOf(TENSIONS, m, 'low'),
    },
    ambience: {
      place: oneOf([...PLACES, 'keep', 'none'] as const, a, 'keep'),
      time: oneOf(TIMES, a, 'day'),
      weather: oneOf(WEATHERS, a, 'clear'),
    },
    cues: loose.cues.flatMap((c) => {
      const w = words(c);
      const beat = Number(w.find((x) => /^\d$/.test(x)) ?? Number.NaN);
      const sfx = w.find((x) => (CUES as readonly string[]).includes(x));
      return sfx && Number.isFinite(beat)
        ? [
            {
              beat: Math.min(6, Math.max(0, beat)),
              sfx: sfx as (typeof CUES)[number],
            },
          ]
        : [];
    }),
  };
};

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
  S extends z.ZodType,
>(
  who: W,
  one: O,
  sound: S,
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
    sound,
  });
};

const sceneTurnSchema = buildSceneTurnSchema(
  whoSchema,
  whoSchema,
  soundDirectionSchema.default({
    music: { situation: 'keep', tension: 'low' },
    ambience: { place: 'keep', time: 'day', weather: 'clear' },
    cues: [],
  }),
);
const choiceSchema = sceneTurnSchema.shape.choices.element;
const effectsSchema = sceneTurnSchema.shape.effects;

/**
 * What the model is asked to produce: `who` narrowed to the table, sound as
 * plain strings (see `sanitizeSound`). Kept small on purpose: the API
 * compiles it into a grammar.
 */
const sceneTurnSchemaFor = (characterIds: readonly string[]) => {
  const ids = [...characterIds] as [string, ...string[]];
  return buildSceneTurnSchema(
    z.enum([...ids, BOTH]),
    z.enum(ids),
    looseSoundDirectionSchema,
  );
};

/** Same narrowing of `who`, strict sound: what the app holds internally. */
const strictSceneTurnSchemaFor = (characterIds: readonly string[]) => {
  const ids = [...characterIds] as [string, ...string[]];
  return buildSceneTurnSchema(
    z.enum([...ids, BOTH]),
    z.enum(ids),
    soundDirectionSchema,
  );
};

/** Narrows a model turn (loose sound) into the app's strict `SceneTurn`. */
const narrowTurn = (
  turn: z.infer<ReturnType<typeof sceneTurnSchemaFor>>,
): SceneTurn => ({ ...turn, sound: sanitizeSound(turn.sound) });

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

/** Concrete pieces for the desk, resolved on the server. */
const soundtrackSchema = z.object({
  /** Situation actually playing (after "keep" is resolved). */
  situation: z.string().optional(),
  /** Place of the ambience actually playing. */
  place: z.string().optional(),
  time: z.enum(TIMES).optional(),
  weather: z.enum(WEATHERS).optional(),
  /** "keep" leaves the desk alone; null fades the music out. */
  music: z.union([z.literal('keep'), soundEntrySchema.nullable()]),
  ambience: z.union([
    z.literal('keep'),
    z
      .object({
        beds: z.array(soundEntrySchema),
        spots: z.array(soundEntrySchema),
      })
      .nullable(),
  ]),
  cues: z.array(
    z.object({
      beat: z.number().int(),
      sfx: z.string(),
      entry: soundEntrySchema,
    }),
  ),
});

const resolvedTurnSchema = sceneTurnSchema.extend({
  id: z.string(),
  background: artEntrySchema.optional(),
  figureArt: artEntrySchema.optional(),
  focus: z.string(),
  grade: z.string(),
  accent: z.string(),
  soundtrack: soundtrackSchema.optional(),
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
        .extend({
          backgroundId: z.string().optional(),
          /** What was sounding, so "keep" and continuity work server-side. */
          sound: z
            .object({
              situation: z.string().optional(),
              place: z.string().optional(),
              time: z.enum(TIMES).optional(),
              weather: z.enum(WEATHERS).optional(),
              musicId: z.string().optional(),
            })
            .optional(),
        }),
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
type SoundDirection = z.infer<typeof soundDirectionSchema>;
type Soundtrack = z.infer<typeof soundtrackSchema>;
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
  narrowTurn,
  sanitizeSound,
  sceneTurnSchemaFor,
  soundDirectionSchema,
  soundtrackSchema,
  strictSceneTurnSchemaFor,
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
  SoundDirection,
  Soundtrack,
  TurnRequest,
  TurnResponse,
  Who,
};
