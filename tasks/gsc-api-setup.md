# Search Console API — one-time setup (for James)

This connects the project to Google Search Console so Claude (and the Monday
routine) can pull fresh ranking data automatically — no more manual CSV
exports. ~15 minutes, all clicking, no code. You only do this once.

## Step 1 — Create a Google Cloud project (3 min)

1. Go to **console.cloud.google.com** and sign in with the same Google
   account that owns Search Console for clubfittingdirectory.com.
2. Click the project dropdown (top left) → **New Project**.
3. Name it `clubfitting-gsc` → **Create** → make sure it's selected.

## Step 2 — Enable the API and create a service account (5 min)

1. In the search bar at the top, type **"Search Console API"** → open it →
   click **Enable**.
2. Search **"Service accounts"** (under IAM & Admin) → **Create Service
   Account**.
3. Name: `gsc-reader` → **Create and Continue** → skip the optional role and
   access screens → **Done**.
4. Click the new `gsc-reader` account → **Keys** tab → **Add Key** →
   **Create new key** → **JSON** → **Create**. A `.json` file downloads.
5. On the service account page, copy its **email address** (looks like
   `gsc-reader@clubfitting-gsc.iam.gserviceaccount.com`).

## Step 3 — Give it read access to Search Console (2 min)

1. Go to **search.google.com/search-console** → select the
   clubfittingdirectory.com property.
2. **Settings** (left sidebar) → **Users and permissions** → **Add user**.
3. Paste the service account email → permission **Restricted** (read-only) →
   **Add**.

## Step 4 — Put the key where the script finds it (1 min)

Rename the downloaded file to exactly:

```
gsc-service-account.json
```

and move it into the project folder (the same folder as CLAUDE.md). It is
already gitignored — it will never be committed or leave your machine.

## Step 5 — Tell Claude "test the GSC pull"

Claude runs `python3 scripts/gsc_pull.py`, which writes fresh
`tasks/gsc-latest/Queries.csv` and `Pages.csv` (same format as a manual
export). If Google returns a permissions error, the usual cause is Step 3 —
re-check the service account email was added to the right property.

**Security note:** the key can only READ Search Console data for this one
property. It can't touch the website, database, or anything else in the
Google account. If it ever leaks, delete the key in Cloud Console → Keys.
