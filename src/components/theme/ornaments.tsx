import { Caps } from './display';

/**
 * Small SVG ornaments drawn in the spirit of the 5e books: a fleuron divider
 * for chapter breaks, and the copper "line with end-circles" rule that
 * dungeonsanddragons.com uses under headings. Both follow currentColor.
 */

const Fleuron = ({ className = '' }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.3"
    viewBox="0 0 160 24"
  >
    <path d="M4 12h52" />
    <path d="M104 12h52" />
    <path d="M62 12c6-8 12-8 18 0 6 8 12 8 18 0" />
    <path d="M80 4l3 8-3 8-3-8z" fill="currentColor" stroke="none" />
    <circle cx="58" cy="12" fill="currentColor" r="1.6" stroke="none" />
    <circle cx="102" cy="12" fill="currentColor" r="1.6" stroke="none" />
    <path d="M62 12c-3-4-6-4-8 0" opacity="0.6" />
    <path d="M98 12c3-4 6-4 8 0" opacity="0.6" />
  </svg>
);

const CopperRule = ({ className = '' }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    preserveAspectRatio="none"
    stroke="currentColor"
    strokeWidth="1"
    viewBox="0 0 400 10"
  >
    <circle cx="5" cy="5" r="3" />
    <path d="M8 5h384" />
    <circle cx="395" cy="5" r="3" />
  </svg>
);

/** A section heading in the Beyond voice: brass caps between two copper rules. */
const SectionMark = ({
  eyebrow,
  title,
  className = '',
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) => (
  <div
    className={`mx-auto flex max-w-3xl flex-col items-center gap-3 text-center ${className}`}
  >
    <span className="font-condensed text-sm text-strapline uppercase tracking-2xl">
      {eyebrow}
    </span>
    <h2 className="font-nodesto text-4xl text-brass-pale uppercase leading-none tracking-wide md:text-5xl">
      <Caps>{title}</Caps>
    </h2>
    <CopperRule className="h-2.5 w-64 text-copper" />
  </div>
);

export { CopperRule, Fleuron, SectionMark };
