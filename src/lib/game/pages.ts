import type { Beat } from './schema';

/**
 * Splits the narrator's beats into short pages so the text can be set big
 * (a TV across the room) without covering the scene. Breaks at sentence
 * ends; a short tail is merged into the previous page.
 */

type Page = {
  /** Index of the beat this page comes from. */
  beat: number;
  kind: Beat['kind'];
  text: string;
  /** First page of its beat: gets the drop cap, fires the cues. */
  first: boolean;
  /** Position within the beat, for "2/3". */
  index: number;
  count: number;
};

const MAX_CHARS = 260;
const MIN_TAIL = 70;

/** Sentence-ish units: text up to and including . ! ? … and closing quotes. */
const sentences = (text: string): string[] => {
  const out: string[] = [];
  const re = /[^.!?…]+[.!?…]+[»")\]]*\s*|[^.!?…]+$/g;
  for (const m of text.matchAll(re)) out.push(m[0]);
  return out.length > 0 ? out : [text];
};

const chunk = (text: string, max = MAX_CHARS): string[] => {
  const clean = text.trim();
  if (clean.length <= max) return [clean];
  const pages: string[] = [];
  let cur = '';
  for (const s of sentences(clean)) {
    if (cur && cur.length + s.length > max) {
      pages.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) pages.push(cur.trim());
  // A very short last page reads as a hiccup: glue it to the previous one.
  if (pages.length > 1) {
    const tail = pages[pages.length - 1] ?? '';
    const prev = pages[pages.length - 2] ?? '';
    if (tail.length < MIN_TAIL && prev.length + tail.length <= max * 1.25) {
      pages.splice(pages.length - 2, 2, `${prev} ${tail}`);
    }
  }
  return pages;
};

const paginate = (beats: Beat[], max = MAX_CHARS): Page[] =>
  beats.flatMap((b, beat) => {
    const parts = chunk(b.text, max);
    return parts.map((text, index) => ({
      beat,
      kind: b.kind,
      text,
      first: index === 0,
      index,
      count: parts.length,
    }));
  });

export { chunk, MAX_CHARS, paginate };
export type { Page };
