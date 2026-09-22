-- ---------------------------------------------------------------------------
-- PULSE GYM - development seed data
--
-- Contains base message templates and automation rules.
-- Synthetic member and plan data removed for clean initial workspace.
--
-- Apply with:  npm run db:seed:local
-- ---------------------------------------------------------------------------

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
-- member_code sequence starts at 0.
INSERT OR REPLACE INTO counters (name, value) VALUES ('member_code', 0);


