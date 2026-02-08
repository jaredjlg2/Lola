const buckets = new Map<string, { count: number; ts: number }>();

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const hit = buckets.get(key);
  if (!hit || now - hit.ts > windowMs) {
    buckets.set(key, { count: 1, ts: now });
    return true;
  }
  if (hit.count >= limit) return false;
  hit.count += 1;
  buckets.set(key, hit);
  return true;
}
