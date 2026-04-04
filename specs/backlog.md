# Feature & Task Backlog

Maintained by the **co-architect**. Each agent picks the next unchecked item labelled for them.

Format: `[ ]` = todo, `[x]` = done, `[~]` = in progress

---

## Phase 0 — Foundation [DevOps Agent]

- [x] **[DevOps]** Initialize git repository at `pachena/` root, create initial commit with all scaffold files
- [x] **[DevOps]** Create GitHub repository `pachena` (private), push initial commit
- [x] **[DevOps]** Create root `package.json` with npm workspaces (`apps/*`, `packages/*`) and top-level scripts (`dev`, `build`, `lint`, `typecheck`)
- [x] **[DevOps]** Create `.gitignore` at repo root (node_modules, .next, .env, .env.local, .supabase)
- [x] **[DevOps]** Scaffold `apps/web/` — run `npx create-next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*"` inside `apps/`
- [x] **[DevOps]** Create `apps/web/.env.example` with all required env var names (no values)
- [x] **[DevOps]** Connect GitHub repo to Vercel, set root directory to `apps/web`, verify a build deploys
- [x] **[DevOps]** Create `.github/workflows/ci.yml` — runs typecheck + lint + build on PR to main/staging
- [x] **[DevOps]** Create dev Supabase project, document the project ref in `specs/architecture.md`
- [x] **[DevOps]** Create `README.md` at repo root with local dev setup instructions

---

## Phase 1 — Backend Stabilization [Backend Agent]

*Start after DevOps Phase 0 is complete (dev Supabase project exists)*

