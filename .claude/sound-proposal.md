# Sonido — propuesta (2026-09-08)

Investigación y diseño del módulo de audio. Sin código todavía. Fuentes
comprobadas el 8 de septiembre de 2026; las licencias se citan tal como las
publica cada sitio.

## 1. Qué queremos oír

Tres capas siempre presentes, mezcladas en tiempo real, más dos pequeñas:

| Capa | Qué es | Ejemplo en la taberna |
|---|---|---|
| **Música** | Siempre suena. Cambia con la situación y el ánimo, no con cada turno. Fundido cruzado de 4-8 s. | Laúd y violín, tempo tranquilo |
| **Ambiente** | Cama en bucle sin costuras por lugar, clima y hora, más **sonidos puntuales** aleatorios cada 15-60 s. | Murmullo, jarras, fuego; de vez en cuando una carcajada o una silla |
| **Efectos de escena** | Disparados por el narrador en un párrafo concreto (`cues`). | Puerta que se abre, moneda en la barra, trueno |
| Interfaz | Discretos: pasar página al cambiar de turno, clic de decisión, abrir la ficha, carta de objeto. | |
| Dados | Traqueteo y caída en la bandeja; pequeño acorde en crítico y pifia. | |

Extras que propongo porque salen casi gratis con esta arquitectura:
- **Tensión progresiva**: dentro de una misma situación (exploración) la
  música puede subir un escalón (capa de percusión encima) cuando el
  narrador marca `tension: high`, sin cambiar de pista.
- **Día, noche y clima** como modificadores del ambiente (grillos y búhos de
  noche, lluvia sobre cualquier lugar exterior).
- **Latido** muy sutil cuando un personaje baja de un cuarto de sus PV.
- **Silencio dramático** como opción válida del narrador (`music: 'none'`
  durante un párrafo, la música vuelve sola).

## 2. Lo que impone el navegador

- Chrome, Safari y Firefox no dejan sonar nada hasta un **gesto del usuario**;
  el `AudioContext` nace en estado `suspended` y hay que reanudarlo dentro
  de un clic. Tras ese primer gesto, todo lo demás (cambios de escena,
  fundidos, efectos) suena sin más gestos.
- **iOS Safari**: el audio Web se corta al bloquear la pantalla o cambiar de
  app; el interruptor de silencio del iPhone silencia también el Web Audio
  en algunas versiones. En Mac y en el televisor (Chrome/Safari de
  escritorio) no hay problema.
- Pestaña en segundo plano: en escritorio la música sigue; los temporizadores
  de los sonidos puntuales se ralentizan (usaremos el reloj del propio
  `AudioContext`, no `setTimeout`, para programarlos).

**Decisión de diseño**: una **pantalla de comprobación de sonido** entre «La
compañía» y la partida. Un botón grande («Probar el sonido») reproduce tres
segundos de ambiente de taberna con un acorde encima; debajo, «Lo oigo,
adelante» y «Seguir sin sonido». Tres deslizadores (música, ambiente,
efectos) y la elección se recuerdan en el navegador. En el HUD de la partida,
un icono de altavoz abre la misma mezcla en un desplegable; tecla M silencia.
Si el navegador vuelve a suspender el audio (iOS al volver), aparece una
pastilla «Activar sonido» sobre la escena.

## 3. Motor

Propongo un **motor propio sobre Web Audio API**, sin dependencias
(~400-500 líneas), porque lo que necesitamos es exactamente una mesa de
mezclas con cuatro buses y programación por reloj, y eso Howler.js (7 kB, MIT,
mantenido) lo hace regular: no tiene buses ni fundidos entre capas, y sus
bucles no son sin costuras en todos los navegadores.

```
                ┌ Música ─ pista A ──┐ (crossfade equal-power)
                │         pista B ──┤
Master ─ límite ┼ Ambiente ─ cama(s) en bucle ─ puntuales programados
(compresor)     ├ Efectos ─ one-shots con variación de tono ±3 % y volumen
                └ Interfaz
```

- Música: elementos `<audio>` conectados con `MediaElementAudioSourceNode`
  (se emiten en streaming, no hay que descargar 3 MB antes de empezar). Dos
  reproductores alternos para el fundido cruzado.
- Ambiente: buffers decodificados (60-120 s) con `loop` de
  `AudioBufferSourceNode`: bucle sin hueco garantizado. Sonidos puntuales
  programados con `context.currentTime` y elegidos al azar sin repetir el
  último.
- Continuidad: la música solo cambia si cambian situación o ánimo; si no,
  rota dentro del mismo conjunto cada 6-10 minutos. El ambiente cambia con el
  lugar. Todo con fundidos; nunca un corte seco salvo en un `cue` de golpe.
- Normalización de sonoridad al transcodificar (música −18 LUFS, ambiente
  −24 LUFS, efectos −16 LUFS) para que el mezclador tenga sentido.
- Formatos: **Opus en WebM** (96 kb/s música, 64 kb/s ambiente) más **AAC
  .m4a** de respaldo para Safari antiguo. Transcodificación con `ffmpeg` en
  el script de sincronización.
