/**
 * Structured application logger.
 *
 * WHY THIS EXISTS:
 * Vercel automatically captures everything written to stdout/stderr as runtime
 * logs. In PRODUCTION we emit one JSON object per line so those logs are
 * searchable and filterable in the Vercel dashboard (by level, context, etc.)
 * and ready to forward to a log drain later. In DEVELOPMENT we print a readable
 * "[context] message" line instead — matching the console style already used
 * across the codebase — so local output stays easy to scan.
 *
 * USAGE:
 *   import { log } from "@/lib/logger"
 *   log.info("api/search", "query served", { q, count })
 *   log.error("api/newsletter", "beehiiv request failed", { error, status })
 *
 * Pass an Error in `meta.error` and it is unpacked to { name, message, stack }
 * (raw Errors serialize to "{}" in JSON, losing the message).
 */

type LogMeta = Record<string, unknown>
type Level = "info" | "warn" | "error"

const isProd = process.env.NODE_ENV === "production"

/** Make values JSON-safe — chiefly Errors, which otherwise stringify to "{}". */
function normalize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack }
  }
  return value
}

function emit(level: Level, context: string, message: string, meta?: LogMeta) {
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log

  if (isProd) {
    const normalized = meta
      ? Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, normalize(v)]))
      : {}
    write(JSON.stringify({ level, context, message, ...normalized, ts: new Date().toISOString() }))
  } else {
    write(`[${context}] ${message}`, meta ?? "")
  }
}

export const log = {
  info: (context: string, message: string, meta?: LogMeta) => emit("info", context, message, meta),
  warn: (context: string, message: string, meta?: LogMeta) => emit("warn", context, message, meta),
  error: (context: string, message: string, meta?: LogMeta) => emit("error", context, message, meta),
}
