-- Categories
insert into category (id, label) values
  ('a1000000-0000-0000-0000-000000000001', 'Freelancing'),
  ('a1000000-0000-0000-0000-000000000002', 'Surveys & Rewards'),
  ('a1000000-0000-0000-0000-000000000003', 'Content Creation'),
  ('a1000000-0000-0000-0000-000000000004', 'Passive Income'),
  ('a1000000-0000-0000-0000-000000000005', 'Microtasks')
on conflict do nothing;

-- Tags
insert into tag (id, label, category) values
  ('b1000000-0000-0000-0000-000000000001', 'Global',            'Location'),
  ('b1000000-0000-0000-0000-000000000002', 'US Only',           'Location'),
  ('b1000000-0000-0000-0000-000000000003', 'Beginner Friendly', 'Skill Level'),
  ('b1000000-0000-0000-0000-000000000004', 'Skill Required',    'Skill Level'),
  ('b1000000-0000-0000-0000-000000000005', 'PayPal',            'Payment Type'),
  ('b1000000-0000-0000-0000-000000000006', 'Bank Transfer',     'Payment Type'),
  ('b1000000-0000-0000-0000-000000000007', 'Crypto',            'Payment Type'),
  ('b1000000-0000-0000-0000-000000000008', 'Gift Cards',        'Payment Type'),
  ('b1000000-0000-0000-0000-000000000009', 'Free to Join',      'Cost'),
  ('b1000000-0000-0000-0000-000000000010', 'Passive',           'Effort')
on conflict do nothing;

-- Posts
insert into post (id, label, description, category, logo_url, link, is_verified, is_global) values
  (
    'c1000000-0000-0000-0000-000000000001',
    'Upwork',
    'One of the largest freelance marketplaces connecting clients with professionals across hundreds of skill categories.',
    'a1000000-0000-0000-0000-000000000001',
    'https://www.upwork.com/favicon.ico',
    'https://www.upwork.com',
    true, true
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Fiverr',
    'Freelance platform where you create "gigs" starting at $5. Great for designers, writers, and digital marketers.',
    'a1000000-0000-0000-0000-000000000001',
    'https://www.fiverr.com/favicon.ico',
    'https://www.fiverr.com',
    true, true
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Swagbucks',
    'Earn points (SB) by taking surveys, watching videos, and shopping online. Redeem for PayPal cash or gift cards.',
    'a1000000-0000-0000-0000-000000000002',
    'https://www.swagbucks.com/favicon.ico',
    'https://www.swagbucks.com',
    true, false
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Survey Junkie',
    'Survey platform that pays cash via PayPal for sharing your opinions. One of the highest-rated survey sites.',
    'a1000000-0000-0000-0000-000000000002',
    'https://www.surveyjunkie.com/favicon.ico',
    'https://www.surveyjunkie.com',
    true, false
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'YouTube',
    'Monetize video content through ads, memberships, and Super Chats once you reach partner eligibility.',
    'a1000000-0000-0000-0000-000000000003',
    'https://www.youtube.com/favicon.ico',
    'https://www.youtube.com',
    true, true
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    'Substack',
    'Publish a newsletter and charge subscribers a monthly or annual fee. Keep 90% of subscription revenue.',
    'a1000000-0000-0000-0000-000000000003',
    'https://substack.com/favicon.ico',
    'https://substack.com',
    true, true
  ),
  (
    'c1000000-0000-0000-0000-000000000007',
    'Honeygain',
    'Earn passive income by sharing your unused internet bandwidth. No active work required after setup.',
    'a1000000-0000-0000-0000-000000000004',
    'https://www.honeygain.com/favicon.ico',
    'https://www.honeygain.com',
    true, true
  ),
  (
    'c1000000-0000-0000-0000-000000000008',
    'Amazon Mechanical Turk',
    'Complete small human intelligence tasks (HITs) for pay. Good for supplemental income with flexible hours.',
    'a1000000-0000-0000-0000-000000000005',
    'https://www.mturk.com/favicon.ico',
    'https://www.mturk.com',
    true, false
  ),
  (
    'c1000000-0000-0000-0000-000000000009',
    'Appen',
    'Data annotation and AI training tasks such as search evaluation, transcription, and image tagging.',
    'a1000000-0000-0000-0000-000000000005',
    'https://appen.com/favicon.ico',
    'https://appen.com',
    true, true
  ),
  (
    'c1000000-0000-0000-0000-000000000010',
    'Teachable',
    'Create and sell online courses. Keep up to 97% of revenue. Suits educators, coaches, and subject-matter experts.',
    'a1000000-0000-0000-0000-000000000003',
    'https://teachable.com/favicon.ico',
    'https://teachable.com',
    true, true
  )
on conflict do nothing;

-- Post-tag mappings
insert into post_tag_mapping (post_id, tag_id) values
  -- Upwork: Global, Skill Required, Bank Transfer, Free to Join
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009'),
  -- Fiverr: Global, Beginner Friendly, PayPal, Free to Join
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000009'),
  -- Swagbucks: US Only, Beginner Friendly, PayPal, Gift Cards, Free to Join
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000008'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000009'),
  -- Survey Junkie: US Only, Beginner Friendly, PayPal, Free to Join
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005'),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000009'),
  -- YouTube: Global, Skill Required, Bank Transfer, Free to Join
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000009'),
  -- Substack: Global, Beginner Friendly, Bank Transfer, Free to Join
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000009'),
  -- Honeygain: Global, Beginner Friendly, PayPal, Crypto, Free to Join, Passive
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000005'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000009'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000010'),
  -- MTurk: US Only, Beginner Friendly, Bank Transfer, Free to Join
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000009'),
  -- Appen: Global, Beginner Friendly, Bank Transfer, Free to Join
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009'),
  -- Teachable: Global, Skill Required, Bank Transfer, Free to Join
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000009')
on conflict do nothing;