- Precarga: al empezar un turno se precargan las pistas de los `sceneTags`
  vecinos; las camas de ambiente se guardan en `Cache Storage` para que la
  segunda sesión arranque al instante.

## 4. Biblioteca

### Fuentes y licencias (comprobadas)

| Fuente | Qué aporta | Licencia | Descarga automatizable |
|---|---|---|---|
| **Freesound** | Ambientes, puntuales, efectos; millones de clips con etiquetas | Filtrable a **CC0** (también CC BY) | API v2 con clave gratuita: búsqueda por etiqueta, licencia y duración; previews HQ OGG a 192 kb/s sin OAuth, originales con OAuth. 2000 peticiones/día |
| **Kevin MacLeod (Incompetech)** | Cientos de piezas; mucha fantasía, medieval, terror, calma | **CC BY 4.0** (crédito: título, autor, enlace) | Sí, ficheros MP3 con enlaces estables |
| **Alexander Nakarada** | Música medieval, celta, épica y de taberna pensada para rol | CC BY 4.0 (a verificar en su web: hoy no resolvía el dominio) | Sí |
| **Darren Curtis** | Fantasía y terror para RPG | Gratuita con crédito «Darren Curtis» | Sí (web, itch.io, Bandcamp) |
| **OpenGameArt** | Colecciones **CC0** de música de fantasía (taberna, mazmorra, batalla) y 80 efectos de RPG CC0 | CC0 / CC BY por pieza | Sí, con manifiesto por pieza |
| **Kenney** | UI Audio, Interface Sounds, Impact Sounds, RPG Audio (50 sonidos) | **CC0** | Sí (zips) |
| **Sonniss GDC Bundle** | Bibliotecas profesionales de efectos: puertas, fuego, viento, pasos, multitudes, criaturas. 7,5 GB este año, 200 GB de archivo | Royalty-free, sin atribución, uso personal y comercial | Sí, pero son paquetes enormes: descarga manual y selección |
| **Pixabay** | Música y efectos sin atribución | Licencia Pixabay (sin crédito, prohíbe redistribuir tal cual) | Sin API para audio: selección manual |
| **Ambient-Mixer** | Atmósferas montadas (taberna, bosque…) | CC Sampling Plus | Sí |
| Tabletop Audio | 300+ ambientes de 10 min con música, hechos para rol | CC **BY-NC-ND**: uso privado sí, pero **sin derivados** (no se pueden recortar ni hacer bucles) y la web no fomenta la descarga | No lo usaría en el motor; sí como referencia de calidad |
| Michael Ghelfi Studios | 500+ ambientes y piezas de rol, calidad muy alta | Álbumes de pago en Bandcamp (uso personal); Patreon con casi 400 exclusivas | Descarga tras compra (10-20 € por álbum). Opcional si queremos subir el listón |
| BBC Sound Effects | 33 000 efectos históricos (RemArc, uso personal) | Personal / educativo | Hoy no accesible desde aquí; a verificar |

Créditos: una página `/credits` en la web con cada pieza, autor y licencia,
generada desde el manifiesto (obligatoria para CC BY; buena costumbre para
todo).

### Taxonomía (etiquetas que verán el narrador y el motor)

- **Lugares** (ambiente): taberna, posada de noche, pueblo de día, mercado,
  ciudad-puerto, templo, palacio, biblioteca, calabozo, alcantarilla, ruinas,
  cementerio, bosque de día, bosque de noche, pantano, montaña, nieve y
  ventisca, río, lago, puente, camino, desierto, cueva, mina, mazmorra,
  infraoscuridad, barco, campamento, interior de granja, molino.
- **Modificadores de ambiente**: día / noche, lluvia, tormenta, viento,
  nieve, niebla (afectan a la cama y a los puntuales).
- **Situaciones** (música): llegada, exploración, viaje, taberna, mercado,
  corte y palacio, misterio, sigilo, tensión, persecución, combate ligero,
  combate serio, jefe, ritual, revelación, tristeza y duelo, descanso,
  victoria, epílogo.
- **Ánimos** (ya existen en el esquema: warm, cold, dark, gold, green, blood)
  como desempate al elegir pista.
- **Efectos de escena** (`cues`, catálogo cerrado de ~60): puerta de madera,
  puerta de hierro, cerrojo, pasos en piedra, moneda, jarra, cristal roto,
  espada desenvainada, choque de acero, flecha, arco, golpe sordo, caída,
  fuego que prende, antorcha, vela que se apaga, trueno, viento súbito, campana,
  gong, rugido, gruñido, aleteo grande, cuervo, lobo, búho, grito lejano,
  risa, aplausos, agua que gotea, chapoteo, derrumbe, cadena, libro que se
  cierra, pergamino, hechizo, curación, chispa arcana, latido, silencio.

### Tamaño objetivo

