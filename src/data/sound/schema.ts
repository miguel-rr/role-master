import { z } from 'zod';

/**
 * One piece of audio in the library. Files live under `public/audio`,
 * transcoded to Opus (WebM) with an AAC fallback, loudness-normalised at
 * sync time so the mixer means the same thing for every piece.
 */

const soundLayerSchema = z.enum(['music', 'bed', 'spot', 'sfx', 'ui']);

const soundTagsSchema = z.object({
  /** Music: what is happening ("tavern", "combat-heavy", "travel"). */
  situations: z.array(z.string()).default([]),
  /** Music and beds: which of the stage moods it suits. */
  moods: z.array(z.string()).default([]),
  /** Beds and spots: where it belongs ("tavern", "forest", "cave"). */
  places: z.array(z.string()).default([]),
  /** Beds and spots: "day" | "night"; empty means any. */
  time: z.array(z.enum(['day', 'night'])).default([]),
  /** Beds and spots: "rain" | "storm" | "wind" | "snow"; empty means any. */
  weather: z.array(z.string()).default([]),
  /** Sfx and ui: the cue name the narrator or the interface uses. */
  cue: z.string().optional(),
});

const soundEntrySchema = z.object({
  id: z.string(),
  layer: soundLayerSchema,
  /** Opus/WebM, served from public. */
  src: z.string(),
  /** AAC fallback for browsers without Opus. */
  srcFallback: z.string().optional(),
  /** Seconds. */
  duration: z.number(),
  /** Gain in dB applied on top of the normalised file (usually 0). */
  gain: z.number().default(0),
  /** Measured integrated loudness before normalisation, for the record. */
  lufs: z.number().optional(),
  title: z.string(),
  artist: z.string(),
  license: z.string(),
  source: z.object({ site: z.string(), page: z.string() }),
  tags: soundTagsSchema,
});

const soundManifestSchema = z.object({
  collection: z.string(),
  generatedAt: z.string(),
  entries: z.array(soundEntrySchema),
});

type SoundLayer = z.infer<typeof soundLayerSchema>;
type SoundTags = z.infer<typeof soundTagsSchema>;
type SoundEntry = z.infer<typeof soundEntrySchema>;
type SoundManifest = z.infer<typeof soundManifestSchema>;

export {
  soundEntrySchema,
  soundLayerSchema,
  soundManifestSchema,
  soundTagsSchema,
};
export type { SoundEntry, SoundLayer, SoundManifest, SoundTags };
