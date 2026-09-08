'use client';

import { useMemo, useState } from 'react';
import { MixerPanel } from '@/components/sound/mixer';
import { Caps } from '@/components/theme/display';
import type { SoundEntry, SoundLayer } from '@/data/sound/schema';
import { PLACES, SITUATIONS, TIMES, WEATHERS } from '@/data/sound/vocabulary';
import { soundEngine } from '@/lib/sound/engine';
import { useSound } from '@/lib/sound/use-sound';

const LAYERS: { id: SoundLayer; label: string; help: string }[] = [
  { id: 'music', label: 'Música', help: 'Por situación; el ánimo desempata.' },
  { id: 'bed', label: 'Camas', help: 'Bucles de lugar, hora y clima.' },
  { id: 'spot', label: 'Puntuales', help: 'Sonidos sueltos sobre la cama.' },
  { id: 'sfx', label: 'Efectos', help: 'Los cues que dispara el narrador.' },
  { id: 'ui', label: 'Interfaz', help: 'Páginas, decisiones, dados.' },
];

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Listening room. Every piece by layer and tag, one click to hear it in
 * context (music crossfades, beds loop, effects fire), plus a scene builder
 * to hear a place, a time and a weather together.
 */
const SoundLab = ({
  entries,
  stats,
}: {
  entries: SoundEntry[];
  stats: Record<string, number>;
}) => {
  const engine = soundEngine();
  const { status, musicId, bedIds } = useSound();
  const [layer, setLayer] = useState<SoundLayer>('music');
  const [tag, setTag] = useState<string>('');
  const [scene, setScene] = useState({
    place: 'tavern',
    time: 'night',
    weather: 'rain',
    situation: 'tavern',
  });

  const list = useMemo(() => {
    const inLayer = entries.filter((e) => e.layer === layer);
    if (!tag) return inLayer;
    return inLayer.filter(
      (e) =>
        e.tags.situations.includes(tag) ||
        e.tags.places.includes(tag) ||
        e.tags.moods.includes(tag) ||
        e.tags.weather.includes(tag) ||
        e.tags.cue === tag,
    );
  }, [entries, layer, tag]);

  const tagsOf = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries.filter((x) => x.layer === layer)) {
      for (const t of [
        ...e.tags.situations,
        ...e.tags.places,
        ...e.tags.weather,
      ])
        set.add(t);
      if (e.tags.cue) set.add(e.tags.cue);
    }
    return [...set].sort();
  }, [entries, layer]);

  const play = async (e: SoundEntry) => {
    await engine.unlock();
    if (e.layer === 'music') engine.playMusic(e, { fade: 2 });
    else if (e.layer === 'bed')
      engine.setAmbience({ beds: [e], spots: [] }, { fade: 1.5 });
    else if (e.layer === 'ui') engine.playUi(e);
    else engine.playSfx(e);
  };

  const playScene = async () => {
    await engine.unlock();
    const fits = (e: SoundEntry) =>
      (e.tags.time.length === 0 ||
        e.tags.time.includes(scene.time as 'day' | 'night')) &&
      (e.tags.weather.length === 0 || e.tags.weather.includes(scene.weather));
    const beds = entries
      .filter(
        (e) =>
          e.layer === 'bed' && e.tags.places.includes(scene.place) && fits(e),
      )
      .slice(0, 2);
    if (scene.weather !== 'clear') {
      const w = entries.find(
        (e) =>
          e.layer === 'bed' &&
          e.tags.places.length === 0 &&
          e.tags.weather.includes(scene.weather),
      );
      if (w) beds.push(w);
    }
    const spots = entries
      .filter(
        (e) =>
          e.layer === 'spot' && e.tags.places.includes(scene.place) && fits(e),
      )
      .slice(0, 8);
    engine.setAmbience({ beds, spots }, { fade: 2 });
    const music = entries.filter(
      (e) => e.layer === 'music' && e.tags.situations.includes(scene.situation),
    );
    const track = music[Math.floor(Math.random() * music.length)];
    if (track) engine.playMusic(track, { fade: 3 });
  };

  return (
    <main className="theme-beyond min-h-screen bg-charcoal-950 px-6 pt-10 pb-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
          Sistema
        </div>
        <h1 className="mt-1 font-nodesto text-5xl text-brass-pale uppercase leading-none">
          <Caps>La mesa de sonido</Caps>
        </h1>
        <p className="mt-3 max-w-2xl font-book text-[1.05rem] text-parchment-text leading-relaxed">
          Todo lo que la mesa puede tocar: {stats.music} pistas, {stats.beds}{' '}
          camas, {stats.spots} puntuales, {stats.sfx} efectos y {stats.ui}{' '}
          sonidos de interfaz. Pulsa una pieza para oírla como sonaría en la
          partida; monta una escena para oír la mezcla completa.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div>
            {/* Scene builder */}
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-brass/40 bg-charcoal-900/60 p-4">
              {(
                [
                  ['place', 'Lugar', PLACES],
                  ['time', 'Hora', TIMES],
                  ['weather', 'Clima', WEATHERS],
                  ['situation', 'Música', SITUATIONS],
                ] as const
              ).map(([key, label, options]) => (
                <label className="block" key={key}>
                  <div className="font-condensed text-[0.65rem] text-strapline uppercase tracking-wider">
                    {label}
                  </div>
                  <select
                    className="mt-1 rounded border border-white/15 bg-charcoal-950 px-2 py-1.5 font-scaly text-sm"
                    onChange={(e) =>
                      setScene({ ...scene, [key]: e.target.value })
                    }
                    value={scene[key]}
                  >
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <button
                className="btn-beyond px-4 py-2 text-sm uppercase"
                onClick={() => void playScene()}
                type="button"
              >
                Oír la escena
              </button>
              <button
                className="btn-ghost px-3 py-2 text-xs uppercase"
                onClick={() => engine.stopAll()}
                type="button"
              >
                Silencio
              </button>
              <span className="ml-auto font-scaly text-charcoal-400 text-xs">
                {status === 'running'
                  ? `Sonando: ${musicId ?? '—'} · ${bedIds.join(', ') || 'sin camas'}`
                  : 'Pulsa algo para activar el audio'}
              </span>
            </div>

            {/* Layer tabs + tag filter */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {LAYERS.map((l) => (
                <button
                  className={`rounded-sm border px-3 py-1.5 font-condensed text-[0.7rem] uppercase tracking-wider ${layer === l.id ? 'border-brass bg-brass/15 text-brass-pale' : 'border-white/15 text-charcoal-300 hover:text-white'}`}
                  key={l.id}
                  onClick={() => {
                    setLayer(l.id);
                    setTag('');
                  }}
                  type="button"
                >
                  {l.label} ·{' '}
                  {stats[
                    l.id === 'bed' ? 'beds' : l.id === 'spot' ? 'spots' : l.id
                  ] ?? 0}
                </button>
              ))}
              <select
                className="ml-auto rounded border border-white/15 bg-charcoal-950 px-2 py-1.5 font-scaly text-sm"
                onChange={(e) => setTag(e.target.value)}
                value={tag}
              >
                <option value="">Todas las etiquetas</option>
                {tagsOf.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 font-scaly text-charcoal-500 text-xs">
              {LAYERS.find((l) => l.id === layer)?.help}
            </p>

            {/* List */}
            <ul className="mt-3 divide-y divide-white/5 rounded-lg border border-white/10">
              {list.map((e) => {
                const on = musicId === e.id || bedIds.includes(e.id);
                return (
                  <li
                    className={`flex items-center gap-3 px-3 py-2 ${on ? 'bg-brass/10' : 'hover:bg-white/5'}`}
                    key={e.id}
                  >
                    <button
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${on ? 'border-brass bg-brass text-charcoal-950' : 'border-white/20 text-brass-pale hover:border-brass'}`}
                      onClick={() => void play(e)}
                      title="Oír"
                      type="button"
                    >
                      ▶
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-caps text-base text-brass-pale">
                        {e.title}
                      </div>
                      <div className="truncate font-scaly text-[0.72rem] text-charcoal-400">
                        {e.artist} · {e.license} · {e.id}
                      </div>
                    </div>
                    <div className="hidden flex-wrap justify-end gap-1 md:flex">
                      {[
                        ...e.tags.situations,
                        ...e.tags.places,
                        ...e.tags.moods,
                        ...e.tags.time,
                        ...e.tags.weather,
                        ...(e.tags.cue ? [e.tags.cue] : []),
                      ].map((t) => (
                        <span
                          className="rounded-sm border border-white/10 px-1 py-0.5 font-condensed text-[0.58rem] text-charcoal-300 uppercase tracking-wider"
                          key={`${e.id}-${t}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="w-12 text-right font-scaly text-charcoal-400 text-xs tabular-nums">
                      {fmt(e.duration)}
                    </span>
                  </li>
                );
              })}
              {list.length === 0 ? (
                <li className="px-3 py-6 text-center font-scaly text-charcoal-400 text-sm">
                  Nada con esa etiqueta todavía.
                </li>
              ) : null}
            </ul>
          </div>
          <aside className="h-fit rounded-lg border border-white/10 bg-charcoal-900/60 p-4 lg:sticky lg:top-6">
            <MixerPanel />
          </aside>
        </div>
      </div>
    </main>
  );
};

export { SoundLab };
