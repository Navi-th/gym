import fs from 'fs';
import path from 'path';

const firstNames = [
  "Aarav", "Ananya", "Rahul", "Priya", "Vikram", "Neha", "Rohan", "Sneha", "Aditya", "Kavya",
  "Karan", "Pooja", "Amit", "Riya", "Sanjay", "Divya", "Deepak", "Anjali", "Suresh", "Meera",
  "Arjun", "Ishita", "Manish", "Shweta", "Rajesh", "Tanvi", "Nikhil", "Simran", "Varun", "Preeti",
  "Kunal", "Swati", "Gaurav", "Nisha", "Alok", "Sunita", "Tarun", "Aarti", "Vikas", "Monika"
];

const lastNames = [
  "Sharma", "Patel", "Verma", "Singh", "Malhotra", "Gupta", "Joshi", "Kumar", "Reddy", "Nair",
  "Rao", "Mehta", "Shah", "Kapoor", "Chawla", "Bhasin", "Deshmukh", "Kulkarni", "Bhat", "Saxena",
  "Bansal", "Agarwal", "Chowdhury", "Dutta", "Das", "Roy", "Sen", "Mukherjee", "Banerjee", "Ghosh"
];

const plans = [
  { id: 'plan_starter_monthly', name: 'Starter Pass', priceCents: 3500, billingPeriod: 'monthly', durationDays: 30 },
  { id: 'plan_starter_annual',  name: 'Starter Pass', priceCents: 34800, billingPeriod: 'annual', durationDays: 365 },
  { id: 'plan_pro_monthly',     name: 'Pro Athlete Pass', priceCents: 6900, billingPeriod: 'monthly', durationDays: 30 },
  { id: 'plan_pro_annual',      name: 'Pro Athlete Pass', priceCents: 70800, billingPeriod: 'annual', durationDays: 365 },
  { id: 'plan_vip_monthly',     name: 'Elite VIP Pass', priceCents: 11900, billingPeriod: 'monthly', durationDays: 30 },
  { id: 'plan_vip_annual',      name: 'Elite VIP Pass', priceCents: 118800, billingPeriod: 'annual', durationDays: 365 },
];

const methods = ['upi', 'cash', 'card', 'bank'];
const genders = ['male', 'female', 'other'];

