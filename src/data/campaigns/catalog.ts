import { ICESPIRE_ACT1 } from './icespire-act1';

/**
 * The shelf. Every campaign the table can pick, playable or announced. Only
 * entries with `available: true` have a bible behind them; the rest are
 * covers so the shelf can be designed with real weight. Mock entries are
 * marked so they can be swept away in one go.
 */

type CatalogEntry = {
  id: string;
  title: string;
  tagline: string;
  /** Two or three sentences for the hero and the campaign page. */
  blurb: string;
  levelRange: string;
  duration: { sessions: string; hours: string };
  /** Catalogue id of the cover painting. */
  coverId: string;
  /** Focal point of the cover, CSS object-position. */
  focus?: string;
  kind: 'Oficial' | 'Original' | 'Dúo';
  /** Two or three words: what it feels like. */
  tone: string[];
  available: boolean;
  isNew?: boolean;
  /** Placeholder to try the shelf design; delete once reviewed. */
  mock?: boolean;
};

type CatalogRow = {
  id: string;
  title: string;
  intro?: string;
  ids: string[];
};

const CATALOG: CatalogEntry[] = [
  {
    id: ICESPIRE_ACT1.id,
    title: ICESPIRE_ACT1.title,
    tagline: ICESPIRE_ACT1.tagline,
    blurb:
      'Phandalin no tiene guardia: tiene mineros asustados, un tablón de encargos y un Alcaide que paga en oro. Un dragón blanco joven se ha instalado en el Pico Escarcha y todo lo que se mueve a menos de un día del pueblo es comida. Dos recién llegados, una mantícora, una excavación enana y unos gnomos con un problema que no saben explicar.',
    levelRange: ICESPIRE_ACT1.levelRange,
    duration: ICESPIRE_ACT1.duration,
    coverId: 'scenes/fr/klauthen-vale',
    focus: '50% 40%',
    kind: 'Oficial',
    tone: ['Frontera', 'Dragón', 'Encargos'],
    available: true,
    isNew: true,
  },
  {
    id: 'lost-mine',
    title: 'La Mina Perdida de Phandelver',
    tagline:
      'Una escolta de carro que sale mal, unos goblins con demasiada organización y una mina que todos creían leyenda.',
    blurb:
      'Gundren Rockseeker os contrata para llevar un carro a Phandalin. Él no llega. Lo que empieza como una emboscada en el camino acaba en los túneles de la Cueva del Eco de las Olas, donde alguien lleva siglos esperando a que abran la puerta.',
    levelRange: 'Niveles 1 a 5',
    duration: { sessions: '10-15 sesiones', hours: '25-40 horas' },
    coverId: 'scenes/fr/redbrand-ruffians',
    focus: '50% 30%',
    kind: 'Oficial',
    tone: ['Clásica', 'Goblins', 'Mazmorra'],
    available: false,
    mock: true,
  },
  {
    id: 'first-blush',
    title: 'Primer Rubor',
    tagline:
      'Una noche, un castillo del que escapar y una lección de cómo se juega a esto.',
    blurb:
      'Despertáis en una celda de la Fortaleza Cristalina sin recordar la cena de anoche. Pensada para enseñar a jugar en dos tardes: escenas sociales, un sigilo que importa y un combate final con el que se aprende a temer a los dados.',
    levelRange: 'Niveles 1 a 2',
    duration: { sessions: '2 sesiones', hours: '4-6 horas' },
    coverId: 'scenes/fr/crimman-club',
    focus: '50% 40%',
    kind: 'Dúo',
    tone: ['Tutorial', 'Huida', 'Corta'],
    available: false,
    mock: true,
  },
  {
    id: 'strahd',
    title: 'La Maldición de Strahd',
    tagline:
      'La niebla os trae a Barovia. El señor del castillo ya sabe vuestros nombres.',
    blurb:
      'Un valle sin sol, un pueblo que entierra a sus muertos con ajo y un vampiro que juega con vosotros porque lleva cuatrocientos años aburrido. Terror gótico de mesa, con Ismark e Ireena a vuestro lado y la Tarokka marcando el camino.',
    levelRange: 'Niveles 3 a 10',
    duration: { sessions: '20-30 sesiones', hours: '50-80 horas' },
    coverId: 'scenes/fr/castle-ravenloft-5e',
    focus: '50% 35%',
    kind: 'Oficial',
    tone: ['Terror gótico', 'Vampiros', 'Larga'],
    available: false,
    mock: true,
  },
  {
    id: 'land-of-vampires',
    title: 'Tierra de Vampiros',
    tagline:
      'Cuatro partes, una plaga que camina de noche y dos personas contra todo un condado.',
    blurb:
      'Una campaña escrita para dos. Los pueblos del condado de Morrow cierran las puertas al anochecer y nadie habla del castillo de la colina. Alguien tiene que subir.',
    levelRange: 'Niveles 1 a 10',
    duration: { sessions: '12-18 sesiones', hours: '30-45 horas' },
    coverId: 'scenes/fr/city-of-the-dead-julian-kok',
    focus: '50% 45%',
    kind: 'Dúo',
    tone: ['Terror', 'Investigación', 'Larga'],
    available: false,
    mock: true,
  },
  // Originals: written by the narrator from a seed, not by Wizards.
  {
    id: 'salt-lighthouse',
    title: 'El Faro de Sal',
    tagline:
      'Un faro que se apagó hace tres años, una tripulación que no volvió y un contrato demasiado bien pagado.',
    blurb:
      'Piratas, mareas y una isla que no aparece en las cartas. Los dos personajes firman como escolta de un cartógrafo que miente en cada frase, y el mar hace el resto.',
    levelRange: 'Niveles 2 a 5',
    duration: { sessions: '5-8 sesiones', hours: '12-20 horas' },
    coverId: 'scenes/fr/sea-sprite-5e',
    focus: '50% 40%',
    kind: 'Original',
    tone: ['Piratas', 'Mar', 'Misterio'],
    available: false,
    mock: true,
  },
  {
    id: 'evernight-ashes',
    title: 'Cenizas de Evernight',
    tagline:
      'La ciudad tiene una sombra en el Shadowfell y alguien ha abierto la puerta desde el otro lado.',
    blurb:
      'Neverwinter de noche y su reflejo muerto, Evernight, donde los vivos son mercancía. Una campaña de callejones, favores y una huida que dura tres capítulos.',
    levelRange: 'Niveles 4 a 7',
    duration: { sessions: '6-9 sesiones', hours: '15-25 horas' },
    coverId: 'scenes/fr/evernight-calder-moore',
    focus: '50% 50%',
    kind: 'Original',
    tone: ['Urbana', 'Sombras', 'Intriga'],
    available: false,
    mock: true,
  },
  {
    id: 'owl-court',
    title: 'La Corte del Búho',
    tagline:
      'Un bosque que cambia de sitio, una corte feérica con sentido del humor y una deuda que no recordáis haber contraído.',
    blurb:
      'Ligera, rara y peligrosa como todo lo feérico. Tratos, acertijos, un baile al que no se puede decir que no y un búho gigante que lo ve todo.',
    levelRange: 'Niveles 2 a 4',
    duration: { sessions: '3-4 sesiones', hours: '8-12 horas' },
    coverId: 'scenes/fr/triboar-trail-klaus-pillon',
    focus: '50% 30%',
    kind: 'Original',
    tone: ['Feérica', 'Humor', 'Tratos'],
    available: false,
    isNew: true,
    mock: true,
  },
  {
    id: 'reghed-ice',
    title: 'Hielo en el Reghed',
    tagline:
      'Las tribus del glaciar no bajan a comerciar este año, y el invierno ha llegado en verano.',
    blurb:
      'Supervivencia en el Valle del Viento Helado: raciones que se cuentan, gigantes de escarcha en el horizonte y un secreto bajo el hielo que las tribus juraron no contar.',
    levelRange: 'Niveles 3 a 6',
    duration: { sessions: '6-8 sesiones', hours: '15-22 horas' },
    coverId: 'scenes/fr/reghedglacier',
    focus: '50% 55%',
    kind: 'Original',
    tone: ['Supervivencia', 'Nieve', 'Gigantes'],
    available: false,
    mock: true,
  },
  {
    id: 'neverwinter-bells',
    title: 'Las Campanas de Neverwinter',
    tagline:
      'Las campanas de la ciudad suenan solas a medianoche y cada vez responde una menos.',
    blurb:
      'Una investigación urbana con gremios, nobles y un puerto que huele a algo más que pescado. Ideal para jugadores que prefieren hablar antes que sacar la espada, hasta que no queda otra.',
    levelRange: 'Niveles 1 a 4',
    duration: { sessions: '4-6 sesiones', hours: '10-16 horas' },
    coverId: 'scenes/fr/neverwinterharbor',
    focus: '50% 50%',
    kind: 'Original',
    tone: ['Ciudad', 'Investigación', 'Gremios'],
    available: false,
    mock: true,
  },
  {
    id: 'bahamut-temple',
    title: 'El Último Templo de Bahamut',
    tagline:
      'Una anciana con escamas os pide que llevéis un huevo a la montaña. No dice de qué.',
    blurb:
      'Peregrinaje con dragones de por medio, cultistas que quieren lo mismo que vosotros y una decisión al final que ningún manual resuelve.',
    levelRange: 'Niveles 5 a 8',
    duration: { sessions: '6-10 sesiones', hours: '15-28 horas' },
    coverId: 'scenes/fr/elder-runara-temple-of-bahamut',
    focus: '50% 40%',
    kind: 'Original',
    tone: ['Dragones', 'Viaje', 'Épica'],
    available: false,
    mock: true,
  },
  {
    id: 'under-blingdenstone',
    title: 'Bajo Blingdenstone',
    tagline:
      'Los gnomos de las profundidades han perdido un túnel entero. Con gente dentro.',
    blurb:
      'Infraoscuridad para dos: setas que brillan, drow que negocian y un silencio que no es natural. Corta, cerrada y claustrofóbica.',
    levelRange: 'Niveles 3 a 5',
    duration: { sessions: '4-5 sesiones', hours: '10-14 horas' },
    coverId: 'scenes/fr/underdark-forest-afr',
    focus: '50% 45%',
    kind: 'Original',
    tone: ['Infraoscuridad', 'Claustrofobia', 'Drow'],
    available: false,
    mock: true,
  },
  {
    id: 'candlekeep-page',
    title: 'La Página que Falta',
    tagline:
      'En Candlekeep no se pierde ningún libro. Hasta que se pierde uno, y os culpan a vosotros.',
    blurb:
      'Enigmas, bibliotecas que no acaban y un culpable que estuvo delante todo el tiempo. Una aventura de una tarde larga para quien disfruta pensando.',
    levelRange: 'Niveles 2 a 3',
    duration: { sessions: '1-2 sesiones', hours: '3-5 horas' },
    coverId: 'scenes/fr/candlekeep',
    focus: '50% 50%',
    kind: 'Original',
    tone: ['Enigmas', 'Biblioteca', 'Corta'],
    available: false,
    mock: true,
  },
  {
    id: 'blue-dragon-calim',
    title: 'El Dragón Azul de Calim',
    tagline:
      'Dunas, un genio con un contrato y un dragón que colecciona ciudades.',
    blurb:
      'Calor, sed y política de bazar. Los dos personajes acaban en medio de una guerra entre un dragón azul y un genio que lleva mil años perdiéndola.',
    levelRange: 'Niveles 6 a 9',
    duration: { sessions: '8-12 sesiones', hours: '20-32 horas' },
    coverId: 'scenes/fr/blue-dragon-lars-grant-west',
    focus: '50% 40%',
    kind: 'Original',
    tone: ['Desierto', 'Dragón', 'Política'],
    available: false,
    mock: true,
  },
  {
    id: 'papazotl-tomb',
    title: 'La Tumba de Papazotl',
    tagline:
      'Una tumba que quiere ser encontrada. Eso debería bastar como aviso.',
    blurb:
      'Trampas, enigmas y una selva que se come los caminos. Para jugadores que disfrutan contando cada paso y leyendo cada inscripción.',
    levelRange: 'Niveles 5 a 7',
    duration: { sessions: '3-5 sesiones', hours: '8-14 horas' },
    coverId: 'scenes/fr/tomb-of-papazotl',
    focus: '50% 50%',
    kind: 'Original',
    tone: ['Mazmorra', 'Trampas', 'Selva'],
    available: false,
    mock: true,
  },
  {
    id: 'stone-bridge',
    title: 'El Puente de Piedra',
    tagline:
      'Dos viajeros, un puente de una milla y algo que cobra peaje desde abajo.',
    blurb:
      'Una sola tarde, un solo lugar, una decisión que no se puede deshacer. Pensada para probar la mesa antes de una campaña larga.',
    levelRange: 'Nivel 1',
    duration: { sessions: '1 sesión', hours: '2-3 horas' },
    coverId: 'scenes/fr/stone-bridge-5e',
    focus: '50% 45%',
    kind: 'Original',
    tone: ['Una tarde', 'Decisión', 'Misterio'],
    available: false,
    mock: true,
  },
  {
    id: 'high-forest-centaurs',
    title: 'Los Cascos del Bosque Alto',
    tagline:
      'Los centauros han cerrado el Bosque Alto y nadie sabe por qué. Vosotros vais a entrar igual.',
    blurb:
      'Naturaleza, diplomacia y una carrera que decide un tratado. Con espacio para quien quiera pelear y para quien prefiera convencer.',
    levelRange: 'Niveles 3 a 5',
    duration: { sessions: '4-6 sesiones', hours: '10-16 horas' },
    coverId: 'scenes/fr/centaurs-high-forest',
    focus: '50% 40%',
    kind: 'Original',
    tone: ['Bosque', 'Diplomacia', 'Carrera'],
    available: false,
    mock: true,
  },
];

