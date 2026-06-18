-- =================================================================
-- Onglet "Clients" du dashboard admin
-- Fonction SECURITY DEFINER : agrège profiles + auth.users + bookings.
-- Réservée aux admins (vérif auth.uid() role = 'admin').
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

create or replace function public.get_admin_clients()
returns table (
  id              uuid,
  name            text,
  email           text,
  phone           text,
  created_at      timestamptz,
  last_booking_at timestamptz,
  total_bookings  bigint,
  favorite_venue  text,
  active          boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Seul un admin peut lister les clients
  if not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin') then
    raise exception 'forbidden: admin only';
  end if;

  return query
  select
    p.id,
    coalesce(u.raw_user_meta_data->>'name', p.display_name, split_part(u.email, '@', 1))::text as name,
    u.email::text as email,
    (select b.phone_number from public.bookings b
       where b.user_id = p.id and b.phone_number is not null
       order by b.created_at desc limit 1) as phone,
    p.created_at,
    (select max(b.created_at) from public.bookings b where b.user_id = p.id) as last_booking_at,
    (select count(*) from public.bookings b where b.user_id = p.id) as total_bookings,
    (select b.venue_name from public.bookings b
       where b.user_id = p.id and b.venue_name is not null
       group by b.venue_name order by count(*) desc limit 1) as favorite_venue,
    exists (select 1 from public.bookings b
       where b.user_id = p.id and b.created_at >= now() - interval '30 days') as active
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

grant execute on function public.get_admin_clients() to authenticated;

-- ── Vérification (exécute en tant qu'admin connecté) ─────────────
-- select * from public.get_admin_clients();
