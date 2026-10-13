-- =========================================================================
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
-- =========================================================================
-- FLOWSITES: Restore All 23 Old Users & Profiles
-- Run this in your NEW Supabase Project → SQL Editor → New Query
-- =========================================================================

-- Temporarily disable trigger so manual profile inserts don't conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ── Subscriptions Table for Razorpay ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    bigint generated always as identity primary key,
  user_id               uuid references auth.users(id) on delete cascade,
  email                 text,
  plan                  text,
  billing_cycle         text,
  razorpay_plan_id      text,
  razorpay_subscription_id text,
  razorpay_payment_id   text,
  razorpay_signature    text,
  status                text not null default 'created',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on subscriptions" ON public.subscriptions;
CREATE POLICY "Allow all on subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);


-- User: samsolutions567@gmail.com (premium_plus)
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
  '4f8cdb7e-7364-49d3-a02e-02df60381018',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'samsolutions567@gmail.com',
  '',
  '2026-07-07 13:52:10.546831+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"101124494531592479151","name":"Ai sam","email":"samsolutions567@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c","full_name":"Ai sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c","provider_id":"101124494531592479151","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-07-07 13:52:10.546831+00',
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
  '4f8cdb7e-7364-49d3-a02e-02df60381018',
  'samsolutions567@gmail.com',
  'Ai sam',
  'https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c',
  'premium_plus',
  NULL,
  '2026-07-07 13:52:10.546831+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: flowsites45@gmail.com (free)
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
  '4c663af7-8503-4bd4-8003-36786e6a6bf8',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'flowsites45@gmail.com',
  '',
  '2026-07-08 08:17:07.562821+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"110581743057842624524","name":"Flowsites","email":"flowsites45@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c","full_name":"Flowsites","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c","provider_id":"110581743057842624524","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-07-08 08:17:07.562821+00',
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
  '4c663af7-8503-4bd4-8003-36786e6a6bf8',
  'flowsites45@gmail.com',
  'Flowsites',
  'https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c',
  'free',
  NULL,
  '2026-07-08 08:17:07.562821+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: samsolutions10@gmail.com (free)
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
  '2624a3e0-a280-4d0a-8b52-cd540d04ef83',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'samsolutions10@gmail.com',
  '',
  '2026-07-08 06:37:28.126434+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"113140074412134179501","name":"Ai Sam","email":"samsolutions10@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocK2Czmw4gZgHx1JtsI5AosBOUCmO9MUDq4TOOiXVGdkJ9sB3g=s96-c","full_name":"Ai Sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocK2Czmw4gZgHx1JtsI5AosBOUCmO9MUDq4TOOiXVGdkJ9sB3g=s96-c","provider_id":"113140074412134179501","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-07-08 06:37:28.126434+00',
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
  '2624a3e0-a280-4d0a-8b52-cd540d04ef83',
  'samsolutions10@gmail.com',
  'null',
  'null',
  'free',
  NULL,
  '2026-07-08 06:37:28.126434+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: samsolutions11111@gmail.com (free)
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
  'c8c2fac7-abfd-4aca-ae9d-7e2bca1c1b19',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'samsolutions11111@gmail.com',
  '',
  '2026-07-08 08:32:16.908657+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"113090589117662526367","name":"Ai Sam","email":"samsolutions11111@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c","full_name":"Ai Sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c","provider_id":"113090589117662526367","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-07-08 08:32:16.908657+00',
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
  'c8c2fac7-abfd-4aca-ae9d-7e2bca1c1b19',
  'samsolutions11111@gmail.com',
  'Ai Sam',
  'https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c',
  'free',
  NULL,
  '2026-07-08 08:32:16.908657+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: akinwumimakinde11@gmail.com (free)
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
  '3371527c-5ba6-4daf-8041-b1a0ce095d97',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'akinwumimakinde11@gmail.com',
  '',
  '2026-10-11 21:39:09.882586+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"sub":"3371527c-5ba6-4daf-8041-b1a0ce095d97","email":"akinwumimakinde11@gmail.com","full_name":"akinwumi makinde","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-11 21:39:09.882586+00',
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
  '3371527c-5ba6-4daf-8041-b1a0ce095d97',
  'akinwumimakinde11@gmail.com',
  'akinwumi makinde',
  '',
  'free',
  NULL,
  '2026-10-11 21:39:09.882586+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: humans@bombaymedia.in (free)
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
  '2d0081ab-5890-47a7-a240-8632c8d51580',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'humans@bombaymedia.in',
  '',
  '2026-10-13 10:49:45.05399+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"100684687917561729530","name":"Humans of Bombay Media","email":"humans@bombaymedia.in","full_name":"Humans of Bombay Media","provider_id":"100684687917561729530","custom_claims":{"hd":"bombaymedia.in"},"email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-13 10:49:45.05399+00',
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
  '2d0081ab-5890-47a7-a240-8632c8d51580',
  'humans@bombaymedia.in',
  'Humans of Bombay Media',
  '',
  'free',
  NULL,
  '2026-10-13 10:49:45.05399+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: 24r01a6651@cmrithyderabad.edu.in (free)
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
  'efbadbd4-72ac-4577-903a-a830adb278ee',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  '24r01a6651@cmrithyderabad.edu.in',
  '',
  '2026-07-14 16:18:29.04566+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"117591415583892876749","name":"SAJAL SHRIVASTAVA 24R01A6651","email":"24r01a6651@cmrithyderabad.edu.in","picture":"https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c","full_name":"SAJAL SHRIVASTAVA 24R01A6651","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c","provider_id":"117591415583892876749","custom_claims":{"hd":"cmrithyderabad.edu.in"},"email_verified":true,"phone_verified":false}'::jsonb,
  '2026-07-14 16:18:29.04566+00',
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
  'efbadbd4-72ac-4577-903a-a830adb278ee',
  '24r01a6651@cmrithyderabad.edu.in',
  'SAJAL SHRIVASTAVA 24R01A6651',
  'https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c',
  'free',
  NULL,
  '2026-07-14 16:18:29.04566+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: x0toxin86@gmail.com (free)
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
  '9765b742-969d-49c2-89bf-bfcc5d6e051f',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'x0toxin86@gmail.com',
  '',
  '2026-08-04 10:57:11.783356+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"102148380377325517401","name":"X0 Toxin","email":"x0toxin86@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c","full_name":"X0 Toxin","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c","provider_id":"102148380377325517401","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-08-04 10:57:11.783356+00',
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
  '9765b742-969d-49c2-89bf-bfcc5d6e051f',
  'x0toxin86@gmail.com',
  'X0 Toxin',
  'https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c',
  'free',
  NULL,
  '2026-08-04 10:57:11.783356+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: maxweb254@gmail.com (free)
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
  '1dc45f6a-7575-4000-a168-362e4b55af50',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'maxweb254@gmail.com',
  '',
  '2026-07-23 17:21:08.016656+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"102877265610532099715","name":"max web","email":"maxweb254@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c","full_name":"max web","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c","provider_id":"102877265610532099715","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-07-23 17:21:08.016656+00',
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
  '1dc45f6a-7575-4000-a168-362e4b55af50',
  'maxweb254@gmail.com',
  'max web',
  'https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c',
  'free',
  NULL,
  '2026-07-23 17:21:08.016656+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: vallurichard1234@gmail.com (free)
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
  '085e2c3a-0e11-4e23-bd81-42c3c33591f1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'vallurichard1234@gmail.com',
  '',
  '2026-08-01 06:11:34.032402+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"108716784741082937597","name":"Richard Valluri","email":"vallurichard1234@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c","full_name":"Richard Valluri","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c","provider_id":"108716784741082937597","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-08-01 06:11:34.032402+00',
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
  '085e2c3a-0e11-4e23-bd81-42c3c33591f1',
  'vallurichard1234@gmail.com',
  'Richard Valluri',
  'https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c',
  'free',
  NULL,
  '2026-08-01 06:11:34.032402+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: khantaranum954@gmail.com (free)
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
  '6d46ffb4-f85f-4640-8faf-65227e7685de',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'khantaranum954@gmail.com',
  '',
  '2026-10-09 15:51:23.50993+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"112933340019847858346","name":"Taranum Khan","email":"khantaranum954@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c","full_name":"Taranum Khan","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c","provider_id":"112933340019847858346","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-09 15:51:23.50993+00',
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
  '6d46ffb4-f85f-4640-8faf-65227e7685de',
  'khantaranum954@gmail.com',
  'Taranum Khan',
  'https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c',
  'free',
  NULL,
  '2026-10-09 15:51:23.50993+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: vinaycharyvelpula@gmail.com (free)
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
  '3f0e3395-397a-403e-92d2-489ef4596367',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'vinaycharyvelpula@gmail.com',
  '',
  '2026-08-08 04:23:06.768622+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"100413637841018368727","name":"Vinay Velpula","email":"vinaycharyvelpula@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c","full_name":"Vinay Velpula","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c","provider_id":"100413637841018368727","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-08-08 04:23:06.768622+00',
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
  '3f0e3395-397a-403e-92d2-489ef4596367',
  'vinaycharyvelpula@gmail.com',
  'Vinay Velpula',
  'https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c',
  'free',
  NULL,
  '2026-08-08 04:23:06.768622+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: greyoo365@gmail.com (premium)
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
  'f7ee38af-793b-4943-aa1e-0b3a016bcd82',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'greyoo365@gmail.com',
  '',
  '2026-08-05 20:30:28.037814+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"116081353487055677017","name":"Greyo","email":"greyoo365@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c","full_name":"Greyo","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c","provider_id":"116081353487055677017","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-08-05 20:30:28.037814+00',
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
  'f7ee38af-793b-4943-aa1e-0b3a016bcd82',
  'greyoo365@gmail.com',
  'Greyo',
  'https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c',
  'premium',
  NULL,
  '2026-08-05 20:30:28.037814+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: syed.imran8751@gmail.com (free)
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
  '01010706-3df0-4fac-95fc-dbb212608d42',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'syed.imran8751@gmail.com',
  '',
  '2026-10-09 15:19:09.74556+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"118194968989117649769","name":"syed imran","email":"syed.imran8751@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c","full_name":"syed imran","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c","provider_id":"118194968989117649769","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-09 15:19:09.74556+00',
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
  '01010706-3df0-4fac-95fc-dbb212608d42',
  'syed.imran8751@gmail.com',
  'syed imran',
  'https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c',
  'free',
  NULL,
  '2026-10-09 15:19:09.74556+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: emmanuelkeys089@gmail.com (premium_plus)
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
  '52bcaf2d-fa16-4906-a2bf-84041cb41519',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'emmanuelkeys089@gmail.com',
  '',
  '2026-08-12 12:12:16.449344+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"107675939047433589007","name":"EMMANUEL KEYS","email":"emmanuelkeys089@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c","full_name":"EMMANUEL KEYS","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c","provider_id":"107675939047433589007","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-08-12 12:12:16.449344+00',
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
  '52bcaf2d-fa16-4906-a2bf-84041cb41519',
  'emmanuelkeys089@gmail.com',
  'EMMANUEL KEYS',
  'https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c',
  'premium_plus',
  NULL,
  '2026-08-12 12:12:16.449344+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: azeemakinpelu2008@gmail.com (free)
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
  '0fd3661e-2349-4429-aebd-91ce580fc33a',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'azeemakinpelu2008@gmail.com',
  '',
  '2026-10-10 20:21:09.828133+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"111759418104565807244","name":"Azeem Akinpelu","email":"azeemakinpelu2008@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c","full_name":"Azeem Akinpelu","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c","provider_id":"111759418104565807244","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-10 20:21:09.828133+00',
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
  '0fd3661e-2349-4429-aebd-91ce580fc33a',
  'azeemakinpelu2008@gmail.com',
  'Azeem Akinpelu',
  'https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c',
  'free',
  NULL,
  '2026-10-10 20:21:09.828133+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: prithu.bansal05@gmail.com (free)
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
  '23ca614f-f244-4a41-9a7b-69e4556de5be',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'prithu.bansal05@gmail.com',
  '',
  '2026-10-09 15:23:05.500633+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"116849915351808639522","name":"prithu bansal","email":"prithu.bansal05@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c","full_name":"prithu bansal","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c","provider_id":"116849915351808639522","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-09 15:23:05.500633+00',
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
  '23ca614f-f244-4a41-9a7b-69e4556de5be',
  'prithu.bansal05@gmail.com',
  'prithu bansal',
  'https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c',
  'free',
  NULL,
  '2026-10-09 15:23:05.500633+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: neonghost2401@gmail.com (free)
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
  'b2b7ae8e-a7ef-4740-84d1-1348cdda79d3',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'neonghost2401@gmail.com',
  '',
  '2026-10-09 19:19:42.572579+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"113889209033551004961","name":"Neon Ghost","email":"neonghost2401@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c","full_name":"Neon Ghost","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c","provider_id":"113889209033551004961","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-09 19:19:42.572579+00',
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
  'b2b7ae8e-a7ef-4740-84d1-1348cdda79d3',
  'neonghost2401@gmail.com',
  'Neon Ghost',
  'https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c',
  'free',
  NULL,
  '2026-10-09 19:19:42.572579+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: gangularaviteja2807@gmail.com (free)
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
  '3a1075f4-1585-439a-b6b1-63617721900b',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'gangularaviteja2807@gmail.com',
  '',
  '2026-10-11 15:48:37.554314+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"100302890113128019583","name":"Ravi Teja","email":"gangularaviteja2807@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c","full_name":"Ravi Teja","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c","provider_id":"100302890113128019583","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-11 15:48:37.554314+00',
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
  '3a1075f4-1585-439a-b6b1-63617721900b',
  'gangularaviteja2807@gmail.com',
  'Ravi Teja',
  'https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c',
  'free',
  NULL,
  '2026-10-11 15:48:37.554314+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: abhishek@whitethoughts.in (free)
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
  '86e2b3eb-3a94-4b8e-a1e9-dea33dd10d0c',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'abhishek@whitethoughts.in',
  '',
  '2026-10-12 05:02:35.63112+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"108779592984242328822","name":"Abhishek Tejith Kumar","email":"abhishek@whitethoughts.in","picture":"https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c","full_name":"Abhishek Tejith Kumar","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c","provider_id":"108779592984242328822","custom_claims":{"hd":"whitethoughts.in"},"email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-12 05:02:35.63112+00',
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
  '86e2b3eb-3a94-4b8e-a1e9-dea33dd10d0c',
  'abhishek@whitethoughts.in',
  'Abhishek Tejith Kumar',
  'https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c',
  'free',
  NULL,
  '2026-10-12 05:02:35.63112+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: theabdzin77@gmail.com (free)
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
  '807b6e98-7cbb-4c8f-8540-4714798efbfc',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'theabdzin77@gmail.com',
  '',
  '2026-10-11 19:02:19.078257+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"117822375434319365974","name":"design talk bro","email":"theabdzin77@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c","full_name":"design talk bro","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c","provider_id":"117822375434319365974","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-11 19:02:19.078257+00',
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
  '807b6e98-7cbb-4c8f-8540-4714798efbfc',
  'theabdzin77@gmail.com',
  'design talk bro',
  'https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c',
  'free',
  NULL,
  '2026-10-11 19:02:19.078257+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- User: madhukiran301@gmail.com (free)
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
  '5a60a570-9b21-4a5c-94d9-e7e45fc37fa5',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'madhukiran301@gmail.com',
  '',
  '2026-10-12 05:31:17.314345+00',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"iss":"https://accounts.google.com","sub":"111269437099345756411","name":"Madhu Kiran","email":"madhukiran301@gmail.com","picture":"https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c","full_name":"Madhu Kiran","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c","provider_id":"111269437099345756411","email_verified":true,"phone_verified":false}'::jsonb,
  '2026-10-12 05:31:17.314345+00',
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
  '5a60a570-9b21-4a5c-94d9-e7e45fc37fa5',
  'madhukiran301@gmail.com',
  'Madhu Kiran',
  'https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c',
  'free',
  NULL,
  '2026-10-12 05:31:17.314345+00',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET
  plan = EXCLUDED.plan,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- Re-enable profile auto-create trigger for future new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 4. Restore auth.identities so Google OAuth maps directly to the users
