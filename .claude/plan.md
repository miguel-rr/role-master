# Role Master — plan de acción

**Estado (2026-09-07): esqueleto montado, alcance en definición.** Este documento
es la fuente de verdad del proyecto: se actualiza con cada decisión cerrada con
Miguel. Las secciones marcadas `[ABIERTO]` esperan respuesta.

## 1. Qué es

Una web privada que hace de Dungeon Master de una partida de Dungeons & Dragons
para **dos jugadores en la misma pantalla** (Miguel y un amigo). La IA narra,
interpreta PNJ, plantea decisiones y resuelve consecuencias. Dos pilares:

1. **Narrativa** al nivel de Critical Role: original, sin muletillas, con voz
   propia, comprensiva cuando toca y dura cuando se lo merecen.
2. **Diseño** de novela ilustrada: ilustraciones que acompañan los pasajes,
   retratos por raza (con generador), y fichas de personaje que parezcan la
   hoja de papel.

Proyecto privado: corre en local o en un servidor gratuito. Sin base de datos.

## 2. Stack (deducido de `frikiparty`, recortado a lo necesario)

| Pieza | Decisión | Nota |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript estricto | Igual que frikiparty. `src/`, alias `@/*`. |
| Estilos | Tailwind CSS v4 vía `@tailwindcss/postcss`, sin `tailwind.config` | Tokens en `src/styles/globals.css`, temas en `src/styles/theme-*.css`. |
| Lint/format | Biome 2 (`biome.jsonc` copiado de frikiparty: comillas simples, `;`, trailing commas, imports y clases ordenadas, `noDefaultExport` salvo ficheros de convención Next) | `pnpm check`, `pnpm check:write`, `pnpm typecheck`. |
| Gestor | pnpm 11 | |
| Fuentes | `next/font/google` | A elegir en la fase de diseño. |
| Validación | Zod | Para las salidas estructuradas de la IA y el esquema de env. |
| Env | `@t3-oss/env-nextjs` + `src/env.ts` | Misma convención que frikiparty: nunca `process.env` suelto. |
| IA (texto) | `@anthropic-ai/sdk` (SDK oficial), modelo `claude-opus-5`, streaming, adaptive thinking, prompt caching, compaction para partidas largas | Ver §4. |
| IA (imagen) | `[ABIERTO]` | Ver §5. |

**Descartado a propósito**: tRPC, TanStack Query, Drizzle/Neon, better-auth,
R2/S3. No hay DB ni usuarios: las route handlers de Next (`src/app/api/*`)
bastan para hablar con la IA desde el servidor (la clave nunca llega al
navegador).

### Convenciones (heredadas de frikiparty)
- Literales de UI en **español**; código, variables, rutas y ficheros en **inglés**.
- Server Components por defecto; `'use client'` solo con estado/efectos.
- Sin `any`. Tipos inferidos de Zod.
- Documentación de proyecto en `.claude/*.md`, en español.
- `pnpm typecheck` y `pnpm check` en verde antes de dar algo por terminado.

## 3. Persistencia sin base de datos `[ABIERTO — propuesta]`

- El **estado de la partida** (historia, fichas, inventario, decisiones,
  resúmenes de capítulo) vive en el navegador (IndexedDB/localStorage) con
  **exportar/importar** a un fichero JSON ("guardar partida").
- Los **datos de referencia** (razas, clases, campañas prefijadas, biblioteca
  de ilustraciones) son ficheros TypeScript/JSON estáticos en el repo.
- Ventaja: funciona igual en local que en Vercel Hobby, sin coste ni cuentas.
- Riesgo: si se borra el almacenamiento del navegador se pierde la partida →
  el botón de exportar es obligatorio y se recuerda al final de cada sesión.

Alternativa si se juega siempre en local: guardar en `data/*.json` en disco
(no funciona en Vercel).

## 4. Narrativa (motor de la IA)

### Arquitectura
- **Un narrador** (Opus 5) con system prompt largo y cacheado: biblia de estilo
  + reglas de mesa + estado de la partida + campaña.
