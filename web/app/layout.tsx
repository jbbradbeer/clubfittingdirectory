import type { Metadata } from "next"
import { Playfair_Display, Lora, JetBrains_Mono } from "next/font/google"
import "../styles/globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

/* ─────────────────────────────────────────────────────────
   GOOGLE FONTS
   Loaded via next/font so they are self-hosted (fast + no
   external network requests at runtime).
   ───────────────────────────────────────────────────────── */
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
})

/* ─────────────────────────────────────────────────────────
   SITE-WIDE DEFAULT METADATA
   ───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "Club Fitting Directory — Independent Golf Fitters Across the US",
    template: "%s | Club Fitting Directory",
  },
  description:
    "Find independent golf club fitting shops near you. Browse over 1,000 fitters, simulators, and retailers across all 50 states — curated by The Tuxedo Collective.",
  metadataBase: new URL("https://clubfittingdirectory.com"),
  openGraph: {
    type: "website",
    siteName: "Club Fitting Directory",
    locale: "en_US",
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
   Wraps every page. Applies font CSS variables to <html>
   so they cascade everywhere.
   ───────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${lora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
