-- Pachena dev seed data
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- Provides: 2 test companies, 5 test reviews — enough to render home page + company detail page

-- ============================================================
-- Companies
-- ============================================================

INSERT INTO public.companies (
  id,
  slug,
  name,
  industry,
  location,
  description,
  logo_url,
  website,
  year_founded,
  employee_count,
  headquarters,
  is_claimed,
  created_at,
  updated_at
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'safaricom-kenya',
  'Safaricom Kenya',
  'Telecommunications',
  'Nairobi, Kenya',
  'Kenya''s leading telecommunications company and home of M-Pesa, Africa''s most successful mobile money platform.',
  null,
  'https://safaricom.co.ke',
  1997,
  '5001-10000',
  'Nairobi, Kenya',
  false,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  'andela-nigeria',
  'Andela',
  'Technology',
  'Lagos, Nigeria',
  'Global technology company that connects employers to skilled tech talent across Africa and beyond.',
  null,
  'https://andela.com',
  2014,
  '1001-5000',
  'Lagos, Nigeria',
  false,
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Verification sessions (required before reviews can be inserted)
-- ============================================================

INSERT INTO public.verification_sessions (
  id,
  company_id,
  email_domain,
  token_hash,
  review_token_hash,
  verified,
  review_submitted,
  expires_at,
  created_at
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'safaricom.co.ke',
  'seed_session_token_1',
  'seed_review_token_1',
  true,
  true,
  now() + interval '30 days',
  now()
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'gmail.com',
  'seed_session_token_2',
  'seed_review_token_2',
  true,
  true,
  now() + interval '30 days',
  now()
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'andela.com',
  'seed_session_token_3',
  'seed_review_token_3',
  true,
  true,
  now() + interval '30 days',
  now()
),
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'gmail.com',
  'seed_session_token_4',
  'seed_review_token_4',
  true,
  true,
  now() + interval '30 days',
  now()
),
(
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'yahoo.com',
  'seed_session_token_5',
  'seed_review_token_5',
  true,
  true,
  now() + interval '30 days',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Reviews
-- ============================================================

INSERT INTO public.reviews (
  id,
  company_id,
  verification_token,
  title,
  employment_status,
  employment_type,
  role_title,
  role_level,
  department,
  tenure_range,
  base_salary_currency,
  base_salary_amount,
  is_net_salary,
  market_alignment,
  pros,
  cons,
  advice,
  rating,
  recommend_to_friend,
  ceo_approval,
  moderation_status,
  created_at
) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'seed_token_hash_1',
  'Great place to grow in telecoms, but bureaucracy slows things down',
  'Current Employee',
  'Full-time',
  'Software Engineer',
  'Mid',
  'Engineering',
  '1-3 years',
  'KES',
  180000,
  true,
  'At Market',
  'Excellent learning opportunities and exposure to large-scale systems. M-Pesa gives you a chance to work on products used by millions of people every day. Good benefits package including medical cover and pension.',
  'Heavy bureaucracy makes it hard to move fast. Decision-making can be slow and requires multiple approvals. The corporate culture can feel rigid compared to startups.',
  'Network aggressively internally. The company is large enough that your growth depends heavily on visibility with the right people.',
  4.0,
  true,
  true,
  'approved',
  now() - interval '10 days'
),
(
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'seed_token_hash_2',
  'Solid salary but limited upward mobility without connections',
  'Former Employee',
  'Full-time',
  'Product Manager',
  'Senior',
  'Product',
  '3-5 years',
  'KES',
  320000,
  true,
  'At Market',
  'Competitive pay relative to the Kenyan market. The brand name opens doors for future roles. Stable job with good job security. Free lunch and modern office facilities.',
  'Promotions are often based on tenure and internal politics rather than performance. Very siloed teams with minimal cross-functional collaboration. Hard to make meaningful impact as an individual contributor.',
  'Build your external network while you are here. The skills transfer well but do not expect the company to invest heavily in your personal growth.',
  3.0,
  false,
  false,
  'approved',
  now() - interval '25 days'
),
(
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'seed_token_hash_5',
  'Best employer in Kenya for engineering talent',
  'Current Employee',
  'Full-time',
  'Senior Software Engineer',
  'Senior',
  'Engineering',
  '5-10 years',
  'KES',
  450000,
  true,
  'Above Market',
  'Top pay in the Kenyan market. Remote-friendly policies post-pandemic. Strong technical leadership and world-class problems to solve at scale. Great team culture within engineering.',
  'Highly competitive to get promoted to L6 and above. Some legacy systems are painful to work with. External hiring sometimes bypasses internal candidates.',
  'Get involved in internal hackathons and innovation challenges — that is where visibility comes from.',
  4.5,
  true,
  true,
  'approved',
  now() - interval '5 days'
),
(
  '20000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'seed_token_hash_3',
  'Mission-driven company with a real impact on African tech',
  'Current Employee',
  'Full-time',
  'Engineering Manager',
  'Senior',
  'Engineering',
  '1-3 years',
  'USD',
  4500,
  false,
  'At Market',
  'Working with world-class talent distributed across Africa. The mission to build the next generation of African engineers is genuine and motivating. Great remote work culture. USD compensation is competitive.',
  'Rapid growth means processes are sometimes chaotic. The business model has shifted a few times which creates uncertainty. Career ladder is not always clearly defined.',
  'Embrace the pace of change rather than fighting it. The opportunities that come with being at a scaling company outweigh the chaos.',
  4.0,
  true,
  true,
  'approved',
  now() - interval '15 days'
),
(
  '20000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  'seed_token_hash_4',
  'Good stepping stone but not a long-term home for many',
  'Former Employee',
  'Full-time',
  'Full Stack Developer',
  'Mid',
  'Engineering',
  '1-3 years',
  'USD',
  3200,
  false,
  'At Market',
  'The training and mentorship in the early days is excellent. You learn how to work with international clients and build professional habits that stick. The name on your CV carries weight globally.',
  'High pressure to perform with relatively thin support once you are placed with a client. Some clients treat Andela developers differently from their direct hires. The client-facing model can feel unstable.',
  'Use it to get two to three years of international client experience, build your portfolio, then evaluate your options. The brand opens doors.',
  3.5,
  true,
  null,
  'approved',
  now() - interval '30 days'
)
ON CONFLICT (id) DO NOTHING;
