'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ArtEntry } from '@/data/art/schema';

type PortraitLabProps = {
  portraits: ArtEntry[];
};

const RACES = [
  { tag: 'human', label: 'Humano' },
  { tag: 'elf', label: 'Elfo' },
  { tag: 'dwarf', label: 'Enano' },
  { tag: 'halfling', label: 'Mediano' },
  { tag: 'gnome', label: 'Gnomo' },
  { tag: 'half-elf', label: 'Semielfo' },
  { tag: 'half-orc', label: 'Semiorco' },
  { tag: 'tiefling', label: 'Tiefling' },
  { tag: 'dragonborn', label: 'Dracónido' },
] as const;

const GENDERS = [
  { tag: 'male', label: 'Masculino' },
  { tag: 'female', label: 'Femenino' },
] as const;

const CLASSES = [
  { tag: 'fighter', label: 'Guerrero' },
  { tag: 'rogue', label: 'Pícaro' },
  { tag: 'wizard', label: 'Mago' },
  { tag: 'cleric', label: 'Clérigo' },
  { tag: 'ranger', label: 'Explorador' },
  { tag: 'paladin', label: 'Paladín' },
  { tag: 'barbarian', label: 'Bárbaro' },
  { tag: 'bard', label: 'Bardo' },
  { tag: 'druid', label: 'Druida' },
  { tag: 'monk', label: 'Monje' },
  { tag: 'sorcerer', label: 'Hechicero' },
  { tag: 'warlock', label: 'Brujo' },
] as const;

/** Categories that group many books; too broad to be a "series". */
const GENERIC_SOURCES = new Set([
  'Images from sourcebooks',
  'Images from 5th edition sourcebooks',
  'Images from adventures',
  'Images from magazines',
  'Images from novels',
  'Images from board games',
  'Images from card games',
  'Images from video games',
]);

const seriesLabel = (cat: string) =>
  cat
    .replace(/^Images from (the )?/, '')
    .replace(/ 5th edition( \(revised\))?/, (m) =>
      m.includes('revised') ? ' (2024)' : ' (2014)',
    )
    .replace(/ sourcebooks$/, '');

const NAMES: Record<
  string,
  { male: string[]; female: string[]; family: string[] }
> = {
  human: {
    male: ['Bram', 'Darvin', 'Halric', 'Tomas', 'Gareth', 'Ulric'],
    female: ['Mara', 'Elsbeth', 'Ilena', 'Sabra', 'Teodora', 'Vela'],
    family: [
      'Piedrahonda',
      'Valcarce',
      'del Roble',
      'Brezal',
      'Cienfuegos',
      'Marlow',
    ],
  },
  elf: {
    male: ['Aelar', 'Theren', 'Varis', 'Ivellios', 'Erevan'],
    female: ['Sariel', 'Naivara', 'Lia', 'Quelenna', 'Thia'],
    family: ['Amakiir', 'Galanodel', 'Liadon', 'Siannodel', 'Xiloscient'],
  },
  dwarf: {
    male: ['Thorin', 'Baern', 'Rurik', 'Eberk', 'Vondal'],
    female: ['Helja', 'Diesa', 'Torbera', 'Vistra', 'Gunnloda'],
    family: [
      'Yunquebronce',
      'Barbafuego',
      'Puñodehierro',
      'Rocafirme',
      'Vetadorada',
    ],
  },
  halfling: {
    male: ['Milo', 'Perrin', 'Cade', 'Osborn', 'Wellby'],
    female: ['Nissa', 'Lidda', 'Merla', 'Verna', 'Seraphina'],
    family: ['Brisaverde', 'Piedecoraje', 'Buenbarril', 'Colinalta', 'Tozudo'],
  },
  gnome: {
    male: ['Boddynock', 'Fonkin', 'Zook', 'Wrenn', 'Alston'],
    female: ['Bimpnottin', 'Nissa', 'Zanna', 'Ellyjobell', 'Roywyn'],
    family: ['Chispaverde', 'Nackle', 'Timbers', 'Garrick', 'Follaje'],
  },
  'half-elf': {
    male: ['Corran', 'Aramil', 'Davos', 'Leif'],
    female: ['Aryn', 'Celeste', 'Mirabel', 'Ysolde'],
    family: ['Sombraluz', 'Vientocorto', 'Dosríos', 'Alamar'],
  },
  'half-orc': {
    male: ['Dench', 'Krusk', 'Thokk', 'Ront', 'Holg'],
    female: ['Baggi', 'Emen', 'Ovak', 'Shautha', 'Vola'],
    family: ['Rompeyelmos', 'Grancolmillo', 'Lobogris', 'Sinmiedo'],
  },
  tiefling: {
    male: ['Akmenos', 'Damakos', 'Leucis', 'Morthos', 'Skamos'],
    female: ['Akta', 'Kallista', 'Nemeia', 'Orianna', 'Rieta'],
    family: ['Penumbra', 'Ceniza', 'Desdén', 'Promesa', 'Vísperas'],
  },
  dragonborn: {
    male: ['Arjhan', 'Balasar', 'Donaar', 'Kriv', 'Torinn'],
    female: ['Akra', 'Biri', 'Harann', 'Kava', 'Sora'],
    family: ['Clethtinthiallor', 'Kepeshkmolik', 'Myastan', 'Turnuroth'],
  },
};

