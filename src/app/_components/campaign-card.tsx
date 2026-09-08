import Link from 'next/link';
import { Caps } from '@/components/theme/display';
import type { ArtEntry } from '@/data/art/schema';
import type { CatalogEntry } from '@/data/campaigns/catalog';

type CampaignCardProps = {
  entry: CatalogEntry;
  cover: ArtEntry | undefined;
};

/** One cover on the shelf: painting, title plate, and what it is in two lines. */
const CampaignCard = ({ entry, cover }: CampaignCardProps) => (
  <Link
    className="group relative w-[min(78vw,22rem)] shrink-0 snap-start overflow-hidden rounded-md border border-white/10 bg-charcoal-900 transition duration-300 hover:z-10 hover:-translate-y-1.5 hover:border-brass hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)] focus-visible:border-brass focus-visible:outline-none"
    data-testid={`campaign-card-${entry.id}`}
    href={`/campaigns/${entry.id}`}
  >
    <div className="relative aspect-[16/10] overflow-hidden">
      {cover ? (
        // biome-ignore lint/performance/noImgElement: pre-sized local art
        <img
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
          height={cover.height}
          loading="lazy"
          src={cover.src}
          style={{ objectPosition: entry.focus ?? '50% 40%' }}
          width={cover.width}
        />
      ) : (
        <div className="h-full w-full bg-charcoal-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent" />
      <div className="absolute top-2 left-2 flex gap-1.5">
        <span className="rounded-sm bg-charcoal-950/80 px-1.5 py-0.5 font-condensed text-[0.6rem] text-brass-pale uppercase tracking-wider backdrop-blur">
          {entry.kind}
        </span>
        {entry.isNew ? (
          <span className="rounded-sm bg-brand-600 px-1.5 py-0.5 font-condensed text-[0.6rem] text-white uppercase tracking-wider">
            Nueva
          </span>
        ) : null}
        {!entry.available ? (
          <span className="rounded-sm bg-charcoal-950/80 px-1.5 py-0.5 font-condensed text-[0.6rem] text-charcoal-300 uppercase tracking-wider backdrop-blur">
            Próximamente
          </span>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
        <div className="font-nodesto text-[1.65rem] text-white uppercase leading-[0.95] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          <Caps>{entry.title}</Caps>
        </div>
      </div>
    </div>
    <div className="px-4 pt-2.5 pb-3.5">
      <p className="line-clamp-2 font-book text-[0.92rem] text-parchment-text leading-snug">
        {entry.tagline}
      </p>
      <div className="mt-2 flex items-center gap-3 font-scaly text-[0.72rem] text-charcoal-400">
        <span>{entry.levelRange}</span>
        <span>·</span>
        <span>{entry.duration.sessions}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {entry.tone.map((t) => (
          <span
            className="rounded-sm border border-white/10 px-1.5 py-0.5 font-condensed text-[0.58rem] text-charcoal-300 uppercase tracking-wider"
            key={t}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  </Link>
);

export { CampaignCard };
