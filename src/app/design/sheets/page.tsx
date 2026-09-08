import type { Metadata } from 'next';
import { CharacterSheet } from '@/components/sheet/character-sheet';
import { buildSheetModel } from '@/components/sheet/sheet-model';
import { byId, findItem } from '@/data/art/catalog';
import type { ArtEntry } from '@/data/art/schema';
import { CHARACTER_PRESETS, presetById } from '@/data/characters/presets';
import { SheetCodex } from './_components/sheet-codex';
import { buildSheetModel as buildLegacyModel } from './_components/sheet-data';
import { SheetRagnarok } from './_components/sheet-ragnarok';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Fichas para la tele',
};

const PROPOSALS = [
  {
    id: 'clasica',
    n: '01',
    title: 'La ficha oficial, afinada',
    intro:
      'La misma hoja de 5e, reconstruida sobre una sola retícula: seis características en fila, tres columnas de anchura fija, cada número en su celda, letra que crece con la pantalla. Nada se sale.',
  },
  {
    id: 'oscura',
    n: '02',
    title: 'La misma, en oscuro',
    intro:
      'Idéntica estructura sobre carbón, con reglas de latón y texto pergamino: para leer de noche en el salón sin que la hoja deslumbre.',
  },
  {
    id: 'codice',
    n: '03',
    title: 'El códice',
    intro:
      'La ficha contada como un capítulo: el retrato entra por la izquierda, el nombre va como título, y lo que hace falta en un combate está en una sola franja grande. Habilidades agrupadas por característica; rasgos como entradas; la personalidad, citada.',
  },
  {
    id: 'runica',
    n: '04',
    title: 'Piedra rúnica',
    intro:
      'Lo que hacen los menús de God of War Ragnarök, traducido a una ficha: piedra negra azulada, capitales plateadas espaciadas, una sola franja blanca para lo seleccionado, oro solo en el número que importa, reglas finas rematadas en rombo y el personaje de pie a la derecha.',
  },
];

const SheetsPage = () => {
  const c = presetById('dagna') ?? CHARACTER_PRESETS[0];
  if (!c) return null;
  const itemArt = new Map<string, ArtEntry | undefined>();
  for (const it of c.inventory) itemArt.set(it.icon, findItem(it.icon));
  const m = buildSheetModel(c, byId(c.portraitId), itemArt);
  const legacy = buildLegacyModel(c, byId(c.portraitId), itemArt);
  return (
    <main className="theme-beyond min-h-screen bg-charcoal-950 pb-24 text-white">
      <div className="mx-auto max-w-[1800px] px-6 pt-10">
        <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
          Propuestas
        </div>
        <h1 className="mt-1 font-nodesto text-5xl text-brass-pale uppercase leading-none">
          Fichas para la tele
        </h1>
        <p className="mt-3 max-w-3xl font-book text-[1.05rem] text-parchment-text leading-relaxed">
          Cuatro maneras de enseñar la misma ficha (Dagna) desde el sofá. Cada
          una va dentro de un marco 16:9 al ancho de la ventana: ponla a
          pantalla completa en la tele para juzgar el tamaño del texto.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {PROPOSALS.map((p) => (
            <a
              className="btn-ghost px-3 py-1.5 text-xs uppercase"
              href={`#${p.id}`}
              key={p.id}
            >
              {p.n} · {p.title}
            </a>
          ))}
        </nav>
      </div>
      {PROPOSALS.map((p) => (
        <section
          className="mx-auto mt-16 max-w-[1800px] px-6"
          id={p.id}
          key={p.id}
        >
          <div className="mb-4 flex items-baseline gap-4">
            <span className="font-nodesto text-4xl text-brand-400">{p.n}</span>
            <h2 className="font-caps text-3xl text-brass-pale">{p.title}</h2>
          </div>
          <p className="mb-5 max-w-3xl font-book text-[1.02rem] text-parchment-text leading-relaxed">
            {p.intro}
          </p>
          <div className="overflow-hidden rounded-lg border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            {p.id === 'clasica' ? (
              <CharacterSheet m={m} player="Loncio" tone="paper" />
            ) : null}
            {p.id === 'oscura' ? (
              <CharacterSheet m={m} player="Loncio" />
            ) : null}
            {p.id === 'codice' ? <SheetCodex m={legacy} /> : null}
            {p.id === 'runica' ? <SheetRagnarok m={legacy} /> : null}
          </div>
        </section>
      ))}
    </main>
  );
};

export default SheetsPage;
