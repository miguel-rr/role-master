import { ArtImage } from '@/components/theme/art';
import type { SheetModel } from './sheet-data';

/**
 * Proposal 4, "Piedra rúnica": what the menus of God of War Ragnarök do,
 * translated to a D&D sheet. Steel-blue black and cracked stone, silver
 * tracked capitals, one white brushed highlight for the selected row, gold
 * only on the primary number, thin silver rules with diamond ends, the
 * character standing on the right, a vertical list of sections on the left
 * and a tab bar underneath.
 */

const S = {
  label: 'text-[clamp(0.85rem,1vw,1.3rem)]',
  body: 'text-[clamp(1.1rem,1.3vw,1.7rem)]',
  value: 'text-[clamp(1.5rem,1.8vw,2.3rem)]',
  big: 'text-[clamp(2.4rem,3vw,4rem)]',
  title: 'text-[clamp(1.9rem,2.4vw,3.2rem)]',
};

const SILVER = '#d9dee3';
const SILVER_DIM = '#8d97a1';
const GOLD = '#e6c237';
const FROST = '#5fa4e8';

const Rule = () => (
  <div className="flex items-center gap-2">
    <span
      className="h-px flex-1"
      style={{
        background: `linear-gradient(90deg, transparent, ${SILVER_DIM})`,
      }}
    />
    <span
      className="h-1.5 w-1.5 rotate-45"
      style={{ background: SILVER_DIM }}
    />
    <span
      className="h-px flex-1"
      style={{
        background: `linear-gradient(90deg, ${SILVER_DIM}, transparent)`,
      }}
    />
  </div>
);

const Bar = ({
  value,
  max = 20,
  gold = false,
}: {
  value: number;
  max?: number;
  gold?: boolean;
}) => (
  <div className="h-[0.35em] w-full overflow-hidden rounded-sm bg-white/10">
    <div
      className="h-full"
      style={{
        width: `${Math.min(100, (value / max) * 100)}%`,
        background: gold ? GOLD : SILVER,
      }}
    />
  </div>
);

const SECTIONS = ['Estado', 'Combate', 'Habilidades', 'Equipo', 'Historia'];
const TABS = ['Personaje', 'Mochila', 'Conjuros', 'Diario', 'Compañía'];

