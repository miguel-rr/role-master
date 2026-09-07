'use client';

import { useEffect, useState } from 'react';
import { Caps } from '@/components/theme/display';
import type { ArtEntry } from '@/data/art/schema';

type PlayerRef = {
  id: string;
  name: string;
  color: string;
  portrait: ArtEntry | undefined;
};

type InteractionBlocksProps = {
  players: [PlayerRef, PlayerRef];
};

const Avatar = ({ p, size = 'h-10 w-10' }: { p: PlayerRef; size?: string }) => (
  <div
    className={`${size} shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-charcoal-800`}
    style={{ ['--tw-ring-color' as string]: p.color }}
  >
    {p.portrait ? (
      // biome-ignore lint/performance/noImgElement: pre-sized local art
      <img
        alt={p.name}
        className="h-full w-full object-cover object-[50%_20%]"
        height={p.portrait.height}
        src={p.portrait.src}
        width={p.portrait.width}
      />
    ) : (
      <div className="h-full w-full bg-charcoal-700" />
    )}
  </div>
);

const Card = ({
  mode,
  who,
  children,
  wide = false,
}: {
  mode: string;
  who: string;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <section
    className={`flex flex-col rounded-lg border border-charcoal-700 bg-charcoal-800 ${wide ? 'md:col-span-2' : ''}`}
  >
    <header className="flex items-center justify-between border-charcoal-700 border-b px-4 py-2">
      <span className="font-nodesto text-brass-pale text-lg uppercase tracking-wider">
        <Caps>{mode}</Caps>
      </span>
      <span className="font-condensed text-strapline text-xs uppercase tracking-wider">
        {who}
      </span>
    </header>
    <div className="flex-1 p-4">{children}</div>
  </section>
);

const Option = ({
  label,
  hint,
  selected,
  disabled,
  onClick,
  color,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  color?: string;
}) => (
  <button
    className={`w-full rounded-md border px-3 py-2.5 text-left transition ${
      selected
        ? 'border-transparent bg-charcoal-100 text-charcoal-900'
        : 'border-charcoal-600 bg-charcoal-900/60 text-charcoal-100 hover:border-brass/70'
    } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    disabled={disabled}
    onClick={onClick}
    style={
      selected && color ? { boxShadow: `inset 4px 0 0 ${color}` } : undefined
    }
    type="button"
  >
    <div className="font-book text-[1rem] leading-snug">{label}</div>
    {hint ? (
      <div
        className={`font-scaly text-xs ${selected ? 'text-charcoal-600' : 'text-charcoal-400'}`}
      >
        {hint}
      </div>
    ) : null}
  </button>
);

const FREE_TEXT = 'Otra cosa: escribe lo que hace tu personaje…';

/* ── Demos ─────────────────────────────────────────────────────────────── */

const BothChoose = ({ players }: InteractionBlocksProps) => {
  const [picks, setPicks] = useState<Record<string, number | null>>({});
  const opts: Record<string, string[]> = {
    [players[0].id]: [
      'Plantarme delante del minero y preguntarle qué mira.',
      'Pedir dos estofados y sentarme de espaldas a la pared.',
      'Subir a las habitaciones a dejar el equipo.',
    ],
    [players[1].id]: [
      'Acercarme al tablón "sin querer" y leer el pergamino nuevo.',
      'Sentarme junto al minero nervioso y darle conversación.',
      'Contar mejor las bolsas. Sobre todo la quinta.',
    ],
  };
  const done = players.every((p) => picks[p.id] != null);
  return (
    <Card mode="Ambos eligen" who="Cada uno su acción" wide>
      <div className="grid gap-4 md:grid-cols-2">
        {players.map((p) => (
          <div className="flex flex-col gap-2" key={p.id}>
            <div className="flex items-center gap-2">
              <Avatar p={p} />
              <span className="font-caps text-brass-pale text-xl">
                {p.name}
              </span>
              {picks[p.id] != null ? (
                <span className="ml-auto font-condensed text-brass text-xs uppercase">
                  Listo
                </span>
              ) : null}
            </div>
            {opts[p.id]?.map((o, i) => (
              <Option
                color={p.color}
                key={o}
                label={o}
                onClick={() =>
                  setPicks((s) => ({ ...s, [p.id]: s[p.id] === i ? null : i }))
                }
                selected={picks[p.id] === i}
              />
            ))}
            <input
              className="rounded-md border border-charcoal-700 bg-charcoal-900/60 px-3 py-2 font-book text-sm placeholder:text-charcoal-500"
              placeholder={FREE_TEXT}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <span className="font-scaly text-charcoal-400 text-sm">
          {done
            ? 'Los dos habéis decidido.'
            : 'Esperando a que decidáis los dos…'}
        </span>
        <button
          className="btn-beyond px-5 py-2 uppercase disabled:opacity-40"
          disabled={!done}
          type="button"
        >
          Actuar
        </button>
      </div>
    </Card>
  );
};

const Spotlight = ({ players }: InteractionBlocksProps) => {
  const [pick, setPick] = useState<number | null>(null);
  const [active, other] = [players[1], players[0]];
  return (
    <Card mode="Foco" who={`Solo actúa ${active.name}`}>
      <div className="flex items-center gap-2">
        <Avatar p={active} />
        <div className="font-book text-charcoal-200 text-sm italic">
          El posadero solo te mira a ti, {active.name}. Bram observa.
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {[
          'Mentirle: venimos a por lo del dragón, nada más.',
          'Decirle la verdad a medias y ver cómo reacciona.',
          'Deslizarle una moneda por el mostrador.',
        ].map((o, i) => (
          <Option
            color={active.color}
            key={o}
            label={o}
            onClick={() => setPick(pick === i ? null : i)}
            selected={pick === i}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 opacity-40">
        <Avatar p={other} size="h-7 w-7" />
        <span className="font-scaly text-charcoal-300 text-xs">
          {other.name} espera su momento
        </span>
      </div>
    </Card>
  );
};

const Group = () => {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <Card mode="Decisión conjunta" who="Una sola elección para los dos">
      <p className="font-book text-charcoal-200 text-sm italic">
        Hay tres encargos en el tablón. Solo podéis aceptar uno antes de que
        anochezca.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {[
          [
            'La bestia de Umbrage Hill',
            'Una manticora ronda la casa de la curandera. 25 po.',
          ],
          [
            'Provisiones para Gnomengarde',
            'Los gnomos del rey no contestan a los mensajes. Nadie sabe por qué.',
          ],
          [
            'El molino de Dwarven Excavation',
            'Dos enanos buscan una mina perdida. Traedlos vivos.',
          ],
        ].map(([t, h], i) => (
          <Option
            hint={h}
            key={t}
            label={t ?? ''}
            onClick={() => setPick(pick === i ? null : i)}
            selected={pick === i}
          />
        ))}
      </div>
    </Card>
  );
};

const SecretAgreement = ({ players }: InteractionBlocksProps) => {
  const [step, setStep] = useState(0); // 0: p1 chooses, 1: handover, 2: p2 chooses, 3: reveal
  const [p1, setP1] = useState<number | null>(null);
  const [p2, setP2] = useState<number | null>(null);
  const opts = [
    'Atacar al goblin de la izquierda',
    'Atacar al de la derecha',
    'Retroceder hacia la puerta',
  ];
  const current = step === 0 ? players[0] : players[1];
  const reset = () => {
    setStep(0);
    setP1(null);
    setP2(null);
  };
  return (
    <Card mode="Acuerdo a ciegas" who="Sin hablar entre vosotros">
      <p className="font-book text-charcoal-200 text-sm italic">
        El goblin grita y sus dos compañeros salen de la maleza. No hay tiempo
        para ponerse de acuerdo: cada uno decide en silencio.
      </p>
      {step === 3 ? (
        <div className="mt-3 space-y-2">
          {players.map((p, i) => (
            <div
              className="flex items-center gap-2 rounded-md border border-charcoal-700 px-3 py-2"
              key={p.id}
            >
              <Avatar p={p} size="h-7 w-7" />
              <span className="font-book text-sm">
                {opts[(i === 0 ? p1 : p2) ?? 0]}
              </span>
            </div>
          ))}
          <div
            className={`rounded-md px-3 py-2 text-center font-caps text-lg ${p1 === p2 ? 'bg-brass/20 text-brass-pale' : 'bg-brand-900/50 text-brand-300'}`}
          >
            {p1 === p2
              ? 'Coincidís. Ventaja en el próximo ataque.'
              : 'Os separáis. El goblin lo aprovecha.'}
          </div>
          <button
            className="btn-ghost w-full px-3 py-1.5 text-xs uppercase"
            onClick={reset}
            type="button"
          >
            Repetir
          </button>
        </div>
      ) : step === 1 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-brass/40 border-dashed p-6 text-center">
          <Avatar p={players[1]} size="h-14 w-14" />
          <div className="font-caps text-brass-pale text-xl">
            Pásale la pantalla a {players[1].name}
          </div>
          <div className="font-scaly text-charcoal-400 text-sm">
            {players[0].name}, tu elección ya está guardada y oculta.
          </div>
          <button
            className="btn-beyond px-5 py-2 uppercase"
            onClick={() => setStep(2)}
            type="button"
          >
            Soy {players[1].name}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-2">
            <Avatar p={current} size="h-7 w-7" />
            <span className="font-caps text-brass-pale text-lg">
              Elige {current.name}
            </span>
            <span className="ml-auto font-condensed text-charcoal-500 text-xs uppercase">
              {step === 0 ? players[1].name : players[0].name}, no mires
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {opts.map((o, i) => (
              <Option
                color={current.color}
                key={o}
                label={o}
                onClick={() => {
                  if (step === 0) {
                    setP1(i);
                    setStep(1);
                  } else {
                    setP2(i);
                    setStep(3);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const Whisper = ({ players }: InteractionBlocksProps) => {
  const [revealed, setRevealed] = useState(false);
  const [read, setRead] = useState(false);
  const p = players[1];
  return (
    <Card mode="Al oído" who={`Solo lo sabe ${p.name}`}>
      <div className="flex items-center gap-2">
        <Avatar p={p} />
        <span className="font-scaly text-charcoal-300 text-sm">
          {players[0].name}, mira a otro lado un momento.
        </span>
      </div>
      <div className="relative mt-3 overflow-hidden rounded-md border border-charcoal-700 bg-charcoal-900/70 p-4">
        <p
          className={`font-book text-[1rem] text-parchment-text italic transition duration-300 ${revealed && !read ? '' : 'select-none blur-md'}`}
        >
          Con el rabillo del ojo ves que la quinta bolsa no es del posadero:
          lleva el sello de los Capas Rojas. Y el minero nervioso también lo ha
          visto.
        </p>
        {!revealed ? (
          <button
            className="btn-beyond absolute inset-0 m-auto h-10 w-40 uppercase"
            onClick={() => setRevealed(true)}
            type="button"
          >
            Leer en secreto
          </button>
        ) : null}
        {read ? (
          <div className="absolute inset-0 flex items-center justify-center font-caps text-brass-pale text-lg">
            Leído. Guárdatelo.
          </div>
        ) : null}
      </div>
      {revealed && !read ? (
        <button
          className="btn-ghost mt-3 w-full px-3 py-1.5 text-xs uppercase"
          onClick={() => setRead(true)}
          type="button"
        >
          Ya lo he leído
        </button>
      ) : null}
    </Card>
  );
};

const Roll = ({ players }: InteractionBlocksProps) => {
  const [result, setResult] = useState<number | null>(null);
  const p = players[1];
  const mod = 2;
  const dc = 13;
  return (
    <Card mode="Tirada" who={`${p.name} · Percepción (SAB) · CD ${dc}`}>
      <div className="flex items-center gap-4">
        <button
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22%] border-2 border-brass/60 bg-charcoal-900 font-nodesto text-4xl text-brass-pale transition hover:border-brass"
          onClick={() => setResult(1 + Math.floor(Math.random() * 20))}
          type="button"
        >
          {result ?? 'd20'}
        </button>
        <div className="font-scaly">
          {result == null ? (
            <p className="text-charcoal-300 text-sm">
              Pulsa el dado. La bandeja 3D de abajo es la versión definitiva;
              esta es la lectura rápida.
            </p>
          ) : (
            <>
              <div className="font-book text-lg">
                {result} <span className="text-charcoal-400">+ {mod} =</span>{' '}
                <b>{result + mod}</b>
              </div>
              <div
                className={`font-caps text-xl ${result === 20 ? 'text-brand-400' : result === 1 ? 'text-charcoal-400' : result + mod >= dc ? 'text-brass-pale' : 'text-brand-300'}`}
              >
                {result === 20
                  ? '¡Crítico!'
                  : result === 1
                    ? 'Pifia.'
                    : result + mod >= dc
                      ? 'Éxito'
                      : 'Fallo'}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const Timed = () => {
  const [left, setLeft] = useState(12);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => {
    if (pick != null || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, pick]);
  return (
    <Card mode="Contra reloj" who="La viga cede">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal-700">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${left <= 4 ? 'bg-brand-500' : 'bg-brass'}`}
          style={{ width: `${(left / 12) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-condensed text-xs uppercase tracking-wider">
        <span className="text-charcoal-400">Decidid ya</span>
        <span className={left <= 4 ? 'text-brand-400' : 'text-brass'}>
          {pick != null ? 'Hecho' : left > 0 ? `${left} s` : 'Tarde'}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {[
          'Saltar por la ventana',
          'Sujetar la viga para que salga Nissa',
          'Arrastrar al minero herido',
        ].map((o, i) => (
          <Option
            disabled={left <= 0 && pick == null}
            key={o}
            label={o}
            onClick={() => setPick(i)}
            selected={pick === i}
          />
        ))}
      </div>
      {left <= 0 && pick == null ? (
        <p className="mt-2 font-book text-brand-300 text-sm italic">
          El techo decide por vosotros.
        </p>
      ) : null}
      {(left <= 0 || pick != null) && (
        <button
          className="btn-ghost mt-3 px-3 py-1 text-xs uppercase"
          onClick={() => {
            setLeft(12);
            setPick(null);
          }}
          type="button"
        >
          Repetir
        </button>
      )}
    </Card>
  );
};

const Haggle = () => {
  const [offer, setOffer] = useState(12);
  const ask = 25;
  const mood =
    offer >= 22
      ? 'Trato hecho. Y no se lo digáis a nadie.'
      : offer >= 17
        ? 'Hmm. Añadid la baraja de cartas y hablamos.'
        : offer >= 10
          ? 'Con eso no compro ni la cuerda.'
          : 'Fuera de mi tienda.';
  return (
    <Card mode="Regateo" who="Halia Thornton · Cambista de Phandalin">
      <p className="font-book text-charcoal-200 text-sm italic">
        «La ballesta vale veinticinco. Lo sé yo y lo sabéis vosotros.»
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="font-nodesto text-3xl text-brass-pale tabular-nums">
          {offer}
        </span>
        <span className="font-condensed text-strapline text-xs uppercase">
          po
        </span>
        <input
          className="flex-1 accent-brass"
          max={ask + 5}
          min={5}
          onChange={(e) => setOffer(Number(e.target.value))}
          type="range"
          value={offer}
        />
      </div>
      <div className="mt-3 rounded-md border border-charcoal-700 bg-charcoal-900/60 px-3 py-2 font-book text-parchment-text text-sm italic">
        {mood}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="btn-beyond flex-1 px-3 py-2 text-sm uppercase"
          type="button"
        >
          Ofrecer {offer} po
        </button>
        <button className="btn-ghost px-3 py-2 text-sm uppercase" type="button">
          Persuasión
        </button>
      </div>
    </Card>
  );
};

const VoteVeto = ({ players }: InteractionBlocksProps) => {
  const [state, setState] = useState<'proposal' | 'vetoed' | 'accepted'>(
    'proposal',
  );
  return (
    <Card
      mode="Propuesta y veto"
      who={`${players[0].name} propone · ${players[1].name} puede vetar una vez`}
    >
      <div className="flex items-start gap-3 rounded-md border border-charcoal-700 px-3 py-2">
        <Avatar p={players[0]} size="h-8 w-8" />
        <p className="font-book text-sm">
          «Entramos por la puerta principal. Con la armadura puesta y la espada
          a la vista. Que sepan quién viene.»
        </p>
      </div>
      {state === 'proposal' ? (
        <div className="mt-3 flex gap-2">
          <button
            className="btn-beyond flex-1 px-3 py-2 text-sm uppercase"
            onClick={() => setState('accepted')}
            type="button"
          >
            De acuerdo
          </button>
          <button
            className="btn-ghost flex-1 px-3 py-2 text-sm uppercase"
            onClick={() => setState('vetoed')}
            type="button"
          >
            Veto
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`font-caps text-lg ${state === 'accepted' ? 'text-brass-pale' : 'text-brand-300'}`}
          >
            {state === 'accepted'
              ? 'Adelante, pues.'
              : `${players[1].name} veta el plan. Toca proponer otro.`}
          </span>
          <button
            className="btn-ghost px-3 py-1 text-xs uppercase"
            onClick={() => setState('proposal')}
            type="button"
          >
            Repetir
          </button>
        </div>
      )}
    </Card>
  );
};

/** The catalogue of turn shapes for two players on one screen. */
const InteractionBlocks = (props: InteractionBlocksProps) => (
  <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
    <BothChoose {...props} />
    <Spotlight {...props} />
    <Group />
    <SecretAgreement {...props} />
    <Whisper {...props} />
    <Roll {...props} />
    <Timed />
    <Haggle />
    <VoteVeto {...props} />
  </div>
);

export { InteractionBlocks };
export type { PlayerRef };
