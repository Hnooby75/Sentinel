-- ============================================================
-- supabase/a-executer.sql
-- À exécuter APRÈS s'être inscrit sur le site
-- Copier-coller dans Supabase SQL Editor → Run
-- ============================================================


-- ============================================================
-- [1] DDL — Ajouter les colonnes et tables manquantes
-- ============================================================

ALTER TABLE public.entreprises
  ADD COLUMN IF NOT EXISTS site_web_actif BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.tickets_sav (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  sujet           TEXT NOT NULL,
  categorie       TEXT NOT NULL,
  description     TEXT NOT NULL,
  statut          TEXT NOT NULL DEFAULT 'ouvert'
                    CHECK (statut IN ('ouvert', 'en_attente', 'résolu', 'clôturé')),
  notes_admin     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_sav_entreprise_idx ON public.tickets_sav(entreprise_id);
CREATE INDEX IF NOT EXISTS tickets_sav_statut_idx     ON public.tickets_sav(statut);
CREATE INDEX IF NOT EXISTS tickets_sav_categorie_idx  ON public.tickets_sav(categorie);

CREATE OR REPLACE FUNCTION public.update_tickets_sav_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_sav_updated_at ON public.tickets_sav;
CREATE TRIGGER tickets_sav_updated_at
  BEFORE UPDATE ON public.tickets_sav
  FOR EACH ROW EXECUTE FUNCTION public.update_tickets_sav_updated_at();

ALTER TABLE public.tickets_sav ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_sav_client_select" ON public.tickets_sav;
CREATE POLICY "tickets_sav_client_select" ON public.tickets_sav
  FOR SELECT USING (
    entreprise_id = (
      SELECT entreprise_id FROM public.utilisateurs
      WHERE id = auth.uid() LIMIT 1
    )
  );

DROP POLICY IF EXISTS "tickets_sav_client_insert" ON public.tickets_sav;
CREATE POLICY "tickets_sav_client_insert" ON public.tickets_sav
  FOR INSERT WITH CHECK (
    entreprise_id = (
      SELECT entreprise_id FROM public.utilisateurs
      WHERE id = auth.uid() LIMIT 1
    )
  );


-- ============================================================
-- [2] Permissions super_admin + config site
--     À exécuter après inscription sur le site
-- ============================================================
DO $$
DECLARE
  v_entreprise_id UUID;
  v_role          TEXT;
BEGIN

  -- Récupérer l'entreprise du compte
  SELECT u.entreprise_id, u.role INTO v_entreprise_id, v_role
  FROM public.utilisateurs u
  WHERE u.email = 'chafiqui@icloud.com'
  LIMIT 1;

  IF v_entreprise_id IS NULL THEN
    RAISE WARNING '✗ Compte chafiqui@icloud.com introuvable. Inscrivez-vous d''abord sur le site puis relancez ce script.';
    RETURN;
  END IF;

  -- Rôle super_admin
  UPDATE public.utilisateurs
  SET role = 'super_admin'
  WHERE email = 'chafiqui@icloud.com';
  RAISE NOTICE '✓ [1/3] Rôle super_admin assigné';

  -- Activer site_web_actif
  UPDATE public.entreprises
  SET site_web_actif = true, plan = 'enterprise', plan_actif = true
  WHERE id = v_entreprise_id;
  RAISE NOTICE '✓ [2/3] site_web_actif activé (plan: enterprise)';

  -- Configurer la vitrine dans sites_clients
  INSERT INTO public.sites_clients (entreprise_id, url, statut, contenu, updated_at)
  VALUES (
    v_entreprise_id,
    '/vitrine/',
    'en_ligne',
    '{"titre": "Sentinel", "description": "La plateforme tout-en-un pour les PME"}'::jsonb,
    now()
  )
  ON CONFLICT (entreprise_id) DO UPDATE
    SET url = '/vitrine/', statut = 'en_ligne', updated_at = now();
  RAISE NOTICE '✓ [3/3] sites_clients configuré (url: /vitrine/)';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '  CONFIGURATION TERMINÉE';
  RAISE NOTICE '  Email : chafiqui@icloud.com';
  RAISE NOTICE '  Rôle  : super_admin';
  RAISE NOTICE '  Plan  : enterprise';
  RAISE NOTICE '  Site  : /vitrine/ (en_ligne)';
  RAISE NOTICE '════════════════════════════════════════════════';

END $$;
