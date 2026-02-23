-- Table des messages de contact (assistance + formulaire entreprise)
-- Exécuter ce script dans l’éditeur SQL du projet Supabase (Dashboard > SQL Editor).

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  source text not null default 'assistance' check (source in ('assistance', 'entreprise')),
  payload jsonb,
  created_at timestamptz not null default now()
);

-- RLS : aucune politique = seuls les appels avec la clé "service role" (API Next.js) peuvent accéder à la table
alter table public.contact_messages enable row level security;

-- Optionnel : index pour filtrer par source et date
create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);
create index if not exists idx_contact_messages_source on public.contact_messages (source);
