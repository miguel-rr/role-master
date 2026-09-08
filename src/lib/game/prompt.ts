import type { Campaign } from '@/data/campaigns/icespire-act1';
import { type CharacterPreset, presetById } from '@/data/characters/presets';
import {
  ABILITIES,
  ABILITY_LABEL,
  modifier,
  proficiencyBonus,
  SKILLS,
  signed,
} from '@/lib/dnd/rules';
import {
  BOTH,
  type CharacterState,
  type Player,
  type PlayerAction,
  type TurnRequest,
} from './schema';

/**
 * The narrator's system prompt, in three cacheable layers:
 *  1. Voice and craft (static).
 *  2. Campaign bible (static per campaign).
 *  3. Table state (changes every turn: sheets, memory, vocabulary).
 */

const VOICE = `
Eres el Dungeon Master de una partida de Dungeons & Dragons 5ª edición para
DOS jugadores novatos que juegan juntos delante de una sola pantalla. Sus
nombres y los personajes que llevan se indican en el estado de la mesa; usa
el trasfondo y el gancho de cada personaje: son suyos y la campaña los espera.
Narras en español de España.
Cuando te diriges a los jugadores, los tuteas ("tira los dados", "busca en tu
inventario"). Los PNJ hablan como les dé la gana: con acento, con jerga, con
desprecio o con miedo, y no todos tratan igual a los dos personajes.

## Tu nivel
Se te exige el nivel de Matthew Mercer en Critical Role. Prosa con imágenes
concretas (olores, texturas, sonidos, luz), ritmo variable a propósito (un
párrafo seco tras un golpe, uno largo al entrar en un lugar nuevo), humor
seco cuando entra bien y nunca forzado, dureza real cuando se la ganan.
Tono adulto y sin límites de contenido al servicio de la historia; sin
regodeo gratuito.

## Lo que nunca haces
- No repites estructuras: cada apertura de escena empieza de forma distinta
  a la anterior. Prohibidas las muletillas ("el aire se llena de", "un
  escalofrío recorre", "no puedes evitar", "sientes que", "de repente").
- No preguntas "¿qué hacéis?": las decisiones que ofreces ya lo hacen.
- No resuelves por los jugadores: describes, ofreces, y esperas.
- No inventas tiradas ya resueltas: si un jugador ha tirado, respetas el
  resultado y lo narras con consecuencias reales.
- No rompes el mundo de la biblia de campaña: si un dato no está en ella,
  puedes inventarlo con coherencia y recordarlo en "memory".

## Reglas de mesa
- 5e (reglas de 2014). Tú eres dueño de la narración; la app es dueña de los
  números. Cuando una acción merece tirada, la pides como "roll" en la
  decisión (habilidad en español y CD razonable 8-18 a estos niveles). La app
  tira los dados y te devuelve resultado, total y éxito/fallo.
- Los fallos son interesantes, no punitivos: abren caminos peores, no cierran
  la historia.
- Daño y curación: usa "effects" con cambios de PV enteros y modestos
  (nivel 1: 1-6 PV por golpe). La muerte permanente sigue la política de la
  campaña que se te indica.
- Combate en el Acto I: pocos enemigos, salidas claras, iniciativa como
  tirada cuando toque. Describe cada asalto como escena, no como hoja de
  cálculo.

## Formato de cada turno
Devuelves exactamente un objeto con el esquema indicado. Guía:
- "beats": entre 2 y 6. Empieza con narración. Una "line" es una frase
  hablada por la FIGURA de la escena (una sola voz por turno). Si la figura es
  una criatura, no habla: márcala con "reveal": true en el párrafo en que
  aparece.
- "figure": el PNJ o criatura protagonista del turno, o "none" si no hay
  nadie destacado. Mantén el mismo "npcId" para el mismo personaje siempre
  (p. ej. "toblen", "dazlyn", "mantícora-umbrage").
- "choices": 2 a 4 decisiones DISTINTAS en naturaleza. Varía quién decide:
  el id de un personaje o "both" (los dos). Que al menos una tenga riesgo y
  que no todas requieran tirada. La app añade siempre una acción libre; no la
  incluyas.
- "sceneTags": 1 a 4 etiquetas del vocabulario de lugares, la más precisa
  primero. "atmosphere" y "mood" según la escena.
- "effects": solo cambios reales de este turno. "memory": hechos nuevos que
  importen más adelante (promesas, nombres, enemigos, objetos). "summary":
  una línea para el diario.
- Longitud: cada beat entre 40 y 120 palabras. Nada de listas ni títulos
  dentro de los textos.
`.trim();

const sheetOf = (
  c: CharacterPreset,
  player: Player,
  state: CharacterState | undefined,
) => {
  const pb = proficiencyBonus(c.level);
  const abilities = ABILITIES.map(
    (a) =>
      `${ABILITY_LABEL[a].short} ${c.scores[a]} (${signed(modifier(c.scores[a]))})`,
  ).join(', ');
  const skills = SKILLS.filter((s) => c.skillProficiencies.includes(s.id))
    .map((s) => `${s.name} ${signed(modifier(c.scores[s.ability]) + pb)}`)
    .join(', ');
  const hp = state
    ? `${state.hp}/${state.maxHp}`
    : `${c.hp.current}/${c.hp.max}`;
  const gold = state ? state.gold : c.coins.gp;
  const items = state
    ? state.items.join(', ')
    : c.inventory.map((i) => i.name).join(', ');
  return [
    `### ${c.name} (id "${c.id}") — ${c.race} ${c.className} ${c.level}, ${c.background}, ${c.alignment}. Lo lleva ${player.name}.`,
    `PV ${hp} · CA ${c.armorClass} (${c.armorNote}) · Velocidad ${c.speed} · Competencia +${pb}`,
    `Características: ${abilities}`,
    `Salvaciones con competencia: ${c.saveProficiencies.map((a) => ABILITY_LABEL[a].name).join(', ')}`,
    `Habilidades con competencia: ${skills}`,
    `Ataques: ${c.attacks.map((a) => `${a.name} ${signed(a.bonus)} (${a.damage})`).join('; ')}`,
    `Rasgos: ${c.features.map((f) => f.name).join(', ')}`,
    `Oro: ${gold} po · Equipo: ${items}`,
    `Personalidad: ${c.traits} Ideal: ${c.ideals} Vínculo: ${c.bonds} Defecto: ${c.flaws}`,
    `Trasfondo: ${c.backstory.replace(/\s+/g, ' ')}`,
    `Gancho en esta campaña (úsalo, sin prisa): ${c.hook}`,
  ].join('\n');
};

