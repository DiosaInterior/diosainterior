import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

/**
 * Lazy singleton del cliente Anthropic. Lee ANTHROPIC_API_KEY en
 * call-time (no en module load) para que los tests puedan mockear
 * sin necesidad de la env var presente.
 *
 * timeout: 120s — análisis con 4 imágenes puede tardar 30-90s.
 * maxRetries: 2 — el SDK retiene su default (exponential backoff).
 */
export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY env var is not set");
    }
    _client = new Anthropic({
      apiKey,
      maxRetries: 2,
      timeout: 120_000,
    });
  }
  return _client;
}

/**
 * Reset del singleton. Solo para testing. NO usar en producción.
 */
export function _resetAnthropicClientForTesting(): void {
  _client = null;
}