- La respuesta de cada turno es **estructurada** (Zod): pasaje narrativo
  (markdown ligero), estado de escena (lugar, hora, clima, tensión), cambios
  de ficha (PV, oro, objetos, condiciones), tirada solicitada (si procede),
  y el **bloque de interacción** (ver §4.3).
- **Memoria de campaña**: además del historial reciente, un "diario" con hechos
  fijos (PNJ conocidos, promesas, enemigos, hilos abiertos) que la IA actualiza
  cada pocas escenas. Compaction del servidor para sesiones largas.
- "Anteriormente en…": resumen automático al abrir sesión.

### 4.1 Biblia de estilo (lo que hará que no suene a IA)
- Prohibiciones explícitas de muletillas y estructuras repetidas; rotación de
  aperturas (nunca dos pasajes seguidos con la misma forma).
- Registro: voz de narrador con opinión, humor seco cuando encaja, crudeza sin
  regodeo. Los PNJ tienen dialecto y motivaciones, no son surtidores de misión.
- Consecuencias reales: el mundo no espera, los fallos duelen, la muerte es
  posible (regla a confirmar, §8).
- Longitud variable a propósito: un pasaje corto y seco tras un golpe, uno
  largo al entrar en un lugar nuevo.
- Se le pide que **no pregunte "¿qué hacéis?"** salvo cuando el bloque de
  interacción lo requiera: el diseño de la interfaz ya lo hace.

### 4.2 Reglas y dados `[ABIERTO]`
Propuesta híbrida: la app es dueña de los números (fichas, PV, espacios de
conjuro, dados visibles con animación); la IA narra y pide tiradas indicando
característica, CD y qué se juega. Combate en "teatro de la mente" con
rastreador de iniciativa, sin tablero táctico.

### 4.3 Modos de interacción (dos jugadores, una pantalla)
La IA elige el modo en cada turno; la interfaz lo renderiza. Catálogo inicial:

| Modo | Quién actúa | Cómo se ve |
|---|---|---|
| `both-choose` | Ambos, cada uno sus opciones | Dos columnas, una por personaje |
| `spotlight` | Solo uno (la escena le apunta) | La columna del otro se atenúa |
| `group` | Decisión conjunta única | Una sola lista de opciones al centro |
| `secret-agreement` | Cada uno elige a ciegas; se revela a la vez | Turno de "pásame la pantalla": uno elige con la opción oculta, luego el otro. Si coinciden, ventaja/bonus narrativo |
| `whisper` | Solo uno ve información | El otro mira a otro lado; contenido desenfocado hasta pulsar |
| `free-text` | Cualquiera / ambos | Campo de texto libre "hacéis otra cosa…" siempre disponible |
| `roll` | Uno o ambos tiran | Dado grande animado; resultado con éxito/fallo |
| `vote-veto` | Uno propone, el otro puede vetar una vez | Dos pasos |
| `bid` / `haggle` | Cada uno ofrece algo (oro, favor) | Regateo con PNJ |
| `timed` | Cuenta atrás | Presión en escenas de acción |
| `split-party` | Escenas paralelas | Dos pasajes a la vez, alternando |

### 4.4 Coste orientativo
Con caching, un turno son ~6-10k tokens de entrada (en gran parte cacheados) y
~500-1.000 de salida. Con Opus 5, una sesión de 2 h (~60 turnos) queda en
torno a 2-4 USD. Bajar a Sonnet 5 dividiría por 2,5 a costa de la prosa.

## 5. Imágenes `[ABIERTO — decisión clave]`

Necesidades: (a) ilustraciones de pasaje por lugar/ambiente/momento, (b)
retratos por raza y variantes (género, edad, clase) con **generador**, (c)
ornamentos de novela ilustrada (capitulares, viñetas, marcos, texturas de papel).

Opciones sobre la mesa:
1. **Biblioteca pregenerada con IA** durante el desarrollo (estilo unificado:
   tinta + acuarela / grabado), guardada en `public/art`. En tiempo de juego
   es gratis e instantánea. Requiere una clave de un proveedor de imagen
   (Anthropic no genera imágenes): OpenAI `gpt-image-1`, o Vercel AI Gateway
   (con una sola clave se accede a Flux, Imagen, gpt-image…).
