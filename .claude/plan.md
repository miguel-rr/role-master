# Role Master — plan de acción

**Estado (2026-09-08): diseño aprobado; motor de juego en marcha (`/` menú, `/play` escena narrada por Claude, `/api/turn`). Laboratorio `/design` se conserva como referencia (sin la propuesta "Pasaje").**
Este documento es la fuente de verdad del proyecto: se actualiza con cada
decisión cerrada con Miguel. Las secciones `[ABIERTO]` esperan respuesta o
investigación.

## 1. Qué es

Una web privada que hace de Dungeon Master de Dungeons & Dragons 5e para **dos
jugadores en la misma pantalla** (Miguel y un amigo, novatos). La IA narra,
interpreta PNJ, plantea decisiones y resuelve consecuencias. Dos pilares:

1. **Narrativa** al nivel de Critical Role: original, sin muletillas, con voz
   propia, comprensiva cuando toca y dura cuando se lo merecen.
2. **Diseño** de novela ilustrada, **sin escatimar detalle**: ilustración para
   cada objeto de inventario, paisajes que cambian con la escena, retrato para
   cada personaje y cada PNJ con el que se hable, tablero táctico en cuadrícula
   con movimiento real por distancia, dados 3D animados, fichas que parecen
   papel.

Privado, sin base de datos, desplegado solo como *preview* en Vercel.

## 2. Stack (deducido de `frikiparty`, recortado a lo necesario) — CERRADO

| Pieza | Decisión |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript estricto, `src/`, alias `@/*` |
| Estilos | Tailwind CSS v4 (`@tailwindcss/postcss`), tokens en `src/styles/` |
| Lint/format | Biome 2, `biome.jsonc` de frikiparty. `pnpm check`, `pnpm check:write`, `pnpm typecheck` |
| Gestor | pnpm 11 |
| Validación / env | Zod 4 + `@t3-oss/env-nextjs` en `src/env.ts` (instalados 2026-09-07) |
| IA (texto) | `@anthropic-ai/sdk` 0.124 (instalado). Modelo **elegible al crear la campaña**: `claude-opus-5` o `claude-fable-5-1`. Streaming, adaptive thinking, salidas estructuradas (`output_config.format`), prompt caching, compaction para partidas largas. Con Fable se activa `fallbacks: "default"` (si un turno es rechazado por los clasificadores, lo sirve otro modelo sin cortar la partida) |
| Dados 3D | `@3d-dice/dice-box` (propuesta, ver §5) |
| Imágenes | Bancos de arte por script (propuesta, ver §5) |

**Descartado**: tRPC, TanStack Query, Drizzle/Neon, better-auth, R2/S3,
generación de imágenes con IA (Miguel prefiere bancos de arte existentes).

### Convenciones (heredadas de frikiparty)
- Literales de UI, prompts y docs en **español**; código, variables, rutas y
  ficheros en **inglés**.
- Server Components por defecto; `'use client'` solo con estado/efectos.
- Sin `any`. Tipos inferidos de Zod. Nunca `process.env` suelto.
- `pnpm typecheck` y `pnpm check` en verde antes de dar algo por terminado.
- Rama de trabajo **`develop`** (creada y subida 2026-09-07). `main` queda
  como base; Miguel la marcará como rama por defecto en GitHub.

## 3. Persistencia — CERRADO

- Estado de la partida en el navegador (IndexedDB vía una capa fina propia;
  localStorage solo para preferencias). Requisito mínimo: **sobrevivir al
  refresco**. Extra barato: exportar/importar JSON como "guardar partida".
- Datos de referencia (razas, clases, presets, campañas, catálogo de arte) como
  módulos TypeScript/JSON estáticos en el repo.

## 4. Despliegue — CERRADO

- Repo `git@github.com:miguel-rr/role-master.git`. Miguel crea el proyecto en
  Vercel, lo asocia al repo y **`develop` → Preview**. Sin URL de producción.
