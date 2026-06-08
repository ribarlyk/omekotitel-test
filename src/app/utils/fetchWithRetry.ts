/**
 * fetch() wrapper that tolerates brief backend blips.
 *
 * The Magento GraphQL backend occasionally gets slow/overloaded for a few seconds.
 * Without this, a single slow window cascades into mass 500s (cart, product
 * variations, ISR cache misses all hit the same endpoint and fail together).
 *
 * Behaviour:
 *   - Per-attempt timeout via AbortController (a hung request is aborted, not left to stall).
 *   - Retries ONLY on transient failures: timeout/abort, network error, HTTP 5xx, HTTP 429.
 *   - Never retries on 2xx/4xx (those are deterministic — retrying wouldn't help).
 *   - Exponential backoff with jitter between attempts to avoid a retry storm.
 *
 * Default is a single retry (2 attempts total) — enough to ride out a brief blip
 * without doubling sustained load on an already-struggling backend.
 */

export interface RetryOptions {
  /** Per-attempt timeout in ms. */
  timeoutMs?: number;
  /** Number of *additional* attempts after the first. */
  retries?: number;
}

function isTransientStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

async function backoff(attempt: number): Promise<void> {
  const base = 300 * 2 ** attempt; // 300ms, 600ms, 1200ms…
  const jitter = Math.random() * 200;
  await new Promise((resolve) => setTimeout(resolve, base + jitter));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  { timeoutMs = 10000, retries = 1 }: RetryOptions = {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      // Transient server error — retry if attempts remain.
      if (isTransientStatus(res.status) && attempt < retries) {
        await backoff(attempt);
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // Timeout/abort or network error — retry if attempts remain.
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
      throw err;
    }
  }

  // Unreachable in practice — the loop either returns or throws.
  throw lastError;
}
