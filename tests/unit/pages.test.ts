import { describe, expect, it } from 'vitest';
import { chunk, paginate } from '@/lib/game/pages';

describe('pages', () => {
  const long =
    'La puerta se cierra a vuestra espalda y la lluvia se queda fuera, con el frío. Dentro huele a estofado y a leña húmeda. Media docena de mineros levantan la vista el tiempo justo para decidir que no sois un problema, y vuelven a sus jarras. El posadero deja de secar un vaso. Os mide de arriba abajo, se detiene un instante en la espada y otro en las manos, que ya están donde no deberían. «Dos camas», dice.';
  it('keeps short text whole and splits long text at sentence ends', () => {
    expect(chunk('Corto.')).toEqual(['Corto.']);
    const parts = chunk(long, 160);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(160 * 1.25);
    for (const p of parts.slice(0, -1)) expect(p).toMatch(/[.!?…»]$/);
    expect(parts.join(' ')).toBe(long);
  });
  it('numbers pages within their beat and keeps the beat index', () => {
    const pages = paginate(
      [
        { kind: 'narration', text: long },
        { kind: 'line', text: '—Hola.' },
      ],
      160,
    );
    const n = pages.filter((p) => p.beat === 0);
    expect(n[0]?.first).toBe(true);
    expect(n.every((p) => p.count === n.length)).toBe(true);
    expect(pages.at(-1)).toMatchObject({
      beat: 1,
      kind: 'line',
      first: true,
      index: 0,
      count: 1,
    });
  });
});
