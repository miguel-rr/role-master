# Fuentes de arte — investigación (2026-09-07)

Todo lo de abajo se comprobó en vivo (API, tamaños, transparencia). Uso
privado: se acepta material con copyright (arte de WotC/Larian) por *fan use*.

## Objetos de inventario → **bg3.wiki** (Baldur's Gate 3, MediaWiki)

- API abierta sin login: `https://bg3.wiki/w/api.php?action=query&list=allimages&ailimit=5&format=json&aiprop=url|size|mime`
- Iconos por objeto en tres tamaños con nombre consistente:
  - `<Objeto> Icon.png` → **380×380, fondo transparente**. `Category:Item tooltip images` → 2.067 ficheros.
  - `<Objeto> Unfaded.png` → 144×144 transparente. `Category:Item controller icons` → 2.115.
  - `<Objeto> Unfaded Icon.png` → 64×64.
- Subárboles: `Equipment icons` (943: amuletos, armaduras ligera/media/pesada,
  botas, ropa, capas, guantes, yelmos, instrumentos, anillos 77, escudos,
  armas 261 en 33 subcategorías por tipo), `Consumable icons` (485: flechas,
  provisiones/comida, venenos, tintes, elixires, granadas, pociones, pergaminos),
  `Miscellaneous item icons` (689: llaves, libros, gemas, oro, chatarra, misión).
- Estilo: icono 2D pintado, coherente, el look "inventario de CRPG". Cubre
  todas las armas/armaduras 5e, pociones, pergaminos, gemas, monedas, comida,
  herramientas, instrumentos, ropa y objetos mágicos.
- También: `Category:Character Portraits (152x152)` 2.457 retratos de PNJ
  (pequeños, render 3D), `Category:Character models` 1.523 cuerpos enteros
  ~480×1270 transparentes, `Category:Race icons` 39.
- Descarga: `generator=categorymembers&gcmtitle=Category:...&gcmtype=file&gcmlimit=500&prop=imageinfo&iiprop=url|size`,
  recorriendo subcategorías con `cmtype=subcat`. ~40 MB todos los iconos de 380 px.
  Ritmo ≤1-2 req/s y User-Agent descriptivo (`robots.txt` desaconseja rastreo de api.php).

## Retratos, PNJ y monstruos → **Forgotten Realms Wiki** (Fandom)

- API: `https://forgottenrealms.fandom.com/api.php?action=query&list=allimages&ailimit=5&aiprop=url|size|mime&format=json`. 37.987 imágenes.
- URLs directas `https://static.wikia.nocookie.net/forgottenrealms/images/...`; sufijo `/revision/latest/scale-to-width-down/512` para redimensionar en servidor.
- Categorías (ficheros): Illustrations 16.087; Images of creatures 15.393;
  humanoids 8.985; humans 5.312; items 4.519; magic items 3.557; from 5th
  edition sourcebooks 2.614; weapons 2.197; elves 1.631; dragons 1.097; armor
  1.058; dwarves 760; halflings 469; half-elves 427; tieflings 395; gnomes 302;
  goblins 220; dragonborn 207; half-orcs 174; owlbears 69; potions 223;
  gemstones 471; food and drink 471; tools 326; money 34; scrolls 73.
  Etiquetas cruzables: males 6.998 / females 4.743; wizards 1.328, fighters
  958, clerics 888; nobles 55, merchants 32, guards 5, innkeepers 3.
- Calidad: arte oficial de WotC (manuales, revistas, novelas), 400-1.800 px,
  pintado, sin transparencia. Perfecto para retratos, arquetipos de PNJ y
  monstruos; **no** para iconos de inventario (categorías de objeto sucias).
- Descarga: `generator=categorymembers&gcmtitle=Category:Images%20of%20tieflings&gcmtype=file&gcmlimit=500&prop=imageinfo|categories&iiprop=url|size|mime&cllimit=50`,
  filtrando por co-categorías (género, clase, 5e) y ancho ≥ 600, excluyendo
  Screenshots/Book covers/Maps. ≤1 req/s.

## Complemento: **Pathfinder Kingmaker/WotR wiki** (Fandom)

- `Category:Portraits - Player` → 80 retratos pintados únicos a **692×1024**,
  nombrados por raza/género/clase (`DwarfFemaleNoble.png`,
  `HalfOrcFemaleTank.png`, `HalflingMaleRogue.png`…). Set uniforme ideal para
  el selector de retrato de PJ por raza y género.

## Descartados
- Pillars of Eternity (máx. 210×330), Baldur's Gate 1/2 (210×330, iconos 32-64 px), Divinity/Solasta/NWN (sin categorías útiles).
- D&D Beyond: imágenes accesibles pero sin API, IDs opacos, Cloudflare, ToS. No scriptable.
- game-icons.net: 4.000+ SVG CC-BY monocromo; solo como relleno para algún objeto ausente.

## Recomendación
1. **bg3.wiki** para todo el inventario (una fuente, estilo único, transparente).
2. **Forgotten Realms Wiki** para retratos, PNJ y monstruos, más los 80 de
   Kingmaker como set limpio de retratos de PJ.
3. game-icons.net solo para huecos.
Dos webs, pero cada una cubre su necesidad al completo con estilo coherente.

---

# Paisajes, tablero táctico y dados — investigación (2026-09-07)

## Paisajes y escenas

