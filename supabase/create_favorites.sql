-- =================================================================
-- Table FAVORIS — persistance des favoris par utilisateur
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  venue_id    text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, venue_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id);

-- RLS : chaque utilisateur ne voit/gère que ses propres favoris
alter table public.favorites enable row level security;

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
