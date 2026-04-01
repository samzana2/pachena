# Frontend Agent — CLAUDE.md

> You are the **Frontend Agent**. You own everything inside `apps/web/`. Read the root `CLAUDE.md` first, then this file.

## Your Role

You build and maintain the Next.js 15 frontend. Your job is to faithfully port the UI from the Lovable export and extend it with new features as specified by the co-architect.

**You do not touch:** `packages/supabase/`, `infra/`, `.github/`, or `specs/` (you read specs, never write them).

---

## Stack You Use

- **Framework:** Next.js 15, App Router, TypeScript strict mode
- **UI:** shadcn/ui components + Tailwind CSS v3
- **Data fetching:** TanStack React Query v5 for client components; direct Supabase server client for Server Components
- **Forms:** React Hook Form + Zod
- **Auth:** Supabase Auth (`@supabase/ssr` package for Next.js cookie-based sessions)
- **Icons:** Lucide React
- **Routing:** Next.js App Router (file-system based) — **not** react-router-dom

---

## Directory Structure

```
apps/web/
├── src/
│   ├── app/                     ← Next.js App Router pages
│   │   ├── layout.tsx           ← Root layout (providers, fonts, toaster)
│   │   ├── page.tsx             ← / (Home)
│   │   ├── companies/
│   │   │   └── page.tsx         ← /companies
│   │   ├── company/
│   │   │   └── [id]/
│   │   │       └── page.tsx     ← /company/[id]
│   │   ├── jobs/
│   │   │   ├── page.tsx         ← /jobs
│   │   │   └── [id]/
│   │   │       └── page.tsx     ← /jobs/[id]
│   │   ├── review/
│   │   │   ├── page.tsx         ← /review
│   │   │   └── submit/
│   │   │       └── page.tsx     ← /review/submit
│   │   ├── employer/
│   │   │   └── dashboard/       ← All employer routes (client-side)
│   │   ├── admin/               ← All admin routes (client-side)
│   │   └── (info)/              ← about, faq, contact, terms, privacy, guidelines
│   ├── components/              ← Ported from Lovable + new components
│   │   ├── ui/                  ← shadcn/ui base components
│   │   ├── admin/               ← Admin-specific components
│   │   ├── employer/            ← Employer dashboard components
│   │   ├── employer-dashboard/  ← Employer dashboard shell
│   │   ├── jobs/                ← Job board components
│   │   └── review/              ← Review submission components
│   ├── contexts/                ← React Context providers (EmployerContext, etc.)
│   ├── hooks/                   ← Custom hooks
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        ← Browser Supabase client (for client components)
│   │   │   └── server.ts        ← Server Supabase client (for Server Components)
│   │   ├── salaryUtils.ts
│   │   ├── redactions.ts
│   │   └── utils.ts
│   └── types/
│       └── supabase.ts          ← DB types (copied from Lovable integrations/supabase/types.ts)
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json              ← shadcn/ui config
└── package.json
```

---

## Routing: React Router → Next.js App Router

When porting pages from the Lovable export, apply these mechanical substitutions:

| Lovable (react-router-dom) | Next.js equivalent |
|---|---|
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'` |
| `navigate('/path')` | `router.push('/path')` |
| `import { useParams } from 'react-router-dom'` | Page props: `params: Promise<{ id: string }>` |
| `import { useSearchParams } from 'react-router-dom'` | `import { useSearchParams } from 'next/navigation'` |
| `import { useLocation } from 'react-router-dom'` | `import { usePathname } from 'next/navigation'` |
| `<Navigate to="/x" replace />` | `redirect('/x')` (server) or `router.replace('/x')` (client) |

---

## Server vs Client Components — The Critical Rule

**Public-facing pages that need SEO → Server Components (no `"use client"`):**
- `/` (home), `/companies`, `/company/[id]`, `/jobs`, `/jobs/[id]`
- `/about`, `/faq`, `/contact`, `/terms`, `/privacy`, `/guidelines`

**Interactive or authenticated pages → Client Components (`"use client"` at top):**
- `/review`, `/review/submit` (wizard with state)
- `/auth`, `/go`
- All `/employer/dashboard/*` routes
- All `/admin/*` routes

**Pattern for Server Component pages:**
```tsx
// app/company/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()

  return <CompanyDetail company={company} /> // CompanyDetail is a Client Component that handles interactivity
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // Return title, description, og tags for SEO
}
```

---

## Supabase Client Setup

Use `@supabase/ssr` (not `@supabase/supabase-js` directly in Next.js):

```ts
// lib/supabase/server.ts — for Server Components and API routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}

// lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key (public, safe to expose)
NEXT_PUBLIC_SITE_URL=             # https://pachena.co (or staging URL)
```

Never use `VITE_` prefixes — those are from the old Vite setup.

---

## Porting Components from Lovable

The Lovable source is at: `C:\Users\samue\projects\pachena-lovable\pachena-main\`

**Steps to port a component:**
1. Copy the file from `pachena-lovable/pachena-main/src/components/` to `apps/web/src/components/`
2. Fix import paths: `@/` still works (configured in tsconfig paths)
3. Replace react-router-dom imports per the routing table above
4. Remove any `lovable-tagger` imports if present
5. Add `"use client"` if the component uses hooks, event handlers, or browser APIs

**Do not rewrite component logic.** Port mechanically. Improve only when specifically tasked.

---

## Calling Edge Functions

Read `specs/api-contracts.md` for the exact request/response shape of each function.

```ts
// Pattern for calling Supabase edge functions from client components
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ...payload }
})
```

Never construct edge function URLs manually — always use `supabase.functions.invoke()`.

---

## shadcn/ui Components

Install new shadcn components with:
```bash
npx shadcn@latest add <component-name>
```

The `components.json` config is already set up. Don't modify it without co-architect approval.

---

## When to Stop and Ask the Co-Architect

- You need a new edge function or DB column that doesn't exist in `specs/api-contracts.md`
- A page requires data that isn't exposed via existing Supabase tables/views
- You're unsure whether a feature should be SSR or client-side
- Any change that affects `specs/` files
