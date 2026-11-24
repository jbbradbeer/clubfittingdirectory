import type { NextConfig } from "next"
import { LISTING_REDIRECTS } from "./lib/listing-redirects"

const nextConfig: NextConfig = {
  // Output as a standard Node.js server deployment (Vercel default)

  // Pin the project root so Next.js doesn't mistakenly pick up an
  // unrelated lockfile elsewhere on the machine when inferring it.
  turbopack: {
    root: __dirname,
  },

  async redirects() {
    return Object.entries(LISTING_REDIRECTS).map(([from, to]) => ({
      source: `/listing/${from}`,
      destination: `/listing/${to}`,
      permanent: true,
    }))
  },
}

export default nextConfig
