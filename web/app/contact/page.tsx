import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { SITE_NAME, SITE_URL, CONTACT_EMAIL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME}. Questions, corrections, or want your fitting shop listed? We'd love to hear from you.`,
  alternates: { canonical: `${SITE_URL}/contact` },
}

const REASONS = [
  {
    title: "List your shop",
    body: "Run a club fitting shop or golf retailer? Submit it to the directory in under a minute.",
    href: "/submit",
    linkLabel: "Submit a shop",
  },
  {
    title: "Update a listing",
    body: "Spotted out-of-date hours, contact details, or services? Email us the shop name and the correction.",
  },
  {
    title: "Everything else",
    body: "Feedback, partnerships, or press — write and we'll reply.",
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        eyebrow="Contact"
        title="Get in Touch"
        subtitle="Whether you run a fitting shop, found something to fix, or just have a question — we read every message and aim to reply within a few days."
      />

      {/* Email card + a quiet reasons list — no icon circles, no card stack */}
      <section className="bg-[var(--color-ivory)] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Email card — the page's one bold element */}
          <div className="lg:col-span-5">
            <div className="bg-[var(--color-forest)] grain relative text-white rounded-2xl p-8 shadow-card">
              <h2 className="font-display text-2xl font-bold text-white!">
                One inbox, read daily.
              </h2>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                No forms, no tickets — email is the fastest way to reach the
                person who maintains the directory.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-6 block w-full text-center py-3 bg-[var(--color-gold)] text-[var(--color-forest-deep)]! font-semibold text-sm rounded-full hover:bg-[var(--color-gold-dark)] transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          {/* Reasons — plain ledger-style rows */}
          <div className="lg:col-span-7">
            <ul className="divide-y divide-[var(--color-border)]">
              {REASONS.map((reason) => (
                <li key={reason.title} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="font-display text-lg font-bold text-[var(--color-charcoal)]">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-[var(--color-charcoal-light)] leading-relaxed">
                    {reason.body}
                  </p>
                  {reason.href && (
                    <Link
                      href={reason.href}
                      className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-gold-ink)] transition-colors"
                    >
                      {reason.linkLabel}
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
