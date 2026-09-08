import { describe, expect, it } from 'vitest';
import { CUES } from '@/data/sound/vocabulary';
import { CUE_WORDS, cueNamed } from '@/lib/sound/cue-words';

describe('cue words', () => {
  it('covers every scene cue with Spanish words', () => {
    for (const c of CUES) expect(CUE_WORDS[c], c).toBeDefined();
  });
  it('recognises the word as the typewriter reveals it', () => {
    expect(cueNamed('laugh', 'Uno de los mineros suelta una ri')).toBe(false);
    expect(cueNamed('laugh', 'Uno de los mineros suelta una risa corta')).toBe(
      true,
    );
    expect(
      cueNamed('door-wood-close', 'La puerta se cierra a vuestra espalda'),
    ).toBe(true);
    expect(cueNamed('thunder', 'Fuera, la lluvia arrecia')).toBe(false);
  });
});
