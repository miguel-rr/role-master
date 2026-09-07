import type { NextConfig } from 'next';

// Validate env at build time (see src/env.ts).
import './src/env';

const nextConfig: NextConfig = {
  // Private project: every response tells crawlers to stay away, on top of the
  // per-page `robots` metadata and public/robots.txt.
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    },
  ],
};

export default nextConfig;
