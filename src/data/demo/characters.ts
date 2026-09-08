/**
 * The design lab shows two of the presets. The roster itself lives in
 * `src/data/characters/presets.ts`.
 */
import {
  type Attack,
  CHARACTER_PRESETS,
  type CharacterPreset,
  type InventoryItem,
} from '@/data/characters/presets';

type DemoCharacter = CharacterPreset;

const DEMO_CHARACTERS: CharacterPreset[] = CHARACTER_PRESETS.slice(0, 2);

export { DEMO_CHARACTERS };
export type { Attack, DemoCharacter, InventoryItem };
