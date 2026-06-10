import type { Metadata } from "next"
import { Wrench, Trophy, Newspaper } from "lucide-react"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { IconCircle } from "@/components/ui/IconCircle"
import { SITE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Newsletter — The Tuxedo Collective",
  description:
    "Join The Tuxedo Collective: a free weekly newsletter on the fittings, gear, and stories behind private club golf — from the team behind the Club Fitting Directory.",
  alternates: { canonical: `${SITE_URL}/newsletter` },
  openGraph: {
    title: "The Tuxedo Collective — Private Club Golf, Explained",
    description:
      "A free weekly newsletter on the fittings, gear, and stories behind private club golf.",
    url: `${SITE_URL}/newsletter`,
    type: "website",
  },
}

const REASONS = [
  {
    icon: <Wrench size={24} />,
    title: "Fittings & gear, decoded",
    body: "What the best players are gaming and why — translated for the rest of us.",
  },
  {
    icon: <Trophy size={24} />,
    title: "Inside private club golf",
    body: "The culture, courses, and characters behind the game's most exclusive clubs.",
  },
  {
    icon: <Newspaper size={24} />,
    title: "One email a week",
    body: "Considered, never spammy. Read by golfers who care about getting it right.",
  },
]

export default function NewsletterPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO + SIGNUP
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-forest-deep)] grain text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <p className="section-label mb-5 inline-flex items-center gap-3" style={{ color: "var(--color-gold)" }}>
            <span className="gold-rule" />
            The Tuxedo Collective
            <span className="gold-rule rotate-180" />
          </p>
          <h1 className="display text-[clamp(2.4rem,6vw,4rem)] text-white leading-[1.05]">
            Private club golf,
            <br />
            <span className="text-[var(--color-gold)]">explained.</span>
          </h1>
          <p className="mt-7 max-w-xl mx-auto text-lg text-white/70 leading-relaxed">
            A free weekly newsletter on the fittings, gear, and stories behind the game&apos;s
            most exclusive clubs — from the team that curates this directory.
          </p>
          <div className="mt-10 max-w-lg mx-auto text-left">
            <NewsletterForm variant="page" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WHY SUBSCRIBE
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {REASONS.map((r) => (
              <div key={r.title} className="text-center">
                <IconCircle size="lg" className="mb-5">
                  {r.icon}
                </IconCircle>
                <h3 className="text-xl font-bold text-[var(--color-charcoal)]">{r.title}</h3>
                <p className="mt-2 text-[var(--color-charcoal-light)] leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
