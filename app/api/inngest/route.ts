import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { analyzePurchase } from "@/inngest/functions/analyze-purchase";

/**
 * Endpoint Inngest. Sirve GET (introspection), POST (receive events),
 * PUT (sync functions con Inngest Cloud).
 *
 * Inngest convention: este endpoint debe vivir en /api/inngest. Inngest
 * Cloud detecta automáticamente las functions registradas acá.
 *
 * Las env vars INNGEST_EVENT_KEY y INNGEST_SIGNING_KEY se leen
 * automáticamente del environment por el SDK.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzePurchase],
});
