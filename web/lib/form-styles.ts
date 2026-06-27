/**
 * Shared form element styles — single source of truth so inputs, labels,
 * and checkboxes look identical across SubmitShopForm, FilterSidebar, etc.
 *
 * Light variants are for forms on light backgrounds; dark variants are for
 * the gold-on-forest treatment used by the newsletter forms.
 */

export const fieldClass =
  "w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-lg text-[0.95rem] text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] hover:border-[var(--color-charcoal-light)]/45 focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"

/* Selects reuse the field look but hide the native arrow so a custom chevron
   can be layered on top (see the `relative` wrapper + ChevronDown pattern). */
export const selectClass = `${fieldClass} appearance-none pr-10 cursor-pointer`

export const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-charcoal-light)] mb-2"

export const checkboxClass =
  "w-[1.05rem] h-[1.05rem] rounded border-[var(--color-border)] accent-[var(--color-forest)] cursor-pointer"

/* ── Dark (on-forest) variants — sizing is appended by the consumer ── */

export const darkInputBase =
  "flex-1 min-w-0 rounded-full bg-white border border-transparent text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/60 transition-all"

export const darkButtonBase =
  "inline-flex items-center justify-center gap-2 shrink-0 rounded-full bg-[var(--color-gold)] text-[var(--color-forest-deep)] font-semibold hover:bg-[var(--color-gold-dark)] transition-colors cursor-pointer disabled:opacity-60"
