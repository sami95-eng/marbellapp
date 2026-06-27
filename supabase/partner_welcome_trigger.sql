-- =================================================================
-- Email de bienvenue partenaire (automatique)
-- Quand profiles.role passe à 'partner', un trigger appelle (via pg_net)
-- l'edge function partner-welcome, qui envoie l'email Resend de bienvenue.
-- Script idempotent : rejouable sans erreur.
-- Prérequis : edge function partner-welcome déployée avec --no-verify-jwt.
-- Instructions : Supabase Dashboard → SQL Editor → New Query → RUN
-- =================================================================

-- pg_net : appels HTTP sortants depuis Postgres.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_partner_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ne se déclenche qu'à la PROMOTION vers 'partner' (pas sur les autres updates).
  IF NEW.role = 'partner' AND NEW.role IS DISTINCT FROM OLD.role THEN
    PERFORM net.http_post(
      url     := 'https://dbuaonbrjulbvowptqde.supabase.co/functions/v1/partner-welcome',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('userId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_welcome ON public.profiles;
CREATE TRIGGER trg_partner_welcome
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'partner' AND NEW.role IS DISTINCT FROM OLD.role)
  EXECUTE FUNCTION public.notify_partner_welcome();

-- ── Vérification ─────────────────────────────────────────────────
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trg_partner_welcome';
