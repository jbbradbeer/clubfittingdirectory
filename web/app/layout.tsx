import type { Metadata } from "next"
import { Hanken_Grotesk } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import "@/styles/globals.css"
import { SITE_URL, SITE_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────
   FONTS — self-hosted via next/font (no external requests)
   Sentient (Fontshare, FFL license — see app/fonts/FFL.txt):
     warm editorial serif, the signature display face.
   Hanken Grotesk: crisp, legible grotesque (body).
   Data/mono numerals use the system mono stack (globals.css)
   — no font download needed for the yardage-book accent.
   ───────────────────────────────────────────────────────── */
const sentient = localFont({
  src: [
    { path: "./fonts/Sentient-Variable.woff2", weight: "200 700", style: "normal" },
    { path: "./fonts/Sentient-VariableItalic.woff2", weight: "200 700", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
})

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

/* ─────────────────────────────────────────────────────────
   GLOBAL METADATA
   ───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} — Independent Golf Fitters Across the US`,
  },
  description:
    "Find independent golf club fitting shops near you. Browse 1,000+ hand-vetted fitters, simulators, and retailers across all 50 US states.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    // OG images are provided by app/opengraph-image.tsx (site default) and the
    // per-route opengraph-image.tsx files — Next injects them automatically.
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "Btj1d-_16uWhCC3SHEQWweEJilLxjssAnA6id57iQCI",
  },
}

/* ─────────────────────────────────────────────────────────
   ROOT LAYOUT
   ───────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(sentient.variable, hanken.variable, "font-sans")}
    >
      <body className="flex flex-col min-h-screen">
        {/* Marks the document as JS-capable BEFORE paint, so scroll-reveal only
            hides content when JS can reveal it again (no-JS users see everything). */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Vercel-native observability — zero config, no external account.
            Analytics = page views / traffic; SpeedInsights = real-user web vitals
            (load speed). Both only send data from production deploys. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
