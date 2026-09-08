import { presetById } from '@/data/characters/presets';
import { BOTH, type SceneTurn, type TurnRequest } from './schema';

/**
 * A scripted narrator that costs nothing: a short, complete story with
 * several places, an NPC who talks, a creature reveal, checks that branch on
 * success and failure, damage, gold, items and an ending. It exercises every
 * component the real narrator drives, so the game can be tested end to end
 * without touching the API. Enabled with MOCK_NARRATOR=1.
 */

const short = (id: string) => presetById(id)?.shortName ?? id;

/** The last resolved roll, if the players just rolled. */
const lastRoll = (req: TurnRequest) =>
  req.action.kind === 'choice' ? (req.action.roll ?? null) : null;

const lastWho = (req: TurnRequest) =>
  req.action.kind === 'start' ? BOTH : req.action.who;

const outcomeLine = (req: TurnRequest): string => {
  const roll = lastRoll(req);
  if (!roll) return '';
  const who = lastWho(req);
  const name = who === BOTH ? 'Los dos' : short(who);
  if (roll.critical === 'hit')
    return `${name} lo borda: un veinte natural en ${roll.skill}, de esos que se cuentan en la taberna durante años.`;
  if (roll.critical === 'miss')
    return `${name} saca un uno en ${roll.skill}. El máster sonríe, y no es buena señal.`;
  return roll.success
    ? `${name} supera la tirada de ${roll.skill} con un ${roll.total} contra ${roll.dc}.`
    : `${name} falla la tirada de ${roll.skill}: ${roll.total} contra ${roll.dc}.`;
};

const custom = (req: TurnRequest): string =>
  req.action.kind === 'custom'
    ? `«${req.action.text}», dice ${req.action.who === BOTH ? 'la compañía' : short(req.action.who)}. El máster se toma un segundo y mueve las piezas.`
    : '';

