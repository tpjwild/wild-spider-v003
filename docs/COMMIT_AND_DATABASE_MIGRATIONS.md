# Committing changes and applying database migrations

Short reference for Supabase schema updates. For the full Git workflow (review, tests, staging, messages, one vs many commits, push), see **[GIT_COMMIT_WORKFLOW.md](./GIT_COMMIT_WORKFLOW.md)**.

**Note:** Files listed in `.gitignore` (for example `.env.local` with secrets) are not committed by design.

---

## Applying migrations with the Supabase CLI

Migrations live in **`supabase/migrations/`**. Applying them updates the hosted Postgres schema for the Supabase project you **link** (for example production — the same project your `NEXT_PUBLIC_SUPABASE_URL` points at).

**Prerequisites:** [Supabase CLI](https://supabase.com/docs/guides/cli) installed, and access to the project in the Supabase dashboard.

1. **Log in** (browser flow)

   ```bash
   supabase login
   ```

2. **Link this repo to your remote project** (once per machine / clone)

   ```bash
   cd /path/to/wild-spider-v003
   supabase link --project-ref <your-project-ref>
   ```

   The **project ref** is the subdomain of your Supabase URL, e.g. `https://<project-ref>.supabase.co` → use `<project-ref>`.

3. **Push pending migrations** to the linked remote database

   ```bash
   supabase db push
   ```

   This applies any migration files under `supabase/migrations/` that have not yet been recorded on that database.

**After schema changes:** redeploy or rely on your normal Vercel Git workflow so the app and the database stay in sync. Env vars on Vercel should still target the same Supabase project you migrated.

**Alternative:** you can paste and run the SQL from a migration file in the Supabase dashboard **SQL** editor instead of using the CLI; `db push` is the repeatable, version-controlled approach.