| Capa | Piezas | Peso |
|---|---|---|
| Música | 120-160 pistas de 2-4 min | ~250-320 MB |
| Camas de ambiente | 50-70 bucles de 60-120 s | ~40 MB |
| Puntuales y efectos | 300-400 clips | ~12 MB |
| **Total** | | **~300-370 MB** |

El arte ya ocupa 317 MB en el repositorio y se despliega bien por Git. Dos
caminos:
1. **En el repositorio** (`public/audio`), como el arte: simple, funciona sin
   red en desarrollo, mismo flujo. Duplica el peso del repo.
2. **Vercel Blob** (o Cloudflare R2): el repo queda ligero, los ficheros se
   sirven por CDN, el manifiesto guarda las URL. Un script más y una variable
   de entorno.

Recomiendo empezar por el **1** con un presupuesto duro de 350 MB y pasar al
2 si la biblioteca crece. Ancho de banda: el plan Hobby incluye 100 GB al mes;
una sesión de tres horas consume unos 150-250 MB, así que sobra.

### Herramientas de curación

Como con los retratos: `scripts/audio/sync.ts` (descarga por trabajo, con
manifiesto por pieza: id, capa, etiquetas, duración, puntos de bucle,
sonoridad medida, autor, licencia, URL de origen) y una página del
laboratorio, **`/design/sound`**, con la mesa de mezclas real: filtros por
capa y etiqueta, botón de escucha por pieza, «me gusta / fuera», y un
constructor de escena (lugar + clima + situación) para oír la combinación
completa. Ahí decides tú qué se queda, igual que con los retratos.

## 5. Integración con el narrador

El esquema del turno gana un bloque, con vocabularios cerrados en el prompt:

```ts
sound: {
  music: { situation: 'tavern', tension: 'low' | 'mid' | 'high' } | 'keep' | 'none',
  ambience: { place: 'tavern', time: 'night', weather: 'rain' } | 'keep',
  cues: [{ beat: 2, sfx: 'door-wood-open' }, { beat: 3, sfx: 'thunder' }],
}
```

- `keep` es lo normal: el narrador solo cambia música o ambiente cuando la
  escena lo pide. El resolutor (`sound-resolver.ts`, como el de arte) elige
  las pistas concretas con semilla, evita repetir la última y respeta la
  continuidad.
- Los `cues` se disparan cuando el jugador llega a ese párrafo (no antes:
  el texto se revela con la máquina de escribir).
- Tiradas: traqueteo al pulsar «Tirar», caída al posarse, acorde en 20 y
  golpe sordo en 1. Cambio de turno: pasar página. Revelación de criatura:
  golpe grave y `stinger` del ánimo.
- El **narrador de guion** incluirá `sound` en sus turnos, así el e2e
  comprueba que el motor recibe lo que debe (estado expuesto en atributos
  `data-*`, sin depender de que el navegador de pruebas suene).

## 6. Fases

1. **Motor y mesa** (primera): buses, fundidos, bucles, puntuales, mezcla
   persistente, pantalla de comprobación, altavoz en el HUD, esquema y
   resolutor, narrador de guion con sonido, e2e. Biblioteca mínima para
   probar de verdad: taberna, camino, bosque, cueva, combate, paz, tristeza
   (~25 pistas, ~15 camas, ~80 efectos).
2. **Biblioteca completa**: sincronización desde las fuentes, transcodificado
   y normalización, `/design/sound` para tu revisión, página de créditos.
3. **Capa fina**: tensión progresiva, día/noche/clima, latido, silencio
   dramático, precarga inteligente, sonidos de interfaz pulidos.

## 7. Preguntas antes de empezar

1. **Dónde vive el audio**: ¿en el repositorio como el arte (recomendado
   para empezar) o en Vercel Blob desde el principio?
2. **`ffmpeg`**: no está instalado en tu Mac. Lo necesita el script de
   transcodificación. ¿Lo instalo con Homebrew, o prefieres que use un paquete
   npm que lo trae dentro (`@ffmpeg-installer/ffmpeg`)?
3. **Freesound** pide una cuenta gratuita y una clave de API (un minuto en
   freesound.org/apiv2/apply). ¿La creas tú y me pasas la clave por `.env`?
4. **Presupuesto**: ¿solo fuentes gratuitas, o te parece bien comprar uno o
   dos álbumes de Michael Ghelfi (10-20 € cada uno) para las camas de ambiente
   más importantes? Cambia la calidad de la taberna y el bosque, no la
   arquitectura.
5. **Créditos**: la mayoría de la música buena gratuita es CC BY. Una página
   `/credits` en la web (privada) cumple. ¿De acuerdo?
6. **Dispositivos**: ¿solo portátil y televisor, o también iPad/iPhone? Con
   iOS habría que aceptar que el sonido se corta al bloquear la pantalla.
7. **Voz**: sigue fuera de alcance (ni narración leída ni voces de PNJ).
   ¿Confirmas?
8. **Motor propio** frente a Howler.js: recomiendo el propio; si prefieres
   la dependencia, la instalo (7 kB).