- **No indexable**: `robots: { index: false, follow: false }` en el layout raíz
  (ya está), `robots.txt` con `Disallow: /`, y cabecera `X-Robots-Tag: noindex,
  nofollow` desde `next.config.ts`. Vercel ya añade `noindex` a las previews;
  lo reforzamos igualmente.
- **Puerta de acceso**: las previews de Vercel ya exigen iniciar sesión con la
  cuenta de Vercel de Miguel (*Deployment Protection*, activo por defecto y
  verificado 2026-09-07: redirige a `vercel.com/sso-api`). Con eso basta: se
  descarta la contraseña propia (`APP_PASSWORD`) salvo que se quiera abrir la
  web a dispositivos del amigo sin la cuenta de Miguel.
- Variables: `ANTHROPIC_API_KEY` en `.env` local y en Vercel (Preview y
  Development, subida por CLI el 2026-09-07). Proyecto enlazado
  (`.vercel/`, ignorado por git).
- Verificado: cada push a `develop` genera una Preview (build ~16 s);
  URL estable `https://role-master-git-develop-cangrejus.vercel.app`;
  cabecera `X-Robots-Tag: noindex` presente. Existe un despliegue de
  Production del primer import de `main`; queda inerte porque `main` no
  recibe commits.

## 5. Arte e ilustraciones — CERRADO (OK de Miguel 2026-09-07)

Decisión de Miguel: bancos de arte existentes (uso privado, se acepta
material con copyright), descargados por script a `public/art`, nunca hotlink.
Investigación completa en `.claude/art-sources.md`. No existe una única web
que lo cubra todo con calidad; la combinación mínima es:

| Necesidad | Fuente | Cómo |
|---|---|---|
| Objetos de inventario (~2.100, 380 px, transparentes, estilo único) | **bg3.wiki** | Script por API MediaWiki |
| Retratos PJ/PNJ y monstruos (miles, arte oficial pintado, etiquetado por raza/género/clase/criatura) | **Forgotten Realms Wiki** | Script por API Fandom |
| Selector limpio de retrato de PJ (80 retratos 692×1024 por raza/género/clase) | **Pathfinder Kingmaker wiki** | Script por API Fandom |
| Paisajes por lugar (tabernas, bosques, cuevas, ciudades, mazmorras…) | **Forgotten Realms Wiki** (categorías de lugares) + **Wikimedia Commons** (Doré, Bauer, Bilibin, Rackham: dominio público, para el toque de grabado) | Script por API |
| Tiles y props del tablero (tinta + acuarela, 70 px/casilla) | **2-Minute Tabletop** (gratis, CC BY-NC) + **Gosbell** CC0 + **Forgotten Adventures** `!Core` para huecos | Zips que descarga Miguel (requieren cuenta gratuita) y deja en `art-src/` |
| Tokens | Forgotten Adventures gratuitos + **tokens generados desde retrato** (recorte circular en Canvas) | Zip + código |
| Mapas de encuentro señalados | **Dyson Logos** (tinta) y 2-Minute Tabletop | Selección manual |
| Ornamentos (capitulares, marcos, filigranas) | Doré/Commons + SVG propio | Código |

Salida: `scripts/sync-art.ts` (descarga con throttle y User-Agent) + catálogo
tipado `src/data/art/*.ts` con id, ruta, etiquetas (raza, género, edad, clase,
tipo de objeto, bioma, hora, clima, ambiente) para que la IA y la UI elijan
imagen **por etiquetas**. Estándar interno del tablero: **70 px = 5 pies**.

### Dados 3D — CERRADO
`@3d-dice/dice-box` (MIT, BabylonJS + física, d4-d100, temas con textura,
color por jugador). Es la única librería mantenida; integración verificada en
Next 16 / React 19 con carga dinámica sin SSR y copia de assets a `public/`.

## 6. Narrativa (motor de la IA) — CERRADO en lo esencial

