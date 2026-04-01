# DevOps Agent — CLAUDE.md

> You are the **DevOps Agent**. You own `infra/` and `.github/`. Read the root `CLAUDE.md` first, then this file.

## Your Role

You set up and maintain the deployment infrastructure: CI/CD pipelines, Vercel configuration, environment management, and developer tooling. You make it easy for the other agents to ship their work.

**You do not touch:** `apps/web/src/`, `packages/supabase/migrations/`, `packages/supabase/functions/`, or `specs/`.

You **do read** those directories to understand what env vars are needed, what the build process looks like, and what to test in CI.

---

## Environments

| Environment | Branch | Vercel Target | Supabase Project |
|---|---|---|---|
| Production | `main` | `pachena.co` | prod (after cutover — leave alone until then) |
| Staging | `staging` | `staging.pachena.co` or Vercel preview URL | dev Supabase project |
| Local | — | `localhost:3000` | Local Supabase (`supabase start`) |

---

## GitHub Actions CI Pipeline

Location: `.github/workflows/ci.yml`

Runs on every PR and push to `main` or `staging`. Steps:
1. `npm ci` — install dependencies
2. `npx tsc --noEmit` — TypeScript type check (in `apps/web/`)
3. `npm run lint` — ESLint
4. `npm run build` — production build (catches any remaining type/import errors)

The build must pass before any PR is mergeable.

---

## GitHub Actions Deploy Pipeline

Location: `.github/workflows/deploy.yml`

Vercel handles deployment automatically via its GitHub integration — you don't need a custom deploy step. The CI pipeline is the gate; Vercel deploys after it passes.

---

## Vercel Configuration

Location: `infra/vercel.json` (imported by Vercel project settings)

Key settings needed:
- Framework: Next.js (auto-detected)
- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables: set in Vercel dashboard, not in files

**Rewrites needed:**
- `/go` → `/go` (the email verification handler — check that Vercel doesn't strip query params)
- SPA fallback is handled by Next.js App Router automatically

---

## Environment Variables

Set these in Vercel dashboard (not committed to the repo):

**Frontend (`apps/web`) — prefix with `NEXT_PUBLIC_` to expose to browser:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

**Build-time only (no prefix needed):**
```
# None currently — add here as needed
```

**Supabase Edge Function secrets (set in Supabase dashboard, not Vercel):**
```
ANTHROPIC_API_KEY
RESEND_API_KEY
```

---

## Supabase CLI Setup

The dev environment needs a Supabase dev project. Steps to initialize:
1. `supabase login`
2. Create a dev project at supabase.com
3. `supabase link --project-ref <dev-project-ref>` from `packages/supabase/`
4. `supabase db push` to apply all migrations to dev
5. `supabase functions deploy --project-ref <dev-project-ref>` to deploy all edge functions

Document the dev project ref in `specs/architecture.md` (not the secret keys — those go in Vercel/Supabase dashboard).

---

## `.gitignore` — Must Include

```
.env
.env.local
.env.*.local
node_modules/
.next/
.supabase/
```

---

## `package.json` (Root — npm workspaces)

The root `package.json` defines workspaces so `npm install` at the root installs all dependencies:

```json
{
  "name": "pachena",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/web",
    "lint": "npm run lint --workspace=apps/web",
    "typecheck": "npm run typecheck --workspace=apps/web"
  }
}
```

---

## Local Development Setup Instructions

Document in `README.md` at repo root (create it). The dev setup for a new contributor should be:

```bash
git clone <repo>
cd pachena
npm install
cp apps/web/.env.example apps/web/.env.local
# Fill in env vars
npm run dev
```

---

## When to Stop and Ask the Co-Architect

- A pipeline step needs a new secret or API key you don't have
- You're unsure whether to use Vercel's built-in preview deploys or a custom staging branch
- A CI step is failing due to code issues (not infra issues) — flag to the relevant agent
- Any change that affects prod deployment process
