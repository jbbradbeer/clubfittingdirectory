# Club Fitting Directory

The most complete directory of independent golf club fitting shops across the United States — built for The Tuxedo Collective. Golfers use it to find local studios offering custom fitting, equipment retail, simulator sessions, and instruction. Over 1,000 vetted listings across all 50 states.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org) | Website framework (App Router, static generation) |
| [Supabase](https://supabase.com) | Postgres database (all shop data lives here) |
| [Vercel](https://vercel.com) | Hosting and deployment |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [TypeScript](https://www.typescriptlang.org) | Programming language |
| Python | Data pipeline scripts (enrichment, import) |

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- A Supabase project (free tier works fine)

### 2. Clone and install

```bash
git clone <your-repo-url>
cd web
npm install
```

### 3. Set environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Where to find these:** Go to your Supabase project → Settings → API.
> Copy the **Project URL** and the **anon (public)** key.

### 4. Set up the database

In Supabase, open the SQL Editor and run the schema file:

```
supabase/001_schema.sql
```

This creates the `shops` table with all the right columns.

### 5. Import shop data

From the **project root** (one folder up from `web/`), run the import script:

```bash
cd ..
python migrate_to_supabase.py
```

This reads `golf_directory_MASTER.csv` and uploads all shop listings to your Supabase database.

### 6. Start the dev server

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment (Vercel)

### First deploy

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → Import Project → select the repo.
3. Set the **Root Directory** to `web`.
4. Add environment variables in Vercel's project settings (same values as your `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**.

### Subsequent deploys

Push to the `main` branch — Vercel automatically rebuilds and redeploys.

### Environment variable reminder

> ⚠️ Never commit `.env.local` to git. It contains your Supabase keys.
> Vercel reads env vars from its own dashboard, not from `.env.local`.

---

## After Updating Shop Data

If you add or update listings in `golf_directory_MASTER.csv`:

1. Re-run the enrichment scripts (optional, if adding new raw entries):
   ```bash
   python enrich_golf_directory.py
   ```

2. Re-run the import to push changes to Supabase:
   ```bash
   python migrate_to_supabase.py
   ```

3. Trigger a Vercel redeploy to regenerate all static pages:
   - Either push a commit, or go to Vercel → Deployments → Redeploy.

---

## Project Structure (key files)

```
web/
├── app/                    # Pages (each folder = a URL)
│   ├── page.tsx            # Homepage
│   ├── directory/          # /directory — searchable full listing
│   ├── listing/[slug]/     # Individual shop profiles
│   ├── states/             # Browse by state index
│   ├── state/[state_code]/ # Shops in a specific state
│   ├── category/[type]/    # Browse by shop type
│   ├── not-found.tsx       # 404 page
│   ├── error.tsx           # Error boundary
│   ├── loading.tsx         # Loading skeleton
│   ├── robots.ts           # /robots.txt (generated)
│   └── sitemap.ts          # /sitemap.xml (generated)
├── components/             # Reusable UI pieces
├── lib/supabase/           # Database queries
├── types/shop.ts           # TypeScript type definitions
└── vercel.json             # Security headers for Vercel
```
