# Database Schema Reference

Maintained by the **Backend Agent**. Updated after every migration.
Read by the **Frontend Agent** to understand available data.

Supabase project (prod): `bfqojnqffebygrwtkcbs`

---

## Core Content Tables

### `companies`
Central table for all company profiles.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Company display name |
| `slug` | text unique | URL-safe identifier |
| `industry` | text | |
| `location` | text | Primary city/country |
| `logo_url` | text | |
| `website` | text | |
| `description` | text | |
| `year_founded` | int | Note: column is `year_founded`, not `founded_year` |
| `employee_count` | text | e.g. "51-200" — Note: column is `employee_count`, not `company_size` |
| `headquarters` | text | HQ city/country |
| `mission` | text | Company mission statement |
| `ceo` | text | CEO name |
| `is_claimed` | bool | Whether employer has claimed |
| `claimed_by` | uuid FK → auth.users | User who claimed the company |
| `claimed_at` | timestamptz | When claim was made |
| `linkedin_url` | text | LinkedIn company page |
| `approved_review_count` | int | Cached count of approved reviews |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

> **Note:** `is_verified` and `is_active` do NOT exist in the current schema (they were in an earlier spec draft but never migrated). The public RLS policy allows all companies to be read. Visibility filtering uses `is_claimed` status only.

Public view: `companies` (with RLS — all rows publicly readable)

### `reviews`
Employee review submissions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `title` | text | Review headline |
| `employment_status` | text | "Current Employee" / "Former Employee" |
| `employment_type` | text | Full-time, Part-time, etc. |
| `role_level` | text | Junior, Mid, Senior, etc. |
| `role_title` | text | Job title |
| `department` | text | |
| `role_focus` | text | |
| `tenure_range` | text | e.g. "1-3 years" |
| `salary_range` | text | Legacy text field |
| `base_salary_currency` | text | ISO currency code |
| `base_salary_amount` | numeric | Monthly take-home |
| `is_net_salary` | bool | Net vs gross |
| `allowances_currency` | text | |
| `allowances_amount` | numeric | |
| `bonus_currency` | text | |
| `bonus_amount` | numeric | Annual bonus |
| `market_alignment` | text | "Below Market" / "At Market" / "Above Market" |
| `pay_transparency` | text | |
| `pros` | text | Min 30 chars |
| `cons` | text | Min 30 chars |
| `advice` | text | "One thing to know" |
| `rating` | numeric | 1–5 overall |
| `recommend_to_friend` | bool | |
| `ceo_approval` | bool | |
| `private_feedback` | text | For employer only |
| `verification_token` | text | SHA-256 hash of session token |
| `verification_type` | text | "unverified" currently |
| `age_range` | text | Demographics |
| `gender` | text | Demographics |
| `ethnicity` | text | Demographics |
| `education_level` | text | Demographics |
| `did_interview` | bool | |
| `interview_experience_rating` | numeric | 1–5 |
| `interview_count` | int | Number of interview rounds |
| `interview_difficulty` | text | |
| `interview_description` | text | |
| `interview_tips` | text | |
| `end_year` | int | For former employees |
| `helpful_count` | int | Cached helpful votes |
| `moderation_status` | text | "approved" / "rejected" — default `approved` — Note: column is `moderation_status`, not `status` |
| `flagged` | bool | Manually flagged for review |
| `moderation_notes` | text | Admin moderation notes |
| `moderated_at` | timestamptz | When moderation action was taken |
| `moderated_by` | uuid FK → auth.users | Admin who moderated |
| `report_count` | int | Cached count of user reports |
| `hidden_fields` | text[] | Fields hidden by admin |
| `ai_fraud_summary` | jsonb | Output from detect-fraud-ai |
| `review_session_id` | uuid FK → review_sessions | Session used to submit this review |
| `created_at` | timestamptz | |

Public view: `reviews_public` — only `moderation_status = 'approved'` reviews, no sensitive fields

### `review_sections`
Modular sections within section-based reviews.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `review_id` | uuid FK → reviews | |
| `section_type` | text | e.g. "compensation", "culture" |
| `section_data` | jsonb | Section-specific structured data |
| `status` | text | "pending" / "approved" / "rejected" |
| `created_at` | timestamptz | |

Public view: `review_sections_public`

### `review_sessions`
Session tracking for the review submission wizard.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `section_data` | jsonb | Accumulated section data |
| `created_at` | timestamptz | |

