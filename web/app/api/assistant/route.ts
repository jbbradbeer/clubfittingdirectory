import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getShopBySlug } from "@/lib/supabase/queries/shops"
import { assistantEnabledFor, systemPrompt } from "@/lib/assistant"
import { log } from "@/lib/logger"

export const runtime = "nodejs"

// Cheap in-memory rate limit — per-IP, resets when the function instance
// recycles. Enough to stop a curl loop from running up the API bill on a
// demo widget; not a substitute for real abuse protection at scale.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10
const hits = new Map<string, { count: number; windowStart: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

type ChatMessage = { role: "user" | "assistant"; content: string }

const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 1000

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many messages — give it a minute." }, { status: 429 })
  }

  let body: { slug?: string; messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const { slug, messages } = body
  if (
    !slug ||
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (m) =>
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" ||
        m.content.length === 0 ||
        m.content.length > MAX_MESSAGE_CHARS,
    )
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  if (!assistantEnabledFor(slug)) {
    return NextResponse.json({ error: "Assistant not available for this shop." }, { status: 404 })
  }

  const shop = await getShopBySlug(slug).catch(() => null)
  if (!shop) {
    return NextResponse.json({ error: "Shop not found." }, { status: 404 })
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: systemPrompt(shop),
      messages,
    })
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
    if (!text) {
      return NextResponse.json({ error: "No answer — try rephrasing." }, { status: 502 })
    }
    return NextResponse.json({ reply: text })
  } catch (e) {
    log.error("api/assistant", "Claude API call failed", { slug, error: e })
    return NextResponse.json({ error: "The assistant is unavailable right now." }, { status: 502 })
  }
}
