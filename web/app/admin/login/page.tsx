import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { login } from "../actions"
import { isAdmin } from "@/lib/admin-auth"

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await isAdmin()) redirect("/admin")
  const { error } = await searchParams

  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-[var(--color-ivory)] px-4 py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-[var(--color-charcoal)] mb-6 text-center">
          Admin Login
        </h1>
        <form
          action={login}
          className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-forest)] text-white font-semibold rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
          >
            Log in
          </button>
        </form>
      </div>
    </section>
  )
}
