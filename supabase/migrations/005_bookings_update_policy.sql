-- Permettre à l'utilisateur de mettre à jour ses propres réservations (ex. annulation).
-- Exécuter dans le SQL Editor Supabase après 003_bookings.sql.
-- Sans cette politique, l'annulation depuis "Mes réservations" ne sera pas enregistrée en base.

drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
