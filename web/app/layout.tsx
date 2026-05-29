import type { Metadata } from "next"
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import "@/styles/globals.css"
import { SITE_URL, SITE_NAME } from "@/lib/constants"

/* ─────────────────────────────────────────────────────────
   FONTS — self-hosted via next/font (no external requests)
   Bricolage Grotesque: bold, characterful display sans
   Hanken Grotesk: crisp, legible grotesque (body)
   ───────────────────────────────────────────────────────── */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    "Find independent golf club fitting shops near you. Browse over 1,000 fitters, simulators, and retailers across all 50 states — curated by The Tuxedo Collective.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

/* ─────────────────────────────────────────────────────────
   ROOT LAYOUT
   ───────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${hanken.variable}`}>
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
