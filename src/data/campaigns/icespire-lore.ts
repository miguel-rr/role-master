import type { LoreKind } from '@/lib/game/lore';

/**
 * What the players can already know when the Icespire campaign starts:
 * the names in the introduction and in each character's backstory. Only the
 * entries whose source is at the table are seeded into a new game.
 */

type LoreSeed = {
  name: string;
  kind: LoreKind;
  aliases?: string[];
  /** One or two sentences: what the players know, not what the bible knows. */
  summary: string;
  /**
   * "intro": known from the start. A character id: known if that character
   * is at the table. "world": hidden until the name appears in the story.
   */
  source: 'intro' | 'world' | string;
};

const ICESPIRE_LORE: LoreSeed[] = [
  // ── Introduction ──
  {
    name: 'Phandalin',
    kind: 'place',
    summary:
      'Pueblo minero de frontera en la Costa de la Espada, a dos días de Neverwinter, levantado sobre ruinas. Sin murallas ni guardia: mineros, granjeros, una posada y un Alcaide.',
    source: 'intro',
  },
  {
    name: 'Costa de la Espada',
    kind: 'place',
    summary:
      'La franja de costa al oeste de Faerûn donde están Neverwinter y Phandalin.',
    source: 'intro',
  },
  {
    name: 'Neverwinter',
    kind: 'place',
    summary:
      'La gran ciudad a dos días al noroeste de Phandalin. De allí vienen la mayoría de los viajeros y las noticias.',
    source: 'intro',
  },
  {
    name: 'Harbin Wester',
    kind: 'character',
    aliases: ['el Alcaide', 'Alcaide'],
    summary:
      'Alcaide de Phandalin. Gobierna desde su casa porque prefiere no salir; ha clavado en el tablón encargos con recompensa en oro.',
    source: 'intro',
  },
  {
    name: 'El Ciervo Dormido',
    kind: 'place',
    aliases: ['Ciervo Dormido', 'la posada'],
    summary:
      'La posada de Phandalin. El primer techo bajo el que dormís en el pueblo.',
    source: 'intro',
  },
  {
    name: 'Pico Escarcha',
    kind: 'place',
    summary:
      'Cima de las Colinas de la Espada donde se ha instalado un dragón blanco joven hace un mes. Nadie lo ha visto de cerca y ha vuelto para contarlo.',
    source: 'intro',
  },
  {
    name: 'Colinas de la Espada',
    kind: 'place',
    summary:
      'Las colinas al este de Phandalin; en su cima más alta, el Pico Escarcha.',
    source: 'intro',
  },
  {
    name: 'el dragón',
    kind: 'creature',
    aliases: ['dragón blanco', 'el dragón blanco'],
    summary:
      'Un dragón blanco joven que desde hace un mes ataca granjas, caravanas y todo lo que se mueve a menos de un día de Phandalin.',
    source: 'intro',
  },
  {
    name: 'el tablón',
    kind: 'concept',
    aliases: [
      'tablón del ayuntamiento',
      'tablón de encargos',
      'el tablón del Alcaide',
    ],
    summary:
      'El tablón del ayuntamiento donde el Alcaide clava encargos con recompensa en oro.',
    source: 'intro',
  },
  // ── Bram ──
  {
    name: 'Lord Protector de Neverwinter',
    kind: 'character',
    aliases: ['Lord Protector'],
    summary:
      'Gobernante de Neverwinter. Bram lleva una carta suya sellada para el Alcaide: la ciudad quiere saber si lo del dragón es real.',
    source: 'bram',
  },
  {
    name: 'la guardia de Neverwinter',
    kind: 'faction',
    aliases: ['guardia de Neverwinter'],
    summary:
      'Bram sirvió doce años en ella, los últimos tres como sargento de la puerta sur. Su insignia ya no significa nada.',
    source: 'bram',
  },
  // ── Nissa ──
  {
    name: 'Mamá Orla',
    kind: 'character',
    aliases: ['Orla'],
    summary:
      'Vieja contrabandista de Neverwinter que sacó a Nissa de una celda a los catorce a cambio de tres años de trabajo. Fueron cinco.',
    source: 'nissa',
  },
  {
    name: 'Halia Thornton',
    kind: 'character',
    aliases: ['Halia'],
    summary:
      'Del Intercambio de Mineros de Phandalin. Nissa debe entregarle un paquete lacrado que ya ha abierto: una llave de bronce con la marca de los Capas Rojas.',
    source: 'nissa',
  },
  {
    name: 'Intercambio de Mineros',
    kind: 'place',
    summary: 'Edificio de Phandalin donde trabaja Halia Thornton.',
    source: 'nissa',
  },
  {
    name: 'Capas Rojas',
    kind: 'faction',
    aliases: ['los Capas Rojas'],
    summary:
      'Una banda cuya marca aparece en la llave de bronce que Nissa lleva para Halia Thornton. «Tú, no preguntes».',
    source: 'nissa',
  },
  // ── Dagna ──
  {
    name: 'Dazlyn Cascagrís',
    kind: 'character',
    aliases: ['Dazlyn'],
    summary:
      'Prima de Dagna. Buscaba a su hermano por Phandalin y hace un mes dejó de contestar a las cartas. Dagna ha venido a buscarla.',
    source: 'dagna',
  },
  {
    name: 'Mithral Hall',
    kind: 'place',
    summary:
      'La ciudad enana donde nació Dagna y de la que salió a los cuarenta.',
    source: 'dagna',
  },
  {
    name: 'Moradin',
    kind: 'concept',
    summary:
      'El dios de los enanos, forjador de su pueblo. Dagna es su clériga; su símbolo es el yunque.',
    source: 'dagna',
  },
  // ── Sariel ──
  {
    name: 'Fibblestib',
    kind: 'character',
    summary:
      'Gnomo inventor de Gnomengarde con quien Sariel se carteó dos años. Su última carta: «Hay algo en las cuevas que no es de aquí». Luego, silencio.',
    source: 'sariel',
  },
  {
    name: 'Gnomengarde',
    kind: 'place',
    summary:
      'Asentamiento de gnomos en unas cuevas cerca de Phandalin, hogar de Fibblestib.',
    source: 'sariel',
  },
  {
    name: 'Candlekeep',
    kind: 'place',
    summary:
      'La gran biblioteca fortaleza donde Sariel se formó copiando tratados ajenos.',
    source: 'sariel',
  },
  // ── Corran ──
  {
    name: 'Adabra Gwynn',
    kind: 'character',
    aliases: ['Adabra'],
    summary:
      'Partera de la Colina Umbrage. Le sacó a Corran dos flechas y una fiebre de niño; él le lleva leña cada invierno.',
    source: 'corran',
  },
  {
    name: 'Colina Umbrage',
    kind: 'place',
    aliases: ['Umbrage Hill', 'la colina'],
    summary:
      'Colina con un molino al sur de Phandalin, donde vive Adabra Gwynn. Corran creció cerca.',
    source: 'corran',
  },
  {
    name: 'Bosque de Neverwinter',
    kind: 'place',
    summary:
      'El bosque donde Corran creció entre lobos, más cerca de ellos que de la gente.',
    source: 'corran',
  },
  // ── Thokk ──
  {
    name: 'los Halcón Rojo',
    kind: 'faction',
    aliases: ['Halcón Rojo', 'la caravana'],
    summary:
      'La caravana en la que Thokk trabajó doce años de carretero; su única familia. Una sombra blanca la convirtió en hielo hace tres semanas.',
    source: 'thokk',
  },
  {
    name: 'Bela',
    kind: 'character',
    summary:
      'Hija del maestro carretero de los Halcón Rojo, nueve años. No apareció entre los muertos de la caravana.',
    source: 'thokk',
  },
  {
    name: 'Triboar',
    kind: 'place',
    summary: 'La villa donde Thokk hacía ruedas antes de la caravana.',
    source: 'thokk',
  },
  {
    name: 'Sendero de Triboar',
    kind: 'place',
    summary:
      'El camino donde la caravana de Thokk fue atacada hace tres semanas.',
    source: 'thokk',
  },
  // ── World: known to the bible, revealed when the story names them ──
  {
    name: 'Capas Rojas',
    kind: 'faction',
    aliases: ['los Capas Rojas', 'Capa Roja'],
    summary:
      'Una banda que se hace notar en Phandalin. Su nombre sale en los rumores y en más de un papel; nadie los llama a la puerta.',
    source: 'world',
  },
  {
    name: 'Toblen Piedracolina',
    kind: 'character',
    aliases: ['Toblen'],
    summary: 'El posadero del Ciervo Dormido.',
    source: 'world',
  },
  {
    name: 'Halia Thornton',
    kind: 'character',
    aliases: ['Halia'],
    summary: 'Dirige el Intercambio de Mineros de Phandalin.',
    source: 'world',
  },
  {
    name: 'Intercambio de Mineros',
    kind: 'place',
    summary:
      'El edificio de Phandalin donde los mineros venden lo que sacan; lo dirige Halia Thornton.',
    source: 'world',
  },
  {
    name: 'Dazlyn Cascagrís',
    kind: 'character',
    aliases: ['Dazlyn'],
    summary:
      'Una enana que busca a su hermano por Phandalin; ha puesto un aviso en el tablón.',
    source: 'world',
  },
  {
    name: 'Adabra Gwynn',
    kind: 'character',
    aliases: ['Adabra'],
    summary: 'La partera de la Colina Umbrage, acólita de Chauntea.',
    source: 'world',
  },
  {
    name: 'Colina Umbrage',
    kind: 'place',
    aliases: ['Umbrage Hill'],
    summary: 'Colina con un molino al sur de Phandalin.',
    source: 'world',
  },
  {
    name: 'Gnomengarde',
    kind: 'place',
    summary: 'Un asentamiento de gnomos en unas cuevas cerca de Phandalin.',
    source: 'world',
  },
  {
    name: 'Fibblestib',
    kind: 'character',
    summary: 'Gnomo inventor de Gnomengarde.',
    source: 'world',
  },
  {
    name: 'Cryovain',
    kind: 'creature',
    summary: 'El nombre que algunos dan al dragón blanco del Pico Escarcha.',
    source: 'world',
  },
  {
    name: 'Chauntea',
    kind: 'concept',
    summary:
      'La diosa de la agricultura y las cosechas; la Madre de los Campos.',
    source: 'world',
  },
  {
    name: 'Excavación enana',
    kind: 'place',
    aliases: ['la excavación'],
    summary:
      'Un yacimiento enano en las colinas al sur de Phandalin, del que hablan los mineros.',
    source: 'world',
  },
  {
    name: 'Ayuntamiento',
    kind: 'place',
    aliases: ['el ayuntamiento'],
    summary:
      'La casa del pueblo donde despacha el Alcaide; en su puerta, el tablón.',
    source: 'world',
  },
  {
    name: 'Colinas de Cascagrís',
    kind: 'place',
    summary: 'Las colinas al oeste de Phandalin, hacia el mar.',
    source: 'world',
  },
  {
    name: 'Mina del Eco de las Olas',
    kind: 'place',
    aliases: ['Eco de las Olas'],
    summary: 'Una vieja mina de la que hablan las leyendas de Phandalin.',
    source: 'world',
  },
];

export { ICESPIRE_LORE };
export type { LoreSeed };
