# Role Master

Web privada que hace de Dungeon Master de D&D para dos jugadores en la misma
pantalla. El plan vivo y las decisiones están en `.claude/plan.md`: léelo antes
de tocar nada y actualízalo cuando se cierre una decisión.

# Commands

- Dev: `pnpm dev` (puerto **3001**, fijado por Miguel). `pnpm dev:mock` lo
  arranca con el narrador de guion (`MOCK_NARRATOR=1`): no consume API.
- Build: `pnpm build`
- Lint + format: `pnpm check` (auto-fix: `pnpm check:write`)
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test` (`test:unit` con vitest, `test:e2e` con Playwright).
  El e2e construye y sirve la app en el puerto 3002 con el narrador de guion;
  nunca llama a Anthropic. Next solo permite un `next dev` por proyecto, por
  eso el e2e usa `next build && next start`.

`pnpm typecheck`, `pnpm check` y `pnpm test` en verde antes de dar una tarea
por terminada. Cualquier prueba que toque el juego debe pasar por el narrador
de guion, nunca por la API real.

# Stack & Conventions

- Next.js 16 App Router, React 19, TypeScript estricto. Server Components por
  defecto; `'use client'` solo cuando hace falta estado/efectos/APIs del navegador.
- Tailwind CSS v4 vía `@tailwindcss/postcss` (sin `tailwind.config`). Tokens y
  temas en `src/styles/`.
- Biome (`biome.jsonc`): comillas simples, punto y coma, trailing commas,
  imports y atributos ordenados. `noDefaultExport` excepto en los ficheros de
  convención de Next.
- Sin base de datos, sin tRPC, sin auth. La IA se llama desde route handlers en
  `src/app/api/*` con el SDK oficial de Anthropic; la clave nunca sale del servidor.
- Env vars validadas en `src/env.ts`; nunca `process.env` suelto.
- Alias `@/*` → `src/*`. Sin `any`.
- **Idioma**: literales de UI, docs y prompts en español; código, variables,
  rutas y nombres de fichero en inglés.

# Boundaries

- No instalar dependencias sin preguntar.
- No tocar `.env*` ni `next.config.ts` sin confirmación.