-- =========================================================================
-- FLOWSITES: Restore Google Identities in auth.identities
-- This links all 23 Google accounts so GoTrue does not throw 500
-- =========================================================================

-- Identity for samsolutions567@gmail.com
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
  '4f8cdb7e-7364-49d3-a02e-02df60381018',
  '{"sub":"101124494531592479151","email":"samsolutions567@gmail.com","email_verified":true,"full_name":"Ai sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c","name":"Ai sam","picture":"https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c","provider_id":"101124494531592479151"}'::jsonb,
  'google',
  '101124494531592479151',
  NOW(),
  '2026-07-07 13:52:10.546831+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for flowsites45@gmail.com
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
  '4c663af7-8503-4bd4-8003-36786e6a6bf8',
  '{"sub":"110581743057842624524","email":"flowsites45@gmail.com","email_verified":true,"full_name":"Flowsites","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c","name":"Flowsites","picture":"https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c","provider_id":"110581743057842624524"}'::jsonb,
  'google',
  '110581743057842624524',
  NOW(),
  '2026-07-08 08:17:07.562821+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for samsolutions10@gmail.com
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
  '2624a3e0-a280-4d0a-8b52-cd540d04ef83',
  '{"sub":"113140074412134179501","email":"samsolutions10@gmail.com","email_verified":true,"full_name":"Ai Sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocK2Czmw4gZgHx1JtsI5AosBOUCmO9MUDq4TOOiXVGdkJ9sB3g=s96-c","name":"Ai Sam","picture":"https://lh3.googleusercontent.com/a/ACg8ocK2Czmw4gZgHx1JtsI5AosBOUCmO9MUDq4TOOiXVGdkJ9sB3g=s96-c","provider_id":"113140074412134179501"}'::jsonb,
  'google',
  '113140074412134179501',
  NOW(),
  '2026-07-08 06:37:28.126434+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for samsolutions11111@gmail.com
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
  'c8c2fac7-abfd-4aca-ae9d-7e2bca1c1b19',
  '{"sub":"113090589117662526367","email":"samsolutions11111@gmail.com","email_verified":true,"full_name":"Ai Sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c","name":"Ai Sam","picture":"https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c","provider_id":"113090589117662526367"}'::jsonb,
  'google',
  '113090589117662526367',
  NOW(),
  '2026-07-08 08:32:16.908657+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for humans@bombaymedia.in
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
  '2d0081ab-5890-47a7-a240-8632c8d51580',
  '{"sub":"100684687917561729530","email":"humans@bombaymedia.in","email_verified":true,"full_name":"Humans of Bombay Media","avatar_url":"","name":"Humans of Bombay Media","picture":"","provider_id":"100684687917561729530"}'::jsonb,
  'google',
  '100684687917561729530',
  NOW(),
  '2026-10-13 10:49:45.05399+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for 24r01a6651@cmrithyderabad.edu.in
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
  'efbadbd4-72ac-4577-903a-a830adb278ee',
  '{"sub":"117591415583892876749","email":"24r01a6651@cmrithyderabad.edu.in","email_verified":true,"full_name":"SAJAL SHRIVASTAVA 24R01A6651","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c","name":"SAJAL SHRIVASTAVA 24R01A6651","picture":"https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c","provider_id":"117591415583892876749"}'::jsonb,
  'google',
  '117591415583892876749',
  NOW(),
  '2026-07-14 16:18:29.04566+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for x0toxin86@gmail.com
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
  '9765b742-969d-49c2-89bf-bfcc5d6e051f',
  '{"sub":"102148380377325517401","email":"x0toxin86@gmail.com","email_verified":true,"full_name":"X0 Toxin","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c","name":"X0 Toxin","picture":"https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c","provider_id":"102148380377325517401"}'::jsonb,
  'google',
  '102148380377325517401',
  NOW(),
  '2026-08-04 10:57:11.783356+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for maxweb254@gmail.com
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
  '1dc45f6a-7575-4000-a168-362e4b55af50',
  '{"sub":"102877265610532099715","email":"maxweb254@gmail.com","email_verified":true,"full_name":"max web","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c","name":"max web","picture":"https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c","provider_id":"102877265610532099715"}'::jsonb,
  'google',
  '102877265610532099715',
  NOW(),
  '2026-07-23 17:21:08.016656+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for vallurichard1234@gmail.com
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
  '085e2c3a-0e11-4e23-bd81-42c3c33591f1',
  '{"sub":"108716784741082937597","email":"vallurichard1234@gmail.com","email_verified":true,"full_name":"Richard Valluri","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c","name":"Richard Valluri","picture":"https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c","provider_id":"108716784741082937597"}'::jsonb,
  'google',
  '108716784741082937597',
  NOW(),
  '2026-08-01 06:11:34.032402+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for khantaranum954@gmail.com
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
  '6d46ffb4-f85f-4640-8faf-65227e7685de',
  '{"sub":"112933340019847858346","email":"khantaranum954@gmail.com","email_verified":true,"full_name":"Taranum Khan","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c","name":"Taranum Khan","picture":"https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c","provider_id":"112933340019847858346"}'::jsonb,
  'google',
  '112933340019847858346',
  NOW(),
  '2026-10-09 15:51:23.50993+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for vinaycharyvelpula@gmail.com
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
  '3f0e3395-397a-403e-92d2-489ef4596367',
  '{"sub":"100413637841018368727","email":"vinaycharyvelpula@gmail.com","email_verified":true,"full_name":"Vinay Velpula","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c","name":"Vinay Velpula","picture":"https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c","provider_id":"100413637841018368727"}'::jsonb,
  'google',
  '100413637841018368727',
  NOW(),
  '2026-08-08 04:23:06.768622+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for greyoo365@gmail.com
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
  'f7ee38af-793b-4943-aa1e-0b3a016bcd82',
  '{"sub":"116081353487055677017","email":"greyoo365@gmail.com","email_verified":true,"full_name":"Greyo","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c","name":"Greyo","picture":"https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c","provider_id":"116081353487055677017"}'::jsonb,
  'google',
  '116081353487055677017',
  NOW(),
  '2026-08-05 20:30:28.037814+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for syed.imran8751@gmail.com
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
  '01010706-3df0-4fac-95fc-dbb212608d42',
  '{"sub":"118194968989117649769","email":"syed.imran8751@gmail.com","email_verified":true,"full_name":"syed imran","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c","name":"syed imran","picture":"https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c","provider_id":"118194968989117649769"}'::jsonb,
  'google',
  '118194968989117649769',
  NOW(),
  '2026-10-09 15:19:09.74556+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for emmanuelkeys089@gmail.com
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
  '52bcaf2d-fa16-4906-a2bf-84041cb41519',
  '{"sub":"107675939047433589007","email":"emmanuelkeys089@gmail.com","email_verified":true,"full_name":"EMMANUEL KEYS","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c","name":"EMMANUEL KEYS","picture":"https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c","provider_id":"107675939047433589007"}'::jsonb,
  'google',
  '107675939047433589007',
  NOW(),
  '2026-08-12 12:12:16.449344+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for azeemakinpelu2008@gmail.com
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
  '0fd3661e-2349-4429-aebd-91ce580fc33a',
  '{"sub":"111759418104565807244","email":"azeemakinpelu2008@gmail.com","email_verified":true,"full_name":"Azeem Akinpelu","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c","name":"Azeem Akinpelu","picture":"https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c","provider_id":"111759418104565807244"}'::jsonb,
  'google',
  '111759418104565807244',
  NOW(),
  '2026-10-10 20:21:09.828133+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for prithu.bansal05@gmail.com
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
  '23ca614f-f244-4a41-9a7b-69e4556de5be',
  '{"sub":"116849915351808639522","email":"prithu.bansal05@gmail.com","email_verified":true,"full_name":"prithu bansal","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c","name":"prithu bansal","picture":"https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c","provider_id":"116849915351808639522"}'::jsonb,
  'google',
  '116849915351808639522',
  NOW(),
  '2026-10-09 15:23:05.500633+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for neonghost2401@gmail.com
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
  'b2b7ae8e-a7ef-4740-84d1-1348cdda79d3',
  '{"sub":"113889209033551004961","email":"neonghost2401@gmail.com","email_verified":true,"full_name":"Neon Ghost","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c","name":"Neon Ghost","picture":"https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c","provider_id":"113889209033551004961"}'::jsonb,
  'google',
  '113889209033551004961',
  NOW(),
  '2026-10-09 19:19:42.572579+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for gangularaviteja2807@gmail.com
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
  '3a1075f4-1585-439a-b6b1-63617721900b',
  '{"sub":"100302890113128019583","email":"gangularaviteja2807@gmail.com","email_verified":true,"full_name":"Ravi Teja","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c","name":"Ravi Teja","picture":"https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c","provider_id":"100302890113128019583"}'::jsonb,
  'google',
  '100302890113128019583',
  NOW(),
  '2026-10-11 15:48:37.554314+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for abhishek@whitethoughts.in
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
  '86e2b3eb-3a94-4b8e-a1e9-dea33dd10d0c',
  '{"sub":"108779592984242328822","email":"abhishek@whitethoughts.in","email_verified":true,"full_name":"Abhishek Tejith Kumar","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c","name":"Abhishek Tejith Kumar","picture":"https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c","provider_id":"108779592984242328822"}'::jsonb,
  'google',
  '108779592984242328822',
  NOW(),
  '2026-10-12 05:02:35.63112+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for theabdzin77@gmail.com
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
  '807b6e98-7cbb-4c8f-8540-4714798efbfc',
  '{"sub":"117822375434319365974","email":"theabdzin77@gmail.com","email_verified":true,"full_name":"design talk bro","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c","name":"design talk bro","picture":"https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c","provider_id":"117822375434319365974"}'::jsonb,
  'google',
  '117822375434319365974',
  NOW(),
  '2026-10-11 19:02:19.078257+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for madhukiran301@gmail.com
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
  '5a60a570-9b21-4a5c-94d9-e7e45fc37fa5',
  '{"sub":"111269437099345756411","email":"madhukiran301@gmail.com","email_verified":true,"full_name":"Madhu Kiran","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c","name":"Madhu Kiran","picture":"https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c","provider_id":"111269437099345756411"}'::jsonb,
  'google',
  '111269437099345756411',
  NOW(),
  '2026-10-12 05:31:17.314345+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();


-- 5. Set Admin permissions & ensure admin profile exists
INSERT INTO public.user_profiles (id, email, full_name, plan)
SELECT id, email, 'Admin', 'premium_plus'
FROM auth.users WHERE email = 'admin@flowsites.com'
ON CONFLICT (id) DO UPDATE SET plan = 'premium_plus';
