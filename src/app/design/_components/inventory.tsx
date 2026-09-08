import { ItemTile, type Slot } from '@/components/items/item-tile';
import { ArtImage } from '@/components/theme/art';
import { Paper } from '@/components/theme/paper';
import type { ArtEntry } from '@/data/art/schema';

type InventoryProps = {
  owner: string;
  slots: Slot[];
  coins: { pp: number; gp: number; ep: number; sp: number; cp: number };
  coinArt: {
    gp: ArtEntry | undefined;
    sp: ArtEntry | undefined;
    cp: ArtEntry | undefined;
  };
};

const Coin = ({
  art,
  amount,
  label,
  tint,
  silver = false,
}: {
  art: ArtEntry | undefined;
  amount: number;
  label: string;
  tint: string;
  silver?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div
      className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-gold-page/40"
      style={silver ? { filter: 'saturate(0) brightness(1.25)' } : undefined}
    >
      {art ? (
        <ArtImage
          alt={label}
          art={art}
          className="h-full w-full"
          fit="contain"
        />
      ) : (
        <div className="h-full w-full" style={{ background: tint }} />
      )}
    </div>
    <div className="font-scaly leading-none">
      <div className="font-bold text-ink text-lg tabular-nums">{amount}</div>
      <div className="text-[0.65rem] text-ink-muted uppercase tracking-wider">
        {label}
      </div>
    </div>
  </div>
);

/** A character's pack laid out as a page of the equipment chapter. */
const Inventory = ({ owner, slots, coins, coinArt }: InventoryProps) => (
  <Paper className="rounded-[3px] p-6 md:p-8">
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="font-caps text-ink-muted text-sm tracking-widest">
          Equipo
        </div>
        <h3 className="h-manual text-3xl">Mochila de {owner}</h3>
      </div>
      <div className="flex items-center gap-5">
        <Coin amount={coins.gp} art={coinArt.gp} label="oro" tint="#c9a227" />
        <Coin
          amount={coins.sp}
          art={coinArt.sp}
          label="plata"
          silver
          tint="#b7bcc4"
        />
        <Coin amount={coins.cp} art={coinArt.cp} label="cobre" tint="#a7642f" />
      </div>
    </div>
    <div className="my-4 h-[2px] bg-gold-rule" />
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
      {slots.map((s) => (
        <ItemTile key={s.item.name} {...s} variant="pack" />
      ))}
      {Array.from({ length: Math.max(0, 18 - slots.length) }).map((_, i) => (
        <div
          className="aspect-square rounded-[3px] border border-gold-page/25 border-dashed"
          // biome-ignore lint/suspicious/noArrayIndexKey: static empty slots
          key={i}
        />
      ))}
    </div>
    <div className="mt-4 flex items-center justify-between font-scaly text-ink-muted text-xs">
      <span>
        Carga:{' '}
        {slots.reduce(
          (s, x) => s + (x.item.weight ?? 0) * (x.item.qty ?? 1),
          0,
        )}{' '}
        lb
      </span>
      <span>Pulsa un objeto para ver su carta</span>
    </div>
  </Paper>
);

export { Inventory, ItemTile };
export type { Slot };