const rnd = <T,>(arr: readonly T[]): T | undefined =>
  arr[Math.floor(Math.random() * arr.length)];

type Chip = { tag: string; label: string };

const ChipRow = ({
  items,
  value,
  onChange,
  allLabel,
}: {
  items: readonly Chip[];
  value: string | null;
  onChange: (v: string | null) => void;
  allLabel: string;
}) => (
  <div className="flex flex-wrap gap-1.5">
    <button
      className={`rounded-full border px-3 py-1 font-condensed text-xs uppercase tracking-wider transition ${
        value === null
          ? 'border-brass bg-brass/20 text-brass-pale'
          : 'border-charcoal-600 text-charcoal-300 hover:border-brass/60'
      }`}
      onClick={() => onChange(null)}
      type="button"
    >
      {allLabel}
    </button>
    {items.map((it) => (
      <button
        className={`rounded-full border px-3 py-1 font-condensed text-xs uppercase tracking-wider transition ${
          value === it.tag
            ? 'border-brass bg-brass/20 text-brass-pale'
            : 'border-charcoal-600 text-charcoal-300 hover:border-brass/60'
        }`}
        key={it.tag}
        onClick={() => onChange(value === it.tag ? null : it.tag)}
        type="button"
      >
        {it.label}
      </button>
    ))}
  </div>
);

type Generated = {
  art: ArtEntry;
  name: string;
  race: Chip;
  gender: Chip;
  cls: Chip;
};

