-- =================================================================
-- Config des créneaux par établissement : fenêtre horaire + capacité.
-- Les créneaux sont générés toutes les 30 min entre slot_start et slot_end.
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

alter table public.venues
  add column if not exists slot_start       text    not null default '10:00',
  add column if not exists slot_end         text    not null default '00:00',
  add column if not exists default_capacity integer not null default 10;

-- Le partenaire/admin doit pouvoir mettre à jour la config de créneaux.
-- (Policy UPDATE dédiée sur venues pour les rôles partner/admin.)
drop policy if exists "Partners update venues" on public.venues;
create policy "Partners update venues"
  on public.venues for update
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and role in ('partner', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and role in ('partner', 'admin'))
  );

-- ── Vérification ─────────────────────────────────────────────────
SELECT id, name, slot_start, slot_end, default_capacity
FROM public.venues ORDER BY name LIMIT 20;