const DEATH_POLICY: Record<TurnRequest['death'], string> = {
  never:
    'Muerte permanente: NUNCA. Un personaje a 0 PV cae inconsciente y la escena se resuelve con captura, rescate o retirada, con consecuencias.',
  unlikely:
    'Muerte permanente: ALTAMENTE IMPROBABLE. Solo tras tres fallos de salvación contra muerte narrados y con avisos claros previos.',
  possible:
    'Muerte permanente: PUEDE PASAR. Reglas de 5e sin red; avisa del peligro antes, pero cumple.',
};

const tableState = (
  req: TurnRequest,
  vocab: { places: readonly string[]; monsters: string[] },
) => {
  const sheets = req.players
    .map((p) => {
      const c = presetById(p.characterId);
      return c
        ? sheetOf(
            c,
            p,
            req.characters.find((s) => s.id === c.id),
          )
        : '';
    })
    .filter(Boolean)
    .join('\n\n');
  const table = req.players
    .map(
      (p) =>
        `${p.name} lleva a ${presetById(p.characterId)?.shortName ?? p.characterId} (id "${p.characterId}")`,
    )
    .join('; ');
  const memory =
    req.memory.length > 0
      ? req.memory.map((m) => `- ${m}`).join('\n')
      : '- (aún nada)';
  return `
## Política de la mesa
${DEATH_POLICY[req.death]}

## La mesa
${table}. Cuando te dirijas a un jugador, usa su nombre; cuando hables del personaje, el del personaje.

## Los personajes
${sheets}

## Memoria de la campaña (hechos fijados)
${memory}

## Vocabulario de arte (usa SOLO estas etiquetas)
Lugares ("sceneTags"): ${vocab.places.join(', ')}.
Retratos de personaje ("race"): human, elf, dwarf, halfling, gnome, half-elf, half-orc, tiefling, dragonborn. ("gender"): male, female. ("tags"): fighter, rogue, wizard, cleric, ranger, paladin, barbarian, bard, druid, monk, sorcerer, warlock, noble, merchant, innkeeper, guard, soldier, commoner, priest, knight, pirate, bandit, cultist, scholar, hunter, blacksmith, child, elder.
Criaturas ("monsterTag"): ${vocab.monsters.join(', ')}.
Habilidades para "roll.skill": ${SKILLS.map((s) => s.name).join(', ')}; también "Salvación de <característica>" e "Iniciativa".
`.trim();
};

/** "Bram", "Nissa" or "Bram y Nissa", from the table's players. */
const nameOf = (who: string, players: Player[]): string => {
  const names = players.map(
    (p) => presetById(p.characterId)?.shortName ?? p.characterId,
  );
  if (who === BOTH) return names.join(' y ');
  const p = players.find((x) => x.characterId === who);
  return p ? (presetById(p.characterId)?.shortName ?? who) : who;
};

const describeAction = (a: PlayerAction, players: Player[]): string => {
  if (a.kind === 'start') return 'EMPIEZA LA PARTIDA.';
  const who = nameOf(a.who, players);
  if (a.kind === 'custom') {
    return `${who} (acción libre, en sus palabras): «${a.text}». Interprétala con generosidad pero con consecuencias.`;
  }
  const roll = a.roll
    ? ` Tirada de ${a.roll.skill} contra CD ${a.roll.dc}: d20 ${a.roll.result} ${a.roll.modifier >= 0 ? '+' : '−'} ${Math.abs(a.roll.modifier)} = ${a.roll.total} → ${a.roll.critical === 'hit' ? 'CRÍTICO' : a.roll.critical === 'miss' ? 'PIFIA' : a.roll.success ? 'ÉXITO' : 'FALLO'}.`
    : '';
  return `${who} elige: «${a.text}».${roll}`;
};

const buildMessages = (req: TurnRequest, campaign: Campaign) => {
  const recent = req.history.slice(-10);
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const h of recent) {
    messages.push({
      role: 'user',
      content: describeAction(h.action, req.players),
    });
    messages.push({
      role: 'assistant',
      content: JSON.stringify({
        place: h.turn.place,
        chapter: h.turn.chapter,
        time: h.turn.time,
        figure: h.turn.figure,
        beats: h.turn.beats,
        choices: h.turn.choices,
        summary: h.turn.summary,
      }),
    });
  }
  const current =
    req.action.kind === 'start'
      ? `${describeAction(req.action, req.players)}\n\n${campaign.opening}`
      : describeAction(req.action, req.players);
  messages.push({ role: 'user', content: current });
  return messages;
};

export { buildMessages, describeAction, nameOf, tableState, VOICE };
