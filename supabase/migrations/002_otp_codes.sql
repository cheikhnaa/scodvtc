-- Table des codes OTP pour vérification téléphone (inscription / connexion)
-- Exécuter dans le SQL Editor du projet Supabase.

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index pour recherche rapide par numéro et expiration
create index if not exists idx_otp_codes_phone_expires
  on public.otp_codes (phone, expires_at);

-- RLS : seul le service role (API Next.js) doit accéder à cette table
alter table public.otp_codes enable row level security;

-- Nettoyage périodique des codes expirés (optionnel, à exécuter via cron ou Edge Function)
-- delete from public.otp_codes where expires_at < now();
