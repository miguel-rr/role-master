# Guía de estilo — el lenguaje visual oficial de D&D (2026-09-07)

Listón: que la web pase por una página oficial de Dungeons & Dragons. Todo lo
de abajo se extrajo de CSS y fuentes reales (dndbeyond.com,
dungeonsanddragons.com, la maqueta de los manuales de 5e reproducida por
Homebrewery y la plantilla LaTeX de 5e). Los valores son exactos salvo que se
indique lo contrario.

## 1. Dos registros oficiales

D&D tiene hoy dos "pieles" oficiales y las usaremos ambas:

- **Manual** (los libros de 5e): pergamino `#EEE5CE`, texto en serif con mucha
  mancha, titulares en versalitas granate `#58180D`, filetes dorados
  `#C0AD6A`, cajas de notas verde `#E0E5C1`, bloques de estadísticas sobre
  `#FDF1DC`/`#F2E5B5`, capitulares ornamentadas, filete rojo en punta
  (la "tapered rule"). Es el registro de la **ficha de personaje**, los
  **pasajes de la historia**, las **cartas de objeto** y todo lo que quiera
  parecer papel.
- **Beyond** (dndbeyond.com): carbón `#12181c`, paneles `#232b2f`, rojo de
  marca `#e40712`, latón `#c3a76e` / oro `#c19429`, pergamino apagado
  `#afa47a` en subtítulos, tipografía condensada en mayúsculas para etiquetas,
  botones con degradado rojo. Es el registro de la **interfaz de juego**
  (menús, tablero táctico, bandeja de dados, bloques de interacción, modo TV).

Regla de oro: el papel va dentro de la interfaz oscura, nunca al revés. La
pantalla de juego es carbón; el pasaje, la ficha y las cartas son hojas de
pergamino apoyadas sobre ella.

## 2. Paleta

### Manual (impreso)
| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#EEE5CE` | fondo de página |
| `--paper-light` | `#F7F2E5` | cajas de lectura ("read-aloud") |
| `--paper-lighter` | `#FAF7EA` | cajas descriptivas |
| `--paper-stat` | `#FDF1DC` | bloque de estadísticas |
| `--paper-stat-2` | `#F2E5B5` | bloque de estadísticas (variante) |
| `--note-green` | `#E0E5C1` | notas y filas alternas de tabla |
| `--ink` | `#1e1a15` | texto |
| `--ink-muted` | `#766649` | pies de foto, secundarios |
| `--maroon` | `#58180D` | titulares, nombres de criatura |
| `--maroon-2` | `#822000` | atributos en bloque de estadísticas |
| `--rule-red` | `#9C2B1B` | filete rojo en punta |
| `--red-bright` | `#ED1C24` | contraportada, acento fuerte |
| `--gold` | `#C9AD6A` | filetes, títulos |
| `--gold-rule` | `#C0AD6A` | subrayado de h3 |
| `--gold-page` | `#B89A67` | número de página, marcos |
| `--ribbon` | `#E69A28` | cinta del bloque de estadísticas |
| `--stain` | `#BBAD82` | manchas de acuarela |
| Sombras | `1px 4px 14px #888` | notas y hojas |

Variantes de fondo de caja por manual: `#B5CEB8` (cian PHB), `#DCCCC5`
(malva), `#E5D5AC` (tostado), `#E3CED3` (lavanda DMG), `#F3D7C1` (coral),
`#DBE4E4` (pizarra), `#E8E6DC` (verde BR).

### Beyond (digital)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#12181c` | fondo de página |
| `--surface` | `#232b2f` | paneles |
| `--surface-2` | `#374045` | paneles elevados, bordes |
| `--surface-3` | `#525c63` | separadores |
| `--bar` | `#090809` | barra superior |
| `--text` | `#ffffff` | texto principal |
| `--text-muted` | `#a2acb2` | secundario |
| `--text-parchment` | `#d7d2be` | descripciones largas |
| `--strapline` | `#afa47a` | subtítulos, borde de bloque 2024 |
| `--red` | `#e40712` | marca, enlaces, botones |
| `--red-hover` | `#c50009` | hover |
| `--red-deep` | `#7d160f` | fondos rojos |
| `--red-legacy` | `#bc0f0f` | bordes de sección |
| `--cta` | `linear-gradient(#eb1313, #8d0b0b)` | botón principal |
| `--gold` | `#c19429` | oro |
| `--brass` | `#c3a76e` | latón de cabeceras |
| `--gold-soft` | `#e0b95b` | oro claro |
| `--gold-pale` | `#ecddac` | oro muy claro |
| `--copper` | `#de8435` | filete ornamental (dungeonsanddragons.com) |
| `--steel` | `#bdd6e6` | azul acero (iconos) |
| Radio | `8px` | tarjetas |
| Foco | `0 0 0 .125rem rgba(255,255,255,.48)` | |

Escala de grises Beyond: 900 `#12181c`, 800 `#232b2f`, 700 `#374045`,
600 `#525c63`, 500 `#75838b`, 400 `#a2acb2`, 300 `#c4cbce`, 200 `#dcdfe1`,
100 `#ecedee`, 50 `#f9fafa`. Rojos: 900 `#551710`, 800 `#7d160f`,
700 `#a7080b`, 600 `#c50009`, 500 `#e40712`, 400 `#fe4736`, 300 `#ff836f`,
100 `#ffcfc7`, 50 `#fbedeb`. Oros: 100 `#f0ead1` … 500 `#c19429` … 900 `#462c18`.

## 3. Tipografía

Las fuentes oficiales (Bookmania, Mrs Eaves Small Caps, Scala Sans, Modesto,
Tiamat) no son libres. Hay dos vías y usamos las dos:

