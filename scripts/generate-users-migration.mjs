import fs from 'node:fs';

// Read both CSV files
const usersCsv = fs.readFileSync('c:/Users/ravid/Downloads/Supabase Snippet Untitled query.csv', 'utf-8');
const profilesCsv = fs.readFileSync('c:/Users/ravid/Downloads/Supabase Snippet Untitled query (1).csv', 'utf-8');

function parseCsv(text) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = '';
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let l = 1; l < lines.length; l++) {
    const line = lines[l];
    const values = [];
    let curVal = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        if (inQ && line[j + 1] === '"') {
          curVal += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        values.push(curVal);
        curVal = '';
      } else {
        curVal += c;
      }
    }
    values.push(curVal);

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || null;
    });
    rows.push(obj);
  }
  return rows;
}

const users = parseCsv(usersCsv);
const profiles = parseCsv(profilesCsv);

console.log(`Parsed ${users.length} users and ${profiles.length} profiles.`);

// Create a lookup map for profiles
const profileMap = new Map();
for (const p of profiles) {
  if (p.id) profileMap.set(p.id, p);
}

let sql = `-- =========================================================================
-- FLOWSITES: Restore All 23 Old Users & Profiles
-- Run this in your NEW Supabase Project → SQL Editor → New Query
-- =========================================================================

-- Temporarily disable trigger so manual profile inserts don't conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

`;

for (const u of users) {
  const id = u.id;
  const email = (u.email || '').trim().replace(/'/g, "''");
  const rawMeta = (u.raw_user_meta_data || '{}').replace(/'/g, "''");
  const createdAt = u.created_at || 'NOW()';

  const prof = profileMap.get(id);
  const plan = prof?.plan || 'free';
  const fullName = (prof?.full_name || '').replace(/'/g, "''");
  const avatarUrl = (prof?.avatar_url || '').replace(/'/g, "''");
  const subId = (prof?.razorpay_subscription_id && prof.razorpay_subscription_id !== 'null') ? `'${prof.razorpay_subscription_id}'` : 'NULL';

  sql += `
-- User: ${email} (${plan})
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '${id}',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  '${email}',
  '',
  '${createdAt}',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '${rawMeta}'::jsonb,
  '${createdAt}',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  avatar_url,
  plan,
  razorpay_subscription_id,
  created_at,
  updated_at
) VALUES (
  '${id}',
  '${email}',
  '${fullName}',
  '${avatarUrl}',
  '${plan}',
  ${subId},
  '${createdAt}',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;
`;
}

sql += `
-- Re-enable profile auto-create trigger for future new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

fs.writeFileSync('scripts/restore-users.sql', sql, 'utf-8');
console.log('Successfully generated scripts/restore-users.sql!');
