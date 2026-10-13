import fs from 'node:fs';

const csv = fs.readFileSync('c:/Users/ravid/Downloads/Supabase Snippet Untitled query.csv', 'utf-8');

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

const users = parseCsv(csv);

let sql = `-- =========================================================================
-- FLOWSITES: Restore Google Identities in auth.identities
-- This links all 23 Google accounts so GoTrue does not throw 500
-- =========================================================================
`;

for (const u of users) {
  try {
    const meta = JSON.parse(u.raw_user_meta_data || '{}');
    const isGoogle = meta.iss && meta.iss.includes('google');
    const sub = meta.sub || meta.provider_id;
    if (isGoogle && sub) {
      const identityData = JSON.stringify({
        sub: sub,
        email: u.email,
        email_verified: true,
        full_name: meta.full_name || meta.name || '',
        avatar_url: meta.avatar_url || meta.picture || '',
        name: meta.name || '',
        picture: meta.picture || '',
        provider_id: sub
      }).replace(/'/g, "''");

      sql += `
-- Identity for ${u.email}
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${u.id}',
  '${identityData}'::jsonb,
  'google',
  '${sub}',
  NOW(),
  '${u.created_at}',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();
`;
    }
  } catch (err) {
    console.error('Error for user', u.email, err);
  }
}

fs.writeFileSync('scripts/restore-identities.sql', sql, 'utf-8');
console.log('Successfully generated scripts/restore-identities.sql!');
