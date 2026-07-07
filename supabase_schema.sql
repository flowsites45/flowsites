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