- [x] **[Backend]** Copy all migration files from `C:\Users\samue\projects\pachena-lovable\pachena-main\supabase\migrations\` to `packages/supabase/migrations/`
- [x] **[Backend]** Copy all edge functions from `C:\Users\samue\projects\pachena-lovable\pachena-main\supabase\functions\` to `packages/supabase/functions/`
- [x] **[Backend]** Create `packages/supabase/config.toml` with Supabase CLI project config
- [x] **[Backend]** Create `packages/supabase/functions/_shared/cors.ts` shared CORS helper
- [x] **[Backend]** Run `supabase db push` against dev project — verify all migrations apply cleanly
- [x] **[Backend]** Run `supabase functions deploy` against dev project — verify all functions deploy
- [x] **[Backend]** Verify `specs/api-contracts.md` matches actual deployed function signatures — fix any discrepancies
- [x] **[Backend]** Verify `specs/db-schema.md` matches actual dev database schema — fix any discrepancies
- [x] **[Backend]** Create `packages/supabase/seed/seed.sql` with minimal seed data (1-2 test companies, 3-5 test reviews)

---

## Phase 2 — Component Port [Frontend Agent]

*Start after Phase 0 is complete (Next.js app scaffolded)*

- [x] **[Frontend]** Install dependencies: `@supabase/ssr`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, `sonner`, `next-themes`, `date-fns`, `recharts`, `vaul`, `embla-carousel-react`, `@dnd-kit/core`, `@dnd-kit/sortable`
- [x] **[Frontend]** Set up `components.json` for shadcn/ui (matching Lovable config — style: default, baseColor: slate)
- [x] **[Frontend]** Install all shadcn/ui components used in the Lovable export (run `npx shadcn@latest add` for each)
- [x] **[Frontend]** Copy `src/types/supabase.ts` — port from `pachena-lovable/pachena-main/src/integrations/supabase/types.ts`
- [x] **[Frontend]** Create `src/lib/supabase/client.ts` — browser Supabase client using `@supabase/ssr`
- [x] **[Frontend]** Create `src/lib/supabase/server.ts` — server Supabase client using `@supabase/ssr`
- [x] **[Frontend]** Set up React Query provider in `src/app/layout.tsx`
- [x] **[Frontend]** Set up Supabase auth middleware in `src/middleware.ts`
- [x] **[Frontend]** Copy and port `src/contexts/EmployerContext.tsx`
- [x] **[Frontend]** Copy and port `src/hooks/` (useFeatureFlags, useSpeechToText, use-mobile, use-toast)
- [x] **[Frontend]** Copy and port `src/lib/` (salaryUtils, redactions, edge-functions, utils)
- [x] **[Frontend]** Copy all `src/components/ui/` files (shadcn base components)
- [x] **[Frontend]** Copy all `src/components/admin/` files, fix routing imports
- [x] **[Frontend]** Copy all `src/components/employer/` and `src/components/employer-dashboard/` files
- [x] **[Frontend]** Copy all `src/components/review/` files
- [x] **[Frontend]** Copy all `src/components/jobs/` files
- [x] **[Frontend]** Copy remaining shared components (Header, Footer, CompanyCard, etc.)
- [x] **[Frontend]** Set up `tailwind.config.ts` matching Lovable (custom colors, fonts: Ubuntu + Pacifico)
- [x] **[Frontend]** Set up `src/app/layout.tsx` root layout (fonts, ThemeProvider, QueryClientProvider, Toaster, Sonner)
- [x] **[Frontend]** Verify `npm run build` passes with zero type errors

---

## Phase 3 — Page Migration [Frontend Agent]

*Start after Phase 2 is complete (all components compile)*
*Co-architect: scope each Frontend Agent session to 2-3 routes max. Pick items from the list below, write a narrow prompt, wait for completion + build confirmation, then write the next prompt.*

### 3a — SEO-Critical Public Pages (Server Components)

- [x] **[Frontend]** Port `src/app/page.tsx` (Home / Index) — Server Component, pre-render featured companies
- [x] **[Frontend]** Port `src/app/companies/page.tsx` — Server Component with search/filter
- [x] **[Frontend]** Port `src/app/company/[id]/page.tsx` — Server Component + `generateMetadata` for OG tags
- [x] **[Frontend]** Fix: company detail page was querying by UUID but URLs use slugs — changed `.eq('id', id)` to `.eq('slug', id)` and resolve UUID for related queries
- [ ] **[Frontend]** Port `src/app/jobs/page.tsx` — Server Component *(DEFERRED — pending PM/CEO discussion on jobs features)*
- [ ] **[Frontend]** Port `src/app/jobs/[id]/page.tsx` — Server Component + `generateMetadata` *(DEFERRED — pending PM/CEO discussion)*

### 3b — Info Pages (Static / Server Components)

- [x] **[Frontend]** Port `/about`, `/faq`, `/contact`, `/terms`, `/privacy`, `/guidelines`, `/employer-guidelines` — all created under `src/app/(info)/`
- [ ] **[Frontend]** Split `/faq` and `/contact` interactive forms into separate client sub-components so `generateMetadata` can be exported from the page — low priority polish task

### 3c — Interactive Public Pages (Client Components)

- [x] **[Frontend]** Port `src/app/auth/page.tsx`
- [x] **[Frontend]** Port `src/app/go/page.tsx` (email verification handler)
- [x] **[Frontend]** Add `/verify` → `/go` redirect in `next.config.ts` (preserves query params)
- [x] **[Frontend]** Port `src/app/review/page.tsx` (company search + start review)
- [x] **[Frontend]** Fix: replaced `router.replace()` with `window.history.replaceState()` for cosmetic URL changes on `/review` — `router.replace()` triggers real Next.js navigation, causing 404 on `/company/[slug]/review`
- [x] **[Frontend]** Port `src/app/review/submit/page.tsx` (section wizard)
- [x] **[Frontend]** Port `src/app/claim/page.tsx`
- [x] **[Frontend]** Port `src/app/request-company/page.tsx`

### 3d — Employer Dashboard (Client Components)

- [x] **[Frontend]** Port `src/app/employer/dashboard/layout.tsx` — server-side auth guard (redirects to `/auth` if no session) + EmployerProvider + EmployerDashboardShell
- [x] **[Frontend]** Port overview page (`dashboard/page.tsx`)
- [x] **[Frontend]** Port company profile page (`dashboard/company/page.tsx`)
- [x] **[Frontend]** Port reviews page (`dashboard/reviews/page.tsx`)
- [x] **[Frontend]** Port inbox page (`dashboard/inbox/page.tsx`)
- [x] **[Frontend]** Port settings page (`dashboard/settings/page.tsx`)
- [x] **[Frontend]** Stub jobs, applications, insights pages with "Coming Soon" placeholder — pending PM/CEO direction
- [x] **[Co-Architect / Manual]** Enable feature flags in dev Supabase `feature_flags` table: set `employer_nav_links` and `employer_footer_section` to `true` to expose employer links in Header and Footer

### 3e — Admin Panel (Client Components)

- [x] **[Frontend]** Port `src/app/admin/auth/page.tsx`
- [x] **[Frontend]** Port admin core pages: `page.tsx` (dashboard), reviews, settings, insights, spam-analytics, jobs, waitlist
- [x] **[Frontend]** Port admin data pages: claims, companies, `companies/[id]/edit`, company-requests, contact-messages, social, seed-job

### 3f — Final

- [ ] **[Frontend]** Port `src/app/moderation/page.tsx`
- [ ] **[Frontend]** Port `src/app/insights/page.tsx`
- [ ] **[Frontend]** Port `src/app/employers/page.tsx` — port the existing "Coming Soon" page from Lovable as-is; full employers landing page requires PM/CEO input
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

## Security Hardening (Post-Cutover) [Backend Agent]

*Not started — known accepted risks, low priority until cutover*

- [ ] **[Backend]** Tighten RLS INSERT policies on 21 tables flagged by Supabase security advisor as having `WITH CHECK (true)` — currently intentional (edge functions use service role and enforce validation), but direct anon-key REST API access bypasses edge function validation. Tables include `benefit_confirmations` and 20 others. Audit each table, restrict where safe, document accepted risks where not.

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
