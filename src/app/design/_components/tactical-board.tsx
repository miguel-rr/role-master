'use client';

import { useMemo, useState } from 'react';

/**
 * Tactical board proposal: a hand-inked battle map on a 5 ft grid with real
 * distance-based movement. Terrain is data (the narrator will emit it), the
 * renderer draws it; tokens carry the character's portrait.
 */

const CELL = 70; // px per 5 ft square (2-Minute Tabletop standard)

type Terrain = '.' | ',' | '#' | 'T' | '~' | ':' | 'D' | 'o';

const LEGEND: Record<Terrain, { label: string; cost: number | null }> = {
  '.': { label: 'Suelo de piedra', cost: 1 },
  ',': { label: 'Hierba', cost: 1 },
  '#': { label: 'Muro', cost: null },
  T: { label: 'Árbol', cost: null },
  '~': { label: 'Agua poco profunda (terreno difícil)', cost: 2 },
  ':': { label: 'Escombros (terreno difícil)', cost: 2 },
  D: { label: 'Puerta', cost: 1 },
  o: { label: 'Roca', cost: null },
};

// 18 × 12: a ruined watch post by a stream, trees to the east.
const MAP: string[] = [
  ',,,,,,,,,,,,,,T,,,',
  ',,#######,,,,,,,T,',
  ',,#.....#,,,,,,,,,',
  ',,#.....D,,,,o,,,,',
  ',,#..:..#,,,,,,T,,',
  ',,###D###,,,,,,,,,',
  ',,,,,,,,,,,,,,,,,,',
  ',,,,,,,~~~,,,,,,T,',
  ',,,,,~~~~~~~,,,,,,',
  ',,,,~~~~~~~~~~,,,,',
  ',,,,,,~~~~~~,,,,,,',
  ',,,,,,,,,,,,,,,,,,',
];

const ROWS = MAP.length;
const COLS = MAP[0]?.length ?? 0;

type Token = {
  id: string;
  name: string;
  src?: string;
  kind: 'pc' | 'enemy' | 'ally';
  color: string;
  x: number;
  y: number;
  speed: number;
  hp: number;
  maxHp: number;
  initiative: number;
};

type TacticalBoardProps = {
  initialTokens: Token[];
};

const terrainAt = (x: number, y: number): Terrain =>
  (MAP[y]?.[x] as Terrain | undefined) ?? '#';

const key = (x: number, y: number) => `${x},${y}`;

/** Dijkstra over the grid; 5e simplified diagonals (every step = 5 ft). */
const reachable = (from: Token, speed: number, tokens: Token[]) => {
  const blocked = new Set(
    tokens.filter((t) => t.id !== from.id).map((t) => key(t.x, t.y)),
  );
  const dist = new Map<string, number>([[key(from.x, from.y), 0]]);
  const prev = new Map<string, string>();
  const open: { x: number; y: number; d: number }[] = [
    { x: from.x, y: from.y, d: 0 },
  ];
  while (open.length > 0) {
    open.sort((a, b) => a.d - b.d);
    const cur = open.shift();
    if (!cur) break;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const cost = LEGEND[terrainAt(nx, ny)].cost;
        if (cost === null) continue;
        // No cutting corners around walls.
        if (dx !== 0 && dy !== 0) {
          if (LEGEND[terrainAt(cur.x + dx, cur.y)].cost === null) continue;
          if (LEGEND[terrainAt(cur.x, cur.y + dy)].cost === null) continue;
        }
        const nd = cur.d + cost * 5;
        if (nd > speed) continue;
        const k = key(nx, ny);
        if (blocked.has(k)) continue;
        if (nd < (dist.get(k) ?? Number.POSITIVE_INFINITY)) {
          dist.set(k, nd);
          prev.set(k, key(cur.x, cur.y));
          open.push({ x: nx, y: ny, d: nd });
        }
      }
    }
  }
  return { dist, prev };
};

const pathTo = (prev: Map<string, string>, from: Token, to: string) => {
  const path: string[] = [];
  let cur: string | undefined = to;
  const start = key(from.x, from.y);
  while (cur && cur !== start) {
    path.unshift(cur);
    cur = prev.get(cur);
  }
  return path;
};

