-- ════════════════════════════════════════════════════════════════
-- FLOWSITES — Subscriptions Table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  id                    bigint generated always as identity primary key,
  user_id               uuid references auth.users(id) on delete cascade,
  email                 text,
  plan                  text not null check (plan in ('Premium', 'Premium+')),
  billing_cycle         text not null check (billing_cycle in ('Monthly', 'Yearly')),
  razorpay_plan_id      text not null,
  razorpay_subscription_id text,
  razorpay_payment_id   text,
  razorpay_signature    text,
  status                text not null default 'created' check (status in ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired')),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can read their own subscriptions
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own subscriptions
drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own subscriptions
drop policy if exists "Users can update own subscriptions" on public.subscriptions;
create policy "Users can update own subscriptions"
  on public.subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.handle_updated_at();
