# AGENTS.md — Diosa Interior V2

Instrucciones para agentes IA (Claude Code, Copilot, Cursor, etc.) que toquen este repo.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next 16) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 1. Qué es este proyecto

**Diosa Interior** es la primera guía de colorimetría diseñada específicamente para piel latina. Esta es la **V2**, una reconstrucción desde cero tras ~60 versiones inestables de la V1 (Firebase + HTML monolítico + estado distribuido en localStorage/sessionStorage/Firestore + IA síncrona en el flujo crítico).

V2 nace con disciplina arquitectónica estricta. **Ninguna decisión técnica improvisada.**

## 2. Documentos canónicos (leer antes de codear)

Las 4 biblias viven en `/docs/` y son la fuente de verdad del proyecto. Léelas en este orden:

1. **[`/docs/BIBLIA_APP_V2_DIOSA_INTERIOR.md`](/docs/BIBLIA_APP_V2_DIOSA_INTERIOR.md)** — arquitectura técnica, schema Postgres, flujo crítico de usuaria, plan de 12 fases.
2. **[`/docs/CLAUDE_DIOSA_INTERIOR_1.md`](/docs/CLAUDE_DIOSA_INTERIOR_1.md)** — sistema de marca: paleta, tipografía, ornamentos, voz, safe zone Instagram.
3. **[`/docs/CLAUDE_DIOSA_INTERIOR_UPDATES_APR2026.md`](/docs/CLAUDE_DIOSA_INTERIOR_UPDATES_APR2026.md)** — actualizaciones Abril 2026 (prioridad sobre el anterior si hay conflicto).
4. **[`/docs/BIBLIA_IMAGEN_DIOSA_INTERIOR.md`](/docs/BIBLIA_IMAGEN_DIOSA_INTERIOR.md)** — sistema colorimétrico científico (12 estaciones, Notación Munsell, Fitzpatrick, irradian/apagan) + reglas de fotografía con IA. Fuente del knowledge base de F.1 (Bloque F).

Si una decisión no está en estos documentos, **preguntar al dueño (César) — no improvisar.**

## 3. Stack obligatorio (cerrado, no cambiar sin aprobación)

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 App Router + TypeScript + React 19 |
| Estilos | Tailwind v4 (CSS-first config con `@theme` en `app/globals.css`) |
| Auth | Supabase Auth (Google OAuth + Magic Link) |
| Base de datos | Supabase Postgres con Row Level Security |
| Storage | Supabase Storage con URLs firmadas |
| Pagos | Stripe Checkout + webhook handler idempotente |
| IA | Anthropic API (`claude-sonnet-4-6` con tool use) |
| Jobs background | Inngest |
| Email | Resend |
| Hosting | Vercel |
| Errores | Sentry (frontend + backend con source maps) |
| Analytics | PostHog |
| Tests | Vitest (unit) + Playwright (e2e) |

## 4. Principios no negociables (P1–P8)

Si una decisión técnica viola alguno, está mal — alertar al humano antes de implementar.

- **P1 — Una fuente de verdad por dato.** Pago vive solo en `purchases` (Postgres). Sesión vive solo en Supabase Auth. Guía vive solo en `guides`. Fotos viven solo en Supabase Storage. Nada se duplica entre `localStorage` / `sessionStorage` / DB.
- **P2 — El frontend nunca decide nada crítico.** El frontend pregunta; el backend responde sí o no. Nunca el frontend infiere estado a partir de `localStorage`.
- **P3 — Análisis de IA es asíncrono.** Stripe webhook → encola job en Inngest → IA corre fuera del request → usuaria recibe email cuando termina. Nunca un spinner síncrono frente a una llamada IA.
- **P4 — Schema validado en cada borde.** Zod en frontend para forms y respuestas API. Validación estricta en cada endpoint. Si la IA devuelve algo que no matchea el schema, se reintenta automáticamente.
- **P5 — Idempotencia en webhooks y mutaciones.** Cada webhook de Stripe se procesa por `event_id` y se guarda en `webhook_events`. Cada mutación crítica acepta `idempotency_key`.
- **P6 — Errores observables.** Sentry captura todo error en frontend, backend y jobs Inngest. PostHog captura el funnel completo.
- **P7 — Staging real antes de prod.** `staging.diosainterior.app` con la misma infra. Cada feature se prueba ahí antes de merge a main.
- **P8 — Reversibilidad.** Cada deploy es revertible en un click vía Vercel rollback. Cada migración de DB tiene su `down`.

