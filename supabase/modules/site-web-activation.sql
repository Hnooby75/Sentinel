-- ============================================
-- supabase/modules/site-web-activation.sql
-- Ajoute le champ site_web_actif sur entreprises
-- À exécuter dans Supabase SQL Editor
-- ============================================

ALTER TABLE public.entreprises
  ADD COLUMN IF NOT EXISTS site_web_actif BOOLEAN DEFAULT false;

-- Activer pour le compte admin principal (super_admin)
UPDATE public.entreprises e
SET site_web_actif = true
WHERE e.id = (
  SELECT u.entreprise_id FROM public.utilisateurs u
  WHERE u.email = 'chafiqui@icloud.com' LIMIT 1
);