2. **Generación en tiempo real** por pasaje/retrato (además de 1): espectacular
   pero lenta (10-20 s) y con coste por imagen (~0,02-0,08 USD).
3. **Arte de dominio público** curado: Doré, Rackham, John Bauer, Kay Nielsen,
   Wyeth… encaja de lleno con "novela ilustrada" y no cuesta nada. Limitado
   para retratos por raza.
4. **Arte oficial de D&D / BG3** descargado a mano (uso privado). No lo puedo
   descargar yo de forma fiable; podrías aportarlo tú a `public/art/official`.

Propuesta: 1 + 3 como base, 2 opcional tras un interruptor.

## 6. Ruta `/design`

Laboratorio de propuestas, no producto final:
- **Portada y tipografía**: 3 direcciones (grabado victoriano; acuarela
  cálida; grimorio oscuro dorado tipo frikiparty).
- **Pasaje ilustrado**: cómo se ve un turno de narración con su ilustración.
- **Galería de retratos por raza** + **generador** (raza, género, edad,
  clase, rasgos → retrato).
- **Ficha de personaje "en papel"**: hoja doble para dos jugadores.
- **Bloques de interacción**: uno por modo de §4.3.
- **Dados** y rastreador de iniciativa.

## 7. Campañas `[ABIERTO]`

Dos vías, ambas en el plan:
- **Originales**: la IA genera una campaña a partir de semillas (tono, región,
  villano, duración) y la desarrolla con un esqueleto de actos.
- **Prefijadas** (petición de Miguel, 2026-09-07): módulos oficiales de D&D
  convertidos a una "biblia de campaña" estructurada (actos, lugares, PNJ,
  encuentros, secretos, ganchos) desde la que la IA dirige tal como está
  diseñada. Candidatas que conozco bien y encajan con 2 jugadores:
  - *La Mina Perdida de Phandelver* (niveles 1-5, el clásico de inicio).
  - *El Dragón del Pico Escarcha* (Essentials Kit, 1-6, muy modular).
  - *La Maldición de Strahd* (1-10, gótico, la más celebrada).
  - Otras posibles: *Tumba de la Aniquilación*, *El Golpe de los Dragones*
    (Waterdeep), *Descenso a Avernus*, *Rime of the Frostmaiden*.
  Los módulos están pensados para 4-5 PJ: para dos jugadores se propone un
  **compañero PNJ** controlado por la IA (regla de "sidekick" del Essentials
  Kit) y reescalar encuentros.

## 8. Decisiones abiertas (ronda 1, 2026-09-07)

1. **Proveedor IA / clave**: clave directa de Anthropic (recomendado, SDK
   oficial, todas las funciones) — necesitas una API key de console.anthropic.com
   en `ANTHROPIC_API_KEY`. ¿Modelo por defecto Opus 5 asumiendo ~2-4 USD/sesión?
2. **Imágenes**: ¿qué opción(es) de §5? ¿Tienes o quieres sacar una clave de
   OpenAI o de Vercel AI Gateway para generar la biblioteca?
3. **Persistencia**: ¿vale navegador + exportar JSON (§3)?
4. **Despliegue**: ¿solo local, o también Vercel Hobby con una contraseña
   sencilla para que nadie más gaste tu clave?
5. **Edición de reglas**: ¿D&D 5e 2014 o 2024? ¿Nivel de "crunch" (§4.2)?
6. **Personajes**: ¿ya los tenéis o los creáis en la app? ¿Nivel inicial?
   ¿Lista de razas: solo SRD o ampliada (aasimar, goliat, tabaxi, genasi,
   firbolg, kenku, tortle, forjado…)?
7. **Dispositivo**: ¿TV/monitor grande en horizontal, portátil, tablet? Cambia
   la maqueta a dos columnas.
8. **Tono y límites**: ¿violencia explícita, temas adultos, humor? ¿Muerte de
   personaje permanente?
9. **Campañas**: ¿con cuál prefijada empezamos? ¿Compañero PNJ sí/no?
10. **Español**: de España, tuteo, ¿los PNJ pueden tener acentos/dialectos?
11. **Fuera de alcance por ahora** (confirmar): voz/TTS, música ambiente,
    tablero táctico, multi-dispositivo.