### 6.1 Arquitectura
- **Un narrador** con system prompt largo y cacheado: biblia de estilo + reglas
  de mesa + estado de la partida + biblia de campaña.
- Cada turno devuelve una **respuesta estructurada** (Zod): pasaje (markdown
  ligero), escena (lugar, hora, clima, tensión, etiquetas de ilustración),
  PNJ presentes (con etiquetas para elegir retrato), cambios de ficha (PV,
  oro, objetos, condiciones, XP), tirada solicitada, orden de tablero táctico
  si arranca combate, y el **bloque de interacción** (§6.4).
- **Memoria**: historial reciente + "diario de campaña" con hechos fijos (PNJ
  conocidos, promesas, enemigos, hilos abiertos) que la IA actualiza cada pocas
  escenas. Compaction del servidor en sesiones largas. "Anteriormente en…" al
  abrir sesión.
- Selección de modelo (Opus 5 / Fable 5.1) **solo al crear la campaña**; queda
  fijada en el guardado.

### 6.2 Biblia de estilo
- Prohibición de muletillas y estructuras repetidas; rotación de aperturas.
- Voz de narrador con opinión; humor cuando entra bien, nunca forzado.
- **Tono adulto, sin límites de contenido** (violencia, temas duros) al servicio
  de la historia, sin regodeo gratuito.
- PNJ con dialecto, acento y motivaciones propias; **cada PNJ nos trata como
  le encaje** (desprecio, miedo, adulación, indiferencia).
