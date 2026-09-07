import type { ArtEntry } from '@/data/art/schema';

type ArtImageProps = {
  art: ArtEntry | undefined;
  alt?: string;
  className?: string;
  /** How the image fills its box. */
  fit?: 'cover' | 'contain';
  /** Focus point for `cover` crops; portraits look best a little above centre. */
  position?: string;
  loading?: 'lazy' | 'eager';
};

/**
 * Renders a catalogue illustration. Files are already resized WebP under
 * `public/art`, so a plain `<img>` (no Next optimisation quota) is the right
 * tool; width/height come from the manifest to avoid layout shift.
 * When the catalogue has no match, draws a parchment placeholder instead.
 */
const ArtImage = ({
  art,
  alt = '',
  className = '',
  fit = 'cover',
  position = '50% 30%',
  loading = 'lazy',
}: ArtImageProps) => {
  if (!art) {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center bg-charcoal-800 text-charcoal-600 ${className}`}
      >
        <svg
          className="h-10 w-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 24 24"
        >
          <title>Sin ilustración</title>
          <path d="M4 5h16v14H4z" />
          <path d="M4 16l5-5 4 4 3-3 4 4" />
          <circle cx="16" cy="9" r="1.5" />
        </svg>
      </div>
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: pre-sized local WebP; see comment above.
    <img
      alt={alt}
      className={className}
      decoding="async"
      height={art.height}
      loading={loading}
      src={art.src}
      style={{ objectFit: fit, objectPosition: position }}
      width={art.width}
    />
  );
};

export { ArtImage };
