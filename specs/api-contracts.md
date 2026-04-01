# API Contracts — Supabase Edge Functions

This file is maintained by the **Backend Agent**. Updated after every function change.
Read by the **Frontend Agent** to know exactly what to send and expect.

All functions are called via:
```ts
const { data, error } = await supabase.functions.invoke('<function-name>', { body: { ... } })
```

Base URL: `https://bfqojnqffebygrwtkcbs.supabase.co/functions/v1/<function-name>`

---

## submit-review

Submits a full employee review after email verification.

**Method:** POST
**Auth:** None (uses review_token from verification session)

**Request body:**
```ts
{
  review_token: string          // Raw token from verification session
  session_id: string            // UUID of verification_sessions row
  company_id: string            // UUID of company
  title: string                 // 20–200 chars
  employment_status?: string    // "Current Employee" | "Former Employee"
  employment_type?: string      // "Full-time" | "Part-time" | "Contract" | etc.
  role_level?: string
  role_title?: string
  department?: string
  role_focus?: string
  tenure_range?: string
  salary_range?: string
  base_salary_currency: string  // Required (e.g., "KES", "NGN", "USD")
  base_salary_amount: number    // Required, monthly take-home
  is_net_salary?: boolean
  allowances_currency?: string
  allowances_amount?: number
  bonus_currency?: string
  bonus_amount?: number
  market_alignment?: string
  pay_transparency?: string
  pros: string                  // 30–3000 chars
  cons: string                  // 30–3000 chars
  advice?: string               // max 5000 chars
  rating: number                // 1–5
  recommendation?: string       // "Yes" | "No"
  ceo_approval?: boolean
  ratings?: Array<{ category: string; rating: number }>  // max 20, rating 0–5
  company_benefit_ids?: string[]   // UUIDs of company_benefits rows
  standard_benefit_ids?: string[]  // UUIDs of standard_benefits rows
  custom_benefits?: string[]       // Free-text benefit names, max 20
  private_feedback?: string        // max 5000 chars (goes to employer_feedback)
  age_range?: string
  gender?: string
  ethnicity?: string
  education_level?: string
  did_interview?: boolean
  interview_experience_rating?: number  // 1–5
  interview_count?: number
  interview_difficulty?: string
  interview_description?: string  // max 5000 chars
  interview_tips?: string         // max 3000 chars
  end_year?: number               // For former employees
  honeypot_field?: string         // Must be empty — spam protection
}
```

**Response (200):**
```ts
{ success: true; review_id: string; message: string }
```

**Response (400):** `{ error: string }` — validation failure or invalid/expired session
**Response (500):** `{ error: string }` — server error

**Side effects:**
- Marks `verification_sessions.review_submitted = true`
- Sends admin email notification via Resend
- Triggers `detect-review-similarity` fire-and-forget

---

## submit-review-section

Submits a single section of a modular/section-based review.

**Method:** POST
**Auth:** None

**Request body:**
```ts
{
  session_id: string
  review_token: string
  company_id: string
  section_type: string
  section_data: Record<string, unknown>
}
```

**Response (200):** `{ success: true; section_id: string }`
**Response (400/500):** `{ error: string }`

---

## create-review-session

Creates an email verification session before a review can be submitted.

**Method:** POST
**Auth:** None

**Request body:**
```ts
{
  company_id: string
  email: string
}
```

**Response (200):**
```ts
{ success: true; session_id: string; message: string }
```

Sends a verification email to the provided address. The email contains a link with `?t=<token>&c=<company_id>&s=<session_id>`.

---

## create-unverified-session

Creates a session without email verification (for unverified reviews).

**Method:** POST
**Auth:** None

**Request body:**
```ts
{
  company_id: string
}
```

**Response (200):**
```ts
{ success: true; session_id: string; review_token: string }
```

---

## analyze-review

AI-powered content moderation for a submitted review.

**Method:** POST
**Auth:** Service role (admin use only)

**Request body:**
```ts
{
  review_id: string
}
```

**Response (200):**
```ts
{
  approved: boolean
  confidence: number  // 0–1
  flags: string[]     // e.g. ["spam", "inappropriate_language"]
  reasoning: string
}
```

