import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, Inbox, Mail, PenLine } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Button } from "@/components/ui/Button"
import { ShopFinder } from "@/components/submit/ShopFinder"
import { PlanComparison } from "@/components/for-shops/PlanComparison"
import { HowItWorksSteps, type HowItWorksStep } from "@/components/for-shops/HowItWorksSteps"
import { FaqSection, type FaqItem } from "@/components/seo/FaqSection"
import { Reveal } from "@/lib/useReveal"
import { CAL_FOUNDING_CALL_URL, SITE_URL } from "@/lib/constants"
import { FREE_PERKS } from "@/lib/plans"

export const metadata: Metadata = {
  title: "For Shop Owners — Free Verified Listing & Featured Placement",
  description:
    "Claim your listing free, get hand-verified, and the Verified badge golfers trust goes on your shop — no charge. Upgrade to Featured for top placement, AI search optimization, and a 6,600-golfer newsletter. $49/month or $499/year.",
  alternates: { canonical: `${SITE_URL}/for-shops` },
  openGraph: {
    title: "For Shop Owners — Free Verified Listing & Featured Placement",
    description:
      "Claim your listing free and earn the Verified badge — no charge. Featured placement is there when you want more. $49/month or $499/year.",
    url: `${SITE_URL}/for-shops`,
  },
}

/* Copy comes from the shared FREE_PERKS source (lib/plans.ts) so the pitch
   matches the claim page, pay page, and emails; icons are page-local. */
const FREE_PERK_ICONS = [BadgeCheck, Inbox, PenLine]
const FREE_INCLUDED = FREE_PERKS.map((perk, i) => ({ icon: FREE_PERK_ICONS[i], ...perk }))

const STEPS: HowItWorksStep[] = [
  {
    title: "Claim your listing",
    summary: "Free, two minutes.",
    body: "Find your shop below and claim it. No card, no commitment — just tell us who you are and how you're connected to the shop.",
  },
  {
    title: "We verify you by hand",
    summary: "Usually done within a day.",
    body: "Every owner is verified personally — a short call or a couple of emails to confirm you actually own or run the shop. That's why the badge means something to golfers: it can't be bought, only earned.",
  },
  {
    title: "Badge + leads go live",
    summary: "Free — and it stays free.",
    body: "The green Verified badge appears on your listing and on every card golfers scan, and every fitting request submitted through your page forwards straight to your inbox. Neither ever costs a dollar.",
  },
  {
    title: "Optional: go Featured",
    summary: "When you want more golfers.",
    body: "Featured puts your shop at the top of your state, city, and category pages, tunes your listing so AI search engines cite you, and adds you to the Gear Shelf newsletter rotation — $49/month or $499/year, secured by Stripe.",
  },
]

const FAQS: FaqItem[] = [
  {
    question: "What does verification involve?",
    answer:
      "You claim your listing, then we confirm you actually own or run the shop — usually on a short call, sometimes over email. No paperwork; we just make sure the badge only ever sits on real, owner-managed shops. Once approved, the Verified badge is yours — free.",
  },
  {
    question: "Is the Verified badge really free?",
    answer:
      "Yes — the badge, lead forwarding, and listing corrections are free and always will be. Verification is about ownership, not payment. Featured is the optional paid layer on top: top placement on your local pages, AI search optimization, the newsletter rotation, and priority updates.",
  },
  {
    question: "My listing has wrong hours or services. Can that be fixed?",
    answer:
      "Yes. Claim the listing and tell us what's wrong — corrections are applied by hand, usually within a day or two. Featured shops go first in the queue, but we fix genuine errors for every shop.",
  },
  {
    question: "How much does Featured cost?",
    answer:
      "It's $49 per month or $499 per year (two months free on the annual plan), handled securely by Stripe. Cancel anytime — the placement stays live through the period you've paid for, and your free Verified badge is never affected.",
  },
  {
    question: "What if my shop isn't listed yet?",
    answer:
      "Submit it through the Submit a Shop page. Every submission is reviewed by hand; once it's live you can claim it and get verified like any other listing.",
  },
  {
    question: "What happens if I don't renew Featured?",
    answer:
      "The top placement and newsletter rotation pause — but your Verified badge, your listing, and lead forwarding all stay live, free. Featured is a growth lever you can turn on and off; verification is yours for good.",
  },
]

/**
 * The shop-owner onboarding page: the free Verified plan, the paid Featured
 * upgrade, and the claim-first funnel entrance. Indexable (unlike the /claim
 * and /onboard transactional pages) — it targets "get listed" searches.
 */
export default function ForShopsPage() {
  return (
    <>
      <Reveal />
      <PageHeader
        eyebrow="For shop owners"
        title={<>Golfers are already finding your shop. <span className="text-[var(--color-forest)]">Make it yours.</span></>}
        subtitle="Claim your listing free, get hand-verified, and the badge golfers trust goes next to your name — no charge. Featured placement is there when you want more."
        align="center"
      >
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href="#find-your-shop" variant="primary" size="lg">
            <BadgeCheck size={18} />
            Begin verification
          </Button>
          <Button href="/contact" variant="outline" size="lg">
            <Mail size={18} />
            Contact for inquiries
          </Button>
        </div>
      </PageHeader>

      {/* ── Free plan + the Featured comparison ── */}
      <section className="bg-[var(--color-ivory)] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Free for every claimed shop"
            subtitle="Verification is about ownership, not payment. Claim your shop and these are yours — forever."
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5" data-reveal-group>
            {FREE_INCLUDED.map((item) => (
              <div
                key={item.title}
                data-reveal
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

          {/* ── Interactive free-vs-Featured comparison with billing toggle ── */}
          <div data-reveal>
            <PlanComparison />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-y border-[var(--color-border)] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How it works"
            subtitle="Verified is free — you only ever pay if you want Featured."
          />
          <div data-reveal>
            <HowItWorksSteps steps={STEPS} />
          </div>
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
              Book a call
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
            Send a message or book a call — both reach the founder directly.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/contact" variant="primary">
              <Mail size={16} />
              Contact for inquiries
            </Button>
            <Button href={CAL_FOUNDING_CALL_URL} external variant="outline">
              Book a call
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
