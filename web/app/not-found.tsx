import { Button } from "@/components/ui/Button"

export default function NotFoundPage() {
  return (
    <section className="bg-[var(--color-cream)] bg-grain min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center relative z-10">
        <p className="section-label mb-4">404</p>
        <h1
          className="text-4xl font-normal text-[var(--color-charcoal)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Out of Bounds
        </h1>
        <p className="mt-4 text-[var(--color-charcoal-light)]">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button href="/directory" variant="secondary" size="md">
            Search Directory
          </Button>
          <Button href="/" variant="outline" size="md">
            Return Home
          </Button>
        </div>
      </div>
    </section>
  )
}
