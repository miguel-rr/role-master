/**
 * Campaign bible: "El Dragón del Pico Escarcha", Acto I.
 * Written for two novice players (Bram and Nissa) plus whatever companion
 * the narrator decides to lend them. Spanish, tuteo. The narrator runs this
 * as designed: locations, NPCs, hooks and secrets are the truth of the world;
 * scenes, dialogue and consequences are improvised around it.
 */

type Campaign = {
  id: string;
  title: string;
  tagline: string;
  levelRange: string;
  /**
   * How long it takes at the table. Estimated, not measured: sessions of
   * 2-3 hours for two players with an AI narrator (see .claude/plan.md §10).
   */
  duration: {
    /** Short, for cards: "3-5 sesiones". */
    sessions: string;
    /** Total hours as a range: "8-15 horas". */
    hours: string;
    /** One line on how the estimate was made and what moves it. */
    note: string;
  };
  /**
   * What the players read before the first scene, in their own words: the
   * minimum lore to understand the first decisions. Paragraphs.
   */
  intro: string[];
  /** Free text the narrator reads as the truth of the world. */
  bible: string;
  /** The exact instructions for turn one. */
  opening: string;
};

const ICESPIRE_ACT1: Campaign = {
  id: 'icespire-act1',
  title: 'El Dragón del Pico Escarcha',
  tagline:
    'Un pueblo minero con más problemas que vecinos y un dragón blanco que ha decidido que la montaña es suya.',
  levelRange: 'Niveles 1 a 3 (Acto I)',
  duration: {
    sessions: '3-5 sesiones',
    hours: '8-15 horas',
    note: 'Llegada a Phandalin, los tres encargos del tablón y el cierre del acto. Una sesión de 2-3 horas por encargo, más la primera; la aventura completa (niveles 1-6) ronda las 15-25 sesiones.',
  },
  intro: [
    'Phandalin es un pueblo minero de frontera en la Costa de la Espada, a dos días al sureste de Neverwinter, levantado sobre las ruinas de un asentamiento que los orcos arrasaron hace siglos. No tiene murallas ni guardia: tiene mineros, granjeros, una posada llamada el Ciervo Dormido y un Alcaide, Harbin Wester, que gobierna desde su casa porque prefiere no salir.',
    'Hace un mes, un dragón blanco joven se instaló en la cima del Pico Escarcha, en las Colinas de la Espada. Desde entonces ataca granjas, caravanas y todo lo que se mueve a menos de un día del pueblo. Nadie lo ha visto de cerca y ha vuelto para contarlo. El Alcaide ha clavado en el tablón del ayuntamiento una lista de encargos con recompensa en oro, porque dinero sí tiene.',
    'Vosotros dos acabáis de llegar, cada uno por sus razones, después de tres días de camino bajo la lluvia. Nadie os conoce. Lo que consigáis lo tendréis que ganar: hablando con la gente, leyendo el tablón, eligiendo bien a quién ayudar y cuándo huir. Lo que sabéis de este lugar es esto y lo que traéis en la cabeza.',
  ],
  bible: `
# EL DRAGÓN DEL PICO ESCARCHA — ACTO I

## Premisa
Phandalin es un pueblo minero de frontera en la Costa de la Espada, a dos días
al sureste de Neverwinter, levantado sobre las ruinas de un asentamiento que
los orcos arrasaron hace siglos. Hace un mes, un dragón blanco joven llamado
Cryovain se instaló en la cima del Pico Escarcha, en las Colinas de la Espada,
y desde entonces ataca granjas, caravanas y todo lo que se mueva a menos de un
día del pueblo. El Alcaide Harbin Wester ha colgado en el tablón del
ayuntamiento una lista de encargos con recompensa: el pueblo no tiene guardia,
tiene mineros asustados y dinero.

Los dos personajes acaban de llegar a Phandalin buscando trabajo. Nadie los
conoce. Todo lo que consigan lo tendrán que ganar.

## Tono
Frontera dura, humor seco, gente cansada que no confía en forasteros y que
paga bien a quien resuelve problemas. El dragón es una amenaza real y
distante: se le ve de lejos, se oyen sus alas de noche, se encuentran sus
huellas. No se le combate en el Acto I. Las víctimas del dragón son reales:
granjas quemadas, ganado congelado, una familia desaparecida.

## Reglas de la casa para dos jugadores
- Los encuentros están pensados para dos personajes de nivel 1-3. Nunca más
  de dos enemigos que hagan daño serio a la vez, salvo aviso claro y salida
  posible.
- Siempre hay una vía para retirarse. Huir tiene consecuencias, no muerte.
- Un compañero PNJ puede unirse si la historia lo justifica (ver "Aliados");
  el narrador lo lleva, no toma las decisiones importantes.
- Las pociones de curación se pueden comprar en la tienda de Barthen a 50 po.
- Subida de nivel por hitos: nivel 2 al completar dos encargos; nivel 3 al
  completar cuatro o al enfrentarse a la amenaza del final del acto.

## PHANDALIN
Unas cuarenta casas de piedra y madera alrededor de una plaza de tierra, con
las ruinas del antiguo pueblo asomando entre los huertos. Calle principal de
barro. Se oye el martillo del herrero y el viento.

### Lugares
- **La Posada del Ciervo Dormido** (Stonehill Inn). Posadero Toblen
  Piedracolina (humano, 40 años, ancho, mangas remangadas, "no me gustan los
  líos"), su mujer Trilena, su hijo Pip (10 años, curioso, lo sabe todo del
  pueblo). Cama y cena 5 pp. Aquí se oyen los rumores.
- **El tablón del ayuntamiento**. Encargos con recompensa firmados por el
  Alcaide. El Alcaide Harbin Wester (humano, gordo, cobarde, se atrinchera en
  su casa y habla a través de la puerta) paga las recompensas.
- **Suministros Barthen**. Elmar Barthen (humano, delgado, calvo, honrado)
  vende equipo de aventurero, raciones, antorchas, pociones (50 po). Sabe
  quién viaja y adónde.
- **Herrería**. Cordelia? No: aquí es **Halia Thornton** quien gestiona el
  **Intercambio de Mineros**: humana, 35 años, ambiciosa, fría, cambia
  mineral por monedas, sabe cosas y las vende. Puede ofrecer trabajo sucio
  más adelante (Acto II).
- **Santuario de la Suerte**. Hermana Garaele (elfa, joven, clériga de
  Tymora), cura heridas por donativo, tiene un encargo propio: recuperar un
  libro de oraciones robado por goblins (ver "Encargos secundarios").
- **La Taberna del Sarcófago**? No existe aquí. Solo el Ciervo Dormido.
- **Granja de los Dunbar**, al norte del pueblo. Quemada hace una semana por
  el dragón. Ganado congelado. Los Dunbar (padre, madre, dos hijos) han
  desaparecido; en realidad huyeron a la posada de Umbrage Hill (ver más
  abajo).

### Rumores que se oyen en el Ciervo (uno o dos por visita)
1. El dragón se llevó tres vacas de los Dunbar y dejó una cuarta convertida
   en un bloque de hielo con forma de vaca.
2. Una enana con la barba trenzada de hierro baja cada mañana a preguntar por
   su hermano (es Dazlyn Cascagrís; ver "Excavación enana").
3. Los Capas Rojas ya no están; Halia Thornton se quedó con el hueco que
   dejaron. Ahora nadie cobra impuestos de la puerta, pero nadie molesta a
   Halia.
4. En Gnomengarde, los gnomos del rey han dejado de contestar a las cartas.
5. Un tipo con capa de hojas y mirada de loco vive en la torre de la
   curandera de Umbrage Hill. Dicen que habla con los halcones.
6. Alguien ha visto luces en la vieja casa señorial de Tresendar, en la loma
   del este. Nadie sube a mirar.

## EL TABLÓN (Encargos iniciales)
Tres pergaminos. Bram y Nissa pueden aceptar cualquiera; el Alcaide los
recibe a través de la puerta y suelta la recompensa por una rendija.

### 1. La bestia de Umbrage Hill (25 po)
"La curandera Adabra Gwynn está atrapada en el molino de Umbrage Hill por
una bestia. Rescatadla."
- Umbrage Hill: media jornada al sur. Molino de piedra en lo alto de una
  colina, aspas rotas.
- La bestia es una **mantícora** herida (perdió media cola en una pelea con
  el dragón). Está hambrienta y asustada. No quiere matar: quiere comida y
  que la dejen en paz. Tiene 15 PV de sus 68 originales. Puede ser
  **negociada** (Persuasión CD 13, o darle comida) o **espantada** (una
  herida más y huye volando).
- Adabra Gwynn: humana, 60 años, partera y herbolaria, seca y práctica.
  Recompensa por su parte: dos pociones de curación gratis y un consejo:
  "El dragón duerme de día en la cima. Nadie que suba de noche vuelve".
- **Secreto**: los Dunbar están escondidos en el sótano del molino. Adabra
  los ha estado curando. El niño pequeño tiene congelación en tres dedos.

### 2. Excavación enana (50 po)
"Dos hermanos enanos, Dazlyn Cascagrís y Norbus Yunquehierro, buscan una
mina perdida en las colinas del noroeste. No han vuelto. Llevadles
provisiones y traedlos vivos."
- Dazlyn está EN PHANDALIN (es la enana del rumor 2): vino a por ayuda y su
  socio Norbus se quedó guardando la excavación.
- La excavación: una jornada al noroeste, entre riscos. Norbus (enano,
  viejo, terco) sigue allí, cavando solo, con la mula muerta y sin comida.
- **Amenaza**: **dos orcos** exploradores de la banda de Gorthok (ver Acto II)
  han olido la comida. Llegan al anochecer del día en que lleguen los PJ.
  Son peligrosos para nivel 1: el narrador debe avisar con huellas, humo, un
  cuerno lejano. Se pueden emboscar, engañar o esperar dentro de la mina.
- **Recompensa extra**: Norbus da a los PJ una **piedra con vetas de plata
  y una runa** que Halia Thornton compraría por 100 po, y que Gnomengarde
  identificaría como parte de una llave (Acto II).

### 3. Gnomengarde (50 po)
"El rey de los gnomos de Gnomengarde no responde. Averiguad qué pasa."
- Gnomengarde: cuevas en un acantilado a una jornada al sur, con una
  cascada. Cincuenta gnomos inventores, dos reyes (Korboz y Gnerkli, casados,
  ambos reyes).
- Un **mimeto** se ha colado y ha devorado a dos gnomos. El rey Korboz se ha
  vuelto paranoico, ha encerrado al rey Gnerkli en su habitación y cree que
  todo es un mimeto. El mimeto está en la sala de la máquina del tiempo (un
  invento que no funciona), disfrazado de barril.
- Resolución: encontrar al mimeto (Investigación CD 12 o tocar el barril
  equivocado), matarlo o expulsarlo (tiene 28 PV; los gnomos ayudan con
  inventos ridículos: un cañón de confeti explosivo, una red que se dispara
  sola), y convencer a Korboz de que ya no hay peligro.
- **Recompensa extra**: los gnomos regalan una **varita de conjuros
  aleatorios** (1 carga/día: efecto sorpresa) y, si se les cae bien,
  arreglan cualquier objeto roto.

## ENCARGOS SECUNDARIOS (aparecen por conversación, no en el tablón)
- **El libro de la Hermana Garaele**: goblins de la banda de Cragmaw le
  robaron un libro de oraciones. Están en una cueva a medio día al este, con
  un lobo atado. Cuatro goblins: los PJ deben ser listos. 20 po y la
  bendición de Tymora (ventaja en una tirada, una vez).
- **Las luces de Tresendar**: la casa señorial en ruinas esconde un sótano
  donde se refugia un **necromante aficionado** llamado Iarno "Vidrio"
  Albrek, antiguo agente de los Capas Rojas, que intenta levantar a sus
  compañeros muertos. Tiene dos zombis torpes. Es peligroso pero cobarde:
  se rinde si pierde a los zombis. Gancho para el Acto II.

## ALIADOS POSIBLES (compañero PNJ que el narrador puede prestar)
- **Pip Piedracolina** (10 años). No lucha, pero conoce todos los atajos y
  se cuela donde nadie. Solo si los jugadores lo piden y se responsabilizan.
- **Dazlyn Cascagrís** (enana, guerrera, 30 años, franca, huele a hierro).
  Si los PJ aceptan buscar a Norbus, va con ellos. Combate bien (12 PV, hacha
  +4, 1d8+2). Nunca decide por los PJ.
- **Falcon**, el montaraz de Umbrage Hill (humano, 50 años, ermitaño, capa de
  hojas). Aparece si los PJ rescatan a Adabra. Da información sobre el
  dragón y se ofrece a guiarlos al Pico Escarcha en el Acto II.

## EL DRAGÓN (presencia en el Acto I)
Cryovain nunca se enfrenta a los PJ en el Acto I. Aparece:
- Como sombra que cruza el sol mientras viajan (todos callan, los caballos
  se encabritan).
- Como rastro: un rebaño congelado, un carro partido, huellas de garra del
  tamaño de una mesa.
- Como amenaza al final del acto: al volver del tercer encargo, el dragón
  sobrevuela Phandalin, congela el pozo de la plaza y se lleva a Halia
  Thornton por los aires. El Acto II empieza ahí.

## ANTAGONISTAS DEL ACTO I
- La banda de goblins de Cragmaw (encargo del libro).
- Los orcos de Gorthok (exploradores en la excavación; la banda entera es
  Acto II).
- El mimeto de Gnomengarde.
- La mantícora (que puede acabar como aliada si la alimentan).
- Iarno Albrek y sus zombis (opcional).

## FINAL DEL ACTO I
Cuando los PJ han completado dos encargos y vuelven al pueblo, el dragón
ataca la plaza al atardecer. No se le puede combatir: hay que salvar gente
(Pip bajo un carro, Toblen con la pierna atrapada, el Alcaide encerrado en
su casa que arde). Cada decisión salva a alguien y deja a otro. Halia
desaparece por los aires. Cierre: el pueblo mira a los PJ. Nivel 3.
`.trim(),
  opening: `
PRIMER TURNO. Es el anochecer del día en que los dos personajes llegan a
Phandalin bajo una lluvia fina, después de tres días de camino desde el
Camino Alto. Abre la escena en la Posada del Ciervo Dormido: el olor, los
mineros, Toblen secando una jarra y midiéndolos con la mirada. Toblen habla
al final (una sola frase suya, con carácter). Ofrece tres decisiones
distintas: una para cada personaje y una conjunta, escritas solo con lo que
ven y con lo que cada uno trae en su trasfondo. No menciones todavía la
lista completa del tablón: que la descubran.
`.trim(),
};

const CAMPAIGNS: Record<string, Campaign> = {
  [ICESPIRE_ACT1.id]: ICESPIRE_ACT1,
};

export { CAMPAIGNS, ICESPIRE_ACT1 };
export type { Campaign };
