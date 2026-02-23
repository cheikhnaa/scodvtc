-- Table des locations (véhicule avec chauffeur, longue durée).
-- OBLIGATOIRE pour que les locations s'affichent dans le tableau de bord (Mon compte).
-- Exécuter dans le SQL Editor Supabase : Dashboard > SQL Editor > New query > coller > Run.

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_ref text not null,
  vehicle_label text not null,
  period text not null,
  start_date date not null,
  end_date date not null,
  pickup_address text,
  total_amount integer not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_rentals_user_id on public.rentals (user_id);
create index if not exists idx_rentals_start_date on public.rentals (start_date desc);
create index if not exists idx_rentals_created_at on public.rentals (created_at desc);

alter table public.rentals enable row level security;

create policy "Users can read own rentals"
  on public.rentals for select
  using (auth.uid() = user_id);

create policy "Users can insert own rentals"
  on public.rentals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rentals"
  on public.rentals for update
  using (auth.uid() = user_id);
