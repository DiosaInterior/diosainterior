# Diosa Interior

La primera guía de colorimetría diseñada específicamente para piel latina.

Este repositorio contiene la **V2** de la aplicación — reconstrucción desde cero con arquitectura profesional.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Stripe · Anthropic · Inngest · Resend · Vercel.

## Documentación

La fuente de verdad del proyecto vive en [`/docs/`](/docs/):

- [`BIBLIA_APP_V2_DIOSA_INTERIOR.md`](/docs/BIBLIA_APP_V2_DIOSA_INTERIOR.md) — arquitectura técnica, schema, plan de fases.
- [`CLAUDE_DIOSA_INTERIOR_1.md`](/docs/CLAUDE_DIOSA_INTERIOR_1.md) — sistema de marca y diseño.
- [`CLAUDE_DIOSA_INTERIOR_UPDATES_APR2026.md`](/docs/CLAUDE_DIOSA_INTERIOR_UPDATES_APR2026.md) — actualizaciones Abril 2026.

Para agentes IA que toquen el repo, ver [`AGENTS.md`](/AGENTS.md).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
app/         App Router (rutas + API)
components/  Componentes React
lib/         Servicios, repositorios, validación, clientes externos
inngest/     Jobs background
supabase/    Migraciones SQL versionadas
tests/       Vitest (unit) + Playwright (e2e)
docs/        Biblias del proyecto
```

---

© Diosa Interior · Mexico City
