# BIBLIA APP V2 — DIOSA INTERIOR
## Arquitectura técnica · Versión 2.3 · Mayo 2026
### Fuente única de verdad para reconstrucción desde cero

> **INSTRUCCIÓN CRÍTICA PARA CLAUDE CODE:** Este archivo es la ley absoluta de la app. Reemplaza toda decisión técnica anterior. Antes de escribir cualquier línea de código, leer las secciones 1, 2 y 3. Si una decisión no está en este documento, preguntar a César — no improvisar.

---

## ÍNDICE

1. Diagnóstico de la V1 (qué falló y por qué)
2. Principios no negociables
3. Stack técnico
4. Arquitectura de capas
5. Modelo de datos (schema Postgres)
6. Flujo crítico de usuaria (paso a paso)
7. Estructura de carpetas
8. Plan de implementación por fases
9. Qué se rescata del código V1
10. Testing y observabilidad
11. Deployment y entornos
12. Checklist de migración

---

## 1. DIAGNÓSTICO DE LA V1

La V1 tuvo ~60 versiones. La causa raíz **no fue el diseño ni el flujo** — esos están bien resueltos. La causa raíz fueron 5 errores de arquitectura:

### 1.1 Estado distribuido sin fuente de verdad
El estado de la usuaria vivía simultáneamente en:
- `localStorage` (`stripe_pending`, `diosa_guia_cache_<uid>`)
- `sessionStorage` (no persistía en Safari iOS — causa raíz de muchos bugs)
- Firestore en 3 colecciones distintas (`pagos`, `guias`, `fotos_pendientes`)
- Variables globales JS (`currentUser`, `uploads`, `cur`, `guiaCargada`)
- URL params (`?paid=true`)

**Resultado:** cada bug "no me cargó la guía después de pagar" es un bug de sincronización entre estas 5 fuentes.

### 1.2 Race conditions en autenticación
El código tenía `getRedirectResult` + `onAuthStateChanged` + `setTimeout(200ms)` + flag `_navegado` compitiendo por mover a la usuaria al slide correcto. Comportamiento no determinístico según navegador.

### 1.3 Lógica de pago acoplada al frontend
El frontend escuchaba cambios de Firestore para detectar el pago. Si el webhook de Stripe fallaba o tardaba, la usuaria quedaba en loop de spinner. Sin idempotencia, sin reintentos.

### 1.4 IA dentro del flujo crítico síncrono
`claude-haiku-4-5` se llamaba en línea esperando JSON parseable de hasta 4000 tokens. Cualquier respuesta con un carácter inesperado rompía todo. La usuaria veía "Error al cargar tu guía" sin posibilidad de recuperación.

### 1.5 Sin tests, sin staging, sin observabilidad
Cada deploy fue ruleta rusa en producción. Sin forma de saber si algo estaba roto hasta que la usuaria escribía a soporte.

---

## 2. PRINCIPIOS NO NEGOCIABLES

Estos principios tienen prioridad sobre cualquier otra consideración. Si una decisión técnica viola alguno, está mal.

### P1 — Una fuente de verdad por dato
- **Pago:** vive solo en `purchases` (Postgres). Frontend pregunta, no decide.
- **Sesión:** vive solo en el proveedor de auth. No se duplica en localStorage.
- **Guía generada:** vive solo en `guides` (Postgres). El cache es opcional, nunca autoritativo.
- **Fotos:** viven solo en Supabase Storage. El frontend solo guarda URLs firmadas temporales.

### P2 — El frontend nunca decide nada crítico
El frontend pregunta "¿esta usuaria pagó?" — el backend responde sí o no. El frontend pregunta "¿está lista la guía?" — el backend responde. Nunca el frontend infiere estado a partir de localStorage.

- **Ejemplo concreto:** la tabla `bookings` tiene RLS solo para `SELECT`. Las mutaciones (INSERT/UPDATE/DELETE) viven en route handlers que validan pago previo + disponibilidad de fecha + permisos antes de tocar la tabla. El cliente nunca escribe directo a `bookings`.

