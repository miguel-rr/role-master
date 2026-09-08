'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArtImage } from '@/components/theme/art';
import type { ArtEntry } from '@/data/art/schema';
import type { InventoryItem } from '@/data/characters/presets';
import { loreFor } from '@/data/items/lore';

type Slot = { item: InventoryItem; art: ArtEntry | undefined };

type Rarity = NonNullable<InventoryItem['rarity']>;

const RARITY_RING: Record<Rarity, string> = {
  common: 'ring-charcoal-500/40',
  uncommon: 'ring-rarity-uncommon/70',
  rare: 'ring-rarity-rare/70',
  'very-rare': 'ring-rarity-very-rare/70',
  legendary: 'ring-rarity-legendary/80',
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Común',
  uncommon: 'Poco común',
  rare: 'Raro',
  'very-rare': 'Muy raro',
  legendary: 'Legendario',
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a7b0b6',
  uncommon: '#1fc219',
  rare: '#4990e2',
  'very-rare': '#b04ff0',
  legendary: '#fea227',
};

const CARD_WIDTH = 340;
const GAP = 12;

/**
 * The item card, as in the equipment chapter, floating next to the tile
 * that opened it. Rendered in a portal so no paper edge clips it.
 */
const ItemCard = ({
  slot,
  anchor,
  onClose,
}: {
  slot: Slot;
  anchor: DOMRect;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const { item, art } = slot;
  const lore = loreFor(item.name);
  const rarity = item.rarity ?? 'common';

  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer the right of the tile, then the left, then below.
    let left = anchor.right + GAP;
    if (left + CARD_WIDTH > vw - 8) left = anchor.left - GAP - CARD_WIDTH;
    if (left < 8)
      left = Math.min(Math.max(8, anchor.left), vw - CARD_WIDTH - 8);
    let top = anchor.top;
    if (top + h > vh - 8) top = Math.max(8, vh - h - 8);
    setPos({ top, left });
  }, [anchor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed z-[80] animate-fade-in rounded-md border border-brass/60 bg-charcoal-950 text-white shadow-[0_30px_80px_rgba(0,0,0,0.75)]"
      data-testid="item-card"
      ref={ref}
      role="dialog"
      style={{
        width: CARD_WIDTH,
        top: pos?.top ?? anchor.top,
        left: pos?.left ?? anchor.right + GAP,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <div
        className="h-1 rounded-t-md"
        style={{ background: RARITY_COLOR[rarity] }}
      />
      <div className="flex gap-3 px-4 pt-3">
        <div className="frame-brass h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-paper-light">
          <ArtImage
            alt={item.name}
            art={art}
            className="h-full w-full p-1"
            fit="contain"
            loading="eager"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-caps text-[1.35rem] text-brass-pale leading-tight">
            {item.name}
          </div>
          <div className="mt-0.5 font-condensed text-[0.62rem] text-strapline uppercase tracking-widest">
            {lore?.kind ?? 'Objeto'} ·{' '}
            <span style={{ color: RARITY_COLOR[rarity] }}>
              {RARITY_LABEL[rarity]}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 font-scaly text-[0.72rem] text-charcoal-300">
            {item.qty && item.qty > 1 ? <span>×{item.qty}</span> : null}
            {item.weight ? <span>{item.weight} lb</span> : null}
            {lore?.cost ? <span>{lore.cost}</span> : null}
            {item.equipped ? (
              <span className="text-brass-pale">Equipado</span>
            ) : null}
          </div>
        </div>
      </div>
      {lore?.properties && lore.properties.length > 0 ? (
        <ul className="mx-4 mt-3 space-y-0.5 border-brass/25 border-y py-2 font-scaly text-[0.82rem] text-parchment-text">
          {lore.properties.map((p) => (
            <li className="flex gap-2" key={p}>
              <span className="text-brass">◆</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="px-4 pt-3 pb-4 font-book text-[0.95rem] text-parchment-text italic leading-snug">
        {lore?.description ??
          'El manual no dice nada de esto. Pregúntale al máster qué es y qué hace.'}
      </p>
    </div>,
    document.body,
  );
};

type ItemTileProps = Slot & {
  /** `pack` shows the name under the icon; `sheet` is the small grid of the paper sheet. */
  variant?: 'pack' | 'sheet';
};

/** One slot of the pack: bg3 icon on a parchment tile; click for its card. */
const ItemTile = ({ item, art, variant = 'pack' }: ItemTileProps) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const id = useId();
  const ring = item.rarity ? RARITY_RING[item.rarity] : 'ring-gold-page/35';
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(anchor ? null : e.currentTarget.getBoundingClientRect());
  };

  if (variant === 'sheet') {
    return (
      <>
        <button
          aria-expanded={!!anchor}
          aria-label={item.name}
          className={`relative aspect-square cursor-pointer overflow-hidden rounded-sm ring-1 transition hover:ring-2 hover:ring-maroon ${item.equipped ? 'bg-paper-stat ring-maroon-2/60' : 'bg-paper-light ring-gold-page/40'} ${anchor ? 'ring-2 ring-maroon' : ''}`}
          data-testid="item-tile"
          id={id}
          onClick={toggle}
          title={item.name}
          type="button"
        >
          <ArtImage
            alt={item.name}
            art={art}
            className="h-full w-full p-0.5"
            fit="contain"
          />
          {item.qty && item.qty > 1 ? (
            <span className="absolute right-0 bottom-0 bg-maroon px-0.5 text-[0.55rem] text-paper-light">
              ×{item.qty}
            </span>
          ) : null}
        </button>
        {anchor ? (
          <ItemCard
            anchor={anchor}
            onClose={() => setAnchor(null)}
            slot={{ item, art }}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <button
        aria-expanded={!!anchor}
        className={`group relative flex aspect-square cursor-pointer flex-col items-center justify-end overflow-hidden rounded-[3px] text-left ring-1 transition hover:ring-2 hover:ring-maroon ${ring} ${item.equipped ? 'bg-paper-stat' : 'bg-paper-light/70'} ${anchor ? 'ring-2 ring-maroon' : ''}`}
        data-testid="item-tile"
        id={id}
        onClick={toggle}
        title={item.name}
        type="button"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(255,250,235,0.75), rgba(238,229,206,0) 70%)',
          }}
        />
        <ArtImage
          alt={item.name}
          art={art}
          className="relative h-[74%] w-[74%] drop-shadow-[0_6px_6px_rgba(40,25,5,0.45)]"
          fit="contain"
        />
        <div className="relative w-full truncate px-1.5 pb-1 text-center font-scaly text-[0.68rem] text-ink leading-tight">
          {item.name}
        </div>
        {item.qty && item.qty > 1 ? (
          <span className="absolute top-1 right-1 rounded-sm bg-maroon px-1 font-bold font-scaly text-[0.68rem] text-paper-light">
            ×{item.qty}
          </span>
        ) : null}
        {item.equipped ? (
          <span
            className="absolute top-1 left-1 h-2 w-2 rounded-full bg-maroon-2 ring-2 ring-paper"
            title="Equipado"
          />
        ) : null}
      </button>
      {anchor ? (
        <ItemCard
          anchor={anchor}
          onClose={() => setAnchor(null)}
          slot={{ item, art }}
        />
      ) : null}
    </>
  );
};

export { ItemTile };
export type { Slot };
