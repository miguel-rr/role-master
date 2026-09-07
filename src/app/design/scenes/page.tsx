import type { Metadata } from 'next';
import { byId } from '@/data/art/catalog';
import { buildPortraitPool } from '@/data/art/portrait-pool';
import { DEMO_CHARACTERS } from '@/data/demo/characters';
import { type Scene, SceneStage } from './_components/scene-stage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Escenas',
};

/**
 * Proposal 08: full-screen passages. Every scene is a data record — the
 * narrator will emit exactly this shape (place, mood, figure tags, text,
 * choices) and the stage renders it. Backgrounds and figures are hand-picked
 * ids from the catalogue for this showcase.
 */
const SCENES: Scene[] = [
  {
    id: 'tavern',
    label: 'Taberna',
    place: 'El Ciervo Dormido',
    chapter: 'Capítulo II · Phandalin',
    time: 'Anochecer · Lluvia fina',
    background: byId('scenes/fr/crimman-club'),
    focus: '50% 40%',
    figure: byId('portraits/pc/quartermastermalehuman'),
    figureSide: 'right',
    figureKind: 'character',
    speaker: { name: 'Toblen Piedracolina', role: 'Posadero' },
    narration: [
      'La puerta se cierra a vuestra espalda y la lluvia se queda fuera, con el frío. Dentro huele a estofado, a cerveza derramada y a leña húmeda. Media docena de mineros levantan la vista el tiempo justo para decidir que no sois un problema, y vuelven a sus jarras.',
      'El posadero deja de secar un vaso. Os mide de arriba abajo, se detiene un instante en la espada de Bram y otro en las manos de Nissa, que ya están donde no deberían.',
    ],
    quote:
      '—Dos camas, cena caliente y nada de preguntas cuestan cinco piezas de plata. Con preguntas, sale más caro. Y si venís por lo del tablón, primero comed. Los muertos no pagan.',
    choices: [
      {
        label: 'Pagar sin regatear y preguntar por el tablón.',
        who: 'bram',
        hint: 'Persuasión',
      },
      {
        label: 'Sentarme junto al minero que no deja de mirar la puerta.',
        who: 'nissa',
        hint: 'Perspicacia',
      },
      { label: 'Pedir estofado para los dos y escuchar.', who: 'both' },
    ],
    atmosphere: 'embers',
    grade: 'linear-gradient(180deg, rgba(120,60,10,0.18), rgba(20,10,5,0.35))',
    accent: '#e69a28',
  },
  {
    id: 'mine',
    label: 'Mina',
    place: 'Cueva del Eco Ondulante',
    chapter: 'Capítulo VII · La Mina Perdida',
    time: 'Sin hora · Goteo constante',
    background: byId('scenes/fr/wave-echo-cave-entrance'),
    focus: '50% 62%',
    figure: byId('portraits/pc/harrim'),
    figureSide: 'left',
    figureKind: 'character',
    speaker: { name: 'Nundro Rockseeker', role: 'Enano · Superviviente' },
    narration: [
      'El eco llega antes que la cueva: un latido de agua contra piedra, lento, como si la montaña respirase. Las vías del carro se hunden en la oscuridad y a los diez pasos la luz de la antorcha ya no llega al techo.',
      'Hay un enano sentado contra la pared, con las manos vendadas y una barba llena de polvo de mineral. No se levanta. Os mira como quien lleva días decidiendo si lo que oye son pasos o es la mina, que también habla.',
    ],
    quote:
      '—Mi hermano está más abajo. Vivo o no, está más abajo. Si bajáis, no toquéis la forja. Lo que la vigila no duerme.',
    choices: [
      {
        label: 'Curarle las manos y preguntarle qué vigila la forja.',
        who: 'bram',
        hint: 'Medicina',
      },
      {
        label: 'Explorar las vías en silencio, sin antorcha.',
        who: 'nissa',
        hint: 'Sigilo · Desventaja sin luz',
      },
      {
        label:
          'Montar campamento aquí y bajar con luz de día. Si es que hay día.',
        who: 'both',
      },
    ],
    atmosphere: 'dust',
    grade: 'linear-gradient(180deg, rgba(40,25,10,0.25), rgba(10,8,6,0.45))',
    accent: '#c9a557',
  },
  {
    id: 'cave',
    label: 'Cueva',
    place: 'Guarida de Cragmaw',
    chapter: 'Capítulo I · La emboscada',
    time: 'Mediodía · Dentro, siempre es noche',
    background: byId('scenes/fr/underdark-forest-afr'),
    focus: '50% 55%',
    figure: byId('portraits/monsters/owlbear-5point5e'),
    figureSide: 'right',
    figureKind: 'creature',
    speaker: { name: 'Máster', role: 'Narración' },
    narration: [
      'El arroyo que sale de la cueva está tibio y huele a animal. Nissa lo nota primero: no hay pájaros. Ni uno. El bosque entero contiene la respiración alrededor de la boca de la caverna.',
      'Dentro, algo grande se mueve entre los huesos. Un pico de búho, dos ojos redondos y amarillos, y un cuerpo de oso que no debería caber por donde acaba de pasar. Os ha olido. Lleva rato oliéndoos.',
    ],
    quote: 'Tirad iniciativa. El lechuzo-oso ya la ha tirado.',
    choices: [
      {
        label: 'Plantarme en la entrada con el escudo y que venga.',
        who: 'bram',
        hint: 'Iniciativa',
      },
      {
        label: 'Trepar a la repisa y buscar un ángulo con el arco.',
        who: 'nissa',
        hint: 'Atletismo · CD 12',
      },
      {
        label: 'Retroceder hacia el arroyo sin darle la espalda.',
        who: 'both',
        hint: 'Sin tirada',
      },
    ],
    atmosphere: 'fog',
    grade: 'linear-gradient(180deg, rgba(10,30,40,0.35), rgba(5,10,15,0.5))',
    accent: '#bdd6e6',
  },
  {
    id: 'palace',
    label: 'Palacio',
    place: 'Salón de los Juramentos',
    chapter: 'Capítulo IX · Audiencia',
    time: 'Mañana · Velas aún encendidas',
    background: byId('scenes/fr/cloister-of-sombre-embrace7'),
    focus: '50% 45%',
    figure: byId('portraits/pc/galfreyfemalepaladin'),
    figureSide: 'right',
    figureKind: 'character',
    speaker: { name: 'Lady Ariane Tormentaplata', role: 'Regente' },
    narration: [
      'El salón es más alto que ancho y está pensado para que quien entra se sienta pequeño. Funciona. La luz cae desde una grieta en la bóveda y no llega al suelo: se queda a media altura, como si tampoco ella tuviera permiso. Vuestras botas dejan barro de Phandalin sobre un mármol que vale más que todo lo que habéis robado en vuestra vida, Nissa.',
      'La regente no está sentada en el trono. Está de pie a su lado, con la mano apoyada en el respaldo, como quien no necesita sentarse para que quede claro quién manda.',
    ],
    quote:
      '—Habéis matado a un dragón blanco con dos personas y un carro de pociones. O sois los héroes que dice el pueblo, o sois los mentirosos más afortunados del Norte. En ambos casos me servís.',
    choices: [
      {
        label: 'Contar la verdad, incluida la parte del carro.',
        who: 'bram',
        hint: 'Persuasión',
      },
      {
        label:
          'Dejar que crea la versión de héroes. Pedir la recompensa doble.',
        who: 'nissa',
        hint: 'Engaño · CD 16',
      },
      {
        label: 'Preguntar qué quiere de nosotros antes de responder nada.',
        who: 'both',
      },
    ],
    atmosphere: 'dust',
    grade: 'linear-gradient(180deg, rgba(20,20,60,0.18), rgba(10,5,20,0.42))',
    accent: '#c19429',
  },
  {
    id: 'forest',
    label: 'Bosque',
    place: 'Bosque de Neverwinter',
    chapter: 'Capítulo IV · Thundertree',
    time: 'Tarde · Luz verde entre las hojas',
    background: byId('scenes/fr/neverwinter-wood-drizzl'),
    focus: '50% 50%',
    figure: byId('portraits/pc/playerdruid01'),
    figureSide: 'left',
    figureKind: 'character',
    speaker: { name: 'Reidoth', role: 'Druida' },
    narration: [
      'El sendero desaparece bajo el musgo y el bosque decide por vosotros por dónde se camina. Hay un silencio de catedral, roto solo por el río, que suena cerca sin dejarse ver.',
      'El druida aparece sin haber llegado: simplemente está, apoyado en un bastón que hace un minuto era una rama. Tiene la mirada de quien lleva demasiado tiempo hablando con árboles y ha empezado a preferirlos.',
    ],
    quote:
      '—No sigáis por ahí. Lo que vive en Thundertree tiene alas y muy mala memoria para los favores. Si queréis pasar, pasaréis por el pantano. Y por mí.',
    choices: [
      {
        label: 'Ofrecerle nuestra ayuda a cambio de guía.',
        who: 'bram',
        hint: 'Persuasión',
      },
      {
        label: 'Preguntar qué quiere decir exactamente "por mí".',
        who: 'nissa',
        hint: 'Perspicacia',
      },
      { label: 'Aceptar el pantano.', who: 'both', hint: 'Supervivencia' },
    ],
    atmosphere: 'fireflies',
    grade: 'linear-gradient(180deg, rgba(20,60,30,0.22), rgba(5,15,10,0.45))',
    accent: '#82b28f',
  },
  {
    id: 'mountains',
    label: 'Montañas',
    place: 'Paso del Pico Escarcha',
    chapter: 'Capítulo XI · Cryovain',
    time: 'Amanecer · Viento del norte',
    background: byId('scenes/fr/klauthen-vale'),
    focus: '50% 40%',
    figure: byId('portraits/monsters/ancient-white-dragon-5er'),
    figureSide: 'right',
    figureKind: 'creature',
    speaker: { name: 'Máster', role: 'Narración' },
    narration: [
      'A esta altura el aire duele. La nieve no cae: viene de lado, y se os mete en los ojos, en la boca, en la idea misma de seguir subiendo. El paso es una grieta entre dos muros de hielo y, al fondo, hay algo blanco que no es nieve.',
      'Se despliega despacio, porque no tiene prisa y porque quiere que lo veáis desplegarse. Cryovain. Diez toneladas de invierno con memoria. Ha esperado a que estuvierais exactamente donde no hay dónde esconderse.',
    ],
    quote:
      'El dragón inhala. Tenéis lo que dura un aliento para decidir. Después, el aliento es suyo.',
    choices: [
      {
        label: 'Tirarme detrás de la roca y tirar de Nissa conmigo.',
        who: 'bram',
        hint: 'Salvación de Destreza · CD 15',
      },
      {
        label:
          'Correr hacia él, no lejos de él. Bajo el cuello no puede alcanzarme.',
        who: 'nissa',
        hint: 'Acrobacias · CD 17 · Desventaja',
      },
      {
        label: 'Levantar la reliquia de Gnomengarde y rezar para que funcione.',
        who: 'both',
        hint: 'Sin tirada · Consecuencias',
      },
    ],
    atmosphere: 'snow',
    grade:
      'linear-gradient(180deg, rgba(150,180,220,0.2), rgba(10,15,30,0.45))',
    accent: '#bdd6e6',
  },
  {
    id: 'road',
    label: 'Camino',
    place: 'Sendero de Triboar',
    chapter: 'Capítulo I · Hacia Phandalin',
    time: 'Media tarde · Calor de finales de verano',
    background: byId('scenes/fr/triboar-trail-klaus-pillon'),
    focus: '50% 55%',
    figure: byId('portraits/pc/staglord'),
    figureSide: 'left',
    figureKind: 'character',
    speaker: { name: 'El Señor Ciervo', role: 'Capitán de los bandidos' },
    narration: [
      'El carro de Gundren se ha quedado atrás y el camino se estrecha entre dos taludes de tierra roja. Hay un caballo muerto cruzado en el sendero, con dos flechas negras en el flanco. Lleva ahí un día, quizá dos.',
      'De entre los árboles sale un hombre con una cornamenta de ciervo por yelmo. No lleva prisa. Detrás de él, en el talud, siete arcos os apuntan con la tranquilidad de quien ya ha hecho esto antes.',
    ],
    quote:
      '—El peaje son las armas y el carro. La vida os la dejo, porque hoy estoy de buen humor y porque los muertos no cuentan a nadie lo que pasa en este camino.',
    choices: [
      {
        label:
          'Soltar la espada muy despacio. Y contar los arcos mientras tanto.',
        who: 'bram',
        hint: 'Percepción',
      },
      {
        label: 'Reírme. Preguntarle si sabe de quién es el carro.',
        who: 'nissa',
        hint: 'Engaño · CD 14',
      },
      {
        label: 'Elegir en secreto: pelear o pagar. Sin hablar entre vosotros.',
        who: 'both',
        hint: 'Acuerdo a ciegas',
      },
    ],
    atmosphere: 'dust',
    grade: 'linear-gradient(180deg, rgba(200,140,60,0.12), rgba(30,15,5,0.4))',
    accent: '#de8435',
  },
  {
    id: 'night',
    label: 'Noche',
    place: 'Castillo Ravenloft',
    chapter: 'Capítulo I · Barovia',
    time: 'Noche cerrada · Niebla',
    background: byId('scenes/fr/castle-ravenloft-5e'),
    focus: '50% 30%',
    figure: byId('portraits/pc/lichmalemage'),
    figureSide: 'right',
    figureKind: 'character',
    speaker: { name: 'Strahd von Zarovich', role: 'Señor de Barovia' },
    narration: [
      'La niebla no se levanta: os acompaña. Ha caminado con vosotros desde el pueblo, pegada a los tobillos, y ahora que veis el castillo entendéis que no era niebla. Era una invitación.',
      'Las puertas están abiertas. Dentro hay luz, música y una mesa puesta para tres. El anfitrión no se ha molestado en fingir que no os esperaba.',
    ],
    quote:
      '—Bienvenidos a mi casa. Entrad libremente, por vuestra propia voluntad, y dejad aquí algo de la felicidad que traéis. La vais a necesitar menos que yo.',
    choices: [
      {
        label: 'Entrar. Con la mano en la empuñadura, pero entrar.',
        who: 'bram',
      },
      {
        label: 'Fijarme en la tercera silla. ¿Para quién es?',
        who: 'nissa',
        hint: 'Investigación',
      },
      {
        label: 'Dar media vuelta hacia la niebla.',
        who: 'both',
        hint: 'La niebla decide',
      },
    ],
    atmosphere: 'fog',
    grade: 'linear-gradient(180deg, rgba(20,20,50,0.35), rgba(5,5,15,0.55))',
    accent: '#a7080b',
  },
];

const ScenesPage = () => {
  const [bram, nissa] = DEMO_CHARACTERS;
  if (!bram || !nissa) return null;
  const pool = buildPortraitPool().entries;
  const pick = (race: string, gender: string, cls: string) =>
    pool.find(
      (p) =>
        p.tags.includes(race) &&
        p.tags.includes(gender) &&
        p.tags.includes(cls),
    ) ?? pool.find((p) => p.tags.includes(race) && p.tags.includes(gender));

  return (
    <SceneStage
      party={[
        {
          id: 'bram',
          name: 'Bram',
          color: '#c19429',
          portrait: pick('human', 'male', 'fighter'),
          hp: 9,
          maxHp: 12,
        },
        {
          id: 'nissa',
          name: 'Nissa',
          color: '#bdd6e6',
          portrait: pick('halfling', 'female', 'rogue'),
          hp: 9,
          maxHp: 9,
        },
      ]}
      scenes={SCENES}
    />
  );
};

export default ScenesPage;