1. **Remakes libres de las fuentes de 5e** (CC BY-SA 4.0, proyecto Solbera),
   auto-alojadas en `src/fonts/5e/` con `next/font/local`. Son las que hacen
   que un texto "parezca el manual":
   - `Bookinsanity` (≈ Bookmania): **cuerpo de texto** de pasajes y fichas.
   - `Mr Eaves Small Caps` (≈ Mrs Eaves SC): **titulares** de sección y
     nombres de criatura, en granate.
   - `Scaly Sans` / `Scaly Sans Caps` (≈ Scala Sans): **tablas, notas,
     bloques de estadísticas, fichas**.
   - `Nodesto Caps Condensed` (≈ Modesto): **títulos de portada y capítulo**,
     en mayúsculas.
   - `Solbera Imitation` : **capitulares**.
2. **Google Fonts** para la interfaz digital (registro Beyond):
   - `Roboto Condensed` 700 mayúsculas para etiquetas y botones (es la que
     usa dndbeyond.com).
   - `Roboto Flex` o `Roboto` para texto de interfaz.
   - `Cinzel` 700/900 como alternativa de título inscripcional si Nodesto
     resulta demasiado "de libro" en pantalla grande.

Medidas del manual (para escalar en pantalla): cuerpo ≈ 0.34 cm con
interlineado 1.25; h1 0.89 cm; h2 0.75 cm; h3 0.575 cm con subrayado
`2px solid #C0AD6A`; h4 0.458 cm; tablas 0.318 cm; capitular 3.5 cm con
degradado `-45deg, #322814, #998250, #322814` recortado al texto y primera
línea en versalitas. Titulares héroe en Beyond: mayúsculas, `letter-spacing:
1px`, centrados, con sombra de texto; escala `2.06rem → 4rem` (lg) y
`2.56rem → 5.6rem` (xl). Etiquetas de bloque: 14 px, negrita, mayúsculas.

## 4. Ornamentos

- **Filete rojo en punta** (el más reconocible): SVG `viewBox="0 0 762.29 18.4"`
  con `fill="#ed1f24"` y trazado
  `M0,9.06S406.1,0,381.53,0,762.29,8.7,762.29,8.7s-350.49,10-381.53,9.69S0,9.06,0,9.06Z`
  (versión Beyond: `viewBox="0 0 226.08 3"`, `fill="#9b2818"`).
- **Bloque de estadísticas 2014**: papel con textura, borde `1px solid #d4d0ce`,
  sombra `0 0 5px #979AA4`, barras de 6 px arriba y abajo (naranja
  `#E69A28`), nombre en versalitas `#822000` a 34 px, secciones con
  `border-bottom: 1px solid #822000`.
- **Bloque de estadísticas 2024**: fondo `#f5f3ee`, borde y contorno dobles
  `#afa47a` (`outline-offset: -.25rem`), radio `.5rem`, celdas de
  característica `#ede6d9` / `#ded4cc`, subrayado `#7a3c2f`.
- **Notas**: fondo `#E0E5C1`, sombra `1px 4px 14px #888`, filete superior e
  inferior fino.
- **Marcos y fleurones**: SVG propios inspirados en los de los manuales
  (esquinas con volutas, cartelas para títulos) y dominio público de
  Wikimedia Commons (categorías *Fleurons*, *Typographic ornaments*, *SVG text
  dividers*, *Decorative borders*, *Cartouches*, *Historiated initials*).
- **Iconografía**: game-icons.net (CC BY 3.0, SVG monocromo) para
  condiciones, escuelas de magia, tipos de daño, habilidades.
- **Texturas**: papel con grano suave (generado en CSS con ruido SVG +
  degradados radiales; sin PNG pesados), manchas de acuarela `#BBAD82` a baja
  opacidad en esquinas.
- Filete ornamental de dungeonsanddragons.com: línea con círculos en los
  extremos, `stroke: currentColor`, cobre `#de8435`, `mix-blend-mode:
  color-dodge`.

## 5. Lo que NO se hace

- No reproducir el logotipo ni el ampersand de D&D (política de contenido de
  fans de Wizards). Se evoca con tipografía y color, nunca se copia la marca.
- No mezclar registros en un mismo componente: una hoja es papel entero; un
  panel de interfaz es carbón entero.
- No usar pixel art ni renders 3D en el registro Manual: ahí solo entra arte
  pintado, grabado o iconos pintados (bg3).
- Nada de gris neutro genérico: los grises son los de la escala Beyond, los
  cremas son los del pergamino.

## 6. Modo TV

Todo el sistema se escala con una variable raíz (`--ui-scale`) que el modo TV
sube ~1.35×; los bloques de interacción pasan a una sola fila de botones
grandes, los pasajes suben a ≥ 24 px de cuerpo y el contraste de texto sobre
pergamino se refuerza (`--ink` puro).

## Fuentes
- dndbeyond.com: CSS de la home (tokens `--ttui_*`), `skins/waterdeep/css/compiled.css`, páginas de goblin y bola de fuego, `stat-block-header-bar.svg`.
- dungeonsanddragons.com (antes dnd.wizards.com): CSS y `logo-wide.svg`.
- Homebrewery `themes/V3/5ePHB/style.less`, `themes/assets/horizontalRule.svg`, `themes/fonts/5e/fonts.less`.
- rpgtex `lib/dndcolors.sty`.
- Solbera D&D fonts: https://github.com/jonathonf/solbera-dnd-fonts
- Política de contenido de fans: https://company.wizards.com/en/legal/fancontentpolicy
