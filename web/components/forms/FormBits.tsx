/* Small pieces shared by every public form (see also lib/form-styles.ts for
   the shared input/label classes and lib/hooks/useFormSubmit.ts for the
   shared submit lifecycle). */

/** Honeypot: a visually hidden field real users never fill — bots that fill
    everything trip it, and the API routes pretend-success so they don't learn. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
      <label>
        Company website
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

/** Gold required-field marker. */
export const Req = () => <span className="text-[var(--color-gold-ink)]"> *</span>
