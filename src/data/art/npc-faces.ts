/**
 * Hand-picked faces for the people the narrator meets most: innkeepers,
 * merchants, guards, priests, elders… The automatic scoring over the whole
 * catalogue is the fallback; these come first when the role and the sex
 * match. Chosen from contact sheets (2026-09-08).
 */

type FaceRole =
  | 'innkeeper'
  | 'merchant'
  | 'commoner'
  | 'guard'
  | 'soldier'
  | 'knight'
  | 'noble'
  | 'priest'
  | 'elder'
  | 'scholar'
  | 'wizard'
  | 'hunter'
  | 'ranger'
  | 'bandit'
  | 'rogue'
  | 'barbarian';

const HUMAN_FACES: Record<
  'male' | 'female',
  Partial<Record<FaceRole, string[]>>
> = {
  male: {
    innkeeper: [
      'portraits/pc/quartermastermalehuman',
      'portraits/fr/brawn-mcgable',
      'portraits/npc/dykstra-mirt',
    ],
    merchant: [
      'portraits/pc/horgusmalehumannoble',
      'portraits/fr/brawn-mcgable',
      'portraits/fr/refrum-joachim-barrum',
    ],
    commoner: [
      'portraits/pc/quartermastermalehuman',
      'portraits/npc/shan-karate-master',
      'portraits/fr/brawn-mcgable',
      'portraits/pc/hilorhumanmale',
    ],
    guard: [
      'portraits/pc/humanmaletank',
      'portraits/pc/treverhumanmwangimalewarrior',
      'portraits/npc/ulder-ravengard-disc',
    ],
    soldier: [
      'portraits/pc/treverhumanmwangimalewarrior',
      'portraits/pc/humanmaletank',
      'portraits/npc/ulder-ravengard-disc',
    ],
    knight: ['portraits/npc/lordpiergeiron', 'portraits/pc/humanmaletank'],
    noble: [
      'portraits/pc/horgusmalehumannoble',
      'portraits/npc/lordpiergeiron',
      'portraits/fr/bidderdoo-harpell',
    ],
    priest: [
      'portraits/pc/sosielmalehumancleric',
      'portraits/fr/akar-kessell-red-handed',
    ],
    elder: [
      'portraits/fr/bidderdoo-harpell',
      'portraits/fr/akar-kessell-red-handed',
      'portraits/fr/refrum-joachim-barrum',
    ],
    scholar: [
      'portraits/fr/refrum-joachim-barrum',
      'portraits/fr/iarno-glasstaff-albrek',
      'portraits/fr/bidderdoo-harpell',
    ],
    wizard: [
      'portraits/fr/iarno-glasstaff-albrek',
      'portraits/pc/humanmalemagus',
    ],
    hunter: [
      'portraits/pc/ulbrigmalehumanshifter',
      'portraits/fr/artus-cimber',
      'portraits/npc/gray-wolf-exile',
    ],
    ranger: [
      'portraits/fr/artus-cimber',
      'portraits/pc/ulbrigmalehumanshifter',
    ],
    bandit: [
      'portraits/pc/hilorhumanmale',
      'portraits/npc/dykstra-mirt',
      'portraits/npc/edgin-darvis-boxart',
    ],
    rogue: ['portraits/pc/hilorhumanmale', 'portraits/npc/edgin-darvis-boxart'],
    barbarian: ['portraits/fr/wulfgar-5e', 'portraits/npc/gray-wolf-exile'],
  },
  female: {
    innkeeper: [
      'portraits/npc/lordbrianne',
      'portraits/fr/minghee-graywind',
      'portraits/fr/indrina-lamsensettle',
    ],
    merchant: [
      'portraits/npc/lordbrianne',
      'portraits/fr/indrina-lamsensettle',
      'portraits/pc/humantianxiafemalenoble',
    ],
    commoner: [
      'portraits/fr/minghee-graywind',
      'portraits/npc/lordbrianne',
      'portraits/pc/aneviafemalerogue',
    ],
    guard: [
      'portraits/pc/seelahfemalepaladin',
      'portraits/pc/humanfemalearcher',
    ],
    soldier: [
      'portraits/pc/seelahfemalepaladin',
      'portraits/pc/galfreyfemalepaladin',
    ],
    knight: [
      'portraits/pc/galfreyfemalepaladin',
      'portraits/pc/seelahfemalepaladin',
    ],
    noble: [
      'portraits/fr/indrina-lamsensettle',
      'portraits/pc/humantianxiafemalenoble',
      'portraits/npc/filfaeril',
    ],
    priest: [
      'portraits/fr/cleric-phb5e2024',
      'portraits/npc/lathanderian-dress',
    ],
    elder: ['portraits/npc/lordbrianne'],
    scholar: [
      'portraits/pc/neniofemalehumanwizard',
      'portraits/fr/tsien-chiang-5e',
    ],
    wizard: [
      'portraits/pc/neniofemalehumanwizard',
      'portraits/pc/humanmwangifemalemage',
      'portraits/fr/tsien-chiang-5e',
    ],
    hunter: [
      'portraits/pc/humanfemalearcher',
      'portraits/fr/bjornhild-solvigsdottir-rotf',
    ],
    ranger: ['portraits/pc/humanfemalearcher'],
    bandit: [
      'portraits/pc/aneviafemalerogue',
      'portraits/npc/holga-kilgore-boxart',
    ],
    rogue: ['portraits/pc/aneviafemalerogue'],
    barbarian: [
      'portraits/npc/holga-kilgore-boxart',
      'portraits/npc/dianayoung',
    ],
  },
};

/** Pictures that pass the automatic filters but are not a person's face. */
const EXCLUDED_FACES = new Set([
  'portraits/pc/deskarimaledemonlord',
  'portraits/pc/nocticulafemaledemonlord',
  'portraits/pc/iomedaegoddessfemale',
  'portraits/pc/pharasmagoddessfemale',
  'portraits/pc/areeluvorleshhalfsuccubusfemalewitch-now',
  'portraits/pc/pentafemaleandroidbard',
  'portraits/pc/wenduagfemalemongrelranger',
  'portraits/pc/lannmalemongrelzenmonk',
  'portraits/fr/petrification-dmg14',
  'portraits/fr/scarecrow-field-5e',
  'portraits/fr/prismatic-spray-5e',
  'portraits/fr/the-joy-of-extradimensional-spaces',
  'portraits/fr/soulknife-5-point-5-e',
  'portraits/fr/spell-components-5e',
  'portraits/fr/halaster-dotmm',
  'portraits/fr/mennek-ariz-dead-in-thay',
  'portraits/fr/lahnis-5e',
  'portraits/fr/necromancer-wizard-5e',
  'portraits/npc/arch-druid-spellfire',
  'portraits/npc/crystal-shard-spa-cover',
  'portraits/npc/church-of-finder-wyvernspur',
  'portraits/npc/arabian-adventurers-artwork',
  'portraits/npc/legends-of-baldurs-gate-frostgiants-fury-shield-of-faith-p103',
  'portraits/npc/shamur-uskevren-griffon',
  'portraits/npc/scoundrel4-1280',
  'portraits/npc/thazienne-uskevren',
  'portraits/npc/uthgardt-barbarian-ncs',
  'portraits/npc/dungeonsdragons-minsc-boo-dunbar',
  'portraits/npc/finder-wyvernspur-3e',
  'portraits/fr/druid-phb5e2024',
  'portraits/fr/flabbergast',
]);

export { EXCLUDED_FACES, HUMAN_FACES };
export type { FaceRole };