### `verification_sessions`
Email verification sessions that gate review submission.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `email_domain` | text | Domain of verified email |
| `verified` | bool | Whether email was clicked |
| `review_submitted` | bool | Whether review was submitted |
| `review_token_hash` | text | SHA-256 hash of the review token |
| `expires_at` | timestamptz | |
| `created_at` | timestamptz | |

### `salaries`
Legacy salary data (separate from review salary fields).

Public view: `salaries_public`

---

## Jobs Tables

### `jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `title` | text | |
| `description` | text | |
| `location` | text | |
| `employment_type` | text | |
| `salary_min` | numeric | |
| `salary_max` | numeric | |
| `salary_currency` | text | |
| `is_active` | bool | |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | |

### `job_applications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `job_id` | uuid FK → jobs | |
| `applicant_email` | text | |
| `applicant_name` | text | |
| `cover_letter` | text | |
| `resume_url` | text | |
| `status` | text | "pending" / "reviewed" / "rejected" |
| `created_at` | timestamptz | |

---

## User & Auth Tables

### `user_roles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `role` | app_role enum | "admin" / "employer" |
| `created_at` | timestamptz | |

Enum `app_role`: `admin`, `employer`

### `employer_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `company_id` | uuid FK → companies | |
| `created_at` | timestamptz | |

### `employment_verifications`
Email verification records for establishing reviewer credibility.

---

## Company Management Tables

### `company_claim_requests`
Claims submitted by employers to take ownership of company pages.

Public view: `claim_requests_list`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `claimant_email` | text | |
| `claimant_name` | text | |
| `claimant_title` | text | |
| `business_email` | text | |
| `message` | text | |
| `status` | text | "pending" / "approved" / "denied" |
| `created_at` | timestamptz | |

### `company_requests`
Requests from users to add a new company to the platform.

### `company_benefits`
Benefits associated with a company (standard + custom).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `benefit_name` | text | |
| `is_standard` | bool | |
| `created_at` | timestamptz | |

### `benefit_confirmations`
Links reviews to benefits they confirmed.

### `standard_benefits`
Platform-wide benefit library (admin-maintained).

---

## Admin & Moderation Tables

### `admin_audit_logs`
All admin actions with before/after state.

### `review_reports`
User-submitted flags on reviews.

### `review_responses`
Employer responses to reviews (public, linked to company).

### `review_similarity_flags`
Output from the duplicate detection function.

### `rate_limit_entries`
Per-IP/per-email rate limiting for review submission.

### `review_helpful_votes`
"This review was helpful" votes (one per user per review).

### `review_rewards`
Reward credits for completing reviews.

---

## Platform Configuration Tables

### `feature_flags`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `flag_name` | text unique | e.g. "enable_salary_data" |
| `is_enabled` | bool | |
| `description` | text | |

### `platform_settings`

| Column | Type | Notes |
|---|---|---|
| `key` | text PK | |
| `value` | jsonb | |

### `form_configurations` / `form_sections` / `form_fields`
Dynamic form builder for the review submission wizard (admin-configured).

### `rating_categories`
Per-review sub-ratings (e.g., Work-Life Balance, Management).

### `rating_category_configs`
Admin configuration for available rating categories.

---

## Communication Tables

### `contact_messages`
Contact form submissions. Visible in admin panel.

### `social_posts`
Scheduled social media posts (admin-managed).

### `employer_feedback`
Private feedback from reviews, visible only to the relevant employer.

---

## Referral & Gamification Tables

### `referrers`
Referral program participants.

Public view: `referrers_leaderboard`

### `referrer_payouts`
Earnings for referral program.

### `referrer_payout_reviews`
Links payouts to specific reviews.

### `ambassador_competitions`
Competitions/contests for reviewers.

### `waitlist`
Pre-launch waitlist signups.

### `session_events`
User session event tracking for analytics.

---

## Security Functions

- `has_role(user_id uuid, role app_role) → bool` — used in RLS policies
- `has_claim_access(user_id uuid, company_id uuid) → bool` — check employer access

---

*Last updated: 2026-04-02 — corrected column names against actual migrations (year_founded, employee_count, moderation_status); removed non-existent is_active/is_verified from companies; added missing review columns*
*Backend Agent: update this file after every migration that adds/changes tables or columns*
