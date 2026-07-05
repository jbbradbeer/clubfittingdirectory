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

/**
 * Logs a failed data fetch and RE-THROWS. Use for the query that decides
 * whether an ISR page calls notFound(): swallowing the error there converts a
 * transient DB blip into a 404 that Next caches for the full revalidate
 * window (up to 30 days). Throwing instead makes the regeneration fail, so
 * Next keeps serving the last good version of the page.
 * Reserve notFound() strictly for a SUCCESSFUL query with zero rows.
 */
export function rethrowQueryError(context: string): (error: unknown) => never {
  return (error) => {
    log.error("query", `${context} failed — rethrowing so ISR keeps the stale page`, { error })
    throw error
  }
}
