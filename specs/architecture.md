# Architecture Decisions

This file records architectural decisions for the Pachena platform. Maintained by the co-architect.

---

## ADR-001: Next.js 15 over Vite SPA

**Decision:** Use Next.js 15 App Router instead of porting the Vite SPA.

**Reason:** Pachena is a Glassdoor-style platform where SEO is a core growth lever — company pages, review pages, and job listings must be indexed by search engines. A Vite SPA requires additional tooling (SSR adapters, pre-rendering) to achieve this. Next.js provides SSR natively and is the most widely supported React framework on Vercel.

**Consequence:** Pages use the App Router file-system convention. Public-facing pages are Server Components by default. Employer dashboard and admin pages use `"use client"`.

---

## ADR-002: Keep Supabase as the backend

**Decision:** No change to the backend — Supabase (PostgreSQL + Auth + Edge Functions) stays.

**Reason:** The Supabase backend is already production-grade, has 80+ migrations, 20+ edge functions, and RLS policies in place. The Lovable MVP proved it scales for the current load. Migration cost would be very high for no benefit.

**Consequence:** The same Supabase project is used by both Lovable (prod) and the new Next.js app during the parallel build period. A separate dev Supabase project is used for development.

---

## ADR-003: Parallel build — Lovable stays live

**Decision:** The Lovable version continues running on pachena.co until the new build reaches feature parity. The new build is developed against a dev Supabase project.

**Reason:** No rush to cut over. Reduces risk. Real users continue getting value while the new build is being built right.

**Consequence:** No migrations run against prod Supabase until co-architect approves a prod deploy milestone. The dev Supabase project schema must be kept in sync with prod manually (by applying all current migrations on first setup).

---

## ADR-004: npm workspaces monorepo (no Turborepo yet)

**Decision:** Simple npm workspaces. No Turborepo, nx, or other build orchestration.

**Reason:** The repo currently has one app (`apps/web`) and one package (`packages/supabase`). Adding a build orchestration layer adds cognitive overhead without payoff until there are 3+ packages with inter-dependencies.

**Revisit:** If a mobile app or a separate API service is added, evaluate Turborepo at that point.

---

## ADR-005: shadcn/ui components ported as-is from Lovable

**Decision:** All 131 components from the Lovable export are ported mechanically — logic unchanged, only routing primitives swapped.

**Reason:** The Lovable components represent validated product decisions and significant design work. Rewriting them would introduce bugs and delay shipping.

**Consequence:** Some components may carry Lovable-specific patterns that aren't idiomatic Next.js. These are acceptable for the initial port. Refactoring can happen incrementally as new features are added.

---

## ADR-006: @supabase/ssr for Next.js auth

**Decision:** Use `@supabase/ssr` (not `@supabase/supabase-js` directly) for auth in the Next.js app.

**Reason:** `@supabase/ssr` handles cookie-based session management correctly in Next.js App Router, including middleware-based session refresh. Using `@supabase/supabase-js` directly in a Next.js app leads to session persistence issues.

**Consequence:** Two Supabase client helpers: `lib/supabase/server.ts` (Server Components, API routes) and `lib/supabase/client.ts` (Client Components).

---

## Infrastructure

| Service | Purpose | Account |
|---|---|---|
| GitHub | Source control, CI | TBD |
| Vercel | Frontend hosting, preview deploys | TBD |
| Supabase | DB, Auth, Edge Functions | Existing account |
| Resend | Transactional email | Existing (`notifications@pachena.co`) |
| Anthropic | Claude API for AI features | Existing |

## Supabase Projects

| Environment | Project Ref | Notes |
|---|---|---|
| Production | `bfqojnqffebygrwtkcbs` | Live Lovable app — read-only until cutover |
| Dev | `gfeghdulunbbvyjymtth` | DevOps Agent creates this in Phase 0 |

## Key Domain

- Production: `pachena.co`
- Staging: Vercel preview URL (until staging subdomain is set up)
- Admin emails: `hello@pachena.co`
- Notification sender: `notifications@pachena.co`
