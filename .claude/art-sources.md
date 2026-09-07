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
