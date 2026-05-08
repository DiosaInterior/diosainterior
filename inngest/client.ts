import { Inngest } from "inngest";

/**
 * Cliente Inngest singleton. ID único de la app en Inngest Cloud
 * (matchea con el slug del dashboard: "diosainterior").
 *
 * Las env vars INNGEST_EVENT_KEY y INNGEST_SIGNING_KEY se leen
 * automáticamente del environment por el SDK.
 *
 * Tipo de eventos: por simplicidad inlineamos el tipo via
 * `eventType` + `staticSchema` en cada función (Inngest 4.x). Si
 * la app crece a >3 eventos, mover a un módulo `inngest/events.ts`.
 */
export const inngest = new Inngest({
  id: "diosainterior",
});
