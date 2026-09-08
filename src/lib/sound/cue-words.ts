import type { Cue } from '@/data/sound/vocabulary';

/**
 * Spanish words that name each scene cue. A cue fires when the typewriter
 * reveals one of them on the page of its beat; if the page never names it,
 * it fires when the page opens.
 */
const CUE_WORDS: Partial<Record<Cue, RegExp>> = {
  'door-wood-open': /puerta|portón|postigo|hoja de madera/i,
  'door-wood-close': /puerta|portón|portazo/i,
  'door-iron': /reja|verja|cancela|puerta de hierro|portón de hierro/i,
  lock: /cerrojo|cerradura|llave|pestillo|candado/i,
  'footsteps-stone': /pasos|pisadas|botas/i,
  'footsteps-wood': /pasos|pisadas|tablas|crujen?|escalera/i,
  coin: /moneda|pieza de (?:oro|plata|cobre)/i,
  'coins-pour': /monedas|bolsa|oro|plata|paga|pagar|cobra/i,
  mug: /jarra|vaso|copa|brind|cerveza|estofado/i,
  'glass-break': /cristal|vidrio|añicos|rompe|estalla/i,
  'sword-draw': /desenvain|espada|acero|hoja|daga|filo/i,
  'sword-clash': /acero|espadas|choca|golpe de espada|parada/i,
  arrow: /flecha|virote|saeta|dispara/i,
  'bow-draw': /arco|cuerda|tensa/i,
  impact: /golpe|puñetazo|impacto|choque|embiste/i,
  'body-fall': /cae|cayó|desploma|derrumba|suelo/i,
  'fire-ignite': /prende|enciende|fuego|llama|arde|hoguera/i,
  torch: /antorcha|tea|fuego|llama/i,
  'candle-out': /vela|apaga|sopla|oscuridad/i,
  thunder: /trueno|relámpago|rayo|tormenta/i,
  'wind-gust': /viento|ráfaga|vendaval|sopla/i,
  bell: /campana|campanada|tañe/i,
  gong: /gong|tambor|retumba/i,
  roar: /rug|brama|ruge/i,
  growl: /gruñ|ronronea|amenaza/i,
  wings: /alas?\b|aletea|aleteo|vuelo|alza el vuelo|se eleva/i,
  crow: /cuervo|grazn|córvido/i,
  wolf: /lobo|aúll|aullido/i,
  owl: /búho|lechuza|ulul/i,
  'scream-far': /grito|chill|alarido|aúlla/i,
  laugh: /risa|carcajada|ríe|rió|reír|risotada/i,
  applause: /aplau|ovaci|palmas/i,
  'water-drip': /gota|gotea|goteo/i,
  splash: /chapote|salpic|agua|zambull/i,
  rockfall: /derrumb|rocas|piedras|desprend/i,
  chain: /cadena|grillete|eslab/i,
  'book-close': /libro|tomo|volumen|cierra/i,
  parchment: /pergamino|papel|carta|sello|nota/i,
  spell: /hechizo|conjuro|magia|arcan|lanza/i,
  heal: /cura|sana|curación|plegaria|bendici/i,
  'arcane-spark': /chispa|destello|brilla|resplandor|magia/i,
  heartbeat: /latido|corazón|pulso/i,
};

/** True when the revealed text already names the cue. */
const cueNamed = (sfx: string, text: string): boolean => {
  const re = CUE_WORDS[sfx as Cue];
  return re ? re.test(text) : false;
};

/** True when the full page names the cue anywhere. */
const pageNamesCue = (sfx: string, text: string) => cueNamed(sfx, text);

export { CUE_WORDS, cueNamed, pageNamesCue };
