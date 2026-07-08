-- ════════════════════════════════════════════════════════════════
-- FLOWSITES — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

-- ── Templates Table ─────────────────────────────────────────────
create table if not exists public.templates (
  id          bigint generated always as identity primary key,
  title       text not null,
  category    text not null default 'Landing Page',
  type        text not null default 'Free' check (type in ('Free', 'Premium')),
  image       text,
  video       text default '',
  prompt      text default '',
  likes       integer default 0,
  published   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Enable Row Level Security ───────────────────────────────────
alter table public.templates enable row level security;

-- ── RLS Policies ────────────────────────────────────────────────

-- Public can read published templates
drop policy if exists "Public can view published templates" on public.templates;
create policy "Public can view published templates"
  on public.templates for select
  using (published = true);

-- Authenticated users can read all templates (admin view)
drop policy if exists "Authenticated can view all templates" on public.templates;
create policy "Authenticated can view all templates"
  on public.templates for select
  to authenticated
  using (true);

-- Authenticated users can insert templates
drop policy if exists "Authenticated can insert templates" on public.templates;
create policy "Authenticated can insert templates"
  on public.templates for insert
  to authenticated
  with check (true);

-- Authenticated users can update templates
drop policy if exists "Authenticated can update templates" on public.templates;
create policy "Authenticated can update templates"
  on public.templates for update
  to authenticated
  using (true)
  with check (true);

-- Authenticated users can delete templates
drop policy if exists "Authenticated can delete templates" on public.templates;
create policy "Authenticated can delete templates"
  on public.templates for delete
  to authenticated
  using (true);

-- ── Updated_at trigger ──────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists templates_updated_at on public.templates;
create trigger templates_updated_at
  before update on public.templates
  for each row
  execute function public.handle_updated_at();

-- ── Increment likes RPC (atomic) ────────────────────────────────
create or replace function public.increment_likes(template_id bigint)
returns void as $$
begin
  update public.templates
  set likes = likes + 1
  where id = template_id;
end;
$$ language plpgsql;

-- ── Storage Bucket for uploads (optional) ───────────────────────
insert into storage.buckets (id, name, public)
values ('templates', 'templates', true)
on conflict (id) do nothing;

-- Storage policies: authenticated can upload, public can read
drop policy if exists "Public can read template assets" on storage.objects;
create policy "Public can read template assets"
  on storage.objects for select
  using (bucket_id = 'templates');

drop policy if exists "Authenticated can upload template assets" on storage.objects;
create policy "Authenticated can upload template assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'templates');

drop policy if exists "Authenticated can delete template assets" on storage.objects;
create policy "Authenticated can delete template assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'templates');

-- ── Top Layouts Table (Row Configuration) ──────────────────────
create table if not exists public.top_layouts (
  id           bigint generated always as identity primary key,
  title        text not null,
  template_ids bigint[] not null default '{}',
  position     integer not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Enable RLS
alter table public.top_layouts enable row level security;

-- RLS Policies
drop policy if exists "Public can view top layouts" on public.top_layouts;
create policy "Public can view top layouts"
  on public.top_layouts for select
  using (true);

drop policy if exists "Authenticated can manage top layouts" on public.top_layouts;
create policy "Authenticated can manage top layouts"
  on public.top_layouts for all
  to authenticated
  using (true)
  with check (true);

-- Add position column to templates table for custom ordering
alter table public.templates add column if not exists position integer default 0;

-- ════════════════════════════════════════════════════════════════
-- SUBSCRIPTION ADDITIONS — Run in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. Update templates type constraint to include Premium Plus
alter table public.templates
  drop constraint if exists templates_type_check;
alter table public.templates
  add constraint templates_type_check
  check (type in ('Free', 'Premium', 'Premium Plus'));

-- 2. User Profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free'
    check (plan in ('free', 'premium', 'premium_plus')),
  razorpay_subscription_id text,
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.user_profiles;
create policy "Users insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- 3. Auto-create free profile on signup (Email or Social/Google Signups)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'free'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

