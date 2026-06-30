# CI Setup — Owner Actions (Chunk D)

The CI workflow now runs a full production **build** on every pull request, on top
of the existing typecheck + lint + test. The build needs your two PUBLIC Supabase
values (the same ones already in `web/.env.local` and already shipped in the
browser — not real secrets). Add them once as GitHub repo secrets.

> ⚠️ Do this BEFORE the next push to GitHub, otherwise the new "Build" check will
> show red until the secrets exist. (Typecheck/lint/test still pass regardless.)

---

## 1. Add the two build secrets to GitHub (≈3 min)

1. Open your GitHub repo in the browser.
2. **Settings** (top repo menu) → left sidebar **Secrets and variables** → **Actions**.
3. Click **New repository secret**. Add the first:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** copy it from `web/.env.local` (the line starting `NEXT_PUBLIC_SUPABASE_URL=`)
   - **Add secret**.
4. **New repository secret** again, add the second:
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** copy from `web/.env.local` (the `NEXT_PUBLIC_SUPABASE_ANON_KEY=` line)
   - **Add secret**.

That's it — next time a PR opens, the Build check runs and should go green.

---

## 2. Confirm Vercel preview deploys are on (≈1 min — usually already on)

Vercel builds a private preview URL for every branch/PR so you can see changes
before they hit the live site. This is on by default; just confirm:

1. **vercel.com** → your project → **Settings** → **Git**.
2. Ensure **Preview Deployments** are enabled (the default). Every branch you push
   then gets its own preview link, posted automatically on the PR.

---

## What CI now checks on every PR
- ✅ Type-check (`tsc --noEmit`)
- ✅ Lint (eslint)
- ✅ Unit tests (vitest)
- ✅ **Full production build** (new — catches build-only failures like the
  June 1,000-row cap that silently dropped shops)

## Done when
- [ ] Both `NEXT_PUBLIC_*` secrets added in GitHub
- [ ] Vercel preview deployments confirmed enabled