/** Turn N of the scripted story, given the table's two character ids. */
const mockTurn = (req: TurnRequest): SceneTurn => {
  const [a = 'bram', b = 'nissa'] = req.players.map((p) => p.characterId);
  const n = req.history.length;
  const roll = lastRoll(req);
  const hit = roll?.success ?? true;
  const who = lastWho(req);
  const hurt = who === BOTH ? a : who;
  const lead = [custom(req), outcomeLine(req)].filter(Boolean).join(' ');
  const opening = lead ? `${lead} ` : '';

  switch (n) {
    case 0:
      return {
        place: 'El Ciervo Dormido',
        chapter: 'Prólogo · Phandalin',
        time: 'Anochecer · Lluvia fina',
        sceneTags: ['taverns', 'inns'],
        atmosphere: 'embers',
        mood: 'warm',
        figure: {
          kind: 'character',
          npcId: 'toblen',
          name: 'Toblen Piedracolina',
          role: 'Posadero',
          race: 'human',
          gender: 'male',
          tags: ['innkeeper', 'merchant'],
        },
        beats: [
          {
            kind: 'narration',
            text: `La puerta se cierra a vuestra espalda y la lluvia se queda fuera, con el frío. Dentro huele a estofado y a leña húmeda. Media docena de mineros levantan la vista el tiempo justo para decidir que ${short(a)} y ${short(b)} no son un problema, y vuelven a sus jarras.`,
          },
          {
            kind: 'line',
            text: '—Dos camas, cena caliente y nada de preguntas cuestan cinco piezas de plata. Con preguntas, sale más caro. Y si venís por lo del tablón, primero comed. Los muertos no pagan.',
          },
          {
            kind: 'narration',
            text: 'Deja el trapo sobre la barra y espera. En la pared del fondo, el tablón del Alcaide tiene tres papeles clavados y uno arrancado.',
          },
        ],
        choices: [
          {
            label: 'Pagar sin regatear y preguntar por el tablón.',
            who: a,
            roll: { skill: 'Persuasión', dc: 12, advantage: 'none' },
          },
          {
            label: 'Sentarse junto al minero que no deja de mirar la puerta.',
            who: b,
            roll: { skill: 'Perspicacia', dc: 11, advantage: 'none' },
          },
          {
            label: 'Pedir estofado para los dos y escuchar.',
            who: BOTH,
            hint: 'Sin tirada',
          },
        ],
        effects: { hp: [], gold: [], items: [] },
        memory: ['Toblen cobra cinco piezas de plata por cama y cena.'],
        summary: 'La compañía llega al Ciervo Dormido bajo la lluvia.',
        sceneEnds: false,
      };
    case 1:
      return {
        place: 'El Ciervo Dormido',
        chapter: 'Prólogo · Phandalin',
        time: 'Noche · La lluvia arrecia',
        sceneTags: ['taverns', 'inns'],
        atmosphere: 'embers',
        mood: hit ? 'gold' : 'dark',
        figure: {
          kind: 'character',
          npcId: 'toblen',
          name: 'Toblen Piedracolina',
          role: 'Posadero',
          race: 'human',
          gender: 'male',
          tags: ['innkeeper'],
        },
        beats: [
          {
            kind: 'narration',
            text: `${opening}${
              hit
                ? 'Toblen mira las monedas, os mira, y algo en su cara se afloja medio dedo.'
                : 'Toblen recoge las monedas con dos dedos, como si pudieran morder, y señala una mesa junto a la ventana.'
            }`,
          },
          {
            kind: 'line',
            text: hit
              ? '—El de arriba es del Alcaide: la mantícora de la Colina Umbrage. Cincuenta de oro por su cabeza, y la partera de allá arriba lleva una semana sin bajar al pueblo. Si vais, llevadle pan.'
              : '—Cinco de plata compran cama y estofado, no compran conversación. El tablón está ahí. Sabéis leer, supongo.',
          },
          {
            kind: 'narration',
            text: 'El papel del Alcaide, escrito con una letra de escribano nervioso, promete cincuenta piezas de oro por acabar con la bestia que asedia el molino de la Colina Umbrage. Está firmado por Harbin Wester. Alguien ha añadido debajo, a carboncillo: «Y otras diez si volvéis».',
          },
        ],
        choices: [
          {
            label:
              'Aceptar el encargo y salir al amanecer hacia la Colina Umbrage.',
            who: BOTH,
            hint: 'Un día de camino',
          },
          {
            label:
              'Antes de dormir, revisar el equipo y repartir las pociones.',
            who: BOTH,
            hint: 'Abre la ficha y el inventario',
          },
          {
            label: 'Colarse en la cocina y llenar la bolsa de provisiones.',
            who: b,
            roll: { skill: 'Sigilo', dc: 10, advantage: 'none' },
          },
        ],
        effects: {
          hp: [],
          gold: hit ? [] : [{ who: hurt, delta: -1 }],
          items: [],
        },
        memory: [
          'El Alcaide Harbin Wester paga 50 po por la mantícora de la Colina Umbrage.',
          'Adabra Gwynn, la partera de la Colina Umbrage, lleva una semana sin bajar al pueblo.',
        ],
        summary: hit
          ? 'Toblen habla: hay una mantícora en la Colina Umbrage y una recompensa.'
          : 'Toblen no suelta prenda; el tablón sí: una mantícora en la Colina Umbrage.',
        sceneEnds: true,
      };
    case 2:
      return {
        place: 'Sendero de Triboar',
        chapter: 'Capítulo I · La Colina Umbrage',
        time: 'Amanecer · Niebla baja',
        sceneTags: ['roads', 'forests'],
        atmosphere: 'fog',
        mood: 'cold',
        figure: { kind: 'none' },
        beats: [
          {
            kind: 'narration',
            text: `${opening}Salís de Phandalin cuando el pueblo aún duerme. El sendero sube entre robles pelados y la niebla os llega a la cintura, y luego al pecho. A media mañana, ${short(a)} encuentra en el barro una huella que no es de lobo: cuatro dedos, garras largas, y el surco de una cola que arrastra.`,
          },
          {
            kind: 'narration',
            text: 'La colina aparece al fin sobre la niebla, con el molino de piedra en la cima y las aspas paradas. Algo ha arrancado la puerta del granero y la ha dejado a veinte pasos, como quien deja un juguete.',
          },
        ],
        choices: [
          {
            label: 'Subir campo a través, pegados al muro de piedra.',
            who: b,
            roll: { skill: 'Sigilo', dc: 12, advantage: 'none' },
          },
          {
            label: 'Rodear la colina y buscar el nido de la bestia.',
            who: a,
            roll: { skill: 'Supervivencia', dc: 13, advantage: 'advantage' },
          },
          {
            label: 'Llamar a la puerta del molino a gritos.',
            who: BOTH,
            hint: 'Arriesgado',
          },
        ],
        effects: {
          hp: [],
          gold: [],
          items: [{ who: a, add: 'Huella de yeso de la bestia' }],
        },
        memory: [
          'La bestia de la Colina Umbrage deja huellas de cuatro dedos y cola.',
        ],
        summary:
          'La compañía sube por el Sendero de Triboar hasta la Colina Umbrage.',
        sceneEnds: false,
      };
    case 3:
      return {
        place: 'Colina Umbrage',
        chapter: 'Capítulo I · La Colina Umbrage',
        time: 'Mediodía · Cielo blanco',
        sceneTags: ['mountains', 'ruins'],
        atmosphere: 'ash',
        mood: 'blood',
        figure: {
          kind: 'creature',
          npcId: 'manticora-umbrage',
          name: 'Mantícora',
          role: 'Bestia de la colina',
          monsterTag: 'manticores',
        },
        beats: [
          {
            kind: 'narration',
            text: `${opening}${
              hit
                ? 'Llegáis al pie del molino sin que nada se mueva. Demasiado sin que nada se mueva.'
                : `Una piedra rueda bajo la bota de ${short(hurt)} y el eco baja por la ladera como una campana.`
            }`,
          },
          {
            kind: 'narration',
            reveal: true,
            text: 'Del tejado del molino se desprende una sombra del tamaño de un carro. Cuerpo de león, alas de murciélago y una cara casi humana que sonríe con demasiados dientes. La cola se alza, erizada de púas, y la primera sale silbando hacia vosotros.',
          },
          {
            kind: 'narration',
            text: hit
              ? 'La púa se clava en la madera de la puerta, a un palmo de la cabeza de ' +
                `${short(b)}. La mantícora aterriza en el patio y os mide. Habla, con una voz que parece salir de un pozo: «Comida que anda. Qué considerada».`
              : `La púa alcanza a ${short(hurt)} en el hombro y lo empuja contra el muro. Duele como una quemadura. La mantícora aterriza en el patio, relamiéndose, y habla con una voz de pozo: «Comida que anda. Qué considerada».`,
          },
        ],
        choices: [
          {
            label: 'Cargar contra ella antes de que vuelva a alzar el vuelo.',
            who: a,
            roll: { skill: 'Iniciativa', dc: 12, advantage: 'none' },
          },
          {
            label: 'Hablar con ella. Si habla, negocia.',
            who: b,
            roll: { skill: 'Persuasión', dc: 14, advantage: 'disadvantage' },
          },
          {
            label: 'Meterse en el molino y atrancar la puerta.',
            who: BOTH,
            hint: 'Retirada',
          },
        ],
        effects: {
          hp: hit ? [] : [{ who: hurt, delta: -4 }],
          gold: [],
          items: [],
        },
        memory: [
          'La mantícora de la Colina Umbrage habla y disfruta haciéndolo.',
        ],
        summary: 'La mantícora ataca en el patio del molino.',
        sceneEnds: false,
      };
    case 4:
      return {
        place: 'Molino de la Colina Umbrage',
        chapter: 'Capítulo I · La Colina Umbrage',
        time: 'Tarde · El viento cambia',
        sceneTags: ['buildings', 'mountains'],
        atmosphere: 'dust',
        mood: hit ? 'gold' : 'dark',
        figure: {
          kind: 'character',
          npcId: 'adabra',
          name: 'Adabra Gwynn',
          role: 'Partera y acólita de Chauntea',
          race: 'human',
          gender: 'female',
          tags: ['priest', 'commoner', 'elder'],
        },
        beats: [
          {
            kind: 'narration',
            text: `${opening}${
              hit
                ? 'La mantícora recula, sorprendida por primera vez en mucho tiempo, y decide que hay presas más fáciles al otro lado de la colina. Se alza con dos golpes de ala y se pierde hacia el este, dejando atrás una púa clavada y una risa.'
                : `La bestia golpea una vez más antes de irse: ${short(hurt)} recibe un zarpazo que le abre el brazo. Luego, con la pereza de quien deja el postre para otro día, la mantícora se eleva y se pierde hacia el este.`
            }`,
          },
          {
            kind: 'narration',
            text: 'La puerta del molino se abre un dedo. Luego del todo. Una mujer menuda, de pelo gris y manos manchadas de harina y de algo más oscuro, os mira de arriba abajo como a dos partos difíciles.',
          },
          {
            kind: 'line',
            text: '—Una semana. Una semana con esa cosa en el tejado y en el pueblo mandan a dos. Entrad antes de que vuelva. Tengo caldo, vendas y una poción que os pienso cobrar.',
          },
          {
            kind: 'narration',
            text: `Dentro, mientras os venda, Adabra os cuenta que la mantícora no vino sola: huía de algo. Algo blanco, grande, que cruzó el cielo hacia el Pico Escarcha hace un mes. Al despediros pone una poción en la mano de ${short(b)} y unas monedas en la de ${short(a)}: «Para el Alcaide, decidle que estoy viva. Y que la próxima vez mande a cuatro».`,
          },
        ],
        choices: [
          {
            label: 'Volver a Phandalin con la noticia y cobrar la recompensa.',
            who: BOTH,
            hint: 'Fin del capítulo',
          },
          {
            label: 'Curar las heridas antes de partir.',
            who: a,
            roll: { skill: 'Medicina', dc: 10, advantage: 'none' },
          },
        ],
        effects: {
          hp: hit ? [] : [{ who: hurt, delta: -3 }],
          gold: [{ who: a, delta: 25 }],
          items: [{ who: b, add: 'Poción de curación de Adabra' }],
        },
        memory: [
          'Adabra Gwynn está viva y debe 25 po al Alcaide por su rescate.',
          'La mantícora huía de algo blanco y grande que voló hacia el Pico Escarcha.',
        ],
        summary: 'Adabra está viva; la mantícora huye hacia el este.',
        sceneEnds: true,
      };
    default:
      return {
        place: 'Phandalin',
        chapter: 'Epílogo · Phandalin',
        time: 'Atardecer · Cielo limpio',
        sceneTags: ['phandalin', 'settlements'],
        atmosphere: 'fireflies',
        mood: 'warm',
        figure: { kind: 'none' },
        beats: [
          {
            kind: 'narration',
            text: `${opening}Bajáis la colina con el sol de cara y el pueblo se ve desde lejos, con sus tejados torcidos y el humo de las chimeneas. Es poca cosa, Phandalin. Pero hoy vuelve a tener partera, y ${short(a)} y ${short(b)} tienen nombre.`,
          },
          {
            kind: 'narration',
            text: 'Cuando la luz se va, sobre el Pico Escarcha se recorta un momento una silueta con alas. Luego nada. La historia continúa otro día.',
          },
        ],
        choices: [
          {
            label: 'Entrar en el Ciervo Dormido a celebrarlo.',
            who: BOTH,
            hint: 'Descanso largo',
          },
          {
            label: 'Ir directos al Alcaide a cobrar.',
            who: a,
            roll: { skill: 'Intimidación', dc: 10, advantage: 'none' },
          },
        ],
        effects: {
          hp: [
            { who: a, delta: 2 },
            { who: b, delta: 2 },
          ],
          gold: [],
          items: [],
        },
        memory: [],
        summary: 'La compañía vuelve a Phandalin al atardecer.',
        sceneEnds: true,
      };
  }
};

export { mockTurn };