const ROWS: CatalogRow[] = [
  {
    id: 'official',
    title: 'Aventuras oficiales, adaptadas para dos',
    intro:
      'Las de Wizards y las escritas para dúo, con compañeros y encuentros ajustados a dos personajes.',
    ids: [
      'icespire-act1',
      'lost-mine',
      'first-blush',
      'strahd',
      'land-of-vampires',
    ],
  },
  {
    id: 'originals',
    title: 'Campañas originales del máster',
    intro:
      'Escritas por el narrador a partir de una semilla: nadie las ha jugado antes.',
    ids: [
      'owl-court',
      'salt-lighthouse',
      'evernight-ashes',
      'reghed-ice',
      'neverwinter-bells',
      'bahamut-temple',
      'under-blingdenstone',
      'blue-dragon-calim',
      'high-forest-centaurs',
    ],
  },
  {
    id: 'short',
    title: 'Una tarde, una historia',
    intro: 'Para probar la mesa o para cuando solo hay una noche.',
    ids: [
      'stone-bridge',
      'candlekeep-page',
      'first-blush',
      'owl-court',
      'papazotl-tomb',
    ],
  },
  {
    id: 'horror',
    title: 'Para jugar con la luz apagada',
    ids: [
      'strahd',
      'land-of-vampires',
      'evernight-ashes',
      'papazotl-tomb',
      'under-blingdenstone',
    ],
  },
];

/** Wide painting for the shelf's banner. */
const BANNER_ART_ID = 'scenes/fr/essentials-kit-dm-screen';

const catalogEntry = (id: string) => CATALOG.find((c) => c.id === id);

export { BANNER_ART_ID, CATALOG, catalogEntry, ROWS };
export type { CatalogEntry, CatalogRow };