- **El máster nos tutea** cuando se dirige a nosotros como jugadores ("tira los
  dados", "busca en tu inventario"). Español de España.
- Consecuencias reales. Longitud variable a propósito.
- No pregunta "¿qué hacéis?": el bloque de interacción lo hace.

### 6.3 Reglas, dados y combate — CERRADO
- D&D 5e (SRD 5.1, reglas de 2014: es lo que siguen los tres módulos elegidos).
- Híbrido: la app es dueña de los números (fichas, PV, espacios de conjuro,
  inventario) y de los dados; la IA narra y pide tiradas indicando
  característica, CD y qué se juega.
- **Dados 3D animados** con física, temas por jugador, lectura automática del
  resultado, ventaja/desventaja, críticos celebrados.
- **Combate en tablero táctico con cuadrícula** (casillas de 5 pies): la IA
  describe la escena como datos (tamaño, terreno, obstáculos, posiciones
  iniciales), la app la renderiza con tiles y props; los tokens llevan el
  retrato; movimiento real por velocidad (alcance resaltado, terreno difícil,
  ataques de oportunidad), alcance de armas y conjuros, cobertura básica,
  iniciativa, condiciones. La IA mueve a los PNJ y enemigos con intención
  táctica y narra cada acción.
- **Muerte permanente** configurable al crear la campaña: *No* / *Altamente
  improbable* / *Puede pasar*. Se inyecta en el prompt y en las reglas de
  salvación contra muerte.

### 6.4 Modos de interacción (dos jugadores, una pantalla)
La IA elige el modo en cada turno; la interfaz lo renderiza:

| Modo | Quién actúa | Cómo se ve |
|---|---|---|
| `both-choose` | Ambos, cada uno sus opciones | Dos columnas, una por personaje |
| `spotlight` | Solo uno | La columna del otro se atenúa |
| `group` | Decisión conjunta única | Una lista al centro |
| `secret-agreement` | Cada uno elige a ciegas; se revela a la vez | "Pásame la pantalla": opciones ocultas; si coinciden, ventaja narrativa |
| `whisper` | Solo uno ve información | Contenido desenfocado hasta pulsar; el otro mira a otro lado |
| `free-text` | Cualquiera | Campo "hacéis otra cosa…" siempre disponible |
| `roll` | Uno o ambos tiran | Dados 3D; éxito/fallo/crítico |
| `vote-veto` | Uno propone, el otro puede vetar una vez | Dos pasos |
| `haggle` | Ofertas a un PNJ | Regateo con oro/favores |
| `timed` | Cuenta atrás | Presión en acción |
| `split-party` | Escenas paralelas | Dos pasajes alternos |
| `tactical` | Combate en cuadrícula | Tablero a pantalla completa |

## 7. Personajes — CERRADO
- Se **crean en la app**, con **presets clásicos para principiantes** (el
  guerrero humano, la pícara mediana, el clérigo enano, la maga elfa, el
  explorador semielfo, el bárbaro semiorco…) editables paso a paso.
- Razas básicas: humano, elfo, enano, mediano, gnomo, semielfo, semiorco,
  tiefling, dracónido. Clases SRD. Nivel inicial según campaña (1).
- Ficha "en papel": hoja doble para los dos, con retrato, inventario ilustrado,
  conjuros, condiciones.
- **Compañero PNJ** controlado por la IA para que los módulos de 4-5 PJ
  funcionen con dos jugadores (regla de *sidekick* del Essentials Kit).

## 8. Nivel de acabado visual — CERRADO (2026-09-07)
**Listón**: que al abrir la web se pueda pensar que es una **página oficial de
Dungeons & Dragons**. Implica estudiar el lenguaje visual oficial (dndbeyond.com,
dnd.wizards.com, las maquetas de los manuales de 5e: cabeceras en serif con
versalitas, rojo D&D sobre carbón, dorados, filigranas, bloques de estadísticas
en pergamino, capitulares, marcos de sección), sacar una **guía de estilo**
propia (`.claude/design-system.md`) con tokens, tipografías equivalentes en
Google Fonts y ornamentos SVG, y aplicarla con rigor en cada pantalla. Sin
prisa: el tiempo que haga falta para reunir referencias y acertar.

## 9. Dispositivos y maqueta — CERRADO
- Portátil y **TV grande vista a varios metros**: tipografía generosa, alto
  contraste, y un **modo TV** que escala la interfaz y simplifica los bloques
  de interacción para que se lean desde el sofá. Dos columnas (una por
  personaje) en horizontal.

## 10. Campañas — CERRADO (alcance, revisado 2026-09-07)
Investigación completa en `.claude/campaigns-research.md`. Biblias
estructuradas (actos, lugares, PNJ con retrato, encuentros con mapa,
secretos, ganchos), adaptadas a **dos jugadores + compañero PNJ**, en este
orden:
1. *El Dragón del Pico Escarcha* (Essentials Kit, 1-6): la única oficial
   pensada para 1-2 jugadores, con reglas de *sidekick*; misiones modulares.
2. *La Mina Perdida de Phandelver* (1-5): la más recomendada para dos; Sildar
   y Gundren como compañeros, nivel 2 pronto, encuentros recortados.
3. *First Blush* (D&D Duet, 1-2, dos sesiones): tutorial para dos novatos,
   diseñada para enseñar a jugar.
4. *La Maldición de Strahd* (3+): segunda campaña; Ismark e Ireena como
   compañeros y el aliado de la Tarokka como PJ de apoyo; Death House suavizada.
Además, **campaña original** generada por la IA a partir de semillas.
**Duración estimada** (campo `duration` de cada biblia; se muestra en el
menú y en «La compañía»): no hay medición propia todavía; el cálculo parte
de las cifras de mesa de la investigación (Pico Escarcha completo, 15-25
sesiones) y asume una sesión de 2-3 horas por encargo para dos jugadores con
narrador de IA. Acto I: 3-5 sesiones, 8-15 horas. Cuando haya partidas
reales, sustituir por turnos y minutos medidos (`history[].turn` con
`updatedAt` ya da la base).
Escalado a dos PJ: multiplicador siguiente del DMG 2014, sanador o pociones
siempre a mano, salida posible de cada combate.

## 11. Fuera de alcance — CERRADO
Voz/TTS, música ambiente, multi-dispositivo. El tablero táctico **sí** entra.

## 12. Pendiente de Miguel
- [x] API key de Anthropic (2026-09-07).
- [x] `develop` rama por defecto en GitHub (2026-09-07).
- [x] Proyecto en Vercel, `develop` → Preview verificado (2026-09-07).
- [x] OK a arte y dados (2026-09-07).
- [ ] Descargar los zips de 2-Minute Tabletop y Forgotten Adventures (cuentas gratuitas) cuando toque el tablero.

## 13. Estado del laboratorio `/design` (2026-09-08)
Construido y revisado en navegador (portátil 1600 px). Secciones: portada,
pasaje ilustrado (manual + variante TV), retratos con generador, inventario
ilustrado, fichas en papel de los dos PJ, nueve bloques de decisión
interactivos, tablero táctico con movimiento real, bandeja de dados 3D, guía
de color y tipografía. Fuentes de 5e auto-alojadas (`src/fonts/5e`).
Pendiente: revisión de Miguel; escenas de paisaje llegan con el catálogo.
Notas técnicas: los iconos de inventario del demo usan nombres de bg3
(`icon` en `src/data/demo/characters.ts`); Nodesto no tiene mayúsculas
acentuadas y `<Caps>` dibuja el acento; las previews de Vercel exigen login.

### Revisión de Miguel (2026-09-08, ronda 1)
- Diseño general: aprobado ("me encanta").
- **Dados**: rehecha la bandeja (v2). Selector de tipo y cantidad con varios
  grupos (p. ej. 6d6 + 2d3), d2/d3 virtuales sobre d4/d6, modificador,
  atajos; arranque robusto (detección de WebGL, tiempo máximo de 20 s) con
  **respaldo 2D** honesto y tiempo máximo por tirada de 9 s (si un dado no se
  asienta, se completa por sorteo y se avisa). Pendiente que Miguel confirme
  que ve la animación 3D en su navegador; desde la sesión automatizada no se
  puede comprobar (la pestaña está oculta y el navegador pausa el render).
- **Retratos**: Miguel quiere una sola línea visual. Añadido filtro por
  **serie (libro de origen)** con conteos y un interruptor "ocultar fondo
  blanco" (etiqueta `white-bg` calculada por luminancia de esquinas con
  `pnpm art:tag-backgrounds`: 165/678 razas, 125/508 PNJ, 340/919 monstruos).
  Cuando elija series, se fijan como conjunto por defecto del juego.

