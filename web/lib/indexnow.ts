import { SITE_URL } from "@/lib/constants"
import { log } from "@/lib/logger"

/* ─────────────────────────────────────────────────────────
   INDEXNOW — tells Bing (which powers ChatGPT browsing and
   other AI search) about changed URLs within hours instead of
   waiting weeks for a recrawl. The key is public by design:
   the protocol verifies ownership by fetching /<key>.txt from
   this site, so committing it is safe and expected.
   ───────────────────────────────────────────────────────── */

export const INDEXNOW_KEY = "3cf84492f1f81eb314d251f5d0d1403b"

/**
 * Fire-and-forget ping. Never throws — indexing hints must not break the
 * caller (e.g. the revalidation webhook).
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: paths.map((p) => `${SITE_URL}${p}`),
      }),
    })
    log.info("lib/indexnow", "pinged", { paths: paths.length, status: res.status })
  } catch (e) {
    log.warn("lib/indexnow", "ping failed", {
      error: e instanceof Error ? e.message : String(e),
    })
  }
}
