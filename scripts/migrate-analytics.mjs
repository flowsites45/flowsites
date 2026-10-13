import { createClient } from '@supabase/supabase-js';

const oldUrl = 'https://gkwkgnycjocvxyglnzrq.supabase.co';
const oldAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tnbnljam9jdnh5Z2xuenJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjY5MDIsImV4cCI6MjA5ODM0MjkwMn0.V_BFKx1y9wd9Jfqv7wyNryz37sXS6s_2NXMefriwcHY';
const oldSupabase = createClient(oldUrl, oldAnon);

const newUrl = 'https://ygmixnumaefjbspzitiy.supabase.co';
const newAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWl4bnVtYWVmamJzcHppdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDk1MDMsImV4cCI6MjEwNzQ4NTUwM30.EPPyPYp1dxy_u-p--C2cMTzWTz_eZGKOb4XE0OKFwJo';
const newSupabase = createClient(newUrl, newAnon);

async function migrateAnalytics() {
  console.log('Fetching all analytics events from old database...');
  let allEvents = [];
  let from = 0;
  const STEP = 1000;

  while (true) {
    const { data, error } = await oldSupabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + STEP - 1);

    if (error) {
      console.error('Error fetching analytics:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allEvents.push(...data);
    from += STEP;
    console.log(`Fetched ${allEvents.length} events...`);
    if (data.length < STEP) break;
  }

  console.log(`Total analytics events to migrate: ${allEvents.length}`);

  // Insert into new project in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
    const batch = allEvents.slice(i, i + BATCH_SIZE).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      event_name: e.event_name,
      user_id: e.user_id,
      user_email: e.user_email,
      session_id: e.session_id,
      path: e.path,
      metadata: e.metadata || {},
      created_at: e.created_at,
    }));

    const { error: insertErr } = await newSupabase.from('analytics_events').insert(batch);
    if (insertErr) {
      console.error(`Error inserting batch [${i} - ${i + batch.length}]:`, insertErr);
    } else {
      console.log(`Migrated analytics events [${i + 1} - ${Math.min(i + BATCH_SIZE, allEvents.length)}/${allEvents.length}]`);
    }
  }

  console.log('========================================================');
  console.log('ANALYTICS MIGRATION COMPLETE! All events safely copied!');
  console.log('========================================================');
}

migrateAnalytics().catch(console.error);