/** Gallery by race, gender and class, plus a one-click character generator. */
const PortraitLab = ({ portraits }: PortraitLabProps) => {
  const [race, setRace] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [series, setSeries] = useState<Set<string>>(new Set());
  const [hideWhite, setHideWhite] = useState(true);
  const [showAllSeries, setShowAllSeries] = useState(false);
  const [visible, setVisible] = useState(48);
  const [favorites, setFavorites] = useState<ArtEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('role-master:portrait-favorites');
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        setFavorites(
          ids
            .map((id) => portraits.find((p) => p.id === id))
            .filter((p): p is ArtEntry => Boolean(p)),
        );
      }
    } catch {
      /* no storage */
    }
  }, [portraits]);

  const toggleFavorite = (art: ArtEntry) =>
    setFavorites((fs) => {
      const next = fs.some((f) => f.id === art.id)
        ? fs.filter((f) => f.id !== art.id)
        : [...fs, art];
      try {
        localStorage.setItem(
          'role-master:portrait-favorites',
          JSON.stringify(next.map((f) => f.id)),
        );
      } catch {
        /* ignore */
      }
      return next;
    });

  const seriesOf = (art: ArtEntry) =>
    art.source.site === 'kingmaker'
      ? ['Pathfinder: Kingmaker']
      : art.cats
          .filter(
            (c) => c.startsWith('Images from ') && !GENERIC_SOURCES.has(c),
          )
          .map(seriesLabel);

  const favoritesText = favorites
    .map((f) => `${f.id} · ${seriesOf(f).join(' / ') || 'sin serie'}`)
    .join('\n');

  const copyFavorites = async () => {
    try {
      await navigator.clipboard.writeText(favoritesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the text is visible anyway */
    }
  };

  /** Pool after every filter except the series themselves. */
  const poolForSeries = useMemo(
    () =>
      portraits.filter(
        (p) =>
          (!hideWhite || !p.tags.includes('white-bg')) &&
          (!race || p.tags.includes(race)) &&
          (!gender || p.tags.includes(gender)) &&
          (!cls || p.tags.includes(cls)),
      ),
    [portraits, hideWhite, race, gender, cls],
  );

  /** Source books available for the current selection, most populated first. */
  const allSeries = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of poolForSeries) {
      for (const c of p.cats) {
        if (c.startsWith('Images from ') && !GENERIC_SOURCES.has(c)) {
          count.set(c, (count.get(c) ?? 0) + 1);
        }
      }
    }
    for (const c of series) if (!count.has(c)) count.set(c, 0);
    return [...count.entries()]
      .filter(([c, n]) => n >= 3 || series.has(c))
      .sort((a, b) => b[1] - a[1]);
  }, [poolForSeries, series]);

  const toggleSeries = (c: string) =>
    setSeries((s) => {
      const next = new Set(s);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const matchesBase = useCallback(
    (p: ArtEntry) =>
      (!hideWhite || !p.tags.includes('white-bg')) &&
      (series.size === 0 || p.cats.some((c) => series.has(c))),
    [hideWhite, series],
  );

  const filtered = useMemo(
    () =>
      portraits.filter(
        (p) =>
          matchesBase(p) &&
          (!race || p.tags.includes(race)) &&
          (!gender || p.tags.includes(gender)) &&
          (!cls || p.tags.includes(cls)),
      ),
    [portraits, race, gender, cls, matchesBase],
  );

  const generate = () => {
    const r = race ? RACES.find((x) => x.tag === race) : rnd(RACES);
    const g = gender ? GENDERS.find((x) => x.tag === gender) : rnd(GENDERS);
    const k = cls ? CLASSES.find((x) => x.tag === cls) : rnd(CLASSES);
    if (!r || !g || !k) return;
    const base = portraits.filter(matchesBase);
    const strict = base.filter(
      (p) =>
        p.tags.includes(r.tag) &&
        p.tags.includes(g.tag) &&
        p.tags.includes(k.tag),
    );
    const loose = base.filter(
      (p) => p.tags.includes(r.tag) && p.tags.includes(g.tag),
    );
    const any = base.filter((p) => p.tags.includes(r.tag));
    const pool = strict.length > 0 ? strict : loose.length > 0 ? loose : any;
    const art = rnd(pool);
    if (!art) return;
    const names = NAMES[r.tag] ?? NAMES.human;
    const first =
      rnd(names?.[g.tag as 'male' | 'female'] ?? []) ?? 'Sin nombre';
    const family = rnd(names?.family ?? []) ?? '';
    setGenerated({
      art,
      name: `${first} ${family}`.trim(),
      race: r,
      gender: g,
      cls: k,
    });
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="space-y-2">
          <ChipRow
            allLabel="Todas las razas"
            items={RACES}
            onChange={setRace}
            value={race}
          />
          <ChipRow
            allLabel="Cualquier género"
            items={GENDERS}
            onChange={setGender}
            value={gender}
          />
          <ChipRow
            allLabel="Cualquier clase"
            items={CLASSES}
            onChange={setCls}
            value={cls}
          />
        </div>

        <div className="mt-4 rounded-md border border-charcoal-700 bg-charcoal-900/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
              Serie · libro de origen
              {series.size > 0 ? ` · ${series.size} elegidas` : ''}
            </div>
            <label className="flex cursor-pointer items-center gap-2 font-scaly text-charcoal-300 text-xs">
              <input
                checked={hideWhite}
                className="accent-brass"
                onChange={(e) => setHideWhite(e.target.checked)}
                type="checkbox"
              />
              Ocultar fondo blanco
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(showAllSeries ? allSeries : allSeries.slice(0, 18)).map(
              ([c, n]) => (
                <button
                  className={`rounded-full border px-2.5 py-1 font-scaly text-xs transition ${
                    series.has(c)
                      ? 'border-brass bg-brass/20 text-brass-pale'
                      : 'border-charcoal-600 text-charcoal-300 hover:border-brass/60'
                  }`}
                  key={c}
                  onClick={() => toggleSeries(c)}
                  type="button"
                >
                  {seriesLabel(c)}{' '}
                  <span className="text-charcoal-500">{n}</span>
                </button>
              ),
            )}
            {allSeries.length > 18 ? (
              <button
                className="rounded-full border border-charcoal-700 border-dashed px-2.5 py-1 font-scaly text-charcoal-400 text-xs"
                onClick={() => setShowAllSeries((v) => !v)}
                type="button"
              >
                {showAllSeries
                  ? 'Ver menos'
                  : `Ver ${allSeries.length - 18} más`}
              </button>
            ) : null}
            {series.size > 0 ? (
              <button
                className="rounded-full px-2.5 py-1 font-condensed text-brand-300 text-xs uppercase"
                onClick={() => setSeries(new Set())}
                type="button"
              >
                Quitar series
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 font-condensed text-charcoal-400 text-xs uppercase tracking-wider">
          {filtered.length} retratos
          {filtered.length > visible ? ` · mostrando ${visible}` : ''}
        </div>
        {filtered.length === 0 ? (
          <div className="mt-4 rounded border border-charcoal-700 border-dashed p-10 text-center font-book text-charcoal-400 italic">
            Todavía no hay retratos con esas etiquetas. La descarga del catálogo
            sigue en marcha, o esta combinación no existe en el arte oficial.
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {filtered.slice(0, visible).map((p) => (
            <button
              className="group frame-brass relative aspect-[3/4] overflow-hidden rounded-sm bg-charcoal-800 text-left"
              key={p.id}
              onClick={() =>
                setGenerated({
                  art: p,
                  name: p.title
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\d+\b/g, '')
                    .trim(),
                  race: RACES.find((r) => p.tags.includes(r.tag)) ?? {
                    tag: '',
                    label: '',
                  },
                  gender: GENDERS.find((g) => p.tags.includes(g.tag)) ?? {
                    tag: '',
                    label: '',
                  },
                  cls: CLASSES.find((c) => p.tags.includes(c.tag)) ?? {
                    tag: '',
                    label: '',
                  },
                })
              }
              title={p.title}
              type="button"
            >
              {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
              <img
                alt={p.title}
                className="h-full w-full object-cover object-[50%_20%] transition duration-300 group-hover:scale-[1.04]"
                height={p.height}
                loading="lazy"
                src={p.src}
                width={p.width}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-950/90 to-transparent px-2 pt-6 pb-1.5">
                <div className="font-condensed text-[0.62rem] text-brass-pale uppercase tracking-wider">
                  {p.tags
                    .filter(
                      (t) =>
                        RACES.some((r) => r.tag === t) ||
                        CLASSES.some((c) => c.tag === t),
                    )
                    .slice(0, 2)
                    .join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>
        {filtered.length > visible ? (
          <div className="mt-4 flex justify-center">
            <button
              className="btn-ghost px-5 py-2 text-xs uppercase"
              onClick={() => setVisible((v) => v + 48)}
              type="button"
            >
              Mostrar 48 más ({filtered.length - visible} restantes)
            </button>
          </div>
        ) : null}
      </div>

      {/* Generator card */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-lg border border-brass/40 bg-charcoal-800 p-5">
          <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
            Generador
          </div>
          <h3 className="font-nodesto text-2xl text-brass-pale uppercase">
            Un personaje al azar
          </h3>
          <p className="mt-1 font-scaly text-charcoal-400 text-sm">
            Usa los filtros de la izquierda o déjalo todo en manos del destino.
          </p>
          <button
            className="btn-beyond mt-4 w-full px-4 py-3 uppercase"
            onClick={generate}
            type="button"
          >
            Generar personaje
          </button>

          {generated ? (
            <div className="paper mt-5 rounded-[3px] p-4">
              <div className="flex gap-4">
                <div className="frame-brass h-36 w-28 shrink-0 overflow-hidden rounded-sm outline-gold-page">
                  {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
                  <img
                    alt={generated.name}
                    className="h-full w-full object-cover object-[50%_15%]"
                    height={generated.art.height}
                    src={generated.art.src}
                    width={generated.art.width}
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-caps text-[1.4rem] text-maroon leading-tight">
                    {generated.name}
                  </div>
                  <div className="font-scaly text-ink-muted text-sm">
                    {[
                      generated.race.label,
                      generated.gender.label,
                      generated.cls.label,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full ring-[3px] ring-brass-gold ring-offset-2 ring-offset-paper">
                      {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
                      <img
                        alt=""
                        className="h-full w-full object-cover object-[50%_15%]"
                        height={generated.art.height}
                        src={generated.art.src}
                        width={generated.art.width}
                      />
                    </div>
                    <div className="font-scaly text-ink-muted text-xs leading-tight">
                      Token para el tablero,
                      <br />
                      generado del retrato.
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-gold-rule border-t pt-2 font-scaly text-[0.72rem] text-ink-muted">
                <div>
                  <span className="text-ink">Clave:</span>{' '}
                  <code className="rounded bg-paper-stat px-1 py-0.5 font-mono text-[0.7rem] text-maroon">
                    {generated.art.id}
                  </code>
                </div>
                <div>
                  <span className="text-ink">Serie:</span>{' '}
                  {seriesOf(generated.art).join(' · ') ||
                    'sin libro identificado'}
                </div>
                <div>
                  <span className="text-ink">Arte:</span>{' '}
                  {generated.art.artist ?? 'Wizards of the Coast'}
                </div>
                <button
                  className={`mt-1 w-full rounded border px-2 py-1.5 font-condensed text-xs uppercase tracking-wider ${
                    favorites.some((f) => f.id === generated.art.id)
                      ? 'border-maroon bg-maroon text-paper-light'
                      : 'border-maroon/50 text-maroon hover:bg-maroon/10'
                  }`}
                  onClick={() => toggleFavorite(generated.art)}
                  type="button"
                >
                  {favorites.some((f) => f.id === generated.art.id)
                    ? '★ En favoritos'
                    : '☆ Marcar favorito'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {favorites.length > 0 ? (
          <div className="mt-4 rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
            <div className="flex items-center justify-between">
              <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
                Favoritos · {favorites.length}
              </div>
              <button
                className="btn-ghost px-2 py-1 text-xs uppercase"
                onClick={copyFavorites}
                type="button"
              >
                {copied ? 'Copiado' : 'Copiar lista'}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-6 gap-1">
              {favorites.map((f) => (
                <button
                  className="frame-brass aspect-[3/4] overflow-hidden rounded-sm"
                  key={f.id}
                  onClick={() => toggleFavorite(f)}
                  title={`Quitar ${f.id}`}
                  type="button"
                >
                  {/* biome-ignore lint/performance/noImgElement: pre-sized local art */}
                  <img
                    alt=""
                    className="h-full w-full object-cover object-[50%_20%]"
                    height={f.height}
                    src={f.src}
                    width={f.width}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="mt-2 h-24 w-full resize-y rounded border border-charcoal-700 bg-charcoal-900 p-2 font-mono text-[0.68rem] text-charcoal-200"
              readOnly
              value={favoritesText}
            />
          </div>
        ) : null}
      </aside>
    </div>
  );
};

export { PortraitLab, RACES };
