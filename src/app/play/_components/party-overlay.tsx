'use client';

import { useEffect, useState } from 'react';
import { Inventory, type Slot } from '@/app/design/_components/inventory';
import { CharacterSheet } from '@/components/sheet/character-sheet';
import { buildSheetModel } from '@/components/sheet/sheet-model';
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
  /** Tab to open on. */
  view?: 'sheet' | 'pack' | 'story';
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
  view: initialView = 'sheet',
}: PartyOverlayProps) => {
  const [tab, setTab] = useState(focus);
  const [view, setView] = useState<'sheet' | 'pack' | 'story'>(initialView);
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
              ['story', 'Historia'],
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
              m={buildSheetModel(live, member.portrait, artMap)}
              player={member.playerName}
            />
          ) : view === 'pack' ? (
            <div className="mx-auto max-w-4xl">
              <Inventory
                coinArt={coinArt}
                coins={live.coins}
                owner={member.name}
                slots={slots}
              />
            </div>
          ) : (
            <div
              className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]"
              data-testid="overlay-story"
            >
              <div className="frame-brass aspect-[3/4] overflow-hidden rounded-sm">
                {member.portrait ? (
                  // biome-ignore lint/performance/noImgElement: pre-sized local art
                  <img
                    alt={member.character.name}
                    className="h-full w-full object-cover"
                    height={member.portrait.height}
                    src={member.portrait.src}
                    style={{ objectPosition: '50% 12%' }}
                    width={member.portrait.width}
                  />
                ) : null}
              </div>
              <div className="paper rounded-[3px] px-8 py-7 text-ink md:px-10">
                <div className="font-caps text-[clamp(0.9rem,1vw,1.25rem)] text-ink-muted tracking-widest">
                  Quién es
                </div>
                <h2 className="h-manual text-[clamp(1.8rem,2.2vw,2.8rem)]">
                  {member.character.name}
                </h2>
                {member.character.backstory.split('\n\n').map((para, i) => (
                  <p
                    className={`mt-3 font-book text-[clamp(1.15rem,1.35vw,1.7rem)] leading-[1.55] ${i === 0 ? 'dropcap-only' : ''}`}
                    key={para.slice(0, 24)}
                  >
                    {para}
                  </p>
                ))}
                <div className="my-5 h-[2px] bg-gold-rule" />
                <div className="font-caps text-[clamp(0.9rem,1vw,1.25rem)] text-ink-muted tracking-widest">
                  Lo que la campaña le guarda
                </div>
                <p className="mt-2 font-book text-[clamp(1.15rem,1.35vw,1.7rem)] leading-[1.55]">
                  {member.character.hook}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    ['Rasgos', member.character.traits],
                    ['Ideal', member.character.ideals],
                    ['Vínculo', member.character.bonds],
                    ['Defecto', member.character.flaws],
                  ].map(([t, v]) => (
                    <div
                      className="rounded-md border border-ink/40 bg-paper-light/60 px-3 py-2"
                      key={t}
                    >
                      <div className="font-scaly text-[clamp(0.75rem,0.85vw,1.05rem)] text-ink-muted uppercase tracking-widest">
                        {t}
                      </div>
                      <p className="font-book text-[clamp(1rem,1.15vw,1.45rem)] italic leading-snug">
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PartyOverlay };
export type { CoinArt };