const chebyshev = (a: Token, b: Token) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * 5;

/* ── Ink patterns for each terrain ─────────────────────────────────────── */
const Defs = () => (
  <defs>
    <pattern
      height={CELL}
      id="p-grass"
      patternUnits="userSpaceOnUse"
      width={CELL}
    >
      <rect fill="#e4dcc0" height={CELL} width={CELL} />
      <g
        fill="none"
        opacity="0.55"
        stroke="#8a7b4f"
        strokeLinecap="round"
        strokeWidth="1.1"
      >
        <path d="M10 52c2-6 3-9 2-14M18 40c1-5 4-7 6-11M40 58c-1-6 1-9 4-13M52 30c2-5 1-9-1-12M28 22c-2-4-1-8 2-11M58 56c2-4 3-7 2-11" />
      </g>
    </pattern>
    <pattern
      height={CELL}
      id="p-stone"
      patternUnits="userSpaceOnUse"
      width={CELL}
    >
      <rect fill="#d9d0b8" height={CELL} width={CELL} />
      <g fill="none" opacity="0.5" stroke="#6b5f45" strokeWidth="1">
        <path d="M0 35h70M35 0v35M0 35v35M35 35h35v35M52 35v35" />
      </g>
    </pattern>
    <pattern
      height={CELL}
      id="p-water"
      patternUnits="userSpaceOnUse"
      width={CELL}
    >
      <rect fill="#c9d4cf" height={CELL} width={CELL} />
      <g
        fill="none"
        opacity="0.6"
        stroke="#5b7a86"
        strokeLinecap="round"
        strokeWidth="1.2"
      >
        <path d="M6 18c6-4 12-4 18 0s12 4 18 0 12-4 18 0M6 40c6-4 12-4 18 0s12 4 18 0 12-4 18 0M6 60c6-4 12-4 18 0s12 4 18 0 12-4 18 0" />
      </g>
    </pattern>
    <pattern
      height={CELL}
      id="p-rubble"
      patternUnits="userSpaceOnUse"
      width={CELL}
    >
      <rect fill="#d5cbb0" height={CELL} width={CELL} />
      <g fill="#8a7b5a" opacity="0.6">
        <circle cx="14" cy="18" r="3.2" />
        <circle cx="40" cy="12" r="2.2" />
        <circle cx="56" cy="30" r="3.6" />
        <circle cx="22" cy="46" r="2.6" />
        <circle cx="48" cy="54" r="3" />
        <circle cx="10" cy="60" r="1.8" />
      </g>
    </pattern>
    <pattern
      height={CELL}
      id="p-wall"
      patternUnits="userSpaceOnUse"
      width={CELL}
    >
      <rect fill="#5a4b3a" height={CELL} width={CELL} />
      <g fill="none" stroke="#2c2318" strokeWidth="1.4">
        <path d="M0 23h70M0 47h70M23 0v23M47 23v24M12 47v23M58 47v23" />
      </g>
    </pattern>
    <clipPath id="clip-token">
      <circle cx="0" cy="0" r={CELL * 0.42} />
    </clipPath>
    <filter height="140%" id="ink-shadow" width="140%" x="-20%" y="-20%">
      <feDropShadow
        dx="0"
        dy="3"
        floodColor="#000"
        floodOpacity="0.45"
        stdDeviation="3"
      />
    </filter>
  </defs>
);

const fillFor = (t: Terrain) =>
  t === ','
    ? 'url(#p-grass)'
    : t === '.' || t === 'D'
      ? 'url(#p-stone)'
      : t === '~'
        ? 'url(#p-water)'
        : t === ':'
          ? 'url(#p-rubble)'
          : t === '#'
            ? 'url(#p-wall)'
            : 'url(#p-grass)';

