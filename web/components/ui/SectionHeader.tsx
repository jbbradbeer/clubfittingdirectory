interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${centered ? "text-center" : ""} ${className}`}>
      {eyebrow && (
        <p className={`section-label mb-4 ${centered ? "" : "with-rule"}`}>{eyebrow}</p>
      )}
      <h2
        className="text-[2rem] sm:text-4xl md:text-[2.6rem] font-bold leading-[1.05] tracking-[-0.025em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-[var(--color-charcoal-light)] text-lg leading-relaxed ${
            centered ? "max-w-2xl mx-auto" : "max-w-2xl"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