### Serie de retratos elegida (2026-09-08)
Favoritos de Miguel (todos de la misma serie): `portraits/pc/aeonnogendermage`,
`portraits/pc/dwarfmalerogue`, `portraits/pc/lichmalemage`,
`portraits/pc/playerdruid01`, `portraits/pc/playerfighter01` — retratos
pintados de **Owlcat Games** (Pathfinder: Kingmaker y Wrath of the Righteous,
wiki `pathfinderkingmaker.fandom.com`). **Decisión**: esa serie es la línea
visual de los retratos de PJ y PNJ (formato vertical, fondo pintado, misma
mano). El arte oficial de Wizards queda para monstruos, escenas y como reserva
cuando falte una combinación. Se amplía la descarga a compañeros, personajes,
versiones *artbook* (1.800 px) y las categorías de retratos de ambos juegos.

### Propuesta 08 · Escenas completas (2026-09-08)
Ruta `/design/scenes` (enlazada desde `/design`): pasajes a pantalla completa
estilo novela gráfica. Cada escena es un registro de datos (lugar, capítulo,
hora, fondo + foco, figura y lado, hablante, párrafos, cita, decisiones,
atmósfera, gradación de color, acento) y el escenario lo renderiza: fondo con
movimiento lento y fundido, figura integrada con máscara y luz de borde,
partículas por ambiente (brasas, polvo, nieve, luciérnagas, niebla), texto que
se revela con clic para completar, decisiones por jugador, HUD del grupo y
tira de escenas con teclado. Ocho escenas: taberna, mina, cueva (lechuzo-oso),
palacio, bosque, montañas (dragón blanco), camino (Señor Ciervo), noche
(Ravenloft). Fondos elegidos a mano con `pnpm art:sheet` y bajados a 1920 px
con `pnpm art:hd`. Este contrato de datos es el que emitirá el narrador.

