import { ItemTile } from '@/components/items/item-tile';
import { ArtImage } from '@/components/theme/art';
import { Formula } from './formula';
import type { SheetModel } from './sheet-model';

/**
 * The character sheet of the table: the official 5e layout rebuilt on one
 * strict grid for a television. Dark by default (charcoal, brass rules,
 * parchment text); `tone="paper"` gives the printed version. Every computed
 * number shows its formula on hover.
 */

type Tone = 'paper' | 'dark';

const T = (tone: Tone) =>
  tone === 'paper'
    ? {
        page: 'paper text-ink',
        ink: 'text-ink',
        muted: 'text-ink-muted',
        accent: 'text-maroon',
        rule: 'border-ink/60',
        box: 'border-ink/60 bg-paper-light/70',
        boxStrong: 'border-ink bg-paper-light',
        chip: 'bg-paper-stat',
        bar: 'bg-paper',
        dotOn: 'bg-ink border-ink',
        dotOff: 'border-ink',
        zebra: 'odd:bg-note/60',
      }
    : {
        page: 'bg-charcoal-950 text-parchment-text',
        ink: 'text-parchment-text',
        muted: 'text-charcoal-300',
        accent: 'text-brass-pale',
        rule: 'border-brass/50',
        box: 'border-brass/35 bg-charcoal-900/70',
        boxStrong: 'border-brass/60 bg-charcoal-900',
        chip: 'bg-brass/15',
        bar: 'bg-charcoal-800',
        dotOn: 'bg-brass border-brass',
        dotOff: 'border-brass/60',
        zebra: 'odd:bg-white/[0.04]',
      };

type Theme = ReturnType<typeof T>;

/** Type scale for a TV: never under 16px, grows with the viewport. */
const S = {
  label: 'text-[clamp(0.85rem,1.05vw,1.35rem)]',
  body: 'text-[clamp(1.1rem,1.4vw,1.8rem)]',
  /** Dense lists (saves, skills): one notch down so two columns fit. */
  list: 'text-[clamp(1rem,1.2vw,1.55rem)]',
  value: 'text-[clamp(1.35rem,1.7vw,2.2rem)]',
  big: 'text-[clamp(2.1rem,2.8vw,3.6rem)]',
  huge: 'text-[clamp(2.7rem,3.6vw,4.6rem)]',
  title: 'text-[clamp(2.1rem,3vw,3.8rem)]',
};

const Label = ({ children, t }: { children: React.ReactNode; t: Theme }) => (
  <div
    className={`font-scaly ${S.label} ${t.muted} uppercase tracking-[0.12em]`}
  >
    {children}
  </div>
);

const Box = ({
  title,
  children,
  t,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  t: Theme;
  className?: string;
}) => (
  <div
    className={`flex flex-col rounded-md border px-4 pt-3 pb-2 ${t.box} ${className}`}
  >
    <div className="min-h-0 flex-1">{children}</div>
    <div
      className={`mt-2 border-t pt-1.5 text-center font-scaly ${S.label} ${t.muted} uppercase tracking-[0.14em] ${t.rule}`}
    >
      {title}
    </div>
  </div>
);

const Dot = ({ on, t }: { on: boolean; t: Theme }) => (
  <span
    className={`inline-block h-[0.8em] w-[0.8em] shrink-0 rounded-full border-2 ${on ? t.dotOn : t.dotOff}`}
  />
);

/** One line of a saves or skills list: dot · value · name · ability, fixed columns. */
const ROW =
  'grid grid-cols-[1.1em_2.9em_minmax(0,1fr)_2.4em] items-center gap-x-1.5';

const Stat = ({
  calc,
  label,
  t,
  shield = false,
}: {
  calc: { value: string; formula: string };
  label: string;
  t: Theme;
  shield?: boolean;
}) => (
  <div
    className={`flex aspect-[5/6] w-full flex-col items-center justify-center border-2 ${t.boxStrong} ${shield ? 'rounded-t-lg rounded-b-[45%]' : 'rounded-lg'}`}
  >
    <Formula
      calc={calc}
      className={`font-book ${S.big} tabular-nums leading-none ${t.ink}`}
    />
    <div
      className={`mt-2 px-2 text-center font-scaly ${S.label} ${t.muted} uppercase leading-none tracking-wider`}
    >
      {label}
    </div>
  </div>
);

