-- ---------------------------------------------------------------------------
-- PULSE GYM - development seed data
--
-- !! THIS REPOSITORY IS PUBLIC.
--    Every member below is OBVIOUSLY SYNTHETIC. Never replace these with real
--    names, phone numbers or emails - a public repo plus real member data is
--    the one way this project leaks.
--
-- Safe to re-run: uses INSERT OR REPLACE on fixed ids.
--
-- Apply with:  npm run db:seed:local
-- ---------------------------------------------------------------------------

-- Plans --------------------------------------------------------------------
-- Prices mirror the public landing page so the admin panel and the marketing
-- site can never disagree. price_cents is the amount charged PER BILLING
-- PERIOD, so annual rows hold 12x the displayed monthly-equivalent price.
INSERT OR REPLACE INTO plans (id, name, price_cents, billing_period, duration_days, is_active) VALUES
  ('plan_starter_monthly', 'Starter Pass',      3500, 'monthly',  30, 1),
  ('plan_starter_annual',  'Starter Pass',     34800, 'annual',  365, 1),
  ('plan_pro_monthly',     'Pro Athlete Pass',  6900, 'monthly',  30, 1),
  ('plan_pro_annual',      'Pro Athlete Pass', 70800, 'annual',  365, 1),
  ('plan_vip_monthly',     'Elite VIP Pass',   11900, 'monthly',  30, 1),
  ('plan_vip_annual',      'Elite VIP Pass',  118800, 'annual',  365, 1);

-- Members ------------------------------------------------------------------
-- Deliberately covers every lifecycle state so the admin UI has something
-- meaningful to render, including one member expiring inside 7 days.
INSERT OR REPLACE INTO members (
  id, member_code, full_name, phone, email, gender, dob,
  emergency_contact_name, emergency_contact_phone,
  plan_id, plan_start, plan_end, stage, notes,
  whatsapp_opt_in, opt_in_at, joined_at
) VALUES
  ('mem_0001', 'PULSE-0001', 'Test Member One', '+919000000001', 'one@example.com', 'male', '1994-03-12',
   'Test Emergency One', '+919000000101',
   'plan_pro_monthly', date('now','-10 days'), date('now','+20 days'), 'active',
   'Seed row - synthetic. Healthy active monthly member.',
   1, datetime('now','-10 days'), date('now','-10 days')),

  ('mem_0002', 'PULSE-0002', 'Test Member Two', '+919000000002', 'two@example.com', 'female', '1990-07-25',
   'Test Emergency Two', '+919000000102',
   'plan_pro_monthly', date('now','-25 days'), date('now','+5 days'), 'active',
   'Seed row - synthetic. Expires within 7 days; drives the renewals queue.',
   1, datetime('now','-25 days'), date('now','-25 days')),

  ('mem_0003', 'PULSE-0003', 'Test Member Three', '+919000000003', 'three@example.com', 'other', '1988-11-02',
   'Test Emergency Three', '+919000000103',
   'plan_vip_annual', date('now','-60 days'), date('now','+305 days'), 'active',
   'Seed row - synthetic. Long-running annual VIP member.',
   0, NULL, date('now','-60 days')),

  ('mem_0004', 'PULSE-0004', 'Test Member Four', '+919000000004', 'four@example.com', 'male', '1996-01-19',
   'Test Emergency Four', '+919000000104',
   'plan_starter_monthly', date('now','-33 days'), date('now','-3 days'), 'active',
   'Seed row - synthetic. LAPSED 3 days ago: stage is still active, so the derived status engine must report expired.',
   1, datetime('now','-33 days'), date('now','-33 days')),

  ('mem_0005', 'PULSE-0005', 'Test Member Five', '+919000000005', 'five@example.com', 'female', '1992-09-08',
   'Test Emergency Five', '+919000000105',
   'plan_pro_monthly', date('now','-40 days'), date('now','+15 days'), 'frozen',
   'Seed row - synthetic. Travelling; membership frozen.',
   1, datetime('now','-40 days'), date('now','-40 days')),

  ('mem_0006', 'PULSE-0006', 'Test Member Six', '+919000000006', 'six@example.com', 'male', '1999-05-30',
   NULL, NULL,
   NULL, NULL, NULL, 'lead',
   'Seed row - synthetic. Walk-in enquiry, not yet a member.',
   0, NULL, date('now','-2 days'));

