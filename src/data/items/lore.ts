/**
 * What an object is, in the words of the equipment chapter: kind, price,
 * properties and a line of flavour. Keyed by the Spanish name used in the
 * inventories, so the narrator can hand out anything and the card still
 * knows what it is when the name matches.
 */

type ItemKind =
  | 'Arma sencilla cuerpo a cuerpo'
  | 'Arma sencilla a distancia'
  | 'Arma marcial cuerpo a cuerpo'
  | 'Arma marcial a distancia'
  | 'Munición'
  | 'Armadura ligera'
  | 'Armadura media'
  | 'Armadura pesada'
  | 'Escudo'
  | 'Equipo de aventurero'
  | 'Herramientas'
  | 'Poción'
  | 'Foco de conjuros'
  | 'Objeto personal'
  | 'Tesoro';

type ItemLore = {
  kind: ItemKind;
  /** Price in the equipment tables ("15 po", "2 pc"). */
  cost?: string;
  /** Damage, range, properties, AC... one short line each. */
  properties?: string[];
  description: string;
};

const weapon = (
  kind: ItemKind,
  cost: string,
  properties: string[],
  description: string,
): ItemLore => ({ kind, cost, properties, description });

const ITEM_LORE: Record<string, ItemLore> = {
  // Weapons
  'Espada larga': weapon(
    'Arma marcial cuerpo a cuerpo',
    '15 po',
    ['1d8 cortante', 'Versátil (1d10)'],
    'La espada del soldado: recta, de doble filo y lo bastante larga para mantener a raya a quien no debería acercarse. A dos manos golpea como un martillo.',
  ),
  'Espada corta': weapon(
    'Arma marcial cuerpo a cuerpo',
    '10 po',
    ['1d6 perforante', 'Sutil', 'Ligera'],
    'Hoja de estocada, corta y rápida. Se puede llevar una en cada mano y usar la más ágil de las dos.',
  ),
  Estoque: weapon(
    'Arma marcial cuerpo a cuerpo',
    '25 po',
    ['1d8 perforante', 'Sutil'],
    'Fino, elegante y letal en manos que saben dónde está el hueco de la armadura. Arma de duelistas y de gente que prefiere no estar donde cae el golpe.',
  ),
  Daga: weapon(
    'Arma sencilla cuerpo a cuerpo',
    '2 po',
    ['1d4 perforante', 'Sutil', 'Ligera', 'Arrojadiza (6/18 m)'],
    'Nunca sobra una. Corta cuerdas, abre cartas, se lanza y se esconde en una bota.',
  ),
  'Martillo de guerra': weapon(
    'Arma marcial cuerpo a cuerpo',
    '15 po',
    ['1d8 contundente', 'Versátil (1d10)'],
    'Cabeza de acero y mango corto. Los clérigos de Moradin lo llevan por devoción; el resto, porque abolla cualquier casco.',
  ),
  'Hacha a dos manos': weapon(
    'Arma marcial cuerpo a cuerpo',
    '30 po',
    ['1d12 cortante', 'Pesada', 'A dos manos'],
    'No hay sutileza posible con esto. Se levanta, se baja, y lo que había debajo deja de ser un problema.',
  ),
  'Hacha de mano': weapon(
    'Arma sencilla cuerpo a cuerpo',
    '5 po',
    ['1d6 cortante', 'Ligera', 'Arrojadiza (6/18 m)'],
    'Sirve para partir leña y para lo otro. Bien equilibrada, vuela recta.',
  ),
  Jabalina: weapon(
    'Arma sencilla cuerpo a cuerpo',
    '5 pp',
    ['1d6 perforante', 'Arrojadiza (9/36 m)'],
    'Lanza ligera pensada para arrojarse. Se llevan varias, porque rara vez se recuperan enteras.',
  ),
  Bastón: weapon(
    'Arma sencilla cuerpo a cuerpo',
    '2 pp',
    ['1d6 contundente', 'Versátil (1d8)'],
    'Un palo largo y sólido. Ayuda a andar, aparta ramas y, llegado el caso, dientes.',
  ),
  'Arco corto': weapon(
    'Arma sencilla a distancia',
    '25 po',
    ['1d6 perforante', 'Munición (24/97 m)', 'A dos manos'],
    'Manejable en espacios cerrados y desde una silla de montar. Menos alcance, más sitios desde donde disparar.',
  ),
  'Arco largo': weapon(
    'Arma marcial a distancia',
    '50 po',
    ['1d8 perforante', 'Munición (45/183 m)', 'Pesada', 'A dos manos'],
    'Tan alto como quien lo tensa. Con él, un buen arquero decide una pelea antes de que el otro sepa que hay pelea.',
  ),
  'Ballesta ligera': weapon(
    'Arma sencilla a distancia',
    '25 po',
    ['1d8 perforante', 'Munición (24/97 m)', 'Recarga', 'A dos manos'],
    'Cualquiera aprende a usarla en una tarde. Tarda en cargarse, pero el virote llega con ganas.',
  ),
  Flechas: {
    kind: 'Munición',
    cost: '1 po (20)',
    properties: ['Se recupera la mitad tras el combate'],
    description:
      'Astil de fresno, punta de hierro y plumas de ganso. Cuenta cuántas te quedan antes de que las cuente el enemigo.',
  },
  Virotes: {
    kind: 'Munición',
    cost: '1 po (20)',
    properties: ['Se recupera la mitad tras el combate'],
    description:
      'Cortos, gruesos y pesados. No vuelan lejos, pero atraviesan lo que tocan.',
  },
  // Armour
  'Armadura de cuero': {
    kind: 'Armadura ligera',
    cost: '10 po',
    properties: ['CA 11 + Destreza', 'Peso 10 lb'],
    description:
      'Cuero hervido en aceite hasta endurecerlo. No frena una espada, pero convierte un tajo en un moratón, y deja moverse.',
  },
  'Cota de escamas': {
    kind: 'Armadura media',
    cost: '50 po',
    properties: [
      'CA 14 + Destreza (máx. 2)',
      'Desventaja en Sigilo',
      'Peso 45 lb',
    ],
    description:
      'Escamas de metal cosidas sobre cuero, superpuestas como las de un pez. Suena al andar; nadie con ella pasa desapercibido.',
  },
  'Cota de malla': {
    kind: 'Armadura pesada',
    cost: '75 po',
    properties: ['CA 16', 'Fuerza 13', 'Desventaja en Sigilo', 'Peso 55 lb'],
    description:
      'Anillas de acero entrelazadas de los hombros a las rodillas, con un acolchado debajo. Pesa lo que pesa, y para lo que no ha nacido, no.',
  },
  Escudo: {
    kind: 'Escudo',
    cost: '10 po',
    properties: ['+2 a la CA', 'Ocupa una mano', 'Peso 6 lb'],
    description:
      'Madera con refuerzo de hierro. La diferencia entre un golpe que entra y uno que no.',
  },
  'Escudo con el yunque de Moradin': {
    kind: 'Escudo',
    cost: '10 po',
    properties: ['+2 a la CA', 'Sirve como símbolo sagrado', 'Peso 6 lb'],
    description:
      'Escudo de acero con el yunque y el martillo de Moradin grabados. Dagna lo usa como foco para sus plegarias: no hace falta soltarlo para rezar.',
  },
  // Adventuring gear
  'Poción de curación': {
    kind: 'Poción',
    cost: '50 po',
    properties: ['Cura 2d4 + 2 PV', 'Beberla es una acción'],
    description:
      'Líquido rojo que brilla un poco cuando se agita. Sabe a hierro y a hierbas. Se bebe entera o no sirve de nada.',
  },
  'Poción de curación de Adabra': {
    kind: 'Poción',
    properties: ['Cura 2d4 + 2 PV', 'Beberla es una acción'],
    description:
      'Frasco de barro tapado con cera, preparado por la partera de la Colina Umbrage. «Os la cobro», dijo, y no lo hizo.',
  },
  Raciones: {
    kind: 'Equipo de aventurero',
    cost: '5 pp (por día)',
    properties: ['Un día de comida', 'Peso 2 lb'],
    description:
      'Carne seca, fruta seca, galleta dura y frutos secos. Comer no es lo mismo que disfrutar de la comida.',
  },
  'Soga de cáñamo (50 pies)': {
    kind: 'Equipo de aventurero',
    cost: '1 po',
    properties: ['Aguanta 2 PV antes de romperse', 'Peso 10 lb'],
    description:
      'Quince metros de cuerda trenzada. Pocas cosas han salvado más vidas en una mazmorra, y ninguna tan barata.',
  },
  Cuerda: {
    kind: 'Equipo de aventurero',
    cost: '1 po',
    properties: ['15 metros', 'Peso 10 lb'],
    description:
      'Cáñamo trenzado a mano por alguien que sabía lo que hacía. Corran la lleva enrollada en bandolera.',
  },
  Antorcha: {
    kind: 'Equipo de aventurero',
    cost: '1 pc',
    properties: [
      'Luz brillante 6 m, tenue 6 m más',
      'Arde una hora',
      '1 de daño de fuego',
    ],
    description:
      'Palo con trapo empapado en brea. La oscuridad retrocede un poco; lo que vive en ella, no siempre.',
  },
  'Saco de dormir': {
    kind: 'Equipo de aventurero',
    cost: '1 po',
    properties: ['Peso 7 lb'],
    description:
      'Lona encerada y lana. Un descanso largo sobre piedra sin esto es un descanso corto y una espalda rota.',
  },
  Odre: {
    kind: 'Equipo de aventurero',
    cost: '2 pp',
    properties: ['Dos litros de agua', 'Peso 5 lb lleno'],
    description:
      'Piel de cabra cosida y engrasada. El agua sabe a cabra. Se agradece igual.',
  },
  'Herramientas de ladrón': {
    kind: 'Herramientas',
    cost: '25 po',
    properties: [
      'Abrir cerraduras y desarmar trampas',
      'Competencia: Nissa (con Pericia)',
      'Peso 1 lb',
    ],
    description:
      'Ganzúas, una lima pequeña, un espejito de mango largo y unas tenazas estrechas, todo en un estuche de cuero que cabe en una manga.',
  },
  Palanca: {
    kind: 'Equipo de aventurero',
    cost: '2 po',
    properties: ['Ventaja en Fuerza donde se pueda hacer palanca', 'Peso 5 lb'],
    description:
      'Barra de hierro con un extremo plano. Abre cajas, puertas y conversaciones que no iban a ninguna parte.',
  },
  'Ropas oscuras con capucha': {
    kind: 'Objeto personal',
    cost: '2 po',
    properties: ['Ropa de viaje'],
    description:
      'Lana gris teñida de humo, capucha honda y ningún adorno que brille. La ropa de quien prefiere que la recuerden poco.',
  },
  'Anillo de plata sin grabar': {
    kind: 'Tesoro',
    cost: '25 po',
    properties: ['Sin marca de orfebre'],
    description:
      'Liso, gastado por dentro, sin inscripción. Nissa no dice de dónde salió. Tampoco lo vende, y eso ya dice algo.',
  },
  'Insignia de rango': {
    kind: 'Objeto personal',
    properties: ['Guardia de Neverwinter · sargento'],
    description:
      'Chapa de latón con el emblema de la ciudad y tres barras. Ya no da órdenes a nadie, pero los veteranos la reconocen y se cuadran un poco.',
  },
  'Símbolo sagrado': {
    kind: 'Foco de conjuros',
    cost: '5 po',
    properties: ['Foco para conjuros de clérigo'],
    description:
      'Amuleto de plata con el yunque de Moradin. Lo sostiene al rezar; la plegaria funciona igual sin él, pero ella prefiere no comprobarlo.',
  },
  'Libro de oraciones': {
    kind: 'Objeto personal',
    cost: '25 po',
    properties: ['Peso 5 lb'],
    description:
      'Encuadernado en cuero rojo, con las letanías de Moradin copiadas a mano en Mithral Hall. Dagna se lo sabe entero; lo lleva por si un día no.',
  },
  Incienso: {
    kind: 'Equipo de aventurero',
    cost: '1 po (bloque)',
    properties: ['Para ceremonias y consagraciones'],
    description:
      'Resina prensada que huele a piedra caliente y a bosque. Se quema en los ritos y, dicen los enanos, ahuyenta a las malas ideas.',
  },
  Vestiduras: {
    kind: 'Objeto personal',
    cost: '1 po',
    properties: ['Ropa ceremonial'],
    description:
      'Túnica de lana gruesa con los bordes bordados en hilo de bronce. Para oficiar, no para viajar; Dagna la lleva plegada bajo la cota.',
  },
  'Libro de conjuros': {
    kind: 'Foco de conjuros',
    cost: '50 po',
    properties: ['Contiene 6 conjuros de nivel 1', 'Peso 3 lb'],
    description:
      'Cien páginas de vitela con cierre de latón. Si se pierde, Sariel pierde con él todo lo que no lleve preparado. Duerme abrazada a él.',
  },
  'Bolsa de componentes': {
    kind: 'Foco de conjuros',
    cost: '25 po',
    properties: ['Componentes materiales para conjuros', 'Peso 2 lb'],
    description:
      'Bolsa de cuero con compartimentos: azufre, plumón de murciélago, arena fina, un trozo de ámbar y otras cosas mejor no preguntar.',
  },
  'Tinta y pluma': {
    kind: 'Equipo de aventurero',
    cost: '10 po',
    properties: ['Tinta para copiar conjuros'],
    description:
      'Frasco de tinta negra y una pluma de cuervo. Sariel escribe en cualquier parte: en la posada, en un carro, en la cuna de una batalla.',
  },
  'Carta de un colega de Gnomengarde': {
    kind: 'Objeto personal',
    properties: ['Última carta de Fibblestib'],
    description:
      'Papel arrugado y letra diminuta: «Hay algo en las cuevas que no es de aquí. No se lo he dicho a nadie». Desde entonces, ni una más.',
  },
  'Capa de viaje': {
    kind: 'Objeto personal',
    cost: '1 po',
    properties: ['Abriga; no protege'],
    description:
      'Lana engrasada con capucha, del color de la hojarasca. Contra la lluvia, bien; contra un dragón blanco, poco.',
  },
  Lupa: {
    kind: 'Herramientas',
    cost: '100 po',
    properties: [
      'Ventaja en Investigación para tasar o examinar de cerca',
      'Enciende fuego con sol',
    ],
    description:
      'Lente de cristal tallada en Puerta de Baldur, montada en latón. Sariel la usa para leer marcas de orfebre y huellas de garra por igual.',
  },
  'Trampa para caza': {
    kind: 'Equipo de aventurero',
    cost: '5 po',
    properties: [
      'Salvación de Destreza CD 13 o 1d4 perforante y queda atrapado',
      'Peso 25 lb',
    ],
    description:
      'Cepo de hierro con mandíbulas dentadas y cadena. Se arma con el pie y se olvida dónde bajo riesgo propio.',
  },
  'Colmillo de lobo (trofeo)': {
    kind: 'Objeto personal',
    properties: ['Del primer lobo que Corran cazó solo'],
    description:
      'Colmillo amarillento, largo como un dedo, colgado de una tira de cuero. Corran tenía doce años. Su madre lo perforó ella misma.',
  },
  Manta: {
    kind: 'Equipo de aventurero',
    cost: '5 pp',
    properties: ['Peso 3 lb'],
    description:
      'Lana basta, zurcida en dos sitios. Huele a hoguera y a perro. Ha dormido bajo ella más noches que bajo un techo.',
  },
  'Manta de lana': {
    kind: 'Equipo de aventurero',
    cost: '5 pp',
    properties: ['Peso 3 lb'],
    description:
      'Grande como para tapar a Thokk, que no es poco decir. Tejida en Triboar; los niños de la caravana dormían sobre ella.',
  },
  'Herramientas de carretero': {
    kind: 'Herramientas',
    cost: '8 po',
    properties: ['Reparar carros y ruedas', 'Competencia: Thokk', 'Peso 6 lb'],
    description:
      'Azuela, escoplo, martillo de bola y un compás de hierro. Con esto y un tronco, Thokk hace una rueda en una tarde.',
  },
  'Carta del gremio': {
    kind: 'Objeto personal',
    properties: ['Gremio de carreteros de Triboar'],
    description:
      'Pergamino con sello de cera azul que acredita a Thokk Grancolmillo como oficial carretero. En una ciudad abre puertas; en el camino, nada.',
  },
  'Rueda de queso de Triboar': {
    kind: 'Equipo de aventurero',
    cost: '2 po',
    properties: ['Cinco días de comida si nadie se pasa', 'Peso 8 lb'],
    description:
      'Curado, duro y con corteza negra. Es lo único de la caravana que Thokk encontró intacto. No se lo come; lo raciona.',
  },
  'Huella de yeso de la bestia': {
    kind: 'Objeto personal',
    properties: ['Cuatro dedos, garras largas, surco de cola'],
    description:
      'Molde tomado en el barro del Sendero de Triboar. Ningún lobo deja esto. Un buen rastreador sabría decir qué sí.',
  },
};

/** The equipment entry for an item name, if the chapter knows it. */
const loreFor = (name: string): ItemLore | undefined => ITEM_LORE[name];

export { ITEM_LORE, loreFor };
export type { ItemKind, ItemLore };
