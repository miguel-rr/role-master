import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Validated environment. Import `env` from here instead of reading
 * `process.env`; a missing or malformed variable fails the build early.
 * Run with `SKIP_ENV_VALIDATION=1` to bypass (e.g. lint-only CI).
 */
const env = createEnv({
  server: {
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
    /** "1" replaces Claude with the scripted narrator (tests, demos). */
    MOCK_NARRATOR: z.enum(['0', '1']).default('0'),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  client: {},
  runtimeEnv: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    MOCK_NARRATOR: process.env.MOCK_NARRATOR,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});

export { env };
