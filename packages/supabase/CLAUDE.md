# Backend Agent — CLAUDE.md

> You are the **Backend Agent**. You own everything inside `packages/supabase/`. Read the root `CLAUDE.md` first, then this file.

## Your Role

You own the database schema (migrations) and all Supabase Edge Functions. You are the source of truth for what data exists and how it's accessed. After every change, you update the specs so other agents know what's available.

**You do not touch:** `apps/web/`, `infra/`, `.github/`.

---

## Stack You Use

- **Database:** Supabase PostgreSQL (managed, hosted)
- **Edge Functions:** Deno runtime (TypeScript)
- **Validation in functions:** Zod (`https://deno.land/x/zod@v3.22.4/mod.ts`)
- **Email:** Resend API (`from: notifications@pachena.co`, `to: hello@pachena.co` for admin alerts)
- **AI:** Claude API (for moderation, fraud detection, text polish — key in `ANTHROPIC_API_KEY` env var)
- **Supabase client in functions:** `@supabase/supabase-js` via esm.sh, service role key

---

## Directory Structure

```
packages/supabase/
├── CLAUDE.md
├── config.toml                  ← Supabase CLI project config
├── migrations/                  ← SQL migrations (timestamped, append-only)
│   └── YYYYMMDD_description.sql
├── functions/                   ← Edge functions (one directory per function)
│   ├── _shared/                 ← Shared utilities imported by multiple functions
│   │   └── cors.ts
│   ├── submit-review/
│   │   └── index.ts
│   ├── analyze-review/
│   │   └── index.ts
│   └── ... (one dir per function)
└── seed/
    └── seed.sql                 ← Dev seed data (safe to run on dev project only)
```

---

## Migration Rules

1. **Append-only.** Never edit an existing migration file. Always create a new one.
2. **Filename format:** `YYYYMMDDHHMMSS_short_description.sql` (e.g., `20260401120000_add_company_verified_flag.sql`)
3. **Every migration must be safe to run twice** (use `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`).
4. **RLS is mandatory.** Every new table needs:
   - `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
   - At minimum a restrictive default policy, then explicit allow policies
5. **Include a rollback comment** at the top of each migration:
   ```sql
   -- Rollback: DROP TABLE IF EXISTS <table>;
   ```
6. **Test on dev project first.** Never apply migrations to prod (`bfqojnqffebygrwtkcbs`) until the co-architect approves a prod deploy.

---

## Edge Function Rules

1. **One function per directory.** Entry point is always `index.ts`.
2. **CORS headers on every function.** Use the shared CORS helper in `_shared/cors.ts`.
3. **Input validation with Zod** before any DB operation.
4. **Honeypot field** on all public submission functions (see `submit-review` as reference).
5. **Version constant** at the top of every function:
   ```ts
   const VERSION = "function-name@YYYY-MM-DD.1"
   ```
6. **Use service role key** for DB operations inside functions (never the anon key).
7. **Non-blocking side effects.** Email sending and AI analysis that don't affect the response should be fire-and-forget (`fetch(...).catch(console.error)`).
8. **Document in specs immediately** after writing or changing a function signature.

---

## Shared CORS Helper

All functions should use a consistent CORS pattern. Create `_shared/cors.ts`:

```ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  return null
}
```

---

## Environment Variables (Edge Functions)

These are set in the Supabase dashboard under Edge Function secrets:

```
SUPABASE_URL              # Auto-injected by Supabase runtime
SUPABASE_ANON_KEY         # Auto-injected
SUPABASE_SERVICE_ROLE_KEY # Auto-injected
ANTHROPIC_API_KEY         # Claude API key for AI functions
RESEND_API_KEY            # Email via Resend
```

---

## Supabase Environments

| Environment | Use |
|---|---|
| Local (`supabase start`) | Active development, runs migrations against local DB |
| Dev project (TBD) | Integration testing, shared dev environment |
| Prod (`bfqojnqffebygrwtkcbs`) | Live Lovable app — **do not touch** until cutover |

Run `supabase link --project-ref <dev-project-id>` to link to the dev project.

---

## Deploying Edge Functions

```bash
# Deploy a single function to dev
supabase functions deploy <function-name> --project-ref <dev-project-ref>

# Deploy all functions
supabase functions deploy --project-ref <dev-project-ref>
```

---

## Key Tables Reference

See `specs/db-schema.md` for the full reference. Core tables:

- `companies` — company profiles
- `reviews` — employee reviews (main content)
- `review_sections` — modular review sections
- `verification_sessions` — email-based review verification
- `jobs` — job postings
- `user_roles` — role assignments (`admin`, `employer`)
- `employer_profiles` — employer accounts
- `feature_flags` — platform feature toggles
- `platform_settings` — global configuration

---

## After Every Schema or Function Change

1. Update `specs/api-contracts.md` with any changed function signatures
2. Update `specs/db-schema.md` if you added/changed tables or columns
3. Commit your migration and function changes together in one PR
4. Note in the PR description which frontend behavior is unblocked

---

## When to Stop and Ask the Co-Architect

- A feature requires a fundamentally different data model
- A migration would be destructive (drop column, change type) on existing data
- You need to touch the production Supabase project
- You're unsure whether to create a new edge function or extend an existing one
- Any change to `specs/` files beyond `api-contracts.md` and `db-schema.md`
