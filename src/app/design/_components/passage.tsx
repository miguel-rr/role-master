import { ArtImage } from '@/components/theme/art';
import { Fleuron } from '@/components/theme/ornaments';
import { Paper } from '@/components/theme/paper';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { ArtEntry } from '@/data/art/schema';

type PassageProps = {
  scene: ArtEntry | undefined;
  npc: ArtEntry | undefined;
  variant: 'manual' | 'beyond';
};

const CHAPTER = 'Capítulo II';
const TITLE = 'La posada del Ciervo Dormido';

const P1 =
  'Phandalin huele a serrín mojado y a humo de turba. Habéis tardado tres días en bajar desde el Camino Alto y la ciudad os recibe como reciben las ciudades pequeñas a los forasteros: mirando de reojo y sin dejar de hacer lo que estaban haciendo. La posada es la única casa de dos plantas de la calle, y de la chimenea sale un humo espeso que promete estofado.';
const P2 =
  'Dentro, media docena de mineros callan cuando abrís la puerta. No es hostilidad. Es cansancio. El posadero, un hombre ancho con las mangas remangadas hasta el codo, deja de secar una jarra y os mide con la mirada. Se detiene un instante más en la espada de Bram y otro en las manos de Nissa, que ya están donde no deberían estar.';
const QUOTE =
  '—Bienvenidos al Ciervo. Dos camas, cena caliente y nada de preguntas cuestan cinco piezas de plata. Con preguntas, sale más caro. —Deja la jarra—. Y si venís por lo del tablón, primero comed. Los muertos no pagan.';
const READ_ALOUD =
  'En la pared del fondo, junto a la chimenea, cuelga un tablón de anuncios con tres pergaminos clavados con dagas oxidadas. El más nuevo aún gotea cera roja del sello del Alcaide.';

/** The chapter opening of a 5e book, as a turn of narration. */
const PassageManual = ({ scene, npc }: Omit<PassageProps, 'variant'>) => (
  <Paper className="mx-auto w-full max-w-[52rem] overflow-hidden rounded-[3px]">
    <div className="relative h-72 w-full md:h-96">
      <ArtImage
        alt=""
        art={scene}
        className="h-full w-full"
        position="50% 45%"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(238,229,206,0) 55%, rgba(238,229,206,0.6) 82%, #eee5ce 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 80px rgba(60,40,10,0.35)',
        }}
      />
    </div>

    <div className="px-8 pb-10 md:px-14">
      <div className="relative -mt-10 text-center">
        <div className="font-caps text-ink-muted text-lg tracking-widest">
          {CHAPTER}
        </div>
        <h2 className="mt-1 h-manual text-4xl md:text-5xl">{TITLE}</h2>
        <TaperedRule className="mx-auto mt-3 h-3 w-72 text-rule-red" />
      </div>

      <div className="mt-8 columns-1 gap-8 text-[1.05rem] leading-[1.45] md:columns-2 md:text-[1.02rem]">
        <p className="dropcap">{P1}</p>
        <p className="mt-4">{P2}</p>

        <div className="break-inside-avoid">
          <figure className="my-5 flex items-start gap-4">
            <div className="frame-brass h-20 w-20 shrink-0 overflow-hidden rounded-full outline-gold-page">
              <ArtImage
                alt="Toblen Piedracolina"
                art={npc}
                className="h-full w-full"
              />
            </div>
            <figcaption className="pt-1">
              <div className="font-caps text-maroon text-xl leading-none">
                Toblen Piedracolina
              </div>
              <div className="font-scaly text-ink-muted text-sm italic">
                Posadero del Ciervo Dormido · humano · «no me gustan los líos»
              </div>
            </figcaption>
          </figure>

          <p className="italic">{QUOTE}</p>
        </div>

        <aside className="paper paper-light my-6 break-inside-avoid px-5 py-4 font-scaly text-[0.95rem] leading-snug shadow-none">
          <div className="-mx-5 -mt-4 mb-3 h-[3px] bg-maroon" />
          <p>{READ_ALOUD}</p>
          <div className="-mx-5 mt-3 -mb-4 h-[3px] bg-maroon" />
        </aside>

        <p>
          Bram nota que uno de los mineros no ha dejado de mirar la puerta desde
          que entrasteis. Nissa, en cambio, ha contado cuatro bolsas de monedas
          a la vista y una quinta, más gorda, bajo el mostrador.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center">
        <Fleuron className="h-6 w-48 text-gold-page" />
      </div>

      <div className="paper paper-stat mx-auto mt-6 flex max-w-md items-center gap-4 rounded px-4 py-3 shadow-sheet-soft">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-maroon-2 font-nodesto text-2xl text-maroon-2">
          20
        </div>
        <div className="font-scaly">
          <div className="text-maroon-2 text-xs uppercase tracking-wider">
            Tirada pedida · Nissa
          </div>
          <div className="font-bold text-ink">
            Percepción (Sabiduría) · CD 13
          </div>
          <div className="text-ink-muted text-sm">
            Para fijarte en lo que el minero no quiere que veas.
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between font-caps text-gold-page text-sm">
        <span>Phandalin</span>
        <span>17</span>
      </div>
    </div>
  </Paper>
);

/** The same turn in the dark "Beyond" register, tuned for a TV. */
const PassageBeyond = ({ scene, npc }: Omit<PassageProps, 'variant'>) => (
  <article className="mx-auto w-full max-w-[52rem] overflow-hidden rounded-lg border border-charcoal-700 bg-charcoal-800 shadow-sheet">
    <div className="relative h-64 md:h-80">
      <ArtImage
        alt=""
        art={scene}
        className="h-full w-full"
        position="50% 45%"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(35,43,47,0) 40%, rgba(35,43,47,0.85) 85%, #232b2f 100%)',
        }}
      />
      <div className="absolute right-0 bottom-4 left-0 px-8">
        <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
          {CHAPTER}
        </div>
        <h2 className="font-nodesto text-4xl text-brass-pale uppercase md:text-5xl">
          {TITLE}
        </h2>
      </div>
    </div>
    <TaperedRule className="h-1 w-full text-brand-500" variant="stat" />
    <div className="px-8 py-7 font-book text-[1.15rem] text-parchment-text leading-[1.55]">
      <p>{P1}</p>
      <p className="mt-4">{P2}</p>
      <div className="my-5 flex items-center gap-3 border-brass/40 border-l-2 pl-4">
        <div className="frame-brass h-14 w-14 shrink-0 overflow-hidden rounded-full">
          <ArtImage alt="Toblen" art={npc} className="h-full w-full" />
        </div>
        <p className="text-white italic">{QUOTE}</p>
      </div>
      <p className="rounded border border-charcoal-700 bg-charcoal-900/70 px-4 py-3 font-scaly text-[1rem] text-charcoal-200">
        {READ_ALOUD}
      </p>
    </div>
  </article>
);

const Passage = (props: PassageProps) =>
  props.variant === 'manual' ? (
    <PassageManual {...props} />
  ) : (
    <PassageBeyond {...props} />
  );

export { Passage };