### P3 — Análisis de IA es asíncrono
Stripe webhook → encola job en background → IA corre fuera del request → usuaria ve estado en tiempo real (o recibe email cuando termina). **Nunca más una usuaria viendo un spinner de 30 segundos rezando que no falle.**

### P4 — Schema validado en cada borde
Zod en frontend para forms y respuestas API. Validación estricta en cada endpoint. Si la IA devuelve algo que no matchea el schema, se reintenta automáticamente — la usuaria nunca ve un error de parseo.

### P5 — Idempotencia en webhooks y mutaciones
Cada webhook de Stripe se procesa por `event_id` y se guarda en `webhook_events` para evitar duplicación. Cada mutación crítica acepta un `idempotency_key`.

### P6 — Errores observables
Sentry captura todo error en frontend y backend. PostHog captura el funnel completo (landing → upload → pago → guía vista). Nada se pierde.

### P7 — Staging real antes de prod
`staging.diosainterior.app` con la misma infra (auth, DB, Stripe en test mode). Cada feature se prueba ahí antes de merge a main.

### P8 — Reversibilidad
Cada deploy es revertible en un click vía Vercel rollback. Cada migración de DB tiene su `down`.

---

## 3. STACK TÉCNICO

Decisiones tomadas y cerradas. No reabrir sin razón fuerte.

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | **Next.js 15 (App Router) + TypeScript** | Server components reducen JS al cliente. Route handlers eliminan necesidad de Cloudflare Worker separado. |
| Estilos | **Tailwind CSS + tokens custom** | Migrar variables CSS actuales (`--marfil`, `--terra`, etc.) a `tailwind.config.ts`. Sistema visual idéntico. |
| Auth | **Supabase Auth (Google OAuth + Magic Link)** | Resuelve Safari iOS de raíz. Integrado con Postgres y Row Level Security. |
| Base de datos | **Supabase Postgres** | Una sola DB. Row Level Security = cada usuaria solo ve sus datos sin escribir lógica de permisos. |
| Storage | **Supabase Storage** | URLs firmadas con expiración. No más base64 viajando en el HTML. |
| Pagos | **Stripe Checkout + webhook handler** | Webhook idempotente en `/api/webhooks/stripe` con verificación de firma. |
| IA | **Anthropic API directo desde route handler** | `claude-sonnet-4-5` (no haiku — vale la pena para análisis colorimétrico crítico). Tool use con JSON schema para garantizar estructura. |
| Jobs background | **Inngest o Trigger.dev** | Orquesta el job de análisis IA fuera del request. Reintentos automáticos. |
| Email | **Resend** | Notifica a la usuaria cuando su guía está lista. Recupera carritos abandonados. |
| Hosting | **Vercel** | Deploy automático, preview por PR, rollback en un click. |
| Errores | **Sentry** | Frontend + backend. Source maps en build. |
| Analytics | **PostHog** | Funnel + session replay para debugging visual. |
| Tests | **Vitest (unit) + Playwright (e2e)** | E2E del flujo completo: landing → pago test → guía generada. |

### Lo que se elimina del stack V1
- ❌ Firebase (Auth + Firestore) — reemplazado por Supabase
- ❌ Cloudflare Worker para Anthropic — reemplazado por route handler de Next.js
- ❌ Formspree — reemplazado por Resend + tabla `bookings`
- ❌ HTML monolítico — reemplazado por componentes React tipados
- ❌ PWA manifest dinámico — Next.js maneja PWA nativamente

---

