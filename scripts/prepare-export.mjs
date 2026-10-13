import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const OLD_STORAGE_PREFIX = `${supabaseUrl}/storage/v1/object/public/templates/`;
const NEW_STORAGE_PREFIX = 'https://pub-6e6682d5b928477ab40c1873a1345ec5.r2.dev/';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function rewriteUrl(url) {
  if (!url) return '';
  return url.replace(OLD_STORAGE_PREFIX, NEW_STORAGE_PREFIX);
}

async function exportAll() {
  console.log('Fetching all templates...');
  const { data: templates, error: tempErr } = await supabase
    .from('templates')
    .select('*')
    .order('id', { ascending: true });

  if (tempErr) throw tempErr;
  console.log(`Fetched ${templates.length} templates.`);

  console.log('Fetching top layouts...');
  const { data: layouts } = await supabase
    .from('top_layouts')
    .select('*')
    .order('position', { ascending: true });
  console.log(`Fetched ${layouts?.length || 0} top layouts.`);

  console.log('Fetching user profiles...');
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*');
  console.log(`Fetched ${profiles?.length || 0} user profiles.`);

  let sql = `-- =========================================================================
-- FLOWSITES: Complete Schema & Data Import for Fresh Supabase Project
-- Generated on: ${new Date().toISOString()}
-- =========================================================================

-- 1. TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.templates (
  id          bigint generated always as identity primary key,
  title       text not null,
  category    text not null default 'Landing Page',
  type        text not null default 'Free' check (type in ('Free', 'Premium', 'Premium Plus')),
  image       text,
  video       text default '',
  prompt      text default '',
  likes       integer default 0,
  published   boolean default false,
  position    integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published templates" ON public.templates;
CREATE POLICY "Public can view published templates"
  ON public.templates FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Authenticated can view all templates" ON public.templates;
CREATE POLICY "Authenticated can view all templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert templates" ON public.templates;
CREATE POLICY "Authenticated can insert templates"
  ON public.templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update templates" ON public.templates;
CREATE POLICY "Authenticated can update templates"
  ON public.templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete templates" ON public.templates;
CREATE POLICY "Authenticated can delete templates"
  ON public.templates FOR DELETE
  TO authenticated
  USING (true);

-- Atomic Likes function
CREATE OR REPLACE FUNCTION public.increment_likes(template_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE public.templates
  SET likes = likes + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'premium', 'premium_plus')),
  razorpay_subscription_id text,
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, plan)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'free'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. TOP LAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.top_layouts (
  id           bigint generated always as identity primary key,
  title        text not null,
  template_ids bigint[] not null default '{}',
  position     integer not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

ALTER TABLE public.top_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view top layouts" ON public.top_layouts;
CREATE POLICY "Public can view top layouts"
  ON public.top_layouts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage top layouts" ON public.top_layouts;
CREATE POLICY "Authenticated can manage top layouts"
  ON public.top_layouts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_name text NOT NULL,
  user_id text,
  user_email text,
  session_id text,
  path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert to analytics_events" ON public.analytics_events;
CREATE POLICY "Allow anon insert to analytics_events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read to authenticated and anon" ON public.analytics_events;
CREATE POLICY "Allow read to authenticated and anon"
  ON public.analytics_events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);

-- =========================================================================
-- 5. TEMPLATES DATA (${templates.length} ROWS WITH CLOUDFLARE R2 URLS)
-- =========================================================================
`;

  for (const t of templates) {
    const videoUrl = rewriteUrl(t.video);
    const imageUrl = rewriteUrl(t.image);

    sql += `INSERT INTO public.templates (title, category, type, image, video, prompt, likes, published, position)
VALUES (
  ${escapeSql(t.title)},
  ${escapeSql(t.category)},
  ${escapeSql(t.type)},
  ${escapeSql(imageUrl)},
  ${escapeSql(videoUrl)},
  ${escapeSql(t.prompt)},
  ${Number(t.likes) || 0},
  ${Boolean(t.published)},
  ${Number(t.position) || 0}
);\n`;
  }

  if (layouts && layouts.length > 0) {
    sql += `\n-- =========================================================================\n`;
    sql += `-- 6. TOP LAYOUTS DATA (${layouts.length} ROWS)\n`;
    sql += `-- =========================================================================\n`;
    for (const l of layouts) {
      const idsArray = Array.isArray(l.template_ids) ? `ARRAY[${l.template_ids.join(',')}]::bigint[]` : "'{}'::bigint[]";
      sql += `INSERT INTO public.top_layouts (title, template_ids, position)\nVALUES (${escapeSql(l.title)}, ${idsArray}, ${Number(l.position) || 0});\n`;
    }
  }

  fs.writeFileSync('scripts/migration_import.sql', sql, 'utf-8');
  console.log('Successfully written to scripts/migration_import.sql!');
}

exportAll().catch(console.error);
