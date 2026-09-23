-- ---------------------------------------------------------------------------
-- PULSE GYM - development seed data
-- ---------------------------------------------------------------------------

-- Plans ---------------------------------------------------------------------
INSERT OR REPLACE INTO plans (id, name, price_cents, duration_days, billing_period, is_active, created_at) VALUES
  ('plan_starter', '1 Month', 90000, 30, 'monthly', 1, CURRENT_TIMESTAMP),
  ('plan_pro',     '3 Months', 240000, 90, 'quarterly', 1, CURRENT_TIMESTAMP);

-- Members -------------------------------------------------------------------
INSERT OR REPLACE INTO members (id, member_code, full_name, phone, email, gender, plan_id, plan_start, plan_end, stage, whatsapp_opt_in, created_at, updated_at) VALUES
  ('mem_lead', 'PULSE-0001', 'Aarav Sharma', '+919876543210', 'aarav@example.com', 'male', NULL, NULL, NULL, 'lead', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mem_active', 'PULSE-0002', 'Naveen Kumar', '+919876543211', 'naveen@example.com', 'male', 'plan_starter', DATE('now'), DATE('now', '+30 days'), 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mem_lapsed', 'PULSE-0003', 'Priya Patel', '+919876543212', 'priya@example.com', 'female', 'plan_starter', DATE('now', '-60 days'), DATE('now', '-5 days'), 'expired', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Payments ------------------------------------------------------------------
INSERT OR REPLACE INTO payments (id, member_id, amount_cents, method, paid_at, period_start, period_end, created_at) VALUES
  ('pay_1', 'mem_active', 90000, 'cash', DATE('now'), DATE('now'), DATE('now', '+30 days'), CURRENT_TIMESTAMP),
  ('pay_2', 'mem_lapsed', 90000, 'upi', DATE('now', '-60 days'), DATE('now', '-60 days'), DATE('now', '-5 days'), CURRENT_TIMESTAMP);

-- Message templates --------------------------------------------------------
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
INSERT OR REPLACE INTO automation_rules (id, name, trigger, offset_days, template_key, is_enabled) VALUES
  ('rule_expiry_7d',   'Renewal reminder - 7 days before expiry', 'plan_expiring', 7, 'expiry_7d',   1),
  ('rule_expiry_1d',   'Renewal reminder - 1 day before expiry',  'plan_expiring', 1, 'expiry_1d',   1),
  ('rule_payment_due', 'Payment due notice',                      'payment_due',   0, 'payment_due', 1),
  ('rule_welcome',     'Welcome message on signup',               'welcome',       0, 'welcome',     1);

-- Counters -----------------------------------------------------------------
INSERT OR REPLACE INTO counters (name, value) VALUES ('member_code', 3);
