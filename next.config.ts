import type { NextConfig } from 'next';

// Validate env at build time (see src/env.ts).
import './src/env';

const nextConfig: NextConfig = {
  // The art catalogue is thousands of pre-sized WebP files; serving them as-is
  // keeps us clear of the image-optimisation quota on the Hobby plan.
  images: { unoptimized: true },
  // Project docs live in .claude/; don't let Next regenerate AGENTS.md/CLAUDE.md.
  agentRules: false,
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
