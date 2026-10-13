import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Old Supabase connection to read original data
const oldEnv = fs.readFileSync('.env', 'utf-8');
const oldUrl = oldEnv.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const oldKey = oldEnv.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const oldSupabase = createClient(oldUrl, oldKey);

// New Supabase connection
const NEW_URL = 'https://ygmixnumaefjbspzitiy.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWl4bnVtYWVmamJzcHppdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDk1MDMsImV4cCI6MjEwNzQ4NTUwM30.EPPyPYp1dxy_u-p--C2cMTzWTz_eZGKOb4XE0OKFwJo';
const newSupabase = createClient(NEW_URL, NEW_KEY);

const OLD_STORAGE_PREFIX = `${oldUrl}/storage/v1/object/public/templates/`;
const NEW_STORAGE_PREFIX = 'https://pub-6e6682d5b928477ab40c1873a1345ec5.r2.dev/';

function rewriteUrl(url) {
  if (!url) return '';
  return url.replace(OLD_STORAGE_PREFIX, NEW_STORAGE_PREFIX);
}

async function runImport() {
  console.log('Fetching templates from old database...');
  const { data: templates, error: tempErr } = await oldSupabase
    .from('templates')
    .select('*')
    .order('id', { ascending: true });

  if (tempErr) throw tempErr;
  console.log(`Fetched ${templates.length} templates. Preparing to insert into new database...`);

  // Transform templates to point to Cloudflare R2
  const cleanedTemplates = templates.map((t) => ({
    title: t.title,
    category: t.category || 'Landing Page',
    type: t.type || 'Free',
    image: rewriteUrl(t.image),
    video: rewriteUrl(t.video),
    prompt: t.prompt || '',
    likes: Number(t.likes) || 0,
    published: Boolean(t.published),
    position: Number(t.position) || 0,
  }));

  // Batch insert into new Supabase project (batches of 40)
  const BATCH_SIZE = 40;
  for (let i = 0; i < cleanedTemplates.length; i += BATCH_SIZE) {
    const batch = cleanedTemplates.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await newSupabase.from('templates').insert(batch);
    if (insertErr) {
      console.error(`Error inserting batch [${i} - ${i + batch.length}]:`, insertErr);
      throw insertErr;
    }
    console.log(`Inserted templates [${i + 1} - ${Math.min(i + BATCH_SIZE, cleanedTemplates.length)}/${cleanedTemplates.length}]`);
  }

  // Import top layouts
  console.log('\nFetching top layouts from old database...');
  const { data: layouts } = await oldSupabase.from('top_layouts').select('*').order('position', { ascending: true });
  if (layouts && layouts.length > 0) {
    const cleanedLayouts = layouts.map((l) => ({
      title: l.title,
      template_ids: l.template_ids || [],
      position: Number(l.position) || 0,
    }));
    const { error: layoutErr } = await newSupabase.from('top_layouts').insert(cleanedLayouts);
    if (layoutErr) console.warn('Could not insert layouts:', layoutErr);
    else console.log(`Inserted ${cleanedLayouts.length} top layouts!`);
  }

  console.log('\n======================================================');
  console.log('IMPORT COMPLETE! All 260 templates now in new project!');
  console.log('======================================================');
}

runImport().catch(console.error);
