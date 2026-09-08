import { ItemTile } from '@/components/items/item-tile';
import { ArtImage } from '@/components/theme/art';
import { Paper } from '@/components/theme/paper';
import type { ArtEntry } from '@/data/art/schema';
import type { DemoCharacter } from '@/data/demo/characters';
import {
  ABILITIES,
  ABILITY_LABEL,
  modifier,
  proficiencyBonus,
  SKILLS,
  signed,
} from '@/lib/dnd/rules';

type CharacterSheetProps = {
  character: DemoCharacter;
  /** Who plays them, printed next to the name. */
  player?: string;
  portrait: ArtEntry | undefined;
  itemArt: Map<string, ArtEntry | undefined>;
};

/* ── Small pieces of the official sheet ─────────────────────────────────── */

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="font-scaly text-[0.58rem] text-ink-muted uppercase tracking-[0.12em]">
    {children}
  </div>
);

const Field = ({
  label,
  value,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={`border-ink/60 border-b pb-0.5 ${className}`}>
    <div className="font-book text-[0.95rem] text-ink leading-tight">
      {value}
    </div>
    <FieldLabel>{label}</FieldLabel>
  </div>
);

const AbilityBox = ({
  id,
  score,
}: {
  id: (typeof ABILITIES)[number];
  score: number;
}) => (
  <div className="relative flex flex-col items-center rounded-t-md rounded-b-[40%] border-2 border-ink bg-paper-light px-2 pt-2 pb-6">
    <FieldLabel>{ABILITY_LABEL[id].name}</FieldLabel>
    <div className="font-book text-[1.9rem] text-ink leading-none">
      {signed(modifier(score))}
    </div>
    <div className="absolute -bottom-3 flex h-7 w-11 items-center justify-center rounded-full border-2 border-ink bg-paper font-scaly text-[0.9rem] text-ink">
      {score}
    </div>
  </div>
);

const Dot = ({ on }: { on: boolean }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full border border-ink ${on ? 'bg-ink' : 'bg-transparent'}`}
  />
);

const Shield = ({ value, label }: { value: number; label: string }) => (
  <div className="relative flex h-[4.6rem] w-[4.2rem] flex-col items-center justify-center">
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-ink"
      fill="none"
      viewBox="0 0 64 72"
    >
      <path
        d="M32 3 L59 12 V36 C59 52 47 63 32 69 C17 63 5 52 5 36 V12 Z"
        fill="#f7f2e5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M32 9 L53 16 V36 C53 48 44 57 32 62 C20 57 11 48 11 36 V16 Z"
        opacity="0.5"
        stroke="currentColor"
        strokeWidth="0.8"
      />
    </svg>
    <div className="relative font-book text-[1.7rem] text-ink leading-none">
      {value}
    </div>
    <div className="relative mt-0.5 font-scaly text-[0.5rem] text-ink-muted uppercase tracking-wider">
      {label}
    </div>
  </div>
);

const StatBox = ({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) => (
  <div className="flex h-[4.6rem] w-[4.2rem] flex-col items-center justify-center rounded-lg border-2 border-ink bg-paper-light">
    <div className="font-book text-[1.5rem] text-ink leading-none">{value}</div>
    <div className="mt-1 text-center font-scaly text-[0.5rem] text-ink-muted uppercase leading-none tracking-wider">
      {label}
    </div>
  </div>
);

const Box = ({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-md border border-ink/70 bg-paper-light/60 px-3 pt-2 pb-2 ${className}`}
  >
    {children}
    <div className="mt-2 border-ink/40 border-t pt-1 text-center font-scaly text-[0.6rem] text-ink-muted uppercase tracking-[0.14em]">
      {title}
    </div>
  </div>
);

/* ── The sheet ──────────────────────────────────────────────────────────── */