---

## analyze-section

AI analysis of a single review section.

**Method:** POST
**Auth:** Service role

**Request body:**
```ts
{
  section_id: string
  section_type: string
  section_data: Record<string, unknown>
}
```

**Response (200):**
```ts
{ approved: boolean; flags: string[]; reasoning: string }
```

---

## detect-fraud-ai

AI fraud detection for suspicious review patterns.

**Method:** POST
**Auth:** Service role

**Request body:**
```ts
{ review_id: string }
```

**Response (200):**
```ts
{ is_fraud: boolean; confidence: number; signals: string[] }
```

---

## detect-review-similarity

Detects duplicate or near-duplicate reviews.

**Method:** POST
**Auth:** Service role (auto-triggered after submit-review)

**Request body:**
```ts
{ review_id: string }
```

**Response (200):**
```ts
{ similar_review_ids: string[]; max_similarity_score: number }
```

---

## moderate-reviews

Batch review moderation (approve/reject multiple reviews).

**Method:** POST
**Auth:** Admin (Supabase Auth bearer token with admin role)

**Request body:**
```ts
{
  review_ids: string[]
  action: "approve" | "reject"
  reason?: string
}
```

**Response (200):** `{ success: true; updated_count: number }`

---

## flag-review

Flag a review for moderation (public, called by users).

**Method:** POST
**Auth:** None

**Request body:**
```ts
{
  review_id: string
  reason: string
  details?: string
}
```

**Response (200):** `{ success: true }`

---

## polish-review-text

AI text improvement for review content.

**Method:** POST
**Auth:** None

**Request body:**
```ts
{
  text: string
  field_type: "pros" | "cons" | "advice"
}
```

**Response (200):**
```ts
{ polished_text: string }
```

---

## extract-job-details

Parse structured job data from free-text job description.

**Method:** POST
**Auth:** Admin/Employer

**Request body:**
```ts
{ raw_text: string }
```

**Response (200):**
```ts
{
  title: string
  description: string
  requirements: string[]
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  location?: string
  employment_type?: string
}
```

---

## submit-claim

Submit a company claim request.

**Method:** POST
**Auth:** None

**Request body:**
```ts
{
  company_id: string
  claimant_name: string
  claimant_email: string
  claimant_title: string
  business_email: string
  message?: string
}
```

**Response (200):** `{ success: true; claim_id: string }`

---

## manage-claims

Approve or deny company claim requests (admin only).

**Method:** POST
**Auth:** Admin bearer token

**Request body:**
```ts
{
  claim_id: string
  action: "approve" | "deny"
  reason?: string
}
```

**Response (200):** `{ success: true }`

---

## manage-admin-users

Manage admin user roles.

**Method:** POST
**Auth:** Super admin bearer token

**Request body:**
```ts
{
  action: "grant" | "revoke"
  user_id: string
  role: "admin" | "employer"
}
```

**Response (200):** `{ success: true }`

---

## publish-social-post

Publish a scheduled social media post.

**Method:** POST
**Auth:** Admin bearer token

**Request body:**
```ts
{
  post_id: string
}
```

**Response (200):** `{ success: true; platform_post_id: string }`

---

## Email Notification Functions

These functions are triggered internally (from other functions or Supabase scheduled jobs). They are not called directly from the frontend.

| Function | Trigger | Purpose |
|---|---|---|
| `send-claim-confirmation` | After claim submitted | Email to claimant confirming receipt |
| `send-claim-denied-email` | After claim denied | Email to claimant with reason |
| `send-company-approved-email` | After company approved | Email to requester |
| `send-company-request-confirmation` | After company requested | Email to requester |
| `send-contact-notification` | After contact form submitted | Email to `hello@pachena.co` |
| `send-waitlist-confirmation` | After waitlist signup | Email to user |

---

## daily-health-check

Internal health check (cron-triggered, not called from frontend).

**Method:** POST
**Auth:** Service role

Checks DB connectivity, function availability, and logs a health status.

---

*Last updated: 2026-04-01 — bootstrapped from Lovable export*
*Backend Agent: update this file immediately after any function change*
