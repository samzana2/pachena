# Feature & Task Backlog

Maintained by the **co-architect**. Each agent picks the next unchecked item labelled for them.

Format: `[ ]` = todo, `[x]` = done, `[~]` = in progress

---

## Phase 0 — Foundation [DevOps Agent]

- [x] **[DevOps]** Initialize git repository at `pachena/` root, create initial commit with all scaffold files
- [ ] **[DevOps]** Create GitHub repository `pachena` (private), push initial commit — **NEEDS MANUAL ACTION** (install `gh` CLI or create via browser, then `git remote add origin <url> && git push -u origin main`)
- [x] **[DevOps]** Create root `package.json` with npm workspaces (`apps/*`, `packages/*`) and top-level scripts (`dev`, `build`, `lint`, `typecheck`)
- [x] **[DevOps]** Create `.gitignore` at repo root (node_modules, .next, .env, .env.local, .supabase)
- [x] **[DevOps]** Scaffold `apps/web/` — Next.js 15 App Router, TypeScript strict, Tailwind, src/, @/* alias (manual scaffold — Node.js not in PATH)
- [x] **[DevOps]** Create `apps/web/.env.example` with all required env var names (no values)
- [ ] **[DevOps]** Connect GitHub repo to Vercel, set root directory to `apps/web`, verify a build deploys — **NEEDS MANUAL ACTION** (requires GitHub repo to exist first)
- [x] **[DevOps]** Create `.github/workflows/ci.yml` — runs typecheck + lint + build on PR to main/staging
- [ ] **[DevOps]** Create dev Supabase project, document the project ref in `specs/architecture.md` — **NEEDS MANUAL ACTION** (create project at supabase.com, then update `specs/architecture.md` with the project ref)
- [x] **[DevOps]** Create `README.md` at repo root with local dev setup instructions

---

## Phase 1 — Backend Stabilization [Backend Agent]

*Start after DevOps Phase 0 is complete (dev Supabase project exists)*

- [ ] **[Backend]** Copy all migration files from `C:\Users\samue\projects\pachena-lovable\pachena-main\supabase\migrations\` to `packages/supabase/migrations/`
- [ ] **[Backend]** Copy all edge functions from `C:\Users\samue\projects\pachena-lovable\pachena-main\supabase\functions\` to `packages/supabase/functions/`
- [ ] **[Backend]** Create `packages/supabase/config.toml` with Supabase CLI project config
- [ ] **[Backend]** Create `packages/supabase/functions/_shared/cors.ts` shared CORS helper
- [ ] **[Backend]** Run `supabase db push` against dev project — verify all migrations apply cleanly
- [ ] **[Backend]** Run `supabase functions deploy` against dev project — verify all functions deploy
- [ ] **[Backend]** Verify `specs/api-contracts.md` matches actual deployed function signatures — fix any discrepancies
- [ ] **[Backend]** Verify `specs/db-schema.md` matches actual dev database schema — fix any discrepancies
- [ ] **[Backend]** Create `packages/supabase/seed/seed.sql` with minimal seed data (1-2 test companies, 3-5 test reviews)

---

## Phase 2 — Component Port [Frontend Agent]

*Start after Phase 0 is complete (Next.js app scaffolded)*

- [ ] **[Frontend]** Install dependencies: `@supabase/ssr`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, `sonner`, `next-themes`, `date-fns`, `recharts`, `vaul`, `embla-carousel-react`, `@dnd-kit/core`, `@dnd-kit/sortable`
- [ ] **[Frontend]** Set up `components.json` for shadcn/ui (matching Lovable config — style: default, baseColor: slate)
- [ ] **[Frontend]** Install all shadcn/ui components used in the Lovable export (run `npx shadcn@latest add` for each)
- [ ] **[Frontend]** Copy `src/types/supabase.ts` — port from `pachena-lovable/pachena-main/src/integrations/supabase/types.ts`
- [ ] **[Frontend]** Create `src/lib/supabase/client.ts` — browser Supabase client using `@supabase/ssr`
- [ ] **[Frontend]** Create `src/lib/supabase/server.ts` — server Supabase client using `@supabase/ssr`
- [ ] **[Frontend]** Set up React Query provider in `src/app/layout.tsx`
- [ ] **[Frontend]** Set up Supabase auth middleware in `src/middleware.ts`
- [ ] **[Frontend]** Copy and port `src/contexts/EmployerContext.tsx`
- [ ] **[Frontend]** Copy and port `src/hooks/` (useFeatureFlags, useSpeechToText, use-mobile, use-toast)
- [ ] **[Frontend]** Copy and port `src/lib/` (salaryUtils, redactions, edge-functions, utils)
- [ ] **[Frontend]** Copy all `src/components/ui/` files (shadcn base components)
- [ ] **[Frontend]** Copy all `src/components/admin/` files, fix routing imports
- [ ] **[Frontend]** Copy all `src/components/employer/` and `src/components/employer-dashboard/` files
- [ ] **[Frontend]** Copy all `src/components/review/` files
- [ ] **[Frontend]** Copy all `src/components/jobs/` files
- [ ] **[Frontend]** Copy remaining shared components (Header, Footer, CompanyCard, etc.)
- [ ] **[Frontend]** Set up `tailwind.config.ts` matching Lovable (custom colors, fonts: Ubuntu + Pacifico)
- [ ] **[Frontend]** Set up `src/app/layout.tsx` root layout (fonts, ThemeProvider, QueryClientProvider, Toaster, Sonner)
- [ ] **[Frontend]** Verify `npm run build` passes with zero type errors

---

## Phase 3 — Page Migration [Frontend Agent]

*Start after Phase 2 is complete (all components compile)*

### 3a — SEO-Critical Public Pages (Server Components)

- [ ] **[Frontend]** Port `src/app/page.tsx` (Home / Index) — Server Component, pre-render featured companies
- [ ] **[Frontend]** Port `src/app/companies/page.tsx` — Server Component with search/filter
- [ ] **[Frontend]** Port `src/app/company/[id]/page.tsx` — Server Component + `generateMetadata` for OG tags
- [ ] **[Frontend]** Port `src/app/jobs/page.tsx` — Server Component
- [ ] **[Frontend]** Port `src/app/jobs/[id]/page.tsx` — Server Component + `generateMetadata`

### 3b — Info Pages (Static / Server Components)

- [ ] **[Frontend]** Port `/about`, `/faq`, `/contact`, `/terms`, `/privacy`, `/guidelines`, `/employer-guidelines`

### 3c — Interactive Public Pages (Client Components)

- [ ] **[Frontend]** Port `src/app/review/page.tsx` (company search + start review)
- [ ] **[Frontend]** Port `src/app/review/submit/page.tsx` (section wizard)
- [ ] **[Frontend]** Port `src/app/auth/page.tsx`
- [ ] **[Frontend]** Port `src/app/go/page.tsx` (email verification handler, preserves `?t=&c=&s=` params)
- [ ] **[Frontend]** Port `src/app/claim/page.tsx`
- [ ] **[Frontend]** Port `src/app/request-company/page.tsx`

### 3d — Employer Dashboard (Client Components)

- [ ] **[Frontend]** Port `src/app/employer/dashboard/layout.tsx` (EmployerDashboardShell + EmployerSidebar)
- [ ] **[Frontend]** Port overview, company, reviews, inbox, jobs, applications, insights, settings pages

### 3e — Admin Panel (Client Components)

- [ ] **[Frontend]** Port `src/app/admin/auth/page.tsx`
- [ ] **[Frontend]** Port all admin pages (companies, reviews, claims, settings, contact-messages, company-requests, waitlist, spam-analytics, insights, social, jobs, seed-job)

### 3f — Final

- [ ] **[Frontend]** Port `src/app/moderation/page.tsx`
- [ ] **[Frontend]** Port `src/app/insights/page.tsx`
- [ ] **[Frontend]** Port `src/app/employers/page.tsx`
- [ ] **[Frontend]** Add `src/app/not-found.tsx` (404 page)
- [ ] **[Frontend]** Verify all routes work end-to-end against dev Supabase
- [ ] **[Frontend]** Run Lighthouse on `/`, `/companies`, `/company/[id]` — target 90+ SEO score

---

## Phase 4 — Cutover Prep [All Agents]

*Start when all Phase 3 tasks are complete*

- [ ] **[DevOps]** Set up staging environment pointing at dev Supabase
- [ ] **[DevOps]** Configure custom domain `staging.pachena.co` on Vercel
- [ ] **[Backend]** Run final migration sync: ensure dev project schema matches prod
- [ ] **[Frontend]** Full QA pass: compare every page against the Lovable version
- [ ] **[DevOps]** Configure prod environment variables in Vercel (prod Supabase keys)
- [ ] **[Co-Architect]** Sign off on cutover readiness
- [ ] **[DevOps]** DNS cutover: point `pachena.co` to Vercel

---

## Upcoming Features (Post-Cutover)

*Not started — listed for planning purposes*

- [ ] Email notifications via Resend (improve on current edge function emails)
- [ ] `next/image` optimization for company logos
- [ ] Vercel Analytics integration
- [ ] PostHog product analytics
- [ ] ISR (Incremental Static Regeneration) for company pages
- [ ] Full-text search for companies and reviews
- [ ] Mobile app (evaluate React Native + Expo)
