export const SITE_URL = "https://clubfittingdirectory.com"
export const SITE_NAME = "Club Fitting Directory"
export const SITE_DESCRIPTION =
  "Find independent golf club fitting shops near you. Browse 700+ hand-vetted fitters, simulators, and retailers across all 50 states — curated by The Tuxedo Collective."

/* Named author for guides — a visible human byline plus Person schema is an
   E-E-A-T trust signal Google and AI engines weigh more than an anonymous
   Organization author. Same public name used in outreach emails. */
export const SITE_AUTHOR = "James Bradbeer"
export const SITE_AUTHOR_TITLE = "Founder, Club Fitting Directory"

/* Cal.com booking link shown to shop owners after they claim their listing
   (thank-you screen + confirmation email). */
export const CAL_FOUNDING_CALL_URL =
  "https://cal.com/bowtiedgolf-xbmgrx/founding-partner-intro-call"

/* US states (code + name) — used by the Submit a Shop form's dropdown. */
export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

/* Fast membership checks (e.g. validating a posted state_code). */
export const US_STATE_CODES = new Set(US_STATES.map((s) => s.code))

/* Public contact address shown on the contact page. */
export const CONTACT_EMAIL = "bowtiedgolf@gmail.com"