## 14. Motor de juego (2026-09-08) — construido y probado sin API
- **Contrato narrador ↔ escena** en `src/lib/game/schema.ts`: cada turno es
  `{ place, chapter, time, sceneTags, atmosphere, mood, figure, beats,
  choices (con roll opcional), effects, memory, summary, sceneEnds }`. Los
  `who` son ids de personaje o `"both"`; la ruta estrecha el esquema a los dos
  personajes de la mesa (`sceneTurnSchemaFor`) antes de pedir la salida
  estructurada a Claude (`src/app/api/turn/route.ts`; Opus 5 / Fable 5.1 con
  `fallbacks: "default"`).
- **Prompt en tres capas** (`src/lib/game/prompt.ts`): voz y oficio,
  biblia de campaña, estado de mesa (quién lleva a quién, fichas con
  trasfondo y gancho, memoria, política de muerte, vocabulario de arte).
- **Arte por etiquetas** (`src/lib/game/art-resolver.ts`): fondo por
  `sceneTags` con preferencia por los `featured` (los ocho elegidos a mano
  para `/design/scenes`), luego pintura 5e; personajes del conjunto Owlcat;
  criaturas por `monsterTag`; `npcArt` fija la cara de cada `npcId`. Los
  fondos en blanco y negro se borraron del catálogo (`pnpm art:prune-mono`:
  160 de scenes-fr y los 20 grabados de Doré).
- **Tiradas**: siempre las lanza el usuario. La decisión abre la bandeja
  (`DiceModal`, la misma de `/design`), nada rueda hasta pulsar «Tirar»; el
  resultado se guarda con éxito/fallo y se muestra como «Última decisión»
  junto al texto siguiente. La taberna del laboratorio usa la misma bandeja.
  Preferencia `localStorage["role-master:dice-2d"]="1"` para dados planos.
- **Persistencia**: `localStorage["role-master:game:v2"]`
  (`src/lib/game/storage.ts`), una partida por navegador.
- **Elenco** (`src/data/characters/presets.ts`): seis presets de nivel 1
  con trasfondo y gancho en el Acto I (Bram, Nissa, Dagna, Sariel, Corran,
  Thokk), retrato Owlcat fijo. `src/data/demo/characters.ts` es un alias de
  los dos primeros para el laboratorio.
- **Flujo de entrada**: `/` (estantería de campañas: héroe destacado,
  «Seguir jugando», filas por tipo y tono, banner) → `/campaigns/[id]`
  (portada, narrador, muerte, elenco) → `/setup` (Lon elige, Jato elige;
  dosier con historia, ficha en papel y mochila; «La compañía») → `/play`.
  El catálogo vive en `src/data/campaigns/catalog.ts`. Miguel aprobó la
  estantería con las 16 campañas anunciadas (2026-09-08): se quedan como
  portadas «Próximamente» (`mock: true`) hasta que cada una tenga biblia;
  al escribirla, `available: true` y quitar la marca. Los jugadores se llaman Lon y Jato (`PLAYERS` en
  `src/app/setup/_components/setup-flow.tsx`).
- **En partida**: retratos del HUD, tecla I o el botón «Fichas» abren la
  superposición con la ficha en papel y la mochila ilustrada con PV, oro y
  objetos vivos (`party-overlay.tsx`, `liveCharacter`).
