import Link from "next/link"
import { TrackedButton } from "@/components/ui/TrackedButton"
import type { GuideBlock, Inline, RichText } from "@/lib/guides/types"

/* ─────────────────────────────────────────────────────────
   GUIDE BODY — renders a guide's typed `blocks` array into the
   site's design language. No prose/typography plugin is used;
   every element is styled explicitly with the project's CSS
   variables so articles match the rest of the site exactly.
   ───────────────────────────────────────────────────────── */

/** kebab-case anchor id from a heading (lets us link to sections / build a ToC). */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

/** Render one inline span — plain text, an internal link, or an external link. */
function InlineSpan({ node }: { node: Inline }) {
  if (typeof node === "string") return <>{node}</>

  const className =
    "text-[var(--color-forest)] font-medium underline decoration-[var(--color-gold)] decoration-2 underline-offset-2 hover:text-[var(--color-forest-dark)] transition-colors"

  if (node.external) {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" className={className}>
        {node.text}
      </a>
    )
  }
  return (
    <Link href={node.href} className={className}>
      {node.text}
    </Link>
  )
}

/** Render RichText (a single span or an array of spans). */
function Rich({ text }: { text: RichText }) {
  const nodes = Array.isArray(text) ? text : [text]
  return (
    <>
      {nodes.map((node, i) => (
        <InlineSpan key={i} node={node} />
      ))}
    </>
  )
}

function Block({ block, guideSlug }: { block: GuideBlock; guideSlug?: string }) {
  switch (block.type) {
    case "heading": {
      const id = headingId(block.text)
      if (block.level === 3) {
        return (
          <h3
            id={id}
            className="scroll-mt-28 mt-10 mb-3 text-xl font-bold text-[var(--color-charcoal)]"
          >
            {block.text}
          </h3>
        )
      }
      return (
        <h2
          id={id}
          className="font-display scroll-mt-28 mt-14 mb-4 text-[1.75rem] font-bold text-[var(--color-charcoal)] tracking-[-0.02em]"
        >
          {block.text}
        </h2>
      )
    }

    case "paragraph":
      return (
        <p className="my-5 text-lg leading-relaxed text-[var(--color-charcoal-light)]">
          <Rich text={block.text} />
        </p>
      )

    case "list": {
      const Tag = block.ordered ? "ol" : "ul"
      return (
        <Tag
          className={`my-5 space-y-2.5 pl-5 text-lg leading-relaxed text-[var(--color-charcoal-light)] ${
            block.ordered ? "list-decimal" : "list-disc"
          } marker:text-[var(--color-gold)]`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <Rich text={item} />
            </li>
          ))}
        </Tag>
      )
    }

    case "table":
      return (
        <figure className="my-8 overflow-x-auto rounded-2xl border border-[var(--color-border)] shadow-card">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--color-forest)] text-white">
                {block.headers.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri % 2 === 0 ? "bg-[var(--color-paper)]" : "bg-[var(--color-cream)]"}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-[var(--color-charcoal)] border-t border-[var(--color-line)]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <figcaption className="px-4 py-3 text-xs text-[var(--color-charcoal-light)] bg-[var(--color-ivory)] border-t border-[var(--color-line)]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

    case "callout":
      return (
        <aside className="my-8 rounded-2xl border-l-4 border-[var(--color-gold)] bg-[var(--color-gold-tint)] px-6 py-5">
          {block.title && (
            <p className="mb-1.5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-gold-ink)]">
              {block.title}
            </p>
          )}
          <p className="text-lg leading-relaxed text-[var(--color-charcoal)]">
            <Rich text={block.text} />
          </p>
        </aside>
      )

    case "cta":
      return (
        <div className="my-10 rounded-2xl bg-[var(--color-forest)] grain px-7 py-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-display text-xl font-bold text-white">
              {block.heading}
            </p>
            {block.text && <p className="mt-1.5 text-white/70 leading-relaxed">{block.text}</p>}
          </div>
          <div className="mt-5 sm:mt-0 shrink-0">
            <TrackedButton
              href={block.href}
              variant="secondary"
              size="md"
              event="guide_cta"
              eventProps={{ guide: guideSlug ?? "unknown", href: block.href }}
            >
              {block.buttonLabel}
            </TrackedButton>
          </div>
        </div>
      )
  }
}

export function GuideBody({
  blocks,
  keyTakeaways,
  guideSlug,
}: {
  blocks: GuideBlock[]
  keyTakeaways?: string[]
  guideSlug?: string
}) {
  return (
    <div>
      {keyTakeaways && keyTakeaways.length > 0 && (
        <aside
          id="key-takeaways"
          className="mb-10 rounded-2xl border-l-4 border-[var(--color-gold)] bg-[var(--color-gold-tint)] px-6 py-5"
        >
          <p className="font-display mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-gold-ink)]">
            Key takeaways
          </p>
          <ul className="space-y-2 pl-5 list-disc marker:text-[var(--color-gold)] text-lg leading-relaxed text-[var(--color-charcoal)]">
            {keyTakeaways.map((t, i) => (
              <li key={i} className="pl-1">
                {t}
              </li>
            ))}
          </ul>
        </aside>
      )}
      {blocks.map((block, i) => (
        <Block key={i} block={block} guideSlug={guideSlug} />
      ))}
    </div>
  )
}
