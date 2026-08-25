interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const GLOBAL_KEY = "__TMS_RATE_LIMIT_STORE__";
const store: Map<string, RateLimitEntry> =
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] as Map<string, RateLimitEntry> ||
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] = new Map<string, RateLimitEntry>());

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

if (!(globalThis as Record<string, unknown>)["__TMS_RATE_LIMIT_CLEANUP__"]) {
  (globalThis as Record<string, unknown>)["__TMS_RATE_LIMIT_CLEANUP__"] = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) store.delete(key);
    }
  }, 60_000);
}

export function checkRateLimit(key: string): { allowed: boolean; remainingMs: number } {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.resetTime) {
    return { allowed: true, remainingMs: 0 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingMs: entry.resetTime - Date.now() };
  }
  return { allowed: true, remainingMs: entry.resetTime - Date.now() };
}

export function recordFailure(key: string): void {
  const existing = store.get(key);
  const now = Date.now();
  if (existing && now < existing.resetTime) {
    existing.count++;
  } else {
    store.set(key, { count: 1, resetTime: now + WINDOW_MS });
  }
}

export function resetAttempts(key: string): void {
  store.delete(key);
}

export { MAX_ATTEMPTS, WINDOW_MS };