## 5. Estructura del repo (sección 7 de la biblia técnica)

```
app/
├── (marketing)/        ← landing pública (no auth)
├── (app)/              ← app autenticada (auth check en layout)
│   ├── upload/
│   ├── analizando/
│   ├── guide/
│   └── booking/
├── api/
│   ├── photos/upload/  ← genera URL firmada Supabase
│   ├── checkout/       ← crea Stripe session
│   ├── webhooks/stripe/ ← webhook handler idempotente
│   └── inngest/        ← endpoint Inngest (convención oficial del SDK)
└── layout.tsx
components/
├── ui/                 ← componentes base
├── upload/             ← PhotoUploader, ProgressDots
├── guide/              ← PaletteGrid, OcasionesGrid, etc.
└── chrome/             ← Logo, ProgressBar, UserBadge
lib/
├── services/           ← lógica de negocio (testeable sin HTTP)
├── db/                 ← acceso a Postgres + tipos generados
├── ai/
│   ├── prompts/        ← prompts versionados
│   └── ...
├── stripe/
└── validation/         ← Zod schemas
inngest/functions/      ← jobs background
supabase/migrations/    ← SQL versionado, aplicado vía Supabase CLI
tests/{unit,e2e}/
docs/                   ← biblias canónicas (no borrar)
```

**Regla de capas:** una capa solo conoce a la inmediatamente inferior. UI no llama a Supabase directo. Services no leen request HTTP. Repositorios no contienen lógica de negocio.

## 6. Reglas de trabajo (estrictas)

1. Explicar qué se va a hacer **antes** de hacerlo. Esperar aprobación del humano.
2. Cada commit pequeño y atómico.
3. Nunca push directo a `main` — siempre rama → PR. (`main` está protegido vía branch protection.)
4. Cero respuestas tipo "ya quedó" sin antes mostrar exactamente qué se hizo y dónde (file:line).
5. Cuando termine una fase, correr los tests y enseñar la salida.
6. Si algo no funciona, decir el error exacto al instante — no minimizar.

## 7. Prohibiciones absolutas

- ❌ No reusar código copiado de V1 sin adaptarlo a TypeScript + componentes React.
- ❌ Nunca instalar Firebase ni firebase-tools.
- ❌ Nunca API keys en código del cliente.
- ❌ No `useEffect` con deps vacías para fetch — usar React Query o server components.
- ❌ No `any` en TypeScript — si dudas del tipo, preguntar.
- ❌ Componentes máximo 200 líneas; partir si crecen más.

## 8. Sistema de marca (referencia rápida)

- **Paleta:** Vino Profundo `#1A0808` (fondo), Terra Diosa `#C4724A` (acento), Marfil `#FDF0E8` (texto). Detalle completo en `/docs/CLAUDE_DIOSA_INTERIOR_1.md` §2.
- **Tipografía:** Cormorant Garamond Italic (voz), Raleway uppercase (estructura), DM Mono (datos técnicos). Detalle en `/docs/CLAUDE_DIOSA_INTERIOR_1.md` §3.
- **Logo:** `/public/logo.png` (PNG por ahora; SVG es roadmap futuro).

## 9. Comandos comunes

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check sin emitir

supabase db push     # Aplicar migraciones a DB remota
supabase gen types typescript --linked > lib/db/database.types.ts  # Regenerar tipos

vercel               # Deploy preview
vercel --prod        # Deploy producción
```

---

*AGENTS.md — Diosa Interior V2*
*Especificación: [agents.md](https://agents.md)*
