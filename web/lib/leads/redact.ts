/**
 * Strips contact details from a golfer's free-text notes before they go to a
 * shop whose owner we haven't verified. Errs toward removing too much. No
 * filter catches everything, which is why the founder sees a preview first.
 */
const GONE = "[removed]"

const EMAIL = /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\sat\s)\s*[a-z0-9-]+(?:\s*(?:\.|\(dot\)|\[dot\]|\sdot\s)\s*[a-z0-9-]+)+/gi
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|co|me|us|golf|link|gg)\b\S*/gi
const HANDLE = /(^|\s)@[a-z0-9_.]{2,}/gi
// 7+ digits, however they're spaced or punctuated.
const PHONE = /\+?(?:\d[\s().\-–/]*){6,}\d/g

export function redactContact(text: string | null | undefined): string {
  return (text ?? "")
    .replace(EMAIL, GONE)
    .replace(URL_RE, GONE)
    .replace(HANDLE, `$1${GONE}`)
    .replace(PHONE, GONE)
    .replace(/\s+/g, " ")
    .trim()
}
