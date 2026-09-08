import { ArtImage } from '@/components/theme/art';
import { Caps } from '@/components/theme/display';
import { TaperedRule } from '@/components/theme/tapered-rule';
import type { SheetModel } from './sheet-data';

/**
 * Proposal 3, "El códice": a D&D character told like a chapter of a book
 * rather than a form. The portrait bleeds in from the left, the name is set
 * like a chapter title, and the numbers you need in a fight sit in one big
 * strip. Skills are grouped by ability, features read as entries, and the
 * personality is quoted, not boxed.
 */

const S = {
  label: 'text-[clamp(0.8rem,0.95vw,1.2rem)]',
  body: 'text-[clamp(1.05rem,1.25vw,1.6rem)]',
  value: 'text-[clamp(1.4rem,1.7vw,2.2rem)]',
  big: 'text-[clamp(2.4rem,3.2vw,4.2rem)]',
  title: 'text-[clamp(2.8rem,4vw,5.4rem)]',
};

const ABILITY_GROUPS: Record<string, string> = {
  FUE: 'Fuerza',
  DES: 'Destreza',
  CON: 'Constitución',
  INT: 'Inteligencia',
  SAB: 'Sabiduría',
  CAR: 'Carisma',
};

const SheetCodex = ({ m }: { m: SheetModel }) => {
  const { c } = m;
  const groups = Object.keys(ABILITY_GROUPS)
    .map((short) => ({
      short,
      name: ABILITY_GROUPS[short] ?? short,
      skills: m.skills.filter((s) => s.ability === short),
    }))
    .filter((g) => g.skills.length > 0);
  return (
    <div className="relative overflow-hidden rounded-[3px] bg-[#f3ecd8] text-ink">
      {/* Chapter head */}
      <div className="relative grid grid-cols-[clamp(16rem,26vw,34rem)_1fr]">
        <div className="relative aspect-[3/4]">
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
                'linear-gradient(90deg, rgba(243,236,216,0) 70%, #f3ecd8 100%), linear-gradient(0deg, #f3ecd8 0%, rgba(243,236,216,0) 30%)',
            }}
          />
        </div>
        <div className="relative flex flex-col justify-end px-[clamp(1rem,2vw,3rem)] pt-[clamp(1rem,2vw,3rem)] pb-4">
          <div
            className={`font-caps ${S.body} text-maroon uppercase tracking-[0.25em]`}
          >
            {c.race} · {c.className} de nivel {c.level} · {c.background}
          </div>
          <h2
            className={`title-cover mt-2 ${S.title} text-maroon leading-[0.9]`}
            style={{ color: '#58180d', textShadow: 'none' }}
          >
            <Caps>{c.name}</Caps>
          </h2>
          <TaperedRule className="mt-3 h-4 w-[60%] text-rule-red" />
          <p className={`mt-3 max-w-3xl font-book ${S.body} leading-snug`}>
            {c.pitch}
          </p>
          {/* Vital strip */}
          <div className="mt-5 grid grid-cols-[1.6fr_repeat(4,1fr)] gap-3">
            <div className="rounded-md border-2 border-maroon/70 bg-paper-light px-4 py-3">
              <div
                className={`font-scaly ${S.label} text-ink-muted uppercase tracking-widest`}
              >
                Puntos de golpe
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-book ${S.big} tabular-nums leading-none`}
                >
                  {c.hp.current}
                </span>
                <span className={`font-book ${S.value} text-ink-muted`}>
                  / {c.hp.max}
                </span>
                <span
                  className={`ml-auto font-scaly ${S.label} text-ink-muted uppercase`}
                >
                  {c.hitDie} por nivel
                </span>
              </div>
              <div className="mt-2 h-[0.55em] overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full bg-[#6c8a3c]"
                  style={{ width: `${m.hpPct}%` }}
                />
              </div>
            </div>
            {[
              ['CA', String(c.armorClass), c.armorNote],
              ['Iniciativa', m.initiative, 'Destreza'],
              ['Velocidad', String(c.speed), 'pies'],
              ['Competencia', `+${m.pb}`, 'nivel 1'],
            ].map(([l, v, n]) => (
              <div
                className="flex flex-col items-center justify-center rounded-md border-2 border-maroon/70 bg-paper-light px-2 py-3 text-center"
                key={l}
              >
                <div className={`font-book ${S.big} tabular-nums leading-none`}>
                  {v}
                </div>
                <div
                  className={`mt-1 font-scaly ${S.label} text-maroon uppercase tracking-widest`}
                >
                  {l}
                </div>
                <div
                  className={`truncate font-scaly ${S.label} text-ink-muted`}
                >
                  {n}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.1fr_1fr] gap-[clamp(1rem,2vw,3rem)] px-[clamp(1rem,2vw,3rem)] pb-[clamp(1rem,2vw,3rem)]">
        {/* Left: abilities as coins + skills grouped */}
        <div>
          <div className="grid grid-cols-6 gap-3">
            {m.abilities.map((a) => (
              <div className="flex flex-col items-center" key={a.id}>
                <div
                  className={`flex aspect-square w-full flex-col items-center justify-center rounded-full border-4 font-book ${S.value} tabular-nums ${a.saveProf ? 'border-maroon bg-maroon text-paper-light' : 'border-gold-page bg-paper-light text-ink'}`}
                  style={{
                    boxShadow:
                      'inset 0 0 0 3px rgba(243,236,216,0.6), 0 6px 14px rgba(40,25,5,0.25)',
                  }}
                  title={a.saveProf ? 'Competente en la salvación' : undefined}
                >
                  <span className={`${S.big} leading-none`}>{a.mod}</span>
                  <span className={`${S.label} opacity-80`}>{a.score}</span>
                </div>
                <div className={`mt-2 font-caps ${S.body} text-maroon`}>
                  {a.short}
                </div>
                <div className={`font-scaly ${S.label} text-ink-muted`}>
                  salv. {a.save}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 columns-2 gap-8">
            {groups.map((g) => (
              <div className="mb-4 break-inside-avoid" key={g.short}>
                <div className={`font-caps ${S.body} text-maroon`}>
                  {g.name}
                </div>
                <ul className={`mt-1 font-scaly ${S.body}`}>
                  {g.skills.map((s) => (
                    <li
                      className={`flex items-baseline gap-3 border-gold-page/40 border-b border-dotted py-[0.2em] ${s.prof ? 'font-bold' : ''}`}
                      key={s.id}
                    >
                      <span>{s.name}</span>
                      <span className="ml-auto tabular-nums">{s.mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={`mt-2 font-scaly ${S.label} text-ink-muted`}>
            En negrita, las habilidades con competencia. Percepción pasiva{' '}
            {m.passive}.
          </div>
        </div>

        {/* Right: attacks as cards, features as entries, pack, voice */}
        <div>
          <div className={`font-caps ${S.body} text-maroon`}>Ataques</div>
          <div className="mt-2 grid gap-2">
            {c.attacks.map((a) => (
              <div
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md border border-gold-page/60 bg-paper-light px-4 py-2"
                key={a.name}
              >
                <div className="min-w-0">
                  <div className={`truncate font-book ${S.body}`}>{a.name}</div>
                  <div
                    className={`truncate font-scaly ${S.label} text-ink-muted`}
                  >
                    {a.notes ?? ''}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`font-book ${S.value} tabular-nums`}>
                    {a.bonus >= 0 ? `+${a.bonus}` : a.bonus}
                  </div>
                  <div
                    className={`font-scaly ${S.label} text-ink-muted uppercase`}
                  >
                    ataque
                  </div>
                </div>
                <div className="text-center">
                  <div className={`font-book ${S.value} tabular-nums`}>
                    {a.damage.split(' ')[0]}
                  </div>
                  <div
                    className={`font-scaly ${S.label} text-ink-muted uppercase`}
                  >
                    {a.damage.split(' ').slice(1).join(' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-5 font-caps ${S.body} text-maroon`}>Rasgos</div>
          <ul className={`mt-1 space-y-1.5 font-book ${S.body} leading-snug`}>
            {c.features.map((f) => (
              <li key={f.name}>
                <span className="font-caps text-maroon">{f.name}. </span>
                {f.text}
              </li>
            ))}
          </ul>
          <div
            className={`mt-5 flex items-baseline justify-between font-caps ${S.body} text-maroon`}
          >
            <span>Mochila</span>
            <span
              className={`font-scaly ${S.label} text-ink-muted normal-case`}
            >
              {c.coins.gp} po · {c.coins.sp} pp · {c.coins.cp} pc
            </span>
          </div>
          <div className="mt-2 grid grid-cols-8 gap-2">
            {c.inventory.slice(0, 16).map((it) => (
              <div
                className={`relative aspect-square overflow-hidden rounded-sm ring-1 ${it.equipped ? 'bg-paper-stat ring-maroon/60' : 'bg-paper-light ring-gold-page/40'}`}
                key={it.name}
                title={it.name}
              >
                <ArtImage
                  alt={it.name}
                  art={m.itemArt.get(it.icon)}
                  className="h-full w-full p-1"
                  fit="contain"
                />
                {it.qty && it.qty > 1 ? (
                  <span
                    className={`absolute right-0 bottom-0 bg-maroon px-1 font-scaly ${S.label} text-paper-light`}
                  >
                    ×{it.qty}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <blockquote
            className={`mt-5 border-maroon/50 border-l-4 pl-4 font-book ${S.body} italic leading-snug`}
          >
            «{c.traits}» <span className="text-ink-muted not-italic">·</span>{' '}
            {c.ideals}
          </blockquote>
          <div
            className={`mt-2 grid grid-cols-2 gap-4 font-book ${S.body} leading-snug`}
          >
            <p>
              <span className="font-caps text-maroon">Vínculo. </span>
              {c.bonds}
            </p>
            <p>
              <span className="font-caps text-maroon">Defecto. </span>
              {c.flaws}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SheetCodex };
