# Role Master — plan de acción

**Estado (2026-09-07): esqueleto montado, alcance casi cerrado (ronda 2).**
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
| Dados 3D | `[ABIERTO]` candidato `@3d-dice/dice-box` (física + temas), pendiente informe |
| Imágenes | `[ABIERTO — en investigación]` ver §5 |

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
- **Puerta de acceso**: contraseña única en `APP_PASSWORD` (cookie firmada) para
  que nadie ajeno gaste la clave de Anthropic. Sin usuarios ni auth real.
- Variables: `ANTHROPIC_API_KEY`, `APP_PASSWORD`, `APP_SECRET` (firma de la
  cookie). En local en `.env`; en Vercel, entorno Preview.

## 5. Arte e ilustraciones `[ABIERTO — en investigación]`

Decisión de Miguel: **bancos de arte existentes**, licenciados sin problema
(uso privado), a poder ser **una sola web** que cubra todo, descargada por
script a `public/art` (no hotlink). Investigación en curso sobre:

- Objetos de inventario (todas las armas, armaduras, ropa, herramientas,
  pociones, pergaminos, gemas, monedas, comida, objetos mágicos).
- Retratos por raza básica (humano, elfo, enano, mediano, gnomo, semielfo,
  semiorco, tiefling, dracónido), géneros, edades, clases; PNJ y monstruos.
- Paisajes/escenas por lugar y momento.
- Tiles, props y tokens para el tablero táctico.
- Ornamentos de novela ilustrada (capitulares, viñetas, marcos, texturas).

Candidatos en evaluación: bg3.wiki (iconos de objeto de todo el juego, PNJ,
razas; MediaWiki con API), Forgotten Realms Wiki (arte oficial pintado),
wikis de CRPG con packs de retratos (Pathfinder, Pillars, Baldur's Gate),
Wikimedia Commons (Doré, Rackham, Bauer, Nielsen para el toque de grabado),
Forgotten Adventures / 2-Minute Tabletop / Dyson Logos para mapas y tiles.

Salida esperada: `scripts/sync-art.ts` que descarga por categorías y genera un
**catálogo tipado** (`src/data/art/*.ts`) con id, ruta, etiquetas (raza,
género, edad, tipo de objeto, bioma, hora, clima…) para que la IA y la UI
elijan imagen por etiquetas, nunca por nombre suelto.

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

## 10. Campañas — CERRADO (alcance)
Las **tres** desde el inicio, convertidas a biblias estructuradas (actos,
lugares, PNJ con retrato, encuentros con mapa, secretos, ganchos), adaptadas
a **dos jugadores + compañero PNJ**, en este orden:
1. *El Dragón del Pico Escarcha* (Essentials Kit): diseñado explícitamente
   para grupos pequeños con sidekicks; misiones modulares; niveles 1-6.
2. *La Mina Perdida de Phandelver*: niveles 1-5, lineal y perfecto para novatos;
   encuentros reescalados.
3. *La Maldición de Strahd*: niveles 1-10, gótico; para dos jugadores se apoya
   en aliados PNJ del propio módulo (Ireena, Ismark, Ezmerelda, Van Richten).
Además, **campaña original** generada por la IA a partir de semillas.

## 11. Fuera de alcance — CERRADO
Voz/TTS, música ambiente, multi-dispositivo. El tablero táctico **sí** entra.

## 12. Pendiente de Miguel
- [ ] API key de Anthropic (pasos en `.claude/setup-anthropic.md`).
- [ ] Marcar `develop` como rama por defecto en GitHub.
- [ ] Crear el proyecto en Vercel, asociar el repo y `develop` → Preview.
- [ ] Confirmar la fuente de arte cuando llegue el informe (§5).
