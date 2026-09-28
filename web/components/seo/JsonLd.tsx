/**
 * Renders a JSON-LD structured-data <script> tag (schemas built in lib/structured-data.ts).
 *
 * `<` is escaped as the JSON sequence \u003c: JSON.stringify does NOT do this, so
 * a scraped shop name containing "</script>" would otherwise close the block
 * and run as markup (the CSP allows inline scripts). The escaped form is valid
 * JSON, so parsers still read the same value.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
