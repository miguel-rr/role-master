# Role Master

Web privada que hace de Dungeon Master de D&D para dos jugadores en la misma
pantalla. El plan vivo y las decisiones están en `.claude/plan.md`: léelo antes
de tocar nada y actualízalo cuando se cierre una decisión.

# Commands

- Dev: `pnpm dev` (puerto **3001**, fijado por Miguel)
- Build: `pnpm build`
- Lint + format: `pnpm check` (auto-fix: `pnpm check:write`)
- Typecheck: `pnpm typecheck`

`pnpm typecheck` y `pnpm check` en verde antes de dar una tarea por terminada.

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