- **Cartas de objeto**: en la ficha y en la mochila, pulsar un objeto abre
  su carta junto al icono (`src/components/items/item-tile.tsx`): tipo,
  rareza, precio, propiedades y una línea de descripción, desde
  `src/data/items/lore.ts` (por nombre en español; lo que el narrador
  reparte sin entrada conocida sale con una carta genérica).
- **Narrador de guion sin API** (`src/lib/game/mock-narrator.ts`,
  `MOCK_NARRATOR=1`): historia corta completa (taberna con Toblen, sendero,
  mantícora con revelación, Adabra, epílogo) con ramas por éxito/fallo,
  daño, oro, objetos, atmósferas y fin de escena. `pnpm dev:mock` lo sirve
  en 3001.
- **Pruebas** (`pnpm test` = `test:unit` + `test:e2e`): vitest en
  `tests/unit` (tiradas, esquema, elenco, efectos, guion) y Playwright en
  `tests/e2e/campaign.spec.ts` (menú → selección → compañía → partida entera
  con dados, texto libre, ficha, mochila, criatura, efectos, recarga y
  continuar; más la taberna del laboratorio). El e2e levanta un build de
  producción en el puerto 3002 con `MOCK_NARRATOR=1` y aborta si una
  respuesta no viene marcada como `x-narrator: mock`. Capturas en
  `test-results/shots/`.
- Pendiente: creador de personajes propio, tablero táctico en combate,
  exportar/importar partida, streaming del texto para acortar la espera.

## 15. Sonido (2026-09-08) — fase 1 construida
Propuesta completa en `.claude/sound-proposal.md` (Miguel aprobó: audio en
el repo, motor propio, solo fuentes gratuitas, página de créditos, portátil
y televisor, sin voz por ahora).
- **Motor** `src/lib/sound/engine.ts`: Web Audio sin dependencias; buses
  música / ambiente / efectos / interfaz → master con limitador; música por
  dos `<audio>` alternos con fundido equal-power; camas decodificadas en bucle
  sin hueco; puntuales aleatorios cada 12-42 s con tono y paneo variados;
  mezcla en `localStorage["role-master:sound:v1"]`; `unlock()` en un gesto.
- **Vocabulario** `src/data/sound/vocabulary.ts` (situaciones, lugares,
  hora, clima, tensión, cues de escena, cues de interfaz). El turno lleva
  `sound { music, ambience, cues }` con "keep" como valor normal; el
  resolutor `src/lib/sound/resolver.ts` elige piezas con continuidad (evita
  repetir la última pista; deriva el lugar de `sceneTags` si el narrador
  calla) y devuelve `soundtrack` en el turno resuelto.
- **Biblioteca**: `scripts/audio/sync.ts` + `scripts/audio/jobs.ts`
  (Incompetech por reglas y lista de títulos, OpenGameArt por página, Kenney
  por zip, Freesound por consulta CC0 con clave). Normaliza sonoridad por
  capa (−18/−24/−20/−16 LUFS), Opus 96/64/48 kb/s + AAC de respaldo, camas
  recortadas a 3 min. Manifiestos en `src/data/sound/manifests/`.
- **Pantalla** `/soundcheck` entre «La compañía» y `/play`: «Probar el
  sonido», mezcla, «Lo oigo, adelante» / «Seguir sin sonido». En partida:
  altavoz en el HUD con la mesa, tecla M, pastilla «Activar sonido» si el
  navegador suspende el audio; pasar página por turno, clic de decisión,
  dados (traqueteo, caída, crítico, pifia), revelación de criatura, cues por
  párrafo.
- **Laboratorio** `/design/sound`: audición de la biblioteca por capa y
  etiqueta para curar.
- Pendiente (fase 2-3): Freesound cuando llegue la clave (camas de taberna,
  lluvia, viento, cueva… y puntuales), curación de Miguel, página `/credits`,
  tensión progresiva, día/noche automático, latido con pocos PV, sonidos de
  carta de objeto.
