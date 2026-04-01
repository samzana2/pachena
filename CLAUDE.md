# Pachena — Root CLAUDE.md

> Read this file fully before doing any work. It applies to all agents.

## What is Pachena?

Pachena is a Glassdoor for Africa — a platform where employees submit anonymous but verified reviews of companies, including salary data, culture ratings, and interview experiences. Employers can claim their company page and respond to reviews. The platform also has a public job board.

**Domain:** pachena.co
**Reference implementation (Lovable, stays live during migration):** the existing Lovable-hosted build
**This repo:** the production-grade version being built in parallel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v3 (matching Lovable config) |
| State | TanStack React Query v5 + React Context |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL) — hosted at `bfqojnqffebygrwtkcbs.supabase.co` |
| Auth | Supabase Auth |
| Edge Functions | Supabase Deno Edge Functions |
| Email | Resend (from: `notifications@pachena.co`) |
| AI | Claude API (via edge functions for moderation, fraud detection, text polish) |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

---

## Repository Structure

```
pachena/
├── CLAUDE.md                    ← You are here (read by all agents)
├── package.json                 ← Monorepo root (npm workspaces)
├── specs/
│   ├── architecture.md          ← Architecture decisions (maintained by co-architect)
│   ├── api-contracts.md         ← Edge function request/response shapes (Backend writes, Frontend reads)
│   ├── db-schema.md             ← Canonical DB table reference (Backend maintains)
│   └── backlog.md               ← Prioritized task queue (co-architect maintains)
├── apps/
│   └── web/                     ← Next.js 15 frontend [FRONTEND AGENT owns this]
│       └── CLAUDE.md
├── packages/
│   └── supabase/                ← Migrations + Edge Functions [BACKEND AGENT owns this]
│       └── CLAUDE.md
├── infra/                       ← Vercel config, scripts [DEVOPS AGENT owns this]
│   └── CLAUDE.md
└── .github/
    └── workflows/               ← CI/CD pipelines [DEVOPS AGENT owns this]
```

---

## Agent Map

There are three specialist agents plus a co-architect. Each agent owns a directory and **must not** write outside it without explicit instruction from the co-architect.

| Agent | Owns | Reads but doesn't write |
|---|---|---|
| **Frontend Agent** | `apps/web/` | `specs/api-contracts.md`, `specs/db-schema.md` |
| **Backend Agent** | `packages/supabase/` | `specs/architecture.md` |
| **DevOps Agent** | `infra/`, `.github/` | All of `apps/` and `packages/` |
| **Co-Architect** | `specs/`, root files | Everything |

### How to start each agent session

```bash
# Frontend Agent — open a terminal in apps/web
cd /c/Users/samue/projects/pachena/apps/web && claude

# Backend Agent — open a terminal in packages/supabase
cd /c/Users/samue/projects/pachena/packages/supabase && claude

# DevOps Agent — open a terminal in the repo root
cd /c/Users/samue/projects/pachena && claude

# Co-Architect (main session)
cd /c/Users/samue/projects/pachena && claude
```

---

## Coordination Protocol

1. **Co-architect writes specs first.** No agent implements a cross-boundary feature until the spec exists in `specs/`.
2. **Backend Agent updates contracts immediately.** After adding or changing an edge function, update `specs/api-contracts.md` before closing the task.
3. **Frontend Agent reads contracts, never guesses.** If a contract is missing or unclear, flag it to the co-architect — do not invent an API shape.
4. **DevOps Agent reads env var requirements from `specs/architecture.md`.** Never hardcode secrets or project-specific values.
5. **Cross-boundary changes require co-architect sign-off.** If you need to touch a file outside your directory, stop and describe the need. The co-architect will either delegate it or instruct you.
6. **Check `specs/backlog.md` for your next task.** Tasks are labelled by agent. Pick the next `[ ]` item labelled for you.

---

## Key Constraints

- **Never commit secrets.** `.env.local` is gitignored. Secrets go in Vercel environment variables.
- **RLS is non-negotiable.** Every Supabase table must have Row Level Security policies.
- **Public pages must be SSR.** Company pages, job listings, and review pages need to be indexed by search engines.
- **Components from Lovable are the source of truth for UI.** Don't redesign — port faithfully, then extend.
- **The Lovable version is the reference.** When in doubt about how something should behave, the Lovable build is the answer.
- **Lovable source is at:** `C:\Users\samue\projects\pachena-lovable\pachena-main\`

---

## Supabase Projects

| Environment | Project | URL |
|---|---|---|
| Production (Lovable) | `bfqojnqffebygrwtkcbs` | `https://bfqojnqffebygrwtkcbs.supabase.co` |
| Dev (new) | TBD — DevOps Agent sets up | TBD |

Production Supabase is shared with the live Lovable app. **Do not run migrations against production until the DNS cutover milestone.**

---

## Lovable-Specific Artifacts to Remove

When porting files from the Lovable export, remove:
- `import { componentTagger } from "lovable-tagger"` (in `vite.config.ts` — not needed in Next.js)
- Any `.lovable/` directory references
- `lovable-tagger` from `package.json` devDependencies

---

## Git Workflow

- `main` → auto-deploys to Vercel production
- `staging` → auto-deploys to Vercel staging
- Feature branches: `feat/<agent>/<short-description>` (e.g., `feat/frontend/company-page-ssr`)
- PRs require CI to pass before merge
- Co-architect reviews PRs that touch cross-boundary concerns