const Tree = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x * CELL + CELL / 2} ${y * CELL + CELL / 2})`}>
    <circle fill="#7f8f5a" r={CELL * 0.46} stroke="#3f4a2a" strokeWidth="2" />
    <circle cx="-8" cy="-6" fill="#95a56a" opacity="0.7" r={CELL * 0.22} />
    <circle cx="9" cy="8" fill="#6b7a48" opacity="0.6" r={CELL * 0.2} />
    <circle fill="#3f4a2a" r="3" />
  </g>
);

const Rock = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x * CELL + CELL / 2} ${y * CELL + CELL / 2})`}>
    <path
      d="M-26 12 L-18 -16 L4 -24 L26 -6 L20 18 L-8 24 Z"
      fill="#a89e86"
      stroke="#4d4536"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M-10 -8 L6 -14 L14 2"
      fill="none"
      opacity="0.6"
      stroke="#4d4536"
      strokeWidth="1.2"
    />
  </g>
);

const Door = ({ x, y }: { x: number; y: number }) => (
  <rect
    fill="#8a5a2b"
    height={CELL - 20}
    rx="3"
    stroke="#3a2510"
    strokeWidth="2"
    width={CELL - 40}
    x={x * CELL + 20}
    y={y * CELL + 10}
  />
);

/* ── Board ─────────────────────────────────────────────────────────────── */