-- Subscriptions ------------------------------------------------------------
-- Only for members who actually started a plan. mem_0006 is a lead with none.
INSERT OR REPLACE INTO subscriptions (
  id, member_id, plan_id, start_date, end_date, status, price_cents_charged, freeze_days
) VALUES
  ('sub_0001', 'mem_0001', 'plan_pro_monthly',     date('now','-10 days'), date('now','+20 days'),  'active',  6900,   0),
  ('sub_0002', 'mem_0002', 'plan_pro_monthly',     date('now','-25 days'), date('now','+5 days'),   'active',  6900,   0),
  ('sub_0003', 'mem_0003', 'plan_vip_annual',      date('now','-60 days'), date('now','+305 days'), 'active',  118800, 0),
  ('sub_0004', 'mem_0004', 'plan_starter_monthly', date('now','-33 days'), date('now','-3 days'),   'expired', 3500,   0),
  ('sub_0005', 'mem_0005', 'plan_pro_monthly',     date('now','-40 days'), date('now','+15 days'),  'frozen',  6900,   7);

-- Payments -----------------------------------------------------------------
-- Amounts are integers in minor units (cents) - never floats.
INSERT OR REPLACE INTO payments (
  id, member_id, subscription_id, amount_cents, method, paid_at,
  period_start, period_end, reference, note
) VALUES
  ('pay_0001', 'mem_0001', 'sub_0001', 6900,   'upi',  datetime('now','-10 days'), date('now','-10 days'), date('now','+20 days'),  'UPI/SEED/0001',  'Seed payment'),
  ('pay_0002', 'mem_0002', 'sub_0002', 6900,   'cash', datetime('now','-25 days'), date('now','-25 days'), date('now','+5 days'),   NULL,             'Seed payment'),
  ('pay_0003', 'mem_0003', 'sub_0003', 118800, 'card', datetime('now','-60 days'), date('now','-60 days'), date('now','+305 days'), 'CARD/SEED/0003', 'Seed payment - annual'),
  ('pay_0004', 'mem_0004', 'sub_0004', 3500,   'upi',  datetime('now','-33 days'), date('now','-33 days'), date('now','-3 days'),   'UPI/SEED/0004',  'Seed payment - not renewed'),
  ('pay_0005', 'mem_0005', 'sub_0005', 6900,   'bank', datetime('now','-40 days'), date('now','-40 days'), date('now','+15 days'),  'NEFT/SEED/0005', 'Seed payment - frozen account');

-- Message templates --------------------------------------------------------
-- Mirrors what must be registered in the WhatsApp Manager. Business-initiated
-- messages REQUIRE an approved template, so these are utility-category and
-- factual in tone - promo-sounding copy gets reclassified or rejected.
INSERT OR REPLACE INTO message_templates (id, key, language, category, body, variables) VALUES
  ('tpl_expiry_7d',   'expiry_7d',   'en', 'utility',
   'Hi {{name}}, your {{plan}} membership expires on {{date}}. Reply here to renew.',
   '["name","plan","date"]'),
  ('tpl_expiry_1d',   'expiry_1d',   'en', 'utility',
   'Hi {{name}}, your {{plan}} membership expires tomorrow ({{date}}). Reply here to renew.',
   '["name","plan","date"]'),
  ('tpl_payment_due', 'payment_due', 'en', 'utility',
   'Hi {{name}}, a payment of {{amount}} is due for your {{plan}} membership. Reply here if you have already paid.',
   '["name","amount","plan"]'),
  ('tpl_welcome',     'welcome',     'en', 'utility',
   'Welcome to PULSE GYM, {{name}}! Your membership code is {{code}}.',
   '["name","code"]');

-- Automation rules ---------------------------------------------------------
-- Automation lives in the database, not in code: changing "7 days before" to
-- "3 days before" is a settings edit, not a deploy.
INSERT OR REPLACE INTO automation_rules (id, name, trigger, offset_days, template_key, is_enabled) VALUES
  ('rule_expiry_7d',   'Renewal reminder - 7 days before expiry', 'plan_expiring', 7, 'expiry_7d',   1),
  ('rule_expiry_1d',   'Renewal reminder - 1 day before expiry',  'plan_expiring', 1, 'expiry_1d',   1),
  ('rule_payment_due', 'Payment due notice',                      'payment_due',   0, 'payment_due', 1),
  ('rule_welcome',     'Welcome message on signup',               'welcome',       0, 'welcome',     1);

-- Counters -----------------------------------------------------------------
-- member_code sequence. 6 members seeded above, so the next code is PULSE-0007.
-- Safe without locking because D1 is single-writer per database.
INSERT OR REPLACE INTO counters (name, value) VALUES ('member_code', 6);

