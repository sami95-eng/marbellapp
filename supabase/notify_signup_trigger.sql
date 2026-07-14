-- =================================================================
-- Alerte email à chaque nouvelle inscription classique (utilisateur)
-- Quand une ligne est créée dans public.profiles (role 'user'), un trigger
-- appelle (via pg_net) l'edge function notify-signup, qui envoie l'email Resend
-- d'alerte à l'équipe.
-- N'affecte PAS handle_new_user / on_auth_user_created : trigger séparé, en
-- parallèle, sur public.profiles.
-- Script idempotent : rejouable sans erreur.
-- Prérequis : edge function notify-signup déployée avec --no-verify-jwt.
-- Instructions : Supabase Dashboard -> SQL Editor -> New Query -> RUN
-- =================================================================

-- pg_net : appels HTTP sortants depuis Postgres.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://dbuaonbrjulbvowptqde.supabase.co/functions/v1/notify-signup',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object('userId', NEW.id, 'name', NEW.display_name)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_signup ON public.profiles;
CREATE TRIGGER trg_notify_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'user')
  EXECUTE FUNCTION public.notify_new_signup();

-- Verification :
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trg_notify_signup';