function pad4(num) {
  return String(num).padStart(4, '0');
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function formatDateTime(d) {
  return d.toISOString().replace('T', ' ').split('.')[0];
}

console.log("Generating 1,000 batched seed records...");

let sql = `-- ---------------------------------------------------------------------------\n`;
sql += `-- PULSE GYM - 1,000 synthetic load testing seed records\n`;
sql += `-- ---------------------------------------------------------------------------\n\n`;

// 1. Insert Plans
sql += `-- Plans --------------------------------------------------------------------\n`;
sql += `INSERT OR REPLACE INTO plans (id, name, price_cents, billing_period, duration_days, is_active) VALUES\n`;
const planRows = plans.map(p => `  ('${p.id}', '${p.name}', ${p.priceCents}, '${p.billingPeriod}', ${p.durationDays}, 1)`);
sql += planRows.join(',\n') + `;\n\n`;

// 2. Build Batched Member, Sub, Pay Inserts
const memberRows = [];
const subRows = [];
const payRows = [];

const today = new Date('2026-09-21');

for (let i = 1; i <= 1000; i++) {
  const idNum = pad4(i);
  const memId = `mem_${idNum}`;
  const subId = `sub_${idNum}`;
  const payId = `pay_${idNum}`;
  const code = `PULSE-${idNum}`;

  const fn = firstNames[(i - 1) % firstNames.length];
  const ln = lastNames[(i + 3) % lastNames.length];
  const fullName = `${fn} ${ln}`;
  const phone = `+9198765${pad4(i)}`;
  const email = `member${idNum}@example.com`;
  const gender = genders[i % genders.length];

  const plan = plans[i % plans.length];
  const optIn = (i % 3 !== 0) ? 1 : 0; // 66% opt-in

  let planStartStr = null;
  let planEndStr = null;
  let subStatus = 'active';
  let stage = 'active';

  if (i % 5 === 0) {
    const daysAgoStart = 40 + (i % 30);
    const daysAgoEnd = 5 + (i % 25);
    const startDate = new Date(today.getTime() - daysAgoStart * 86400000);
    const endDate = new Date(today.getTime() - daysAgoEnd * 86400000);
    planStartStr = `'${formatDate(startDate)}'`;
    planEndStr = `'${formatDate(endDate)}'`;
    subStatus = 'expired';
    stage = 'active';
  } else if (i % 5 === 1) {
    const daysAgoStart = 25;
    const daysAheadEnd = 1 + (i % 6);
    const startDate = new Date(today.getTime() - daysAgoStart * 86400000);
    const endDate = new Date(today.getTime() + daysAheadEnd * 86400000);
    planStartStr = `'${formatDate(startDate)}'`;
    planEndStr = `'${formatDate(endDate)}'`;
    subStatus = 'active';
    stage = 'active';
  } else if (i % 5 === 2) {
    const daysAgoStart = 30 + (i % 30);
    const daysAheadEnd = 60 + (i % 240);
    const startDate = new Date(today.getTime() - daysAgoStart * 86400000);
    const endDate = new Date(today.getTime() + daysAheadEnd * 86400000);
    planStartStr = `'${formatDate(startDate)}'`;
    planEndStr = `'${formatDate(endDate)}'`;
    subStatus = 'active';
    stage = 'active';
  } else if (i % 5 === 3) {
    const daysAgoStart = 10;
    const daysAheadEnd = 20;
    const startDate = new Date(today.getTime() - daysAgoStart * 86400000);
    const endDate = new Date(today.getTime() + daysAheadEnd * 86400000);
    planStartStr = `'${formatDate(startDate)}'`;
    planEndStr = `'${formatDate(endDate)}'`;
    subStatus = 'active';
    stage = 'active';
  } else {
    planStartStr = 'NULL';
    planEndStr = 'NULL';
    stage = 'active';
  }

  const joinedDate = new Date(today.getTime() - (60 + (i % 100)) * 86400000);
  const joinedStr = formatDate(joinedDate);
  const optInAtStr = optIn ? `'${formatDateTime(joinedDate)}'` : 'NULL';
  const planIdVal = planStartStr !== 'NULL' ? `'${plan.id}'` : 'NULL';

  memberRows.push(
    `('${memId}', '${code}', '${fullName.replace(/'/g, "''")}', '${phone}', '${email}', '${gender}', ${planIdVal}, ${planStartStr}, ${planEndStr}, '${stage}', ${optIn}, ${optInAtStr}, '${joinedStr}')`
  );

  if (planStartStr !== 'NULL') {
    subRows.push(
      `('${subId}', '${memId}', '${plan.id}', ${planStartStr}, ${planEndStr}, '${subStatus}', ${plan.priceCents}, 0)`
    );

    const payMethod = methods[i % methods.length];
    const paidAt = planStartStr.replace(/'/g, '') + ' 10:30:00';
    payRows.push(
      `('${payId}', '${memId}', '${subId}', ${plan.priceCents}, '${payMethod}', '${paidAt}', ${planStartStr}, ${planEndStr}, 'REF/SEED/${idNum}', 'Seed payment')`
    );
  }
}

// Function to chunk array into batches of size N
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Write Batched Members
sql += `-- Members (batched 50 per INSERT) ---------------------------------------\n`;
chunkArray(memberRows, 50).forEach(batch => {
  sql += `INSERT OR REPLACE INTO members (id, member_code, full_name, phone, email, gender, plan_id, plan_start, plan_end, stage, whatsapp_opt_in, opt_in_at, joined_at) VALUES\n`;
  sql += batch.join(',\n') + `;\n\n`;
});

// Write Batched Subscriptions
sql += `-- Subscriptions (batched 50 per INSERT) ---------------------------------\n`;
chunkArray(subRows, 50).forEach(batch => {
  sql += `INSERT OR REPLACE INTO subscriptions (id, member_id, plan_id, start_date, end_date, status, price_cents_charged, freeze_days) VALUES\n`;
  sql += batch.join(',\n') + `;\n\n`;
});

// Write Batched Payments
sql += `-- Payments (batched 50 per INSERT) --------------------------------------\n`;
chunkArray(payRows, 50).forEach(batch => {
  sql += `INSERT OR REPLACE INTO payments (id, member_id, subscription_id, amount_cents, method, paid_at, period_start, period_end, reference, note) VALUES\n`;
  sql += batch.join(',\n') + `;\n\n`;
});

// Message templates
sql += `-- Message templates --------------------------------------------------------\n`;
sql += `INSERT OR REPLACE INTO message_templates (id, key, language, category, body, variables) VALUES\n`;
sql += `  ('tpl_expiry_7d', 'expiry_7d', 'en', 'utility', 'Hi {{name}}, your {{plan}} membership expires on {{date}}. Reply here to renew.', '["name","plan","date"]'),\n`;
sql += `  ('tpl_expiry_1d', 'expiry_1d', 'en', 'utility', 'Hi {{name}}, your {{plan}} membership expires tomorrow ({{date}}). Reply here to renew.', '["name","plan","date"]'),\n`;
sql += `  ('tpl_payment_due', 'payment_due', 'en', 'utility', 'Hi {{name}}, a payment of {{amount}} is due for your {{plan}} membership. Reply here if you have already paid.', '["name","amount","plan"]'),\n`;
sql += `  ('tpl_welcome', 'welcome', 'en', 'utility', 'Welcome to PULSE GYM, {{name}}! Your membership code is {{code}}.', '["name","code"]');\n\n`;

// Automation rules
sql += `-- Automation rules ---------------------------------------------------------\n`;
sql += `INSERT OR REPLACE INTO automation_rules (id, name, trigger, offset_days, template_key, is_enabled) VALUES\n`;
sql += `  ('rule_expiry_7d', 'Renewal reminder - 7 days before expiry', 'plan_expiring', 7, 'expiry_7d', 1),\n`;
sql += `  ('rule_expiry_1d', 'Renewal reminder - 1 day before expiry', 'plan_expiring', 1, 'expiry_1d', 1),\n`;
sql += `  ('rule_payment_due', 'Payment due notice', 'payment_due', 0, 'payment_due', 1),\n`;
sql += `  ('rule_welcome', 'Welcome message on signup', 'welcome', 0, 'welcome', 1);\n\n`;

// Counters
sql += `-- Counters -----------------------------------------------------------------\n`;
sql += `INSERT OR REPLACE INTO counters (name, value) VALUES ('member_code', 1000);\n`;

const outputPath = path.join(process.cwd(), 'scripts', 'seed-1000.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Successfully generated 1,000 batched seed records at ${outputPath}!`);