const CharacterSheet = ({
  m,
  player,
  tone = 'dark',
}: {
  m: SheetModel;
  player?: string;
  tone?: Tone;
}) => {
  const t = T(tone);
  const { c } = m;
  const half = Math.ceil(m.skills.length / 2);
  const skillCols = [m.skills.slice(0, half), m.skills.slice(half)];
  return (
    <div
      className={`${t.page} rounded-[3px] p-[clamp(1rem,1.6vw,2.2rem)] font-scaly`}
      data-testid="character-sheet"
    >
      {/* Header */}
      <div className="grid grid-cols-[clamp(6rem,8vw,10rem)_1fr] gap-[clamp(1rem,1.4vw,1.8rem)]">
        <div className="frame-brass aspect-[4/5] overflow-hidden rounded-sm">
          <ArtImage
            alt={c.name}
            art={m.portrait}
            className="h-full w-full"
            position="50% 15%"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-between">
          <div className={`border-b-2 pb-1 ${t.rule}`}>
            <div
              className={`truncate font-caps ${S.title} ${t.accent} leading-none`}
            >
              {c.name}
            </div>
            <Label t={t}>
              Nombre del personaje{player ? ` · jugador: ${player}` : ''}
            </Label>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {(
              [
                ['Clase y nivel', `${c.className} ${c.level}`, null],
                ['Trasfondo', c.background, null],
                ['Raza', c.race, null],
                ['Alineamiento', c.alignment, null],
                ['Experiencia', String(c.xp), null],
                ['Competencia', m.pb.value, m.pb],
              ] as const
            ).map(([l, v, calc]) => (
              <div className={`min-w-0 border-b pb-1 ${t.rule}`} key={l}>
                <div
                  className={`truncate font-book ${S.body} ${t.ink} leading-tight`}
                >
                  {calc ? <Formula calc={calc} /> : v}
                </div>
                <Label t={t}>{l}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Abilities */}
      <div className="mt-[clamp(1rem,1.4vw,1.8rem)] grid grid-cols-6 gap-[clamp(0.6rem,1vw,1.4rem)]">
        {m.abilities.map((a) => (
          <div
            className={`relative flex flex-col items-center rounded-t-lg rounded-b-[40%] border-2 pt-2 pb-7 ${t.boxStrong}`}
            key={a.id}
          >
            <Label t={t}>{a.name}</Label>
            <Formula
              calc={a.mod}
              className={`font-book ${S.huge} tabular-nums leading-none ${t.ink}`}
            />
            <div
              className={`absolute -bottom-[1.1em] flex h-[2.2em] min-w-[3.2em] items-center justify-center rounded-full border-2 px-2 font-scaly ${S.value} tabular-nums ${t.boxStrong} ${t.ink}`}
            >
              {a.score}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="mt-[clamp(1.6rem,2.2vw,3rem)] grid grid-cols-[1.55fr_0.95fr_1.4fr] gap-[clamp(0.8rem,1.2vw,1.6rem)]">
        {/* Saves, skills, passive, personality */}
        <div className="flex flex-col gap-3">
          <Box t={t} title="Tiradas de salvación">
            <div
              className={`grid grid-cols-2 gap-x-6 gap-y-1 font-scaly ${S.list}`}
            >
              {m.abilities.map((a) => (
                <div className={ROW} key={a.id}>
                  <Dot on={a.saveProf} t={t} />
                  <Formula
                    calc={a.save}
                    className={`justify-self-end text-right font-bold tabular-nums ${t.ink}`}
                  />
                  <span className={`leading-tight ${t.ink}`}>{a.name}</span>
                  <span />
                </div>
              ))}
            </div>
          </Box>
          <Box t={t} title="Habilidades">
            <div className="grid grid-cols-2 gap-x-6">
              {skillCols.map((col, i) => (
                <div
                  className={`font-scaly ${S.list}`}
                  key={i === 0 ? 'a' : 'b'}
                >
                  {col.map((s) => (
                    <div className={`${ROW} py-[0.15em]`} key={s.id}>
                      <Dot on={s.prof} t={t} />
                      <Formula
                        calc={s.mod}
                        className={`justify-self-end text-right font-bold tabular-nums ${t.ink}`}
                      />
                      <span className={`leading-tight ${t.ink}`}>{s.name}</span>
                      <span className={`text-right ${S.label} ${t.muted}`}>
                        {s.ability}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Box>
          <div
            className={`flex items-center gap-3 rounded-md border px-4 py-2 ${t.box}`}
          >
            <Formula
              calc={m.passive}
              className={`flex h-[2.4em] w-[2.4em] items-center justify-center rounded-full border-2 font-book ${S.value} tabular-nums no-underline ${t.boxStrong} ${t.ink}`}
            />
            <Label t={t}>Percepción pasiva</Label>
          </div>
          <Box className="flex-1" t={t} title="Personalidad">
            <div
              className={`grid grid-cols-1 gap-y-1.5 font-book ${S.body} ${t.ink} italic leading-snug`}
            >
              {[
                ['Rasgos', c.traits],
                ['Ideal', c.ideals],
                ['Vínculo', c.bonds],
                ['Defecto', c.flaws],
              ].map(([l, v]) => (
                <p key={l}>
                  <span className={`font-caps not-italic ${t.accent}`}>
                    {l}.{' '}
                  </span>
                  {v}
                </p>
              ))}
            </div>
          </Box>
        </div>

        {/* Combat */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat calc={m.armor} label="Armadura" shield t={t} />
            <Stat calc={m.initiative} label="Iniciativa" t={t} />
            <Stat
              calc={{
                value: String(c.speed),
                formula: `Velocidad de ${c.race.toLowerCase()}: ${c.speed} pies`,
              }}
              label="Velocidad"
              t={t}
            />
          </div>
          <div className={`-mt-1 text-center font-scaly ${S.label} ${t.muted}`}>
            {c.armorNote}
          </div>
          <Box t={t} title="Puntos de golpe">
            <div className="flex items-end justify-between">
              <div>
                <Label t={t}>
                  Máximo <Formula calc={m.hpMax} />
                </Label>
                <div
                  className={`font-book ${S.huge} tabular-nums leading-none ${t.ink}`}
                >
                  {c.hp.current}
                  <span className={`${S.value} ${t.muted}`}> / {c.hp.max}</span>
                </div>
              </div>
              <div className="text-right">
                <Label t={t}>Temporales</Label>
                <div className={`font-book ${S.value} ${t.ink}`}>
                  {c.hp.temp || '—'}
                </div>
              </div>
            </div>
            <div
              className={`mt-3 h-[0.6em] overflow-hidden rounded-full border ${t.rule} ${t.bar}`}
            >
              <div
                className={
                  m.hpPct > 50
                    ? 'h-full bg-[#6c8a3c]'
                    : m.hpPct > 25
                      ? 'h-full bg-ribbon'
                      : 'h-full bg-rule-red'
                }
                style={{ width: `${m.hpPct}%` }}
              />
            </div>
          </Box>
          <div className="grid grid-cols-2 gap-3">
            <Box t={t} title="Dados de golpe">
              <div className={`font-book ${S.value} ${t.ink}`}>{c.hitDie}</div>
              <Label t={t}>Total {c.level}</Label>
            </Box>
            <Box t={t} title="Salv. de muerte">
              {(['Éxitos', 'Fallos'] as const).map((k) => (
                <div
                  className={`flex items-center justify-between font-scaly ${S.body} ${t.ink}`}
                  key={k}
                >
                  <span>{k}</span>
                  <span className="flex gap-1">
                    <Dot on={false} t={t} />
                    <Dot on={false} t={t} />
                    <Dot on={false} t={t} />
                  </span>
                </div>
              ))}
            </Box>
          </div>
          <Box className="flex-1" t={t} title="Rasgos y atributos">
            <ul className={`space-y-1.5 font-scaly ${S.body} ${t.ink}`}>
              {c.features.map((f) => (
                <li key={f.name}>
                  <span className={`font-caps ${t.accent}`}>{f.name}. </span>
                  <span className="font-book">{f.text}</span>
                </li>
              ))}
            </ul>
          </Box>
        </div>

        {/* Attacks, equipment */}
        <div className="flex flex-col gap-3">
          <Box t={t} title="Ataques y conjuros">
            <table className={`w-full table-fixed font-scaly ${S.body}`}>
              <thead>
                <tr
                  className={`${S.label} ${t.muted} uppercase tracking-wider`}
                >
                  <th className="w-[38%] text-left font-normal">Nombre</th>
                  <th className="w-[14%] font-normal">Bonif.</th>
                  <th className="text-left font-normal">Daño y notas</th>
                </tr>
              </thead>
              <tbody>
                {m.attacks.map((a) => (
                  <tr className={`${t.zebra} align-top`} key={a.name}>
                    <td className={`py-1 pl-1 ${t.ink}`}>{a.name}</td>
                    <td
                      className={`py-1 text-center font-bold tabular-nums ${t.ink}`}
                    >
                      <Formula calc={a.bonus} />
                    </td>
                    <td className={`py-1 ${t.ink}`}>
                      <div>{a.damage}</div>
                      {a.notes ? (
                        <div className={`${S.label} ${t.muted}`}>{a.notes}</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Box t={t} title="Equipo">
            <div className="grid grid-cols-6 gap-2">
              {c.inventory.slice(0, 12).map((it) => (
                <ItemTile
                  art={m.itemArt.get(it.icon)}
                  item={it}
                  key={it.name}
                  variant="sheet"
                />
              ))}
            </div>
            <div
              className={`mt-3 grid grid-cols-3 font-scaly ${S.body} ${t.ink}`}
            >
              {[
                ['Oro', c.coins.gp],
                ['Plata', c.coins.sp],
                ['Cobre', c.coins.cp],
              ].map(([l, v]) => (
                <span key={l}>
                  <b className="tabular-nums">{v}</b>{' '}
                  <span className={t.muted}>{l}</span>
                </span>
              ))}
            </div>
          </Box>
          <Box className="flex-1" t={t} title="Competencias e idiomas">
            <p className={`font-scaly ${S.body} ${t.ink}`}>
              <b>Competencias.</b> {c.proficiencies.join(', ')}.
            </p>
            <p className={`mt-1 font-scaly ${S.body} ${t.ink}`}>
              <b>Idiomas.</b> {c.languages.join(', ')}.
            </p>
          </Box>
        </div>
      </div>
    </div>
  );
};

export { CharacterSheet };
