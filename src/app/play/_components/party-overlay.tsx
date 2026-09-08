'use client';

import { useEffect, useState } from 'react';
import { CharacterSheet } from '@/app/design/_components/character-sheet';
import { Inventory, type Slot } from '@/app/design/_components/inventory';
import { Caps } from '@/components/theme/display';
import type { ArtEntry } from '@/data/art/schema';
import { liveCharacter, type PartyMember } from '@/lib/game/party';
import type { CharacterState } from '@/lib/game/schema';

type CoinArt = {
  gp: ArtEntry | undefined;
  sp: ArtEntry | undefined;
  cp: ArtEntry | undefined;
};

type PartyOverlayProps = {
  party: PartyMember[];
  characters: CharacterState[];
  itemArt: Record<string, ArtEntry>;
  coinArt: CoinArt;
  /** Character id to open on. */
  focus: string;
  onClose: () => void;
};

/**
 * The paper sheet and the illustrated pack of each character, over the
 * scene. Live numbers: hit points, gold and whatever the narrator has handed
 * out or taken away.
 */
const PartyOverlay = ({
  party,
  characters,
  itemArt,
  coinArt,
  focus,
  onClose,
}: PartyOverlayProps) => {
  const [tab, setTab] = useState(focus);
  const [view, setView] = useState<'sheet' | 'pack'>('sheet');
  const member = party.find((p) => p.id === tab) ?? party[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!member) return null;
  const state = characters.find((c) => c.id === member.id);
  const live = liveCharacter(member.character, state);
  const artMap = new Map<string, ArtEntry | undefined>();
  for (const it of live.inventory) {
    artMap.set(it.icon, itemArt[it.icon] ?? itemArt[it.name]);
  }
  const slots: Slot[] = live.inventory.map((item) => ({
    item,
    art: artMap.get(item.icon),
  }));

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col bg-black/75 backdrop-blur-sm"
      data-testid="party-overlay"
    >
      <div className="flex items-center gap-3 border-brass/30 border-b bg-charcoal-950/90 px-5 py-3">
        <div className="flex overflow-hidden rounded border border-brass/40">
          {party.map((p) => (
            <button
              className="flex items-center gap-2 px-3 py-1.5 transition"
              data-testid={`overlay-tab-${p.id}`}
              key={p.id}
              onClick={() => setTab(p.id)}
              style={{
                background: p.id === member.id ? p.color : 'transparent',
                color: p.id === member.id ? '#12181c' : p.color,
              }}
              type="button"
            >
              <span className="font-condensed text-[0.65rem] uppercase tracking-wider opacity-80">
                {p.playerName}
              </span>
              <span className="font-caps text-lg leading-none">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="ml-4 flex overflow-hidden rounded border border-white/15">
          {(
            [
              ['sheet', 'Ficha'],
              ['pack', 'Mochila'],
            ] as const
          ).map(([id, label]) => (
            <button
              className={`px-3 py-1.5 font-condensed text-[0.7rem] uppercase tracking-wider ${view === id ? 'bg-white/15 text-white' : 'text-charcoal-300 hover:text-white'}`}
              data-testid={`overlay-view-${id}`}
              key={id}
              onClick={() => setView(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto hidden font-scaly text-charcoal-400 text-xs sm:block">
          {state ? `${state.hp}/${state.maxHp} PV · ${state.gold} po` : ''}
        </div>
        <button
          className="btn-ghost px-3 py-1.5 text-xs uppercase"
          data-testid="overlay-close"
          onClick={onClose}
          type="button"
        >
          Volver a la escena · Esc
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-4 text-center font-nodesto text-3xl text-brass-pale uppercase leading-none">
            <Caps>{member.character.name}</Caps>
          </div>
          {view === 'sheet' ? (
            <CharacterSheet
              character={live}
              itemArt={artMap}
              player={member.playerName}
              portrait={member.portrait}
            />
          ) : (
            <div className="mx-auto max-w-4xl">
              <Inventory
                coinArt={coinArt}
                coins={live.coins}
                owner={member.name}
                slots={slots}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PartyOverlay };
export type { CoinArt };
