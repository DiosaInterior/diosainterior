"use client";

// =====================================================================
// Error boundary del root layout (App Router)
// =====================================================================
// Captura errores que ocurren en el root layout o durante el render
// de React. Si Sentry no está inicializado (DSN vacío), capture es no-op.
// =====================================================================

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
