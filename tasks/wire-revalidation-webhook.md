# Wire Up the Live-Update Webhook (A1)

**Goal:** When a shop changes in Supabase, your site rebuilds *just that shop's pages* within seconds — instead of waiting up to 30 days.

**Your secret:** use the fresh 64-character value Claude gave you in chat. Paste
that same value everywhere `<YOUR_SECRET>` appears below.

> 🔒 **Never paste the real secret into this file** — or any file in the repo,
> which is **public on GitHub**. It belongs only in Vercel and Supabase. If a
> secret ever lands in a commit, treat it as compromised: generate a new one
> with `openssl rand -hex 32` and rotate all three places below.

---

## Step 1 — Add the secret to Vercel (so the site recognises the webhook)

1. Go to **vercel.com** → your Club Fitting Directory project.
2. **Settings** → **Environment Variables**.
3. Add a new variable:
   - **Name:** `REVALIDATE_SECRET`
   - **Value:** `<YOUR_SECRET>` (the value Claude gave you in chat)
   - **Environments:** tick **Production** (and Preview if you like).
4. Click **Save**.

## Step 2 — Redeploy so Vercel picks up the new variable

1. Go to the **Deployments** tab.
2. On the most recent deployment, click the **⋯** menu → **Redeploy**.
3. Wait for it to finish (green check).

> Until this redeploy finishes, the endpoint returns an error on purpose (it refuses to run without its secret). That's the safety feature working.

## Step 3 — Create the webhook in Supabase

1. Go to **supabase.com** → your project.
2. **Database** (left sidebar) → **Webhooks** → **Create a new hook**.
3. Fill in:
   - **Name:** `revalidate-shop-pages`
   - **Table:** `shops`
   - **Events:** tick **Insert**, **Update**, **Delete** (all three).
   - **Type:** **HTTP Request**
   - **Method:** **POST**
   - **URL:** `https://clubfittingdirectory.com/api/revalidate`
   - **HTTP Headers** → add one header:
     - **Name:** `Authorization`
     - **Value:** `Bearer <YOUR_SECRET>`
       *(the word `Bearer`, one space, then the secret — no quotes, no trailing spaces)*
4. Click **Create webhook**.

## Step 4 — Test it (1 minute)

1. In Supabase → **Table Editor** → `shops`, open any one shop.
2. Make a tiny harmless edit (e.g. retype the same phone number) and **Save**.
3. Within ~30 seconds, that shop's live page should reflect changes on the next visit.
4. To confirm the ping worked: Supabase → Database → Webhooks → your hook → it logs recent deliveries with a **200** status. A 401 = the Authorization header doesn't match; a 500 = the Vercel variable/redeploy step isn't done yet.

---

## Done when
- [ ] `REVALIDATE_SECRET` set in Vercel + redeployed
- [ ] `shops` webhook created in Supabase pointing at `/api/revalidate` with the Bearer header
- [ ] Test edit shows a 200 in the webhook logs
