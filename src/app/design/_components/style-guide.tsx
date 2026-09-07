import { Caps } from '@/components/theme/display';
import { Paper } from '@/components/theme/paper';
import { TaperedRule } from '@/components/theme/tapered-rule';

const MANUAL = [
  ['Pergamino', '#eee5ce'],
  ['Lectura', '#f7f2e5'],
  ['Estadísticas', '#fdf1dc'],
  ['Nota', '#e0e5c1'],
  ['Tinta', '#1e1a15'],
  ['Granate', '#58180d'],
  ['Granate 2', '#822000'],
  ['Filete rojo', '#9c2b1b'],
  ['Oro', '#c9ad6a'],
  ['Cinta', '#e69a28'],
] as const;

const BEYOND = [
  ['Carbón', '#12181c'],
  ['Panel', '#232b2f'],
  ['Panel 2', '#374045'],
  ['Barra', '#090809'],
  ['Rojo marca', '#e40712'],
  ['Rojo hover', '#c50009'],
  ['Latón', '#c3a76e'],
  ['Oro', '#c19429'],
  ['Subtítulo', '#afa47a'],
  ['Cobre', '#de8435'],
] as const;

const Swatch = ({
  name,
  hex,
  dark,
}: {
  name: string;
  hex: string;
  dark?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <div
      className={`h-14 rounded-sm ${dark ? 'border border-charcoal-700' : 'border border-gold-page/40'}`}
      style={{ background: hex }}
    />
    <div
      className={`font-condensed text-[0.7rem] uppercase tracking-wider ${dark ? 'text-charcoal-300' : 'text-ink-muted'}`}
    >
      {name}
    </div>
    <div
      className={`font-mono text-[0.7rem] ${dark ? 'text-charcoal-500' : 'text-ink-muted/70'}`}
    >
      {hex}
    </div>
  </div>
);

/** Palette and type specimens for both registers. */
const StyleGuide = () => (
  <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
    <Paper className="rounded-[3px] p-8">
      <div className="font-caps text-ink-muted text-sm tracking-widest">
        Registro
      </div>
      <h3 className="h-manual h-manual-rule text-3xl">Manual</h3>
      <div className="mt-5 grid grid-cols-5 gap-3">
        {MANUAL.map(([n, h]) => (
          <Swatch hex={h} key={n} name={n} />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        <div className="font-nodesto text-5xl text-maroon uppercase">
          <Caps>Nodesto · Títulos de portada</Caps>
        </div>
        <div className="font-caps text-3xl text-maroon">
          Mr Eaves Small Caps · Encabezados
        </div>
        <p className="font-book text-[1.05rem] leading-relaxed">
          Bookinsanity · Cuerpo de texto. La tipografía del manual tiene mucha
          mancha y una x alta; aguanta bien el pergamino y la lectura larga
          desde el sofá.
        </p>
        <p className="font-scaly text-[0.95rem]">
          Scaly Sans · Tablas, notas, fichas y bloques de estadísticas. Con
          versalitas propias para las cabeceras de tabla.
        </p>
        <p className="dropcap font-book text-[1.05rem] leading-relaxed">
          Solbera para la capitular de cada capítulo, con el degradado bronce de
          los libros, y la primera línea en versalitas.
        </p>
        <TaperedRule className="h-3 w-64 text-rule-red" />
      </div>
    </Paper>

    <div className="rounded-lg border border-charcoal-700 bg-charcoal-800 p-8">
      <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
        Registro
      </div>
      <h3 className="font-nodesto text-3xl text-brass-pale uppercase">
        Beyond
      </h3>
      <div className="mt-5 grid grid-cols-5 gap-3">
        {BEYOND.map(([n, h]) => (
          <Swatch dark hex={h} key={n} name={n} />
        ))}
      </div>
      <div className="mt-8 space-y-4">
        <div className="font-nodesto text-5xl text-white uppercase">
          Nodesto · Titulares héroe
        </div>
        <div className="label-beyond text-charcoal-300 text-sm">
          Roboto Condensed · Etiquetas de interfaz y botones
        </div>
        <p className="font-book text-[1.1rem] text-parchment-text leading-relaxed">
          Bookinsanity en tono pergamino sobre carbón para la lectura en modo
          TV: el mismo cuerpo del manual, sin el papel.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-beyond px-5 py-2.5 uppercase" type="button">
            Acción principal
          </button>
          <button className="btn-ghost px-5 py-2.5 uppercase" type="button">
            Secundaria
          </button>
          <span className="inline-flex items-center rounded-full border border-brass/50 px-3 font-condensed text-brass text-xs uppercase tracking-wider">
            Etiqueta
          </span>
        </div>
        <TaperedRule className="h-1 w-full text-brand-500" variant="stat" />
        <p className="font-scaly text-charcoal-400 text-sm">
          Los grises son la escala real de dndbeyond.com (900 → 50); los rojos y
          oros, sus tokens de marca. Ver <code>.claude/design-system.md</code>.
        </p>
      </div>
    </div>
  </div>
);

export { StyleGuide };
