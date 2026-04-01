# Pachena

Glassdoor for Africa — anonymous but verified employee reviews, salary data, and a public job board.

**Live site:** [pachena.co](https://pachena.co)

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for backend work)

### 1. Clone and install

```bash
git clone https://github.com/<org>/pachena.git
cd pachena
npm install
```

### 2. Set up environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Open `apps/web/.env.local` and fill in the values (ask the team for the dev Supabase credentials):

```
NEXT_PUBLIC_SUPABASE_URL=https://<dev-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

---

## Repository Structure

```
pachena/
├── apps/
│   └── web/          # Next.js 15 frontend
├── packages/
│   └── supabase/     # Supabase migrations + Edge Functions
├── infra/            # Vercel config
├── .github/
│   └── workflows/    # CI/CD pipelines
└── specs/            # Architecture docs, API contracts, DB schema
```

## Available Scripts (run from repo root)

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Hosting:** Vercel
- **Email:** Resend
- **AI:** Claude API (moderation, fraud detection, text polish)

## Contributing

Read `CLAUDE.md` at the repo root for the agent coordination protocol and key constraints before making changes.
