-- ============================================================
-- SENTINEL — Migration Audit Complet
-- Corrige TOUS les problèmes de cohérence base ↔ code
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ─── 1. FIX CHECK CONSTRAINT — journaux_usage_ia.niveau_risque ───
-- Code utilise 'non_classe' partout mais DB ne l'autorise pas
ALTER TABLE public.journaux_usage_ia DROP CONSTRAINT IF EXISTS journaux_usage_ia_niveau_risque_check;
ALTER TABLE public.journaux_usage_ia
  ADD CONSTRAINT journaux_usage_ia_niveau_risque_check
  CHECK (niveau_risque IN ('faible','limite','eleve','inacceptable','non_classe'));

-- ─── 2. FIX CHECK CONSTRAINT — journaux_usage_ia.statut ─────────
-- Code référence 'a_revoir' mais DB ne l'autorise pas
ALTER TABLE public.journaux_usage_ia DROP CONSTRAINT IF EXISTS journaux_usage_ia_statut_check;
ALTER TABLE public.journaux_usage_ia
  ADD CONSTRAINT journaux_usage_ia_statut_check
  CHECK (statut IN ('actif','inactif','archive','a_revoir'));

-- ─── 3. FIX CHECK CONSTRAINT — documents_contrats.type_contrat ──
-- API autorise 'client','emploi' mais DB ne les accepte pas
ALTER TABLE public.documents_contrats DROP CONSTRAINT IF EXISTS documents_contrats_type_contrat_check;
ALTER TABLE public.documents_contrats
  ADD CONSTRAINT documents_contrats_type_contrat_check
  CHECK (type_contrat IN ('prestataire','cgu','bail','partenariat','nda','autre','client','emploi'));

-- ─── 4. FIX CHECK CONSTRAINT — documents_contrats.statut ────────
-- Code insère 'en_analyse' mais DB ne l'autorise pas
ALTER TABLE public.documents_contrats DROP CONSTRAINT IF EXISTS documents_contrats_statut_check;
ALTER TABLE public.documents_contrats
  ADD CONSTRAINT documents_contrats_statut_check
  CHECK (statut IN ('brouillon','analyse','en_analyse','signe','archive'));

-- ─── 5. TABLE MANQUANTE — alertes_envoyees ──────────────────────
-- alertes/auto/route.ts query cette table pour déduplication
CREATE TABLE IF NOT EXISTS public.alertes_envoyees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  ref_id          TEXT NOT NULL,
  envoyee_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entreprise_id, type, ref_id)
);
ALTER TABLE public.alertes_envoyees ENABLE ROW LEVEL SECURITY;

-- RLS avec get_user_entreprise_id() pour éviter récursion
DROP POLICY IF EXISTS "alertes_envoyees_entreprise" ON public.alertes_envoyees;
CREATE POLICY "alertes_envoyees_entreprise" ON public.alertes_envoyees
  USING (entreprise_id = get_user_entreprise_id());

CREATE INDEX IF NOT EXISTS idx_alertes_envoyees_lookup
  ON public.alertes_envoyees(entreprise_id, type, ref_id);

-- ─── 6. FIX RLS tickets_sav — utiliser get_user_entreprise_id() ─
-- Évite récursion infinie via subquery sur utilisateurs
DROP POLICY IF EXISTS "tickets_sav_client_select" ON public.tickets_sav;
DROP POLICY IF EXISTS "tickets_sav_client_insert" ON public.tickets_sav;

CREATE POLICY "tickets_sav_select" ON public.tickets_sav
  FOR SELECT USING (entreprise_id = get_user_entreprise_id());

CREATE POLICY "tickets_sav_insert" ON public.tickets_sav
  FOR INSERT WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ─── 7. RLS relances (table créée par fix-complet-v2) ───────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "relances_entreprise" ON public.relances;
  CREATE POLICY "relances_entreprise" ON public.relances
    USING (entreprise_id = get_user_entreprise_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─── 8. TRIGGERS updated_at MANQUANTS ───────────────────────────
-- Seule tickets_sav a un trigger. Toutes les autres tables avec
-- updated_at n'en ont pas.

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- clients
DROP TRIGGER IF EXISTS set_updated_at ON public.clients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- factures
DROP TRIGGER IF EXISTS set_updated_at ON public.factures;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- documents_contrats
DROP TRIGGER IF EXISTS set_updated_at ON public.documents_contrats;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.documents_contrats
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- obligations
DROP TRIGGER IF EXISTS set_updated_at ON public.obligations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.obligations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- journaux_usage_ia
DROP TRIGGER IF EXISTS set_updated_at ON public.journaux_usage_ia;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.journaux_usage_ia
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ─── 9. INDEX SUPPLÉMENTAIRES (perf) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON public.paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_alertes_envoyees_entreprise ON public.alertes_envoyees(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_obligations_statut ON public.obligations(statut);
CREATE INDEX IF NOT EXISTS idx_obligations_echeance ON public.obligations(echeance);

-- ─── FIN ─────────────────────────────────────────────────────────
-- Vérification post-exécution :
-- SELECT conname FROM pg_constraint WHERE conrelid = 'journaux_usage_ia'::regclass;
-- SELECT * FROM alertes_envoyees LIMIT 1;
