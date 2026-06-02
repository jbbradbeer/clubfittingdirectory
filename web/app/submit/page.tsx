import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/PageHeader"
import { SubmitShopForm } from "@/components/submit/SubmitShopForm"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Submit a Shop",
  description: `Know a great club fitter, golf retailer, or simulator we're missing? Submit it to ${SITE_NAME} and we'll review it for the directory.`,
  alternates: { canonical: `${SITE_URL}/submit` },
}

export default function SubmitPage() {
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Submit a Shop" }]}
        eyebrow="Grow the Directory"
        title="Submit a Shop"
        subtitle="Know a great club fitter, golf retailer, or simulator we're missing? Add it below — we review every submission before it goes live."
      />

      <section className="bg-[var(--color-ivory)] py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <SubmitShopForm />
        </div>
      </section>
    </>
  )
}
