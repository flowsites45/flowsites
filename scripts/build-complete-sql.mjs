import fs from 'node:fs';

const usersSql = fs.readFileSync('scripts/restore-users.sql', 'utf-8');
const identitiesSql = fs.readFileSync('scripts/restore-identities.sql', 'utf-8');

// Filter out admin@flowsites.com block because admin is already registered and working
const cleanedUsersSql = usersSql.replace(/-- User: admin@flowsites\.com[\s\S]*?avatar_url = EXCLUDED\.avatar_url;\n\n/g, '');

const combined = `-- =========================================================================
-- FLOWSITES MASTER FIX: RESTORE IDENTITIES & USERS & ENSURE POLICIES
-- =========================================================================

-- 1. Ensure user_profiles table has proper triggers & permissions
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  plan text DEFAULT 'free',
  razorpay_subscription_id text,
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 2. Clean trigger function for new OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'free'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN user_profiles.full_name IS NULL OR user_profiles.full_name = '' THEN EXCLUDED.full_name ELSE user_profiles.full_name END,
    avatar_url = CASE WHEN user_profiles.avatar_url IS NULL OR user_profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE user_profiles.avatar_url END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Restore all 22 historical Google users into auth.users and user_profiles
${cleanedUsersSql}

-- 4. Restore auth.identities so Google OAuth maps directly to the users
${identitiesSql}

-- 5. Set Admin permissions & ensure admin profile exists
INSERT INTO public.user_profiles (id, email, full_name, plan)
SELECT id, email, 'Admin', 'premium_plus'
FROM auth.users WHERE email = 'admin@flowsites.com'
ON CONFLICT (id) DO UPDATE SET plan = 'premium_plus';
`;

fs.writeFileSync('scripts/complete-migration-setup.sql', combined, 'utf-8');
console.log('Successfully created scripts/complete-migration-setup.sql!');