/** A faithful take on the official 5e character sheet, filled in and alive. */
const CharacterSheet = ({
  character: c,
  player,
  portrait,
  itemArt,
}: CharacterSheetProps) => {
  const pb = proficiencyBonus(c.level);
  const passive =
    10 +
    modifier(c.scores.wis) +
    (c.skillProficiencies.includes('perception') ? pb : 0);
  const hpPct = Math.round((c.hp.current / c.hp.max) * 100);

  return (
    <Paper className="w-full rounded-[3px] p-5 font-scaly md:p-7">
      {/* Header: name plate + portrait + identity fields */}
      <div className="flex gap-4">
        <div className="frame-brass h-28 w-24 shrink-0 overflow-hidden rounded-sm outline-gold-page">
          <ArtImage
            alt={c.name}
            art={portrait}
            className="h-full w-full"
            position="50% 20%"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="border-ink border-b-2">
            <div className="truncate font-caps text-[2rem] text-maroon leading-none">
              {c.name}
            </div>
            <FieldLabel>
              Nombre del personaje{player ? ` · jugador: ${player}` : ''}
            </FieldLabel>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-2">
            <Field label="Clase y nivel" value={`${c.className} ${c.level}`} />
            <Field label="Trasfondo" value={c.background} />
            <Field label="Raza" value={c.race} />
            <Field label="Alineamiento" value={c.alignment} />
            <Field label="Puntos de experiencia" value={c.xp} />
            <Field label="Bonif. competencia" value={signed(pb)} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[4.6rem_1fr_1fr] gap-4 md:grid-cols-[5rem_11.5rem_1fr]">
        {/* Column 1: abilities */}
        <div className="flex flex-col gap-5">
          {ABILITIES.map((a) => (
            <AbilityBox id={a} key={a} score={c.scores[a]} />
          ))}
        </div>

        {/* Column 2: inspiration, saves, skills, passive */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-md border border-ink/70 bg-paper-light/60 px-2 py-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink font-book text-ink" />
            <FieldLabel>Inspiración</FieldLabel>
          </div>
          <Box title="Tiradas de salvación">
            <ul className="space-y-0.5 text-[0.8rem]">
              {ABILITIES.map((a) => {
                const prof = c.saveProficiencies.includes(a);
                return (
                  <li className="flex items-center gap-1.5" key={a}>
                    <Dot on={prof} />
                    <span className="w-6 font-bold text-ink tabular-nums">
                      {signed(modifier(c.scores[a]) + (prof ? pb : 0))}
                    </span>
                    <span className="text-ink">{ABILITY_LABEL[a].name}</span>
                  </li>
                );
              })}
            </ul>
          </Box>
          <Box title="Habilidades">
            <ul className="space-y-[1px] text-[0.76rem]">
              {SKILLS.map((s) => {
                const prof = c.skillProficiencies.includes(s.id);
                return (
                  <li className="flex items-center gap-1.5" key={s.id}>
                    <Dot on={prof} />
                    <span className="w-6 font-bold text-ink tabular-nums">
                      {signed(modifier(c.scores[s.ability]) + (prof ? pb : 0))}
                    </span>
                    <span className="text-ink">{s.name}</span>
                    <span className="ml-auto text-[0.62rem] text-ink-muted">
                      {ABILITY_LABEL[s.ability].short}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Box>
          <div className="flex items-center gap-2 rounded-md border border-ink/70 bg-paper-light/60 px-2 py-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink font-book text-ink">
              {passive}
            </span>
            <FieldLabel>Sabiduría (Percepción) pasiva</FieldLabel>
          </div>
        </div>

        {/* Column 3: combat, attacks, equipment */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-around">
            <Shield label="Clase de armadura" value={c.armorClass} />
            <StatBox
              label="Iniciativa"
              value={signed(modifier(c.scores.dex))}
            />
            <StatBox label="Velocidad" value={`${c.speed}`} />
          </div>
          <Box title="Puntos de golpe">
            <div className="flex items-end justify-between">
              <div>
                <FieldLabel>Máximo: {c.hp.max}</FieldLabel>
                <div className="font-book text-[2.2rem] text-ink leading-none">
                  {c.hp.current}
                  <span className="text-ink-muted text-sm"> / {c.hp.max}</span>
                </div>
              </div>
              <div className="text-right">
                <FieldLabel>Temporales</FieldLabel>
                <div className="font-book text-ink text-xl">
                  {c.hp.temp || '—'}
                </div>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full border border-ink/50 bg-paper">
              <div
                className={
                  hpPct > 50
                    ? 'h-full bg-[#6c8a3c]'
                    : hpPct > 25
                      ? 'h-full bg-ribbon'
                      : 'h-full bg-rule-red'
                }
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </Box>
          <div className="grid grid-cols-2 gap-3">
            <Box title="Dados de golpe">
              <div className="font-book text-ink text-lg">{c.hitDie}</div>
              <FieldLabel>Total: {c.level}</FieldLabel>
            </Box>
            <Box title="Salvaciones de muerte">
              <div className="flex items-center justify-between text-[0.7rem] text-ink">
                <span>Éxitos</span>
                <span className="flex gap-1">
                  <Dot on={false} />
                  <Dot on={false} />
                  <Dot on={false} />
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[0.7rem] text-ink">
                <span>Fallos</span>
                <span className="flex gap-1">
                  <Dot on={false} />
                  <Dot on={false} />
                  <Dot on={false} />
                </span>
              </div>
            </Box>
          </div>
          <Box title="Ataques y conjuros">
            <table className="w-full text-[0.78rem]">
              <thead>
                <tr className="text-[0.58rem] text-ink-muted uppercase tracking-wider">
                  <th className="text-left font-normal">Nombre</th>
                  <th className="font-normal">Bonif.</th>
                  <th className="text-left font-normal">Daño / tipo</th>
                </tr>
              </thead>
              <tbody>
                {c.attacks.map((a) => (
                  <tr className="odd:bg-note/60" key={a.name}>
                    <td className="py-0.5 pl-1 text-ink">{a.name}</td>
                    <td className="text-center font-bold text-ink">
                      {signed(a.bonus)}
                    </td>
                    <td className="text-ink">
                      {a.damage}
                      {a.notes ? (
                        <span className="text-ink-muted"> · {a.notes}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Box className="flex-1" title="Equipo">
            <div className="grid grid-cols-6 gap-1.5">
              {c.inventory.slice(0, 12).map((it) => (
                <ItemTile
                  art={itemArt.get(it.icon)}
                  item={it}
                  key={it.name}
                  variant="sheet"
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[0.72rem] text-ink">
              <span>
                PO <b>{c.coins.gp}</b>
              </span>
              <span>
                PP <b>{c.coins.sp}</b>
              </span>
              <span>
                PC <b>{c.coins.cp}</b>
              </span>
              <span className="text-ink-muted">{c.armorNote}</span>
            </div>
          </Box>
        </div>
      </div>

      {/* Bottom: personality + features */}
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr]">
        <div className="grid grid-cols-1 gap-2">
          {[
            ['Rasgos de personalidad', c.traits],
            ['Ideales', c.ideals],
            ['Vínculos', c.bonds],
            ['Defectos', c.flaws],
          ].map(([t, v]) => (
            <Box key={t} title={t ?? ''}>
              <p className="font-book text-[0.85rem] text-ink italic leading-snug">
                {v}
              </p>
            </Box>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Box title="Rasgos y atributos">
            <ul className="space-y-1.5 text-[0.8rem] text-ink">
              {c.features.map((f) => (
                <li key={f.name}>
                  <span className="font-caps text-[0.95rem] text-maroon">
                    {f.name}.{' '}
                  </span>
                  <span className="font-book">{f.text}</span>
                </li>
              ))}
            </ul>
          </Box>
          <Box title="Otras competencias e idiomas">
            <p className="text-[0.78rem] text-ink">
              <b>Competencias.</b> {c.proficiencies.join(', ')}.
            </p>
            <p className="mt-1 text-[0.78rem] text-ink">
              <b>Idiomas.</b> {c.languages.join(', ')}.
            </p>
          </Box>
        </div>
      </div>
    </Paper>
  );
};

export { CharacterSheet };