| Fuente | Conteo verificado | Estilo / tamaño | Licencia | Descarga |
|---|---|---|---|---|
| **Forgotten Realms Wiki** | `Images of locations` 843; `buildings` 918; `settlements` 567; `forests` 130; `taverns` 135; `caves` 121; subcats (dungeons, fortresses, mines, sewers, tombs, jungles…) | Arte oficial pintado, 600-1920 px | Fair use (WotC) | Misma API que retratos, `generator=categorymembers`, paginar con `gcmcontinue` |
| **Wikimedia Commons** | Doré 4.066; Rackham 2.841; N.C. Wyeth 538; Bilibin 333; John Bauer 156; Kay Nielsen 144; John Martin 42; C.D. Friedrich 46. Subcats útiles: *Paradise Lost* (63), *Don Quijote* (46), *Orlando Furioso* (68), *Idylls of the King* (23) de Doré | Doré: grabados b/n (bosques, montañas, castillos, cavernas: la estética de novela ilustrada). Bauer/Bilibin/Rackham/Nielsen: cuento en color. Hasta 6.000 px | Dominio público (verificar `extmetadata.LicenseShortName`) | `commons.wikimedia.org/w/api.php` con `iiurlwidth=1600` → `thumburl` (evita TIFF de 50 MB). ~1 req/s, UA descriptivo (429 si se acelera). Filtrar ancho ≥ 1200 |
| bg3.wiki | `Location screenshots` 454; `Location map images` 136 | Capturas 3D 1920-2560 px | Larian | Relleno para entornos tipo Baldur's Gate |

## Tablero táctico (tiles, props, tokens, mapas)

- **2-Minute Tabletop** — 386 productos gratuitos (mapas y packs de assets:
  "Grime & Shine", "Modular Jail"…). Tinta + acuarela, **70 px/casilla**
  (versión Roll20) y 140 px (Foundry). CC BY-NC 4.0 con atribución.
  https://2minutetabletop.com/product-category/free/ · licencia:
  https://2minutetabletop.com/license/ · "The Free Map Pack" (10 mapas:
  cantera, puente del dragón, ruinas, pueblo costero, mercado, torre de mago,
  galeón, murallas…): https://2minutetabletop.com/product/the-free-map-pack/
- **Forgotten Adventures** — `!Core Mapmaking Pack` gratuito: 140.000+ assets
  (suelos, muros, puertas, árboles, rocas, mobiliario, decoración de mazmorra),
  pintado cenital, **200 px/casilla; tokens 400 px**. Descarga con cuenta de
  Patreon (tier gratuito). Gratis para uso personal.
  https://www.forgotten-adventures.net/product/map-making/assets/core-mapmaking-pack/
  Tokens gratuitos (una variante de color de casi todos: criaturas, PNJ,
  héroes): https://www.forgotten-adventures.net/product-category/tokens/
  Mapas gratuitos con rejilla: https://www.forgotten-adventures.net/battlemaps/
- **Mark Gosbell "Free Flat Greyscale Dungeon Assets"** — CC0, tinta/gris,
  70 px/casilla: https://markgosbell.itch.io/free-flat-greyscale-dungeon-assets
- **Dyson Logos** — 1.601 mapas dibujados a tinta, ~707 con licencia libre
  (crédito): https://dysonlogos.blog/maps/commercial-maps/ . El paso de rejilla
  varía por mapa: medir px/casilla una vez por mapa.
- **Devin Night** — packs de tokens pintados gratuitos (mirror verificado:
  https://github.com/SirNiloc/devin-nights-free-tokens-fantasy/releases/download/3.0.0/module.zip)
- **Tokens desde retratos**: recorte circular + anillo en Canvas sobre
  cualquier retrato (FR wiki / Kingmaker). Trivial y consistente.
- game-icons.net: siluetas SVG CC-BY como token de emergencia.
- Descartados: Kenney / Dungeon Crawl / LPC (pixel art, rompe la estética),
  Dungeondraft / Dungeon Alchemist (assets no extraíbles).

**Combinación recomendada**: 2-Minute Tabletop (tinta+acuarela, 70 px) como
tile set procedural principal; Gosbell CC0 para decoración de mazmorra a
tinta; FA `!Core` para lo que falte (reescalar 200→70 px); tokens FA + tokens
sellados desde retrato para PJ/PNJ; Dyson para encuentros señalados.
**Estándar interno: 70 px = 5 pies.**

## Dados 3D

| Paquete | Versión / fecha | Descargas/sem | Motor | Dados | Licencia |
|---|---|---|---|---|---|
| **@3d-dice/dice-box** | 1.1.4 / 2024-08 (repo activo hasta 2024-10, 249★) | 5.525 | BabylonJS + AmmoJS WASM, web worker + OffscreenCanvas | d4 d6 d8 d10 d12 d20 **d100** | MIT |
| @3d-dice/dice-box-threejs | 0.0.12 / 2022 | 4.211 | three + cannon-es | estándar | MIT (permite resultado predeterminado `1d20@17`) |
| threejs-dice | 2019 | 66 | — | — | muerto |
| react-dice-complete | 2026 | 232 | CSS, solo d6 | d6 | no sirve |

`@3d-dice/dice-box`: ~600 KB de assets (ammo.wasm + tema por defecto); temas
con textura en https://github.com/3d-dice/dice-themes (MIT: rock, rust,
gemstone, wooden, smooth…); `themeColor` por jugador; resultados con
`await box.roll('1d20+5')` → `{ sides, value, … }` o `onRollComplete`. Sin
tipos TS (issue #94): escribir `dice-box.d.ts` propio.
Integración Next 16 / React 19 verificada (demo enlazada por el mantenedor):
componente cliente con `dynamic(..., { ssr: false })`; copiar
`node_modules/@3d-dice/dice-box/dist/assets/*` a `public/assets/dice-box/`
con un script `postinstall`; inicializar una sola vez (StrictMode);
`offscreen: false` si OffscreenCanvas falla.
