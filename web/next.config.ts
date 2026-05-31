import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Output as a standard Node.js server deployment (Vercel default)

  // Pin the project root so Next.js doesn't mistakenly pick up an
  // unrelated lockfile elsewhere on the machine when inferring it.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
