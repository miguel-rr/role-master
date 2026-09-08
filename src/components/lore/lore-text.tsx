'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { findMentions, LORE_KIND_LABEL, type LoreEntry } from '@/lib/game/lore';

/**
 * Text with the names the table already knows underlined; hovering or
 * pressing one opens a small card: what it is, where it was first read,
 * and what has been learnt since.
 */

const CARD_W = Math.min(
  560,
  Math.max(
    380,
    Math.round(typeof window === 'undefined' ? 420 : window.innerWidth * 0.26),
  ),
);

const LoreCard = ({
  entry,
  anchor,
  onClose,
  onEnter,
  onOpenGlossary,
}: {
  entry: LoreEntry;
  anchor: DOMRect;
  onClose: () => void;
  onEnter: () => void;
  onOpenGlossary?: (id: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    const h = ref.current?.offsetHeight ?? 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchor.left + anchor.width / 2 - CARD_W / 2;
    left = Math.max(8, Math.min(left, vw - CARD_W - 8));
    let top = anchor.top - h - 10;
    if (top < 8) top = Math.min(anchor.bottom + 10, vh - h - 8);
    setPos({ top, left });
  }, [anchor]);
  const recent = entry.events.slice(-3);
  return createPortal(
    <div
      className="fixed z-[85] animate-fade-in rounded-md border border-brass/60 bg-charcoal-950 px-6 py-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
      data-testid="lore-card"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={onEnter}
      onMouseLeave={onClose}
      ref={ref}
      role="dialog"
      style={{
        width: CARD_W,
        top: pos?.top ?? anchor.top,
        left: pos?.left ?? anchor.left,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <div className="font-condensed text-[clamp(0.902rem,1.14vw,1.42rem)] text-strapline uppercase tracking-widest">
        {LORE_KIND_LABEL[entry.kind]} · {entry.firstSeen.label}
      </div>
      <div className="font-caps text-[clamp(1.8rem,2.28vw,3.04rem)] text-brass-pale leading-tight">
        {entry.name}
      </div>
      <p className="mt-2 font-book text-[clamp(1.33rem,1.71vw,2.18rem)] text-parchment-text leading-snug">
        {entry.summary}
      </p>
      {recent.length > 0 ? (
        <ul className="mt-2 space-y-1 border-brass/25 border-t pt-2 font-scaly text-[clamp(1.14rem,1.42vw,1.8rem)] text-charcoal-200">
          {recent.map((ev) => (
            <li
              className="flex gap-2"
              key={`${ev.turn}-${ev.text.slice(0, 20)}`}
            >
              <span className="shrink-0 text-brass">◆</span>
              <span>
                {ev.text}
                <span className="text-charcoal-500"> · turno {ev.turn}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {onOpenGlossary ? (
        <button
          className="mt-3 font-condensed text-[clamp(0.902rem,1.14vw,1.42rem)] text-brass-pale uppercase tracking-widest underline-offset-4 hover:underline"
          onClick={() => onOpenGlossary(entry.id)}
          type="button"
        >
          Ver en el glosario · G
        </button>
      ) : null}
    </div>,
    document.body,
  );
};

const LoreText = ({
  text,
  lore,
  onOpenGlossary,
  className,
  resetKey,
  currentTurn,
}: {
  text: string;
  lore: LoreEntry[];
  onOpenGlossary?: (id: string) => void;
  className?: string;
  /** Changes when the page changes; while the typewriter runs, the card stays. */
  resetKey?: string;
  /**
   * Turn being read. A name is only underlined from the turn after it was
   * first met: on its first appearance the text itself is the introduction.
   */
  currentTurn?: number;
}) => {
  const [open, setOpen] = useState<{
    entry: LoreEntry;
    anchor: DOMRect;
  } | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), 250);
  };
  // A new page or an Escape closes the card.
  const pageKey = resetKey ?? text;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the page changing is the signal
  useEffect(() => {
    setOpen(null);
  }, [pageKey]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    const onDown = () => setOpen(null);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const known =
    currentTurn === undefined
      ? lore
      : lore.filter((e) => e.firstSeen.turn < currentTurn);
  const mentions = findMentions(text, known);
  if (mentions.length === 0) return <span className={className}>{text}</span>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const m of mentions) {
    if (m.start > cursor)
      parts.push(
        <Fragment key={`t${m.start}`}>{text.slice(cursor, m.start)}</Fragment>,
      );
    parts.push(
      <button
        className="cursor-help rounded-sm underline decoration-brass/70 decoration-dotted underline-offset-[0.2em] hover:bg-brass/10"
        data-lore={m.entry.id}
        key={`m${m.start}-${m.entry.id}`}
        onClick={(e) => {
          e.stopPropagation();
          cancelClose();
          setOpen({
            entry: m.entry,
            anchor: e.currentTarget.getBoundingClientRect(),
          });
        }}
        onMouseEnter={(e) => {
          cancelClose();
          setOpen({
            entry: m.entry,
            anchor: e.currentTarget.getBoundingClientRect(),
          });
        }}
        onMouseLeave={scheduleClose}
        type="button"
      >
        {text.slice(m.start, m.end)}
      </button>,
    );
    cursor = m.end;
  }
  if (cursor < text.length)
    parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);
  return (
    <span className={className}>
      {parts}
      {open ? (
        <LoreCard
          anchor={open.anchor}
          entry={open.entry}
          onClose={scheduleClose}
          onEnter={cancelClose}
          onOpenGlossary={onOpenGlossary}
        />
      ) : null}
    </span>
  );
};

export { LoreText };
