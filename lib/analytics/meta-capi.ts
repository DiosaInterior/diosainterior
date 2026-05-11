// =====================================================================
// Diosa Interior — Meta Conversions API (CAPI) server-side
// =====================================================================
// G.7 — POST a Meta Graph API para disparar eventos server-side.
// Complementa al Pixel client (con event_id matcheando para dedup)
// para eventos críticos donde Pixel solo no es confiable:
//  - Purchase (webhook Stripe: el cliente ya no está en la app)
//  - CompleteRegistration (Inngest job: cero cliente involucrado)
//  - Lead (auth callback: server-side, sin redirect a un page con fbq)
//
// Hashing:
//  Meta requiere SHA-256 lowercase de campos PII (email, phone, etc).
//  Solo hasheamos el email; client_ip_address y client_user_agent NO
//  se hashean (Meta los acepta en plain según docs).
//
// Defensive:
//  - Si NEXT_PUBLIC_META_PIXEL_ID o META_CAPI_ACCESS_TOKEN faltan,
//    no-op silencioso (config en dev, no romper).
//  - Timeout 5s + 1 retry. Si los 2 attempts fallan, log a Sentry
//    con tag 'capi=meta' + event_name + event_id en el contexto.
//  - Nunca lanza excepciones al caller — el bloque de Sentry es el
//    único side-effect en path de error. Caller hace fire-and-forget.
// =====================================================================

import "server-only";
import { createHash } from "node:crypto";

import * as Sentry from "@sentry/nextjs";

import type { MetaPixelEventName } from "./meta-pixel";

const META_GRAPH_VERSION = "v20.0";
const CAPI_TIMEOUT_MS = 5000;
const CAPI_RETRY_COUNT = 1; // = 2 attempts total

function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export type CapiUserData = {
  email?: string;
  client_ip_address?: string;
  client_user_agent?: string;
};

export type SendCapiEventArgs = {
  eventName: MetaPixelEventName;
  eventId: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
  eventSourceUrl: string;
};

async function postOnce(
  url: string,
  body: unknown,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendCapiEvent(args: SendCapiEventArgs): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    // Config ausente (dev local). No-op silencioso para no contaminar
    // Sentry con falsos negativos.
    return;
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  const userData: Record<string, string> = {};
  if (args.userData.email) {
    userData.em = hashEmail(args.userData.email);
  }
  if (args.userData.client_ip_address) {
    userData.client_ip_address = args.userData.client_ip_address;
  }
  if (args.userData.client_user_agent) {
    userData.client_user_agent = args.userData.client_user_agent;
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: args.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.eventId,
        action_source: "website",
        event_source_url: args.eventSourceUrl,
        user_data: userData,
        custom_data: args.customData ?? {},
      },
    ],
  };
  // Test Events Viewer de Meta — si está la env var, todos los eventos
  // van al stream de testing y NO contaminan métricas de producción.
  // Producción debe correr sin esta env var.
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= CAPI_RETRY_COUNT; attempt++) {
    try {
      const res = await postOnce(url, payload, CAPI_TIMEOUT_MS);
      if (res.ok) {
        return;
      }
      const body = await res.text();
      lastError = new Error(`CAPI HTTP ${res.status}: ${body}`);
    } catch (err) {
      lastError = err;
    }
  }

  // Ambos attempts fallaron — log a Sentry con tag específico para
  // poder filtrar en el dashboard. Caller (webhook/job) no se entera
  // y sigue su flujo principal.
  Sentry.captureException(lastError, {
    tags: { capi: "meta", event_name: args.eventName },
    extra: {
      event_id: args.eventId,
      event_name: args.eventName,
      event_source_url: args.eventSourceUrl,
    },
  });
}
