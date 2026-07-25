import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, CalendarCheck, Mail, Newspaper, PenLine, Sparkles, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Button } from "@/components/ui/Button"
import { ShopFinder } from "@/components/submit/ShopFinder"
import { FaqSection, type FaqItem } from "@/components/seo/FaqSection"
import { CAL_FOUNDING_CALL_URL, SITE_URL } from "@/lib/constants"
import { VERIFIED_PERKS } from "@/lib/plans"

export const metadata: Metadata = {
  title: "For Shop Owners — Get Verified on Club Fitting Directory",
  description:
    "Claim your free listing, then get Verified: the badge golfers trust, fitting requests forwarded to your inbox, and a newsletter audience of 6,600 golfers. $49/month or $499/year.",
  alternates: { canonical: `${SITE_URL}/for-shops` },
  openGraph: {
    title: "For Shop Owners — Get Verified on Club Fitting Directory",
    description:
      "Claim your free listing, get verified, and put the badge golfers trust on your shop. $49/month or $499/year.",
    url: `${SITE_URL}/for-shops`,
  },
}

/* Copy comes from the shared VERIFIED_PERKS source (lib/plans.ts) so the
   pitch matches the claim page, pay page, and emails; icons are page-local. */
const PERK_ICONS = [BadgeCheck, TrendingUp, Sparkles, Newspaper, PenLine]
const INCLUDED = VERIFIED_PERKS.map((perk, i) => ({ icon: PERK_ICONS[i], ...perk }))

const STEPS = [
  {
    title: "Claim your listing",
    body: "Find your shop below and claim it — free, two minutes. Claiming alone turns on lead forwarding once approved.",
  },
  {
    title: "Quick intro call",
    body: "Fifteen minutes with the founder. We confirm you're the real owner and fix anything wrong on your listing while we talk.",
  },
  {
    title: "We verify you",
    body: "Every owner is verified by hand — that's why the badge means something to golfers. Usually done within a day.",
  },
  {
    title: "Pay & the badge goes live",
    body: "You get a secure Stripe payment link. Pick monthly or annual and the Verified badge is live within minutes.",
  },
]

const FAQS: FaqItem[] = [
  {
    question: "What does verification involve?",
    answer:
      "You claim your listing, then we confirm you actually own or run the shop — usually on a short intro call, sometimes over email. No paperwork; we just make sure the badge only ever sits on real, owner-managed shops.",
  },
  {
    question: "Is claiming my listing really free?",
    answer:
      "Yes — claiming is free and always will be. A claimed shop gets fitting requests forwarded to its inbox at no cost. Verified is the optional paid layer on top: the badge, featured placement at the top of your local pages, AI search optimization, the newsletter rotation, and priority updates.",
  },
  {
    question: "My listing has wrong hours or services. Can that be fixed?",
    answer:
      "Yes. Claim the listing and tell us what's wrong — corrections are applied by hand, usually within a day or two. Verified shops get priority, but we fix genuine errors for every shop.",
  },
  {
    question: "How much does Verified cost?",
    answer:
      "It's $49 per month or $499 per year (two months free on the annual plan), handled securely by Stripe. Cancel anytime — the badge stays live through the period you've paid for.",
  },
  {
    question: "What if my shop isn't listed yet?",
    answer:
      "Submit it through the Submit a Shop page. Every submission is reviewed by hand; once it's live you can claim it and get verified like any other listing.",
  },
  {
    question: "What happens if I don't renew?",
    answer:
      "The badge and newsletter rotation pause, but your free listing and lead forwarding stay live. You can come back any time.",
  },
]

/**
 * The shop-owner onboarding page: what Verified is, what it costs,
 * and the claim-first funnel entrance. Indexable (unlike the /claim and
 * /onboard transactional pages) — it targets "get listed" searches.
 */
export default function ForShopsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For shop owners"
        title={<>Golfers are already finding your shop. <span className="text-[var(--color-forest)]">Make it yours.</span></>}
        subtitle="Your listing is live in front of golfers searching for a fitter. Claim it free, get verified, and put the badge they trust next to your name."
        align="center"
      >
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href="#find-your-shop" variant="primary" size="lg">
            Find your shop
          </Button>
          <Button href={CAL_FOUNDING_CALL_URL} external variant="outline" size="lg">
            <CalendarCheck size={18} />
            Book an intro call
          </Button>
        </div>
      </PageHeader>

      {/* ── What Verified includes ── */}
      <section className="bg-[var(--color-ivory)] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="What Verified includes"
            subtitle="One membership, five things working for your shop all year."
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {INCLUDED.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6"
              >
                <item.icon size={26} className="text-[var(--color-forest)]" />
                <h3 className="mt-4 font-display text-xl text-[var(--color-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-charcoal-light)] leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* ── Pricing ── */}
          <div className="mt-12 relative overflow-hidden bg-[var(--color-forest)] text-white rounded-2xl shadow-card">
            <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-gold)]" />
            <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)] font-semibold">
                  Simple pricing
                </p>
                <p className="mt-2 font-display text-4xl">
                  $49<span className="text-lg text-white/70">/month</span>
                  <span className="mx-3 text-lg text-white/50">or</span>
                  $499<span className="text-lg text-white/70">/year</span>
                </p>
                <p className="mt-2 text-sm text-white/70 max-w-md leading-relaxed">
                  Secured by Stripe. Two months free on the annual plan — cancel
                  anytime and the badge stays through your paid period.
                </p>
              </div>
              <div className="shrink-0">
                <Button href="#find-your-shop" variant="secondary" size="lg">
                  Start with your free claim
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-y border-[var(--color-border)] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How it works"
            subtitle="Claim first, pay after — you're verified before a dollar changes hands."
          />
          <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative bg-[var(--color-ivory)] border border-[var(--color-border)] rounded-2xl p-6">
                <span className="font-display text-3xl text-[var(--color-gold-ink)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg text-[var(--color-charcoal)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-charcoal-light)] leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Shop finder — the funnel entrance ── */}
      <section id="find-your-shop" className="bg-[var(--color-ivory)] py-16 md:py-20 scroll-mt-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="Find your shop"
            subtitle="Search by shop name or city — picking your shop takes you straight to its free claim page."
          />
          <div className="mt-8">
            <ShopFinder />
          </div>
          <p className="mt-5 text-sm text-[var(--color-charcoal-light)] text-center">
            Not listed yet?{" "}
            <Link href="/submit" className="font-semibold text-[var(--color-forest)] hover:underline">
              Submit your shop
            </Link>{" "}
            — free, reviewed by hand.{" "}
            Prefer to talk first?{" "}
            <a href={CAL_FOUNDING_CALL_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--color-forest)] hover:underline">
              Book the intro call
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── FAQ (visible + FAQPage JSON-LD) ── */}
      <FaqSection items={FAQS} heading="Shop owner questions" />

      {/* ── Closing CTA ── */}
      <section className="bg-white border-t border-[var(--color-border)] py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
            Questions before you claim?
          </h2>
          <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
            Reply to any email from the directory or book the intro call — both
            reach the founder directly.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href={CAL_FOUNDING_CALL_URL} external variant="primary">
              <CalendarCheck size={16} />
              Book the intro call
            </Button>
            <Button href="/contact" variant="outline">
              <Mail size={16} />
              Contact us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
