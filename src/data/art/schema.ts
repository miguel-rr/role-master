import { z } from 'zod';

/**
 * One illustration in the art catalogue. Produced by `scripts/art/sync.ts`,
 * consumed by the UI and by the narrator's prompt (which only ever sees
 * tags, never file names).
 */
const artSiteSchema = z.enum(['bg3', 'fr', 'kingmaker', 'commons']);

const artEntrySchema = z.object({
  /** Stable id: `<collection>/<slug>`. */
  id: z.string(),
  /** Public path, e.g. `/art/items/longsword.webp`. */
  src: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Human title from the source (file name without extension). */
  title: z.string(),
  /** Normalised tags: race, gender, class, item type, place, mood… */
  tags: z.array(z.string()),
  /** Raw source categories (trimmed), kept to re-tag without re-downloading. */
  cats: z.array(z.string()).default([]),
  artist: z.string().optional(),
  source: z.object({
    site: artSiteSchema,
    /** Page on the source wiki, for credit and provenance. */
    page: z.string(),
  }),
});

const artManifestSchema = z.object({
  collection: z.string(),
  generatedAt: z.string(),
  entries: z.array(artEntrySchema),
});

type ArtEntry = z.infer<typeof artEntrySchema>;
type ArtManifest = z.infer<typeof artManifestSchema>;
type ArtSite = z.infer<typeof artSiteSchema>;

export { artEntrySchema, artManifestSchema, artSiteSchema };
export type { ArtEntry, ArtManifest, ArtSite };
