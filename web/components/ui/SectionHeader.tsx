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
        <p className="section-label mb-4">{eyebrow}</p>
      )}
      <h2 className="font-display text-[2rem] sm:text-4xl md:text-[2.6rem] font-bold leading-[1.05] tracking-[-0.025em]">
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
