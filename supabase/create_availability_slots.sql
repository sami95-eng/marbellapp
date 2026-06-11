-- =================================================================
-- Disponibilités : créneaux par établissement (jour/heure + capacité)
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

create table if not exists public.availability_slots (
  id               uuid primary key default gen_random_uuid(),
  venue_id         uuid not null references public.venues(id) on delete cascade,
  day_of_week      smallint not null check (day_of_week between 0 and 6), -- 0 = dimanche … 6 = samedi
  time             text not null,                                         -- "HH:MM"
  max_capacity     integer not null default 1 check (max_capacity > 0),
  current_bookings integer not null default 0 check (current_bookings >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (venue_id, day_of_week, time)
);

create index if not exists availability_venue_idx on public.availability_slots (venue_id);

alter table public.availability_slots enable row level security;

-- Lecture publique des créneaux actifs (le client voit les dispos)
drop policy if exists "Anyone can read active slots" on public.availability_slots;
create policy "Anyone can read active slots"
  on public.availability_slots for select
  using (is_active = true);

-- Gestion (insert/update/delete) réservée aux partner/admin
drop policy if exists "Partners manage slots" on public.availability_slots;
create policy "Partners manage slots"
  on public.availability_slots for all
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and role in ('partner', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and role in ('partner', 'admin'))
  );

-- Incrémente current_bookings de façon atomique (appelé à la réservation).
-- Renvoie true si le créneau avait de la place (et a été incrémenté), false sinon.
create or replace function public.book_slot(slot_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare ok boolean;
begin
  update public.availability_slots
     set current_bookings = current_bookings + 1
   where id = slot_id
     and is_active = true
     and current_bookings < max_capacity
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

grant execute on function public.book_slot(uuid) to authenticated;

-- Lien réservation → créneau (pour pouvoir libérer la place à l'annulation)
alter table public.bookings
  add column if not exists slot_id uuid references public.availability_slots(id) on delete set null;

-- Libère une place sur un créneau (décrément, plancher à 0).
-- Appelé lors d'une annulation (client ou partenaire).
create or replace function public.release_slot(slot_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.availability_slots
     set current_bookings = greatest(0, current_bookings - 1)
   where id = slot_id;
end;
$$;

grant execute on function public.release_slot(uuid) to authenticated;

-- ── Vérification ─────────────────────────────────────────────────
SELECT venue_id, day_of_week, time, max_capacity, current_bookings, is_active
FROM public.availability_slots ORDER BY venue_id, day_of_week, time;
