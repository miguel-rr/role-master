import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Validated environment. Import `env` from here instead of reading
 * `process.env`; a missing or malformed variable fails the build early.
 * Run with `SKIP_ENV_VALIDATION=1` to bypass (e.g. lint-only CI).
 */
const env = createEnv({
  server: {
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  client: {},
  runtimeEnv: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});

export { env };