const TacticalBoard = ({ initialTokens }: TacticalBoardProps) => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [turn, setTurn] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [movedFeet, setMovedFeet] = useState(0);

  const order = useMemo(
    () => [...tokens].sort((a, b) => b.initiative - a.initiative),
    [tokens],
  );
  const active = order[turn % order.length];
  const speedLeft = active ? active.speed - movedFeet : 0;

  const reach = useMemo(
    () =>
      active
        ? reachable(active, speedLeft, tokens)
        : { dist: new Map<string, number>(), prev: new Map<string, string>() },
    [active, speedLeft, tokens],
  );
  const hoverPath =
    hover && active && reach.dist.has(hover)
      ? pathTo(reach.prev, active, hover)
      : [];

  const moveTo = (k: string) => {
    if (!active) return;
    const d = reach.dist.get(k);
    if (d == null || d === 0) return;
    const [x, y] = k.split(',').map(Number) as [number, number];
    setTokens((ts) => ts.map((t) => (t.id === active.id ? { ...t, x, y } : t)));
    setMovedFeet((m) => m + d);
    setHover(null);
  };

  const endTurn = () => {
    setTurn((t) => t + 1);
    setMovedFeet(0);
    setHover(null);
  };

  const enemiesInReach = active
    ? tokens.filter((t) => t.kind !== active.kind && chebyshev(active, t) <= 5)
    : [];

  return (
    <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[1fr_17rem]">
      <div className="overflow-x-auto rounded-lg border border-charcoal-700 bg-charcoal-950 p-3">
        <svg
          aria-label="Tablero táctico"
          className="mx-auto block h-auto w-full max-w-[1260px]"
          role="img"
          viewBox={`-28 -28 ${COLS * CELL + 56} ${ROWS * CELL + 56}`}
        >
          <Defs />
          {/* Paper frame */}
          <rect
            fill="#eee5ce"
            height={ROWS * CELL + 56}
            rx="6"
            stroke="#8a7b5a"
            strokeWidth="2"
            width={COLS * CELL + 56}
            x="-28"
            y="-28"
          />
          {/* Coordinates */}
          {Array.from({ length: COLS }).map((_, x) => (
            <text
              className="fill-[#6b5f45]"
              fontFamily="var(--font-scaly)"
              fontSize="13"
              key={`c${String.fromCharCode(65 + x)}`}
              textAnchor="middle"
              x={x * CELL + CELL / 2}
              y="-10"
            >
              {String.fromCharCode(65 + x)}
            </text>
          ))}
          {Array.from({ length: ROWS }).map((_, y) => (
            <text
              className="fill-[#6b5f45]"
              fontFamily="var(--font-scaly)"
              fontSize="13"
              key={`r${y + 1}`}
              textAnchor="middle"
              x="-14"
              y={y * CELL + CELL / 2 + 5}
            >
              {y + 1}
            </text>
          ))}
          {/* Terrain */}
          {MAP.map((row, y) =>
            [...row].map((ch, x) => (
              <rect
                fill={fillFor(ch as Terrain)}
                height={CELL}
                key={key(x, y)}
                width={CELL}
                x={x * CELL}
                y={y * CELL}
              />
            )),
          )}
          {/* Grid */}
          <g fill="none" stroke="#3b301f" strokeOpacity="0.28" strokeWidth="1">
            {Array.from({ length: COLS + 1 }).map((_, i) => (
              <path d={`M${i * CELL} 0V${ROWS * CELL}`} key={`v${i * CELL}`} />
            ))}
            {Array.from({ length: ROWS + 1 }).map((_, i) => (
              <path d={`M0 ${i * CELL}H${COLS * CELL}`} key={`h${i * CELL}`} />
            ))}
          </g>
          {/* Props */}
          {MAP.map((row, y) =>
            [...row].map((ch, x) =>
              ch === 'T' ? (
                <Tree key={key(x, y)} x={x} y={y} />
              ) : ch === 'o' ? (
                <Rock key={key(x, y)} x={x} y={y} />
              ) : ch === 'D' ? (
                <Door key={key(x, y)} x={x} y={y} />
              ) : null,
            ),
          )}
          {/* Reachable cells */}
          {active
            ? [...reach.dist.entries()].map(([k, d]) => {
                if (d === 0) return null;
                const [x, y] = k.split(',').map(Number) as [number, number];
                const onPath = hoverPath.includes(k);
                return (
                  // biome-ignore lint/a11y/useSemanticElements: SVG cells; the board also has keyboard-free controls in the sidebar
                  <rect
                    className="cursor-pointer"
                    fill={onPath ? active.color : active.color}
                    fillOpacity={onPath ? 0.55 : 0.22}
                    height={CELL}
                    key={k}
                    onClick={() => moveTo(k)}
                    onMouseEnter={() => setHover(k)}
                    onMouseLeave={() => setHover(null)}
                    role="button"
                    stroke={active.color}
                    strokeOpacity="0.5"
                    width={CELL}
                    x={x * CELL}
                    y={y * CELL}
                  />
                );
              })
            : null}
          {/* Path distance label */}
          {hover && active && reach.dist.has(hover)
            ? (() => {
                const [x, y] = hover.split(',').map(Number) as [number, number];
                return (
                  <g
                    pointerEvents="none"
                    transform={`translate(${x * CELL + CELL / 2} ${y * CELL + 12})`}
                  >
                    <rect
                      fill="#12181c"
                      height="20"
                      rx="4"
                      width="54"
                      x="-27"
                      y="-14"
                    />
                    <text
                      fill="#ecddac"
                      fontFamily="var(--font-condensed)"
                      fontSize="13"
                      fontWeight="700"
                      textAnchor="middle"
                      y="1"
                    >
                      {reach.dist.get(hover)} ft
                    </text>
                  </g>
                );
              })()
            : null}
          {/* Tokens */}
          {tokens.map((t) => {
            const isActive = t.id === active?.id;
            const cx = t.x * CELL + CELL / 2;
            const cy = t.y * CELL + CELL / 2;
            return (
              <g
                filter="url(#ink-shadow)"
                key={t.id}
                transform={`translate(${cx} ${cy})`}
              >
                {isActive ? (
                  <circle
                    className="animate-ember"
                    fill="none"
                    r={CELL * 0.5}
                    stroke={t.color}
                    strokeWidth="3"
                  />
                ) : null}
                <circle fill="#1b1512" r={CELL * 0.45} />
                {t.src ? (
                  <image
                    clipPath="url(#clip-token)"
                    height={CELL * 0.84}
                    href={t.src}
                    preserveAspectRatio="xMidYMin slice"
                    width={CELL * 0.84}
                    x={-CELL * 0.42}
                    y={-CELL * 0.42}
                  />
                ) : (
                  <text
                    fill="#ecddac"
                    fontFamily="var(--font-nodesto)"
                    fontSize="26"
                    textAnchor="middle"
                    y="9"
                  >
                    {t.name[0]}
                  </text>
                )}
                <circle
                  fill="none"
                  r={CELL * 0.43}
                  stroke={t.color}
                  strokeWidth="4"
                />
                {/* HP arc as a ring */}
                <circle
                  fill="none"
                  r={CELL * 0.43}
                  stroke="#000"
                  strokeDasharray={`${(1 - t.hp / t.maxHp) * 2 * Math.PI * CELL * 0.43} ${2 * Math.PI * CELL * 0.43}`}
                  strokeOpacity="0.55"
                  strokeWidth="4"
                  transform="rotate(-90)"
                />
                <rect
                  fill="#12181c"
                  height="16"
                  rx="3"
                  width={t.name.length * 7 + 10}
                  x={-(t.name.length * 7 + 10) / 2}
                  y={CELL * 0.46}
                />
                <text
                  fill="#ecddac"
                  fontFamily="var(--font-condensed)"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  y={CELL * 0.46 + 12}
                >
                  {t.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Initiative + turn controls */}
      <aside className="flex flex-col gap-3 rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
        <div className="font-condensed text-strapline text-xs uppercase tracking-2xl">
          Iniciativa · Asalto {Math.floor(turn / order.length) + 1}
        </div>
        <ol className="space-y-1.5">
          {order.map((t) => (
            <li
              className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${t.id === active?.id ? 'border-brass bg-brass/10' : 'border-charcoal-700'}`}
              key={t.id}
            >
              <span className="w-6 text-center font-nodesto text-brass-pale text-lg">
                {t.initiative}
              </span>
              <span
                className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2"
                style={{ ['--tw-ring-color' as string]: t.color }}
              >
                {t.src ? (
                  // biome-ignore lint/performance/noImgElement: pre-sized local art
                  <img
                    alt=""
                    className="h-full w-full object-cover object-[50%_20%]"
                    src={t.src}
                  />
                ) : (
                  <span className="block h-full w-full bg-charcoal-700" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-caps text-[1rem] text-charcoal-100 leading-none">
                  {t.name}
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-charcoal-900">
                  <div
                    className={`h-full ${t.hp / t.maxHp > 0.5 ? 'bg-[#6c8a3c]' : t.hp / t.maxHp > 0.25 ? 'bg-ribbon' : 'bg-brand-500'}`}
                    style={{ width: `${(t.hp / t.maxHp) * 100}%` }}
                  />
                </div>
              </div>
              <span className="font-scaly text-charcoal-400 text-xs tabular-nums">
                {t.hp}/{t.maxHp}
              </span>
            </li>
          ))}
        </ol>

        {active ? (
          <div className="mt-2 rounded-md border border-charcoal-700 bg-charcoal-900/60 p-3 font-scaly text-sm">
            <div className="font-caps text-brass-pale text-lg leading-none">
              Turno de {active.name}
            </div>
            <div className="mt-2 flex justify-between text-charcoal-300">
              <span>Movimiento</span>
              <span className="tabular-nums">
                <b className="text-white">{speedLeft}</b> / {active.speed} ft
              </span>
            </div>
            <div className="mt-1 flex justify-between text-charcoal-300">
              <span>Al alcance (5 ft)</span>
              <span className="text-white">
                {enemiesInReach.length > 0
                  ? enemiesInReach.map((e) => e.name).join(', ')
                  : '—'}
              </span>
            </div>
            <p className="mt-2 text-charcoal-400 text-xs">
              Pulsa una casilla iluminada para mover. El agua y los escombros
              cuestan el doble; los muros no se atajan en diagonal.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="btn-beyond flex-1 px-3 py-2 text-xs uppercase disabled:opacity-40"
                disabled={enemiesInReach.length === 0}
                type="button"
              >
                Atacar
              </button>
              <button
                className="btn-ghost flex-1 px-3 py-2 text-xs uppercase"
                onClick={endTurn}
                type="button"
              >
                Fin del turno
              </button>
            </div>
          </div>
        ) : null}

        <details className="mt-auto font-scaly text-charcoal-400 text-xs">
          <summary className="cursor-pointer font-condensed text-strapline uppercase tracking-wider">
            Leyenda
          </summary>
          <ul className="mt-2 space-y-0.5">
            {(Object.keys(LEGEND) as Terrain[]).map((k) => (
              <li key={k}>
                <span className="inline-block w-4 font-mono text-charcoal-200">
                  {k}
                </span>{' '}
                {LEGEND[k].label}
              </li>
            ))}
          </ul>
        </details>
      </aside>
    </div>
  );
};

export { TacticalBoard };
export type { Token };
