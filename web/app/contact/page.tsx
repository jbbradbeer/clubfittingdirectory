import type { Metadata } from "next"
import Link from "next/link"
import { Mail, Store, Pencil } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { IconCircle } from "@/components/ui/IconCircle"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

const CONTACT_EMAIL = "bowtiedgolf@gmail.com"

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME}. Questions, corrections, or want your fitting shop listed? We'd love to hear from you.`,
  alternates: { canonical: `${SITE_URL}/contact` },
}

const REASONS = [
  {
    icon: <Store size={20} />,
    title: "List your shop",
    body: "Run a club fitting shop or golf retailer? Submit it to the directory in under a minute.",
    href: "/submit",
  },
  {
    icon: <Pencil size={20} />,
    title: "Update a listing",
    body: "Spotted out-of-date hours, contact details, or services? Let us know and we'll fix it.",
  },
  {
    icon: <Mail size={20} />,
    title: "General questions",
    body: "Anything else — feedback, partnerships, or press — reach out and we'll reply.",
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

      {/* Email card + reasons */}
      <section className="bg-[var(--color-ivory)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Email card */}
            <div className="w-full lg:max-w-sm lg:shrink-0">
              <div className="bg-[var(--color-forest)] text-white rounded-2xl p-8 shadow-card">
                <IconCircle size="md" tone="whiteOnDark" className="mb-5">
                  <Mail size={24} />
                </IconCircle>
                <h2 className="font-display text-xl font-bold mb-2 text-white">
                  Email Us
                </h2>
                <p className="text-sm text-white/70 mb-6 leading-relaxed">
                  The fastest way to reach us. Click below to open your email app.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block w-full text-center py-3 bg-[var(--color-gold)] text-[var(--color-forest-deep)] font-semibold text-sm rounded-full hover:bg-[var(--color-gold-dark)] transition-colors"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>

            {/* Reasons */}
            <div className="flex-1">
              <SectionHeader
                eyebrow="How We Can Help"
                title="What can we help with?"
                centered={false}
              />
              <div className="mt-8 space-y-4">
                {REASONS.map((reason) => (
                  <div
                    key={reason.title}
                    className="flex items-start gap-4 bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
                  >
                    <IconCircle size="sm" className="shrink-0">
                      {reason.icon}
                    </IconCircle>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-charcoal)]">
                        {reason.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-charcoal-light)] leading-relaxed">
                        {reason.body}
                      </p>
                      {reason.href && (
                        <Link
                          href={reason.href}
                          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-gold-ink)] transition-colors"
                        >
                          Submit a shop
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
