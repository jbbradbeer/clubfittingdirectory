/**
 * Minimal in-memory rate limiter for public form endpoints.
 *
 * Scope: per serverless instance. Vercel may run several instances, so the
 * real-world ceiling is (limit × instances) — fine for stopping casual spam
 * and runaway bots without adding a paid store (Upstash/Redis). If lead spam
 * ever becomes a real problem, swap this for a shared store; the call site
 * won't need to change.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000 // memory guard

/** Returns true if `key` is still within `limit` hits per `windowMs`. */
export function rateLimitOk(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      // Drop expired buckets; if everything is live we fail open (never block
      // real users because of our own memory guard).
      for (const [k, b] of buckets) {
        if (now >= b.resetAt) buckets.delete(k)
      }
      if (buckets.size >= MAX_BUCKETS) return true
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count++
  return bucket.count <= limit
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}