## 4. ARQUITECTURA DE CAPAS

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js Server + Client Components)          │
│  - Solo UI y forms                                      │
│  - Llama a route handlers vía fetch tipado              │
│  - NO tiene lógica de negocio                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ROUTE HANDLERS (/app/api/*)                            │
│  - Validación con Zod                                   │
│  - Llama a services                                     │
│  - Devuelve JSON tipado                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  SERVICES (/lib/services/*)                             │
│  - Lógica de negocio pura                               │
│  - PaymentService, AnalysisService, GuideService        │
│  - Testeable sin HTTP                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  REPOSITORIES (/lib/db/*)                               │
│  - Acceso a Postgres vía Supabase client                │
│  - Tipos generados desde el schema                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  SUPABASE POSTGRES + STORAGE + AUTH                     │
└─────────────────────────────────────────────────────────┘

Webhooks Stripe → /api/webhooks/stripe → PaymentService → trigger job IA
Job IA → Inngest → AnalysisService → Anthropic API → guarda en guides
```

**Regla:** una capa solo conoce a la inmediatamente inferior. UI no llama a Supabase directo. Services no leen request HTTP.

---

## 5. MODELO DE DATOS (SCHEMA POSTGRES)

```sql
-- Usuarias (manejado por Supabase Auth, extendido con perfil)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  country TEXT, -- 'MX' | 'CO' | 'AR' | etc — para analítica regional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compras (fuente de verdad del pago)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product TEXT NOT NULL, -- 'base' | 'wedding' | 'quinceanera' | 'session'
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'mxn',
  status TEXT NOT NULL, -- 'pending' | 'paid' | 'refunded' | 'failed'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON purchases(user_id, status);

-- Fotos subidas (referencias a Storage)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- 'users/<uid>/photo_1.jpg'
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position)
);

-- Jobs de análisis (estado del procesamiento IA)
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued' | 'running' | 'succeeded' | 'failed'
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  prompt_version TEXT NOT NULL, -- '2.0', '2.1' — para A/B testing
  model TEXT NOT NULL, -- 'claude-sonnet-4-5'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guías generadas (resultado final)
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES analysis_jobs(id),
  -- Datos del análisis colorimétrico
  fitzpatrick INTEGER CHECK (fitzpatrick BETWEEN 1 AND 6),
  season TEXT, -- 'true_spring' | 'warm_autumn' | etc
  undertone TEXT, -- 'warm_golden' | 'neutral_olive' | etc
  munsell_notation TEXT, -- '5YR 6/4' por ejemplo
  cie_lab JSONB, -- {L: 65, a: 12, b: 20}
  -- Resultado completo (JSON validado por Zod)
  data JSONB NOT NULL,
  -- Versionado
  prompt_version TEXT NOT NULL,
  app_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guides_user ON guides(user_id);

-- Webhooks procesados (idempotencia)
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY, -- stripe event id
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);

-- Citas (reemplaza Formspree)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Cada usuaria solo ve lo suyo
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_photos" ON photos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_guides" ON guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_jobs" ON analysis_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
```

> **Nota sobre `bookings` (v2.1):** la versión 2.0 omitía habilitar RLS y crear policy para esta tabla — corregido en v2.1. La policy es `FOR SELECT` (no `FOR ALL`) por decisión arquitectónica alineada con P2: las mutaciones de bookings involucran lógica de negocio crítica (validar pago previo, validar fecha disponible, disparar email de confirmación, posibles reembolsos parciales en cancelación) y por tanto viven en route handlers con `service_role` key + validación de negocio. El frontend solo lee sus propias bookings; nunca las escribe directo. Las bookings con `user_id NULL` (guest) solo son visibles vía backend con service role.

---

## 6. FLUJO CRÍTICO DE USUARIA (PASO A PASO)

Este es el único flujo que importa. Documentado para que no haya ambigüedad.

### Estado A: Aterriza en landing
- Server component renderiza estático.
- No hay JS de auth todavía.
- CTA: "Empezar mi análisis"

### Estado B: Click en CTA
- Modal de auth (Google OAuth o Magic Link).
- Supabase Auth maneja redirect.
- Al volver, server component lee cookie de sesión.

### Estado C: Sube 4 fotos
- Componente client con drag/drop.
- Cada foto se sube a Supabase Storage vía URL firmada (no pasa por nuestro backend).
- Se inserta row en `photos` con `position`.
- Cuando hay 4, se habilita CTA "Pagar y analizar".

### Estado D: Click en pagar
- Backend crea Stripe Checkout Session con `client_reference_id = user.id`.
- Inserta `purchases` con `status = 'pending'`.
- Redirige a Stripe.

### Estado E: Stripe webhook
- Llega `checkout.session.completed`.
- Verifica firma. Verifica idempotencia en `webhook_events`.
- Actualiza `purchases.status = 'paid'` y `paid_at`.
- **Encola job de análisis** vía Inngest. Inserta `analysis_jobs` con `status = 'queued'`.
- Devuelve 200 a Stripe.

### Estado F: Usuaria vuelve a la app
- Server component lee `purchases` y `analysis_jobs` para esta usuaria.
- Si `job.status = 'queued'` o `'running'` → muestra pantalla de "estamos analizando, te avisamos por email".
- Si `job.status = 'succeeded'` → renderiza la guía.
- Si `job.status = 'failed'` → muestra "tuvimos un problema, ya estamos trabajando en ello" + reencola automático.

### Estado G: Job de análisis corre (background)
- Inngest invoca handler.
- Handler descarga las 4 fotos de Storage.
- Llama a Anthropic con tool use forzando schema.
- Si la respuesta no parsea → reintenta hasta 3 veces con jitter.
- Si éxito → inserta en `guides`, marca job como `succeeded`.
- Envía email vía Resend: "Tu guía está lista".

### Estado H: Usuaria recibe email y vuelve
- Click en link → server component lee guía → renderiza directo.
- Cero spinners. Cero loading states de IA. La guía ya existe.

### Diferencia clave vs V1
En V1 la usuaria esperaba con spinner mientras la IA corría, en una conexión que podía fallar en cualquier momento. En V2 la usuaria paga, cierra la app si quiere, y vuelve cuando recibe el email. **El sistema es resiliente a interrupciones.**

---

## 7. ESTRUCTURA DE CARPETAS

```
diosa-interior/
├── app/                              # Next.js App Router
│   ├── (marketing)/                  # Landing pública
│   │   └── page.tsx
│   ├── (app)/                        # App autenticada
│   │   ├── upload/page.tsx           # Slide 3 V1
│   │   ├── analyzing/page.tsx        # Slide 4 V1 (ahora background)
│   │   ├── guide/page.tsx            # Slide 7 V1
│   │   └── booking/page.tsx
│   ├── api/
│   │   ├── photos/upload/route.ts    # Genera URL firmada
│   │   ├── checkout/route.ts         # Crea Stripe session
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts       # Webhook handler idempotente
│   │   └── jobs/analyze/route.ts     # Endpoint Inngest
│   └── layout.tsx
├── components/
│   ├── ui/                           # Componentes base (Button, Card, etc)
│   ├── upload/                       # PhotoUploader, ProgressDots
│   ├── guide/                        # PaletteGrid, OcasionesGrid, etc
│   └── chrome/                       # Logo, ProgressBar, UserBadge
├── lib/
│   ├── services/
│   │   ├── payment.service.ts
│   │   ├── analysis.service.ts
│   │   ├── guide.service.ts
│   │   └── notification.service.ts
│   ├── db/
│   │   ├── client.ts                 # Supabase client (browser)
│   │   ├── server.ts                 # Supabase client (server) — ver nota v2.2
│   │   ├── database.types.ts         # Tipos generados con `supabase gen types`
│   │   ├── purchases.repo.ts
│   │   ├── guides.repo.ts
│   │   └── photos.repo.ts
│   ├── ai/
│   │   ├── prompts/
│   │   │   ├── colorimetry-v2.ts     # Prompt versionado
│   │   │   └── schema.ts             # JSON schema para tool use
│   │   └── anthropic.client.ts
│   ├── stripe/
│   │   └── client.ts
│   └── validation/
│       └── schemas.ts                # Todos los Zod schemas
├── inngest/
│   └── functions/
│       └── analyze-colorimetry.ts    # Job background
├── styles/
│   └── globals.css                   # Tokens migrados de V1
├── tests/
│   ├── unit/
│   └── e2e/
│       └── full-flow.spec.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

> **Nota sobre `lib/db/` (v2.2):** el cliente Supabase se parte en dos archivos por compatibilidad con Next App Router. `client.ts` exporta `createBrowserClient` para componentes con `"use client"`; `server.ts` exporta `createServerClient` async (lee cookies vía `next/headers`) para server components, route handlers y server actions. Mezclarlos en un solo archivo rompe el bundle de cliente porque `next/headers` solo existe en server. Convención oficial Supabase + Next App Router. El cliente con `service_role` (bypass RLS para webhooks Stripe / jobs Inngest) se añade como tercer archivo cuando llegue su primer consumidor.

---

## 8. PLAN DE IMPLEMENTACIÓN POR FASES

### Fase 0 — Setup (1 día)
- Crear repo en GitHub
- Crear proyecto Supabase (free tier inicial)
- Crear proyecto Vercel + conectar repo
- Configurar Stripe en modo test
- Configurar Anthropic API key
- Configurar Sentry, PostHog, Resend, Inngest
- Variables de entorno en Vercel + `.env.local`

### Fase 1 — Schema y auth (1 día)
- Correr migraciones SQL del schema completo
- Configurar Supabase Auth con Google OAuth
- Configurar Row Level Security
- Componente de login con Google
- Página `/upload` protegida (redirige si no hay sesión)

### Fase 2 — Upload de fotos (1 día)
- Componente `PhotoUploader` con drag/drop
- Genera URLs firmadas vía route handler
- Guarda referencia en `photos`
- Migra el visual exacto del slide 3 V1

### Fase 3 — Pago (1 día)
- Crear productos en Stripe (Base, Wedding, Quinceañera)
- Route handler `/api/checkout` con `client_reference_id`
- Webhook handler `/api/webhooks/stripe` con verificación de firma e idempotencia
- Inserta/actualiza `purchases`

### Fase 4 — Análisis IA asíncrono (2 días)
- Definir JSON schema completo del análisis
- Migrar prompt de V1 a `lib/ai/prompts/colorimetry-v2.ts`
- Implementar tool use con Anthropic
- Crear Inngest function `analyzeColorimetry`
- Webhook de Stripe encola el job
- Estados de job (`queued` → `running` → `succeeded`/`failed`)
- Reintentos automáticos en `failed`

### Fase 5 — Render de guía (2 días)
- Migrar visual del slide 7 V1 a componentes React
- `PerfilCard`, `PaletaGrid`, `OcasionesGrid`, `MaquillajeCard`, `MetalesCard`
- Server component lee guía y renderiza estático
- Compartir vía link único (sin login para receptora)

### Fase 6 — Email y notificaciones (medio día)
- Template Resend "Tu guía está lista"
- Job Inngest envía email cuando análisis termina
- Email de carrito abandonado (si pagó pero no subió fotos)

### Fase 7 — Booking (medio día)
- Form de cita en `/booking`
- Inserta en `bookings`
- Envía email a César con detalles

### Fase 8 — Tests E2E (1 día)
- Playwright: flujo completo con Stripe test mode
- Cubrir caso happy path + 3 edge cases (pago falla, IA falla, sesión expira)

### Fase 9 — Staging y QA (1 día)
- Deploy a `staging.diosainterior.app`
- Probar con 5 usuarias reales (Valentina + 4 amigas)
- Capturar bugs en GitHub Issues

### Fase 10 — Producción (medio día)
- Migrar dominio `diosainterior.app` a Vercel
- Switchear Stripe a modo live
- Monitoreo en Sentry/PostHog primeras 48h

**Total: ~12 días de desarrollo activo con Claude Code.** Comparado con las 60 versiones de V1, una semana y media para tener algo robusto y escalable.

---

## 9. QUÉ SE RESCATA DEL CÓDIGO V1

No tiramos nada que ya funcione. Esto se migra:

| Asset V1 | Migración V2 |
|----------|--------------|
| Tokens CSS (`--marfil`, `--terra`, etc) | → `tailwind.config.ts` extended colors |
| Fuentes (Cormorant, Raleway, DM Mono) | → `app/layout.tsx` con `next/font` |
| Slide 1 visual (landing) | → `app/(marketing)/page.tsx` |
| Slide 3 visual (upload) | → componente `PhotoUploader` |
| Slide 7 visual (guía) | → componentes en `components/guide/*` |
| Componente swatches con tooltip | → `components/guide/PaletaSwatch.tsx` |
| Estructura JSON del análisis | → `lib/validation/schemas.ts` (con Zod) |
| Prompt de Anthropic | → `lib/ai/prompts/colorimetry-v2.ts` (mejorado con tool use) |
| Animación shimmer del logo | → keyframes en `globals.css` |
| Loading steps (`ls1`-`ls5`) | → componente para pantalla de procesamiento |
| Generación de PDF/HTML descargable | → route handler `/api/guide/download` |

### Qué se elimina
- ❌ Toda la lógica de `_moverUsuaria`, `getRedirectResult`, race conditions
- ❌ `localStorage.setItem('stripe_pending', ...)`
- ❌ `sessionStorage` para fotos
- ❌ Cloudflare Worker
- ❌ PWA manifest dinámico via Blob
- ❌ Conversión de HEIC en cliente (Supabase Storage lo maneja)

---

## 10. TESTING Y OBSERVABILIDAD

### Tests obligatorios
- **Unit (Vitest):** cada service y cada validador Zod
- **Integration:** route handlers con mock de Supabase
- **E2E (Playwright):** flujo completo en CI antes de cada deploy

### Sentry — capturar siempre
- Errores en route handlers
- Errores en componentes client (Error Boundary)
- Errores en jobs Inngest
- Source maps subidos en build

#### Patrón silent-without-DSN (v2.3)

Sentry SIN DSN no debe romper builds ni emitir warnings. Patrón obligatorio en cada archivo de init (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`):

```typescript
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN; // o SENTRY_DSN en server/edge
if (dsn) {
  Sentry.init({ dsn, /* … */ });
}
```

Sin DSN, el SDK no inicia y todas las funciones (`Sentry.captureException`, `Sentry.captureRequestError`, `Sentry.captureRouterTransitionStart`) degradan a no-op. Esto permite clonar el repo y correr `npm run dev` sin tener cuenta Sentry. El DSN se configura solo en `.env.local` local + Vercel — nunca commiteado.

### PostHog — eventos clave
- `landing_viewed`
- `signup_started` / `signup_completed`
- `photo_uploaded` (con `position`)
- `checkout_started`
- `payment_succeeded`
- `analysis_started` / `analysis_completed` / `analysis_failed`
- `guide_viewed`
- `guide_shared`
- `booking_submitted`

### Métricas a vigilar (dashboard semanal)
- Conversión landing → signup
- Conversión signup → upload completo
- Conversión upload → pago
- Tasa de éxito de IA (succeeded / total jobs)
- Tiempo promedio del job IA
- Tasa de errores Sentry por release

---

## 11. DEPLOYMENT Y ENTORNOS

### Tres entornos
- **Local:** `dev` con Supabase local (Docker) o proyecto staging
- **Staging:** `staging.diosainterior.app` — deploy automático desde rama `staging`
- **Producción:** `diosainterior.app` — deploy desde `main` solo vía PR con tests verdes

### Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo backend
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

### Reglas de deploy
- Nunca push directo a `main`
- Cada PR genera preview URL en Vercel
- Tests E2E corren en CI obligatoriamente
- Migración de DB se aplica vía Supabase CLI antes de deploy de código

---

## 12. CHECKLIST DE MIGRACIÓN

Para cuando empieces con Claude Code, este es el orden de comandos:

- [ ] `npx create-next-app@latest diosa-interior --typescript --tailwind --app`
- [ ] Crear repo GitHub y push inicial
- [ ] Crear proyecto Supabase
- [ ] Correr schema SQL completo
- [ ] Configurar Auth con Google OAuth (callback URL Vercel)
- [ ] Crear `.env.local` con todas las variables
- [ ] Migrar tokens de diseño a `tailwind.config.ts`
- [ ] Migrar fuentes con `next/font`
- [ ] Implementar Fase 1 → 10 según orden
- [ ] Tests E2E pasando
- [ ] Deploy staging
- [ ] QA con usuarias reales
- [ ] Deploy producción
- [ ] Monitorear 48h

---

## NOTAS FINALES

**Sobre el cambio Firebase → Supabase:** sí, hay trabajo de migración. Pero Firebase fue la causa de tres clases de bugs:
1. Safari iOS y popups bloqueados
2. `sessionStorage` no persistente
3. Reglas de Firestore inflexibles vs RLS de Postgres

Supabase resuelve los tres. Y el modelo relacional con Postgres es estrictamente mejor para los datos de Diosa Interior (relaciones entre `purchases`, `guides`, `bookings`).

**Sobre el cambio de Haiku → Sonnet:** el análisis colorimétrico es el producto. Vale la pena pagar 5x por una respuesta más precisa que justifique el precio del producto. Cuando el volumen sea alto, evaluar si Haiku 4.5 con buen prompt logra paridad — pero arrancar con Sonnet.

**Sobre el async de IA:** este es el cambio más importante. Una usuaria que espera 30 segundos viendo un spinner es una usuaria que cree que la app está rota. Una usuaria que paga, recibe email "tu guía está lista en 2 minutos", y vuelve a una guía perfectamente renderizada — esa usuaria confía en la marca.

---

*BIBLIA APP V2 — Versión 2.3*
*Creada: Mayo 2026*
*Reemplaza: toda decisión técnica de versiones anteriores*
*Próxima revisión: cuando V2 esté en producción y haya 50+ usuarias activas*

---

## CHANGELOG

### v2.3 — Mayo 2026
- **§10 observabilidad:** documentado el patrón silent-without-DSN para Sentry — `if (dsn) { Sentry.init() }` en lugar del placeholder `___DSN___` que sugiere el SKILL oficial. Permite clonar el repo y correr dev sin cuenta Sentry.
- Reservada implícitamente la ruta `/monitoring` para `tunnelRoute` de Sentry (evade ad-blockers). No crear página `/monitoring` sin antes mover `tunnelRoute` a otro path en `withSentryConfig`.

### v2.2 — Mayo 2026
- **§7 estructura:** `lib/db/` ahora lista `client.ts` (browser), `server.ts` (server) y `database.types.ts` por separado.
- **§7:** nota arquitectónica explicando por qué el cliente Supabase se parte en dos archivos (incompatibilidad de `next/headers` con bundle de cliente — convención oficial Supabase + Next App Router).

### v2.1 — Mayo 2026
- **§5 schema:** añadido `ALTER TABLE bookings ENABLE ROW LEVEL SECURITY` y policy `users_own_bookings` (FOR SELECT). La v2.0 los omitía — sin RLS cualquier usuaria autenticada podía leer las citas de cualquier otra.
- **§5 schema:** nota explicando por qué la policy de `bookings` es `FOR SELECT` y no `FOR ALL` (mutaciones vía route handlers con service role + validación de negocio).
- **§2 P2:** añadido ejemplo concreto referenciando `bookings` como caso de aplicación del principio.

### v2.0 — Mayo 2026
- Versión inicial.
