import type { Metadata } from "next"
import { Mail, Store, Pencil } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
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
    body: "Run a club fitting shop or golf retailer? Get in touch to be added to the directory.",
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
            <div className="lg:w-96 shrink-0">
              <div className="bg-[var(--color-forest)] text-white rounded-2xl p-8 shadow-card">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-5">
                  <Mail size={22} />
                </div>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
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
                    className="flex items-start gap-4 bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-forest-tint)] text-[var(--color-forest)] shrink-0">
                      {reason.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-charcoal)]">
                        {reason.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-charcoal-light)] leading-relaxed">
                        {reason.body}
                      </p>
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