const SheetRagnarok = ({ m }: { m: SheetModel }) => {
  const { c } = m;
  const profSkills = m.skills.filter((s) => s.prof);
  return (
    <div
      className="relative overflow-hidden rounded-[3px] font-condensed"
      style={{
        color: SILVER,
        background:
          'radial-gradient(ellipse 70% 80% at 80% 40%, #1d2a36 0%, #0d131a 55%, #06090c 100%)',
      }}
    >
      {/* Cracked stone: two subtle noise layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 9px), repeating-linear-gradient(35deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 13px)',
        }}
      />
      <div className="relative grid max-h-[100vh] min-h-[56.25vw] grid-cols-[clamp(4rem,5vw,6.5rem)_clamp(15rem,20vw,26rem)_1fr_clamp(18rem,26vw,34rem)]">
        {/* Icon rail */}
        <div className="flex flex-col items-center gap-5 border-white/10 border-r py-6">
          {['✦', '⚔', '☆', '▣', '✎'].map((g, i) => (
            <span
              className={`flex h-[2.4em] w-[2.4em] items-center justify-center rounded-sm border ${S.body} ${i === 0 ? 'border-white/60 bg-white/10' : 'border-white/15 text-white/50'}`}
              key={g}
            >
              {g}
            </span>
          ))}
        </div>

        {/* Section list with the brushed highlight */}
        <div className="flex flex-col py-6 pr-4">
          <div className="px-5">
            <div className={`${S.title} uppercase tracking-[0.18em]`}>
              {c.shortName}
            </div>
            <div
              className={`${S.label} uppercase tracking-[0.22em]`}
              style={{ color: SILVER_DIM }}
            >
              {c.race} · {c.className} {c.level}
            </div>
            <div className="mt-3">
              <Rule />
            </div>
          </div>
          <ul
            className={`mt-5 flex flex-col gap-1 ${S.body} uppercase tracking-[0.14em]`}
          >
            {SECTIONS.map((s, i) => (
              <li
                className="relative flex items-center px-5 py-[0.55em]"
                key={s}
                style={
                  i === 0
                    ? {
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 70%, rgba(255,255,255,0) 100%)',
                        color: '#0d131a',
                      }
                    : {
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
                      }
                }
              >
                {s}
                {i === 0 ? (
                  <span className="ml-auto" style={{ color: GOLD }}>
                    ➤
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-auto px-5">
            <div
              className={`${S.label} uppercase tracking-[0.2em]`}
              style={{ color: SILVER_DIM }}
            >
              Jugador
            </div>
            <div className={`${S.body} uppercase tracking-[0.14em]`}>
              Loncio
            </div>
          </div>
        </div>

        {/* Stats panel */}
        <div className="flex flex-col gap-5 px-[clamp(1rem,1.6vw,2.4rem)] py-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div
              className="flex h-[3.6em] w-[3em] flex-col items-center justify-center border-2"
              style={{
                borderColor: GOLD,
                clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)',
                background: 'rgba(230,194,55,0.08)',
              }}
            >
              <span
                className={`${S.value} leading-none`}
                style={{ color: GOLD }}
              >
                {c.level}
              </span>
              <span
                className={`${S.label} uppercase`}
                style={{ color: SILVER_DIM }}
              >
                niv
              </span>
            </div>
            <div>
              <div
                className={`${S.label} uppercase tracking-[0.2em]`}
                style={{ color: SILVER_DIM }}
              >
                Puntos de golpe
              </div>
              <div className="flex items-baseline gap-3">
                <span
                  className={`${S.big} tabular-nums leading-none`}
                  style={{ color: GOLD }}
                >
                  {c.hp.current}
                </span>
                <span
                  className={`${S.value} tabular-nums`}
                  style={{ color: SILVER_DIM }}
                >
                  / {c.hp.max}
                </span>
              </div>
              <div className="mt-2">
                <Bar gold max={c.hp.max} value={c.hp.current} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                ['CA', c.armorClass],
                ['Inic.', m.initiative],
                ['Vel.', c.speed],
              ].map(([l, v]) => (
                <div key={String(l)}>
                  <div className={`${S.value} tabular-nums leading-none`}>
                    {v}
                  </div>
                  <div
                    className={`${S.label} uppercase tracking-[0.18em]`}
                    style={{ color: SILVER_DIM }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Rule />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {m.abilities.map((a) => (
              <div key={a.id}>
                <div
                  className={`flex items-baseline justify-between ${S.body} uppercase tracking-[0.14em]`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-[0.7em] w-[0.7em] rotate-45 border"
                      style={{
                        borderColor: a.saveProf ? GOLD : SILVER_DIM,
                        background: a.saveProf ? GOLD : 'transparent',
                      }}
                    />
                    {a.name}
                  </span>
                  <span className="tabular-nums">
                    <span className={S.value}>{a.mod}</span>
                    <span
                      className={`ml-2 ${S.label}`}
                      style={{ color: SILVER_DIM }}
                    >
                      {a.score}
                    </span>
                  </span>
                </div>
                <div className="mt-1">
                  <Bar value={a.score} />
                </div>
              </div>
            ))}
          </div>
          <Rule />
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <div
                className={`${S.label} uppercase tracking-[0.2em]`}
                style={{ color: SILVER_DIM }}
              >
                Competencias
              </div>
              <ul className={`mt-2 ${S.body} uppercase tracking-[0.1em]`}>
                {profSkills.map((s) => (
                  <li
                    className="flex items-baseline justify-between border-white/10 border-b py-[0.3em]"
                    key={s.id}
                  >
                    <span>{s.name}</span>
                    <span className="tabular-nums" style={{ color: GOLD }}>
                      {s.mod}
                    </span>
                  </li>
                ))}
                <li
                  className="flex items-baseline justify-between py-[0.3em]"
                  style={{ color: SILVER_DIM }}
                >
                  <span>Percepción pasiva</span>
                  <span className="tabular-nums">{m.passive}</span>
                </li>
              </ul>
            </div>
            <div>
              <div
                className={`${S.label} uppercase tracking-[0.2em]`}
                style={{ color: SILVER_DIM }}
              >
                Ataques
              </div>
              <ul className={`mt-2 ${S.body} uppercase tracking-[0.1em]`}>
                {c.attacks.map((a) => (
                  <li
                    className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 border-white/10 border-b py-[0.3em]"
                    key={a.name}
                  >
                    <span className="leading-tight">{a.name}</span>
                    <span className="tabular-nums" style={{ color: GOLD }}>
                      {a.bonus >= 0 ? `+${a.bonus}` : a.bonus}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: SILVER_DIM }}
                    >
                      {a.damage.split(' ')[0]}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className={`mt-3 ${S.label} uppercase tracking-[0.2em]`}
                style={{ color: SILVER_DIM }}
              >
                Rasgos
              </div>
              <ul className={`mt-1 ${S.body} tracking-[0.04em]`}>
                {c.features.slice(0, 3).map((f) => (
                  <li className="truncate py-[0.15em]" key={f.name}>
                    <span style={{ color: FROST }}>◆ </span>
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="mt-auto rounded-sm px-4 py-2"
            style={{
              background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD} 60%, rgba(230,194,55,0.15) 100%)`,
              color: '#0d131a',
            }}
          >
            <span className={`${S.body} uppercase tracking-[0.2em]`}>
              Ver la mochila
            </span>
            <span
              className={`ml-4 ${S.label} uppercase tracking-[0.14em] opacity-70`}
            >
              {c.inventory.length} objetos · {c.coins.gp} po
            </span>
          </div>
        </div>

        {/* Character */}
        <div className="relative">
          <ArtImage
            alt={c.name}
            art={m.portrait}
            className="h-full w-full"
            position="50% 10%"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #0d131a 0%, rgba(13,19,26,0.2) 30%, rgba(13,19,26,0) 60%), linear-gradient(0deg, #06090c 0%, rgba(6,9,12,0) 35%)',
            }}
          />
          <div className="absolute right-6 bottom-6 text-right">
            <div
              className={`${S.label} uppercase tracking-[0.2em]`}
              style={{ color: SILVER_DIM }}
            >
              {c.background}
            </div>
            <div className={`${S.body} uppercase tracking-[0.14em]`}>
              {c.alignment}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className={`relative flex items-center justify-around border-white/10 border-t py-3 ${S.body} uppercase tracking-[0.2em]`}
      >
        {TABS.map((t, i) => (
          <span className="flex items-center gap-6" key={t}>
            <span
              className={
                i === 0 ? 'rounded-sm bg-white px-5 py-1 text-[#0d131a]' : ''
              }
              style={i === 0 ? undefined : { color: SILVER_DIM }}
            >
              {t}
            </span>
            {i < TABS.length - 1 ? (
              <span
                className="h-1.5 w-1.5 rotate-45"
                style={{ background: SILVER_DIM }}
              />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
};

export { SheetRagnarok };
