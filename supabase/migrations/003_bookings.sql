-- Table des réservations (trajets) liées à l'utilisateur connecté.
-- OBLIGATOIRE pour que les trajets s'affichent dans le tableau de bord (Mon compte).
-- Exécuter dans le SQL Editor du projet Supabase : Dashboard > SQL Editor > New query > coller ce script > Run.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_ref text not null,
  pickup_address text not null,
  dropoff_address text not null,
  scheduled_date date not null,
  scheduled_time text not null,
  vehicle_class text not null check (vehicle_class in ('confort', 'premium', 'vip')),
  total_amount integer not null,
  deposit_amount integer not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_user_id on public.bookings (user_id);
create index if not exists idx_bookings_scheduled on public.bookings (scheduled_date, scheduled_time);
create index if not exists idx_bookings_created_at on public.bookings (created_at desc);

alter table public.bookings enable row level security;

-- L'utilisateur ne voit et n'insère que ses propres réservations
create policy "Users can read own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);
