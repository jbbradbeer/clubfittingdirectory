import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { log } from "@/lib/logger"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Logs a failed data fetch (so it appears in Vercel's logs) and returns a safe
 * fallback so the page can still render. Use in place of a bare
 * `.catch(() => fallback)`, which hides failures completely — the pattern that
 * let a broken database connection masquerade as "no data".
 */
export function logQueryError<T>(context: string, error: unknown, fallback: T): T {
  log.error("query", `${context} failed`, { error })
  return fallback
}
