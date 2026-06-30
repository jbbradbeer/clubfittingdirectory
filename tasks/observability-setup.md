# Observability — Owner Setup (Chunk B)

The code is done and deployed-ready. These are the dashboard toggles only you can flip. All free, all Vercel/Supabase-native (no new accounts).

---

## 1. Turn on Vercel Analytics + Speed Insights (≈2 min)

The code is already in the site (`app/layout.tsx`). You just enable collection:

1. Go to **vercel.com** → your Club Fitting Directory project.
2. Click the **Analytics** tab → **Enable** (Web Analytics — page views & traffic).
3. Click the **Speed Insights** tab → **Enable** (real-visitor load speed / Core Web Vitals).
4. Redeploy (or wait for the next deploy). Data starts appearing within a few minutes of real traffic.

> Free tier is generous and fine for current traffic. No code changes needed ever again.

---

## 2. Find slow database queries in Supabase (≈2 min, no setup)

Supabase already tracks this — nothing to install:

1. Go to **supabase.com** → your project.
2. Left sidebar → **Reports** → **Query Performance**
   *(or **Advisors** → **Query Performance** depending on dashboard version).*
3. Sort by **Slowest execution time** / **Most time consuming**.
4. This shows the queries costing the most time — the things to optimise first if a page ever feels slow.

Check this once a month, or any time the site feels sluggish.

---

## 3. (Optional) Log individual slow queries to the Postgres log

Step 2 shows aggregates. If you want a log line every time a *single* query takes
longer than 1 second:

1. Supabase → **SQL Editor** → **New query**, paste and run:
   ```sql
   alter database postgres set log_min_duration_statement = '1000';
   ```
   (1000 = 1000 milliseconds = 1 second. Use a bigger number to log fewer.)
2. View the results later in: Supabase → **Logs** → **Postgres Logs**.
3. To turn it back off:
   ```sql
   alter database postgres set log_min_duration_statement = '-1';
   ```

> Skip this unless you're actively chasing a slow page — the Query Performance
> report (step 2) is enough for normal monitoring.

---

## Where to read your logs (for reference)

- **Application logs** (our new structured logger — API errors, query failures):
  Vercel → your project → **Logs** (or **Observability** → **Logs**). In production
  each entry is JSON you can filter by `level` and `context`.
- **Traffic & speed:** Vercel → Analytics / Speed Insights tabs.
- **Database health:** Supabase → Reports → Query Performance.

---

## Done when
- [ ] Vercel Web Analytics enabled
- [ ] Vercel Speed Insights enabled
- [ ] You know where the Query Performance report lives
