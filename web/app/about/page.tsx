import type { Metadata } from "next"
import { Search, MapPin, ShieldCheck } from "lucide-react"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Button } from "@/components/ui/Button"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${SITE_NAME} — the most comprehensive directory of independent golf club fitters and retailers across the United States.`,
  alternates: { canonical: `${SITE_URL}/about` },
}

const PILLARS = [
  {
    icon: <MapPin size={22} />,
    title: "Nationwide Coverage",
    body: "Over 1,000 independent club fitters, retailers, simulators, and pro shops across all 50 states — searchable by city, state, and category.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Curated & Verified",
    body: "Every listing is reviewed for accuracy, with ratings, services, hours, and contact details brought together in one place.",
  },
  {
    icon: <Search size={22} />,
    title: "Built for Golfers",
    body: "Filter by the services that matter to you, find shops near your location, and compare fitters before you book your session.",
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-cream)] bg-grain py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "About" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <p className="section-label mb-2">About</p>
            <h1
              className="text-3xl md:text-5xl font-normal text-[var(--color-charcoal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              About {SITE_NAME}
            </h1>
            <p className="mt-4 text-lg text-[var(--color-charcoal-light)] leading-relaxed">
              {SITE_NAME} is your guide to the finest independent golf club fitters
              and retailers across the United States. We bring every shop — with its
              ratings, services, and contact details — into one place, so you can
              spend less time searching and more time finding your perfect fit.
            </p>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-[var(--color-ivory)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="What We Do"
            title="A directory built for the fitting community"
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-white border border-[var(--color-border)] rounded-lg p-6"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-cream)] text-[var(--color-forest)] mb-4">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[var(--color-charcoal-light)] leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial statement */}
      <section className="bg-[var(--color-cream)] bg-grain py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="section-label mb-4">Our Belief</p>
          <p
            className="text-xl md:text-2xl leading-relaxed text-[var(--color-charcoal)] italic"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The right fit changes the game. We exist to connect golfers with the
            independent experts who make that happen.
          </p>
          <p className="mt-6 text-sm text-[var(--color-charcoal-light)]">
            A{" "}
            <a
              href="https://thetuxedocollective.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-gold"
            >
              Tuxedo Collective
            </a>{" "}
            Publication
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeader
            eyebrow="Get Started"
            title="Find your perfect fit"
            subtitle="Browse the directory, or get in touch if you run a fitting shop and want to be listed."
          />
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/directory" variant="primary">
              Browse the Directory
            </Button>
            <Button href="/contact" variant="outline">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
