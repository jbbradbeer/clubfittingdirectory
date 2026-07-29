"use client"

import { useEffect, useRef, useState } from "react"
import { track } from "@vercel/analytics"
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { RequestFittingButton } from "@/components/booking/RequestFittingButton"

type Msg = { role: "user" | "assistant"; content: string }

type Props = {
  shopId: string
  shopName: string
  shopSlug: string
}

/**
 * The AI fitting assistant — the live demo for the Shop Site + Growth tier.
 * Renders only on allowlisted listings (server decides via assistantEnabledFor).
 * Answers questions from the shop's own facts; booking hands off to the
 * existing Request-a-Fitting flow in the panel footer.
 */
export function FittingAssistant({ shopId, shopName, shopSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, sending])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setError(null)
    const next: Msg[] = [...messages, { role: "user", content: trimmed }]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: shopSlug, messages: next.slice(-12) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.reply) {
        setError(data?.error ?? "Something went wrong — try again.")
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }])
        track("assistant_message", { slug: shopSlug })
      }
    } catch {
      setError("Connection problem — try again.")
    } finally {
      setSending(false)
    }
  }

  const SUGGESTIONS = [
    "What does a fitting cost?",
    "What are your hours?",
    "What do you fit?",
  ]

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); track("assistant_open", { slug: shopSlug }) }}
          className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 px-4 py-3 bg-[var(--color-forest)] text-white text-sm font-semibold rounded-full shadow-2xl hover:bg-[var(--color-forest-deep)] transition-colors cursor-pointer"
        >
          <MessageCircle size={18} />
          Ask about a fitting
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[90] w-full sm:w-96 sm:max-h-[36rem] flex flex-col bg-white sm:rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[var(--color-forest)] text-white">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="shrink-0" />
              <p className="text-sm font-semibold truncate">{shopName} — fitting assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="p-1.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-56 max-h-80">
            <div className="text-sm text-[var(--color-charcoal-light)] bg-[var(--color-ivory)] border border-[var(--color-border)] rounded-xl rounded-tl-sm px-3.5 py-2.5">
              Hi! Ask me anything about {shopName} — services, pricing, hours — and I can help
              you request a fitting.
            </div>
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-8 text-sm text-white bg-[var(--color-forest)] rounded-xl rounded-tr-sm px-3.5 py-2.5">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="mr-4 text-sm text-[var(--color-charcoal)] bg-[var(--color-ivory)] border border-[var(--color-border)] rounded-xl rounded-tl-sm px-3.5 py-2.5 whitespace-pre-wrap">
                  {m.content}
                </div>
              ),
            )}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-charcoal-light)]">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 border border-[var(--color-border)] rounded-full text-[var(--color-charcoal-light)] hover:border-[var(--color-forest)] hover:text-[var(--color-forest)] transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input) }}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-[var(--color-border)]"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask a question…"
              className="flex-1 text-sm px-3 py-2 border border-[var(--color-border)] rounded-full focus:outline-none focus:border-[var(--color-forest)]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="p-2.5 bg-[var(--color-forest)] text-white rounded-full disabled:opacity-40 hover:bg-[var(--color-forest-deep)] transition-colors cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>

          {/* Booking handoff — reuses the existing lead-capture flow */}
          <div className="px-3 pb-3">
            <RequestFittingButton shopId={shopId} shopName={shopName} shopSlug={shopSlug} />
          </div>
        </div>
      )}
    </>
  )
}
