-- ============================================================
-- SENTINEL — Fix RLS : infinite recursion sur "utilisateurs"
-- À exécuter dans Supabase SQL Editor :
-- https://supabase.com/dashboard/project/kbbfajxdlctjrjppoksb/sql
-- ============================================================

-- ─── 1. FONCTION SECURITY DEFINER (bypass RLS pour récupérer l'entreprise_id) ──
-- Cette fonction tourne avec les droits du propriétaire de la table (postgres)
-- ce qui évite la récursion infinie dans les politiques RLS.
CREATE OR REPLACE FUNCTION get_user_entreprise_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── 2. FIX — TABLE utilisateurs ─────────────────────────────────────────────
DROP POLICY IF EXISTS "utilisateurs_select" ON public.utilisateurs;
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.utilisateurs;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.utilisateurs;

CREATE POLICY "utilisateurs_select" ON public.utilisateurs
  FOR SELECT USING (
    id = auth.uid()
    OR entreprise_id = get_user_entreprise_id()
  );

-- ─── 3. FIX — TABLE entreprises ──────────────────────────────────────────────
DROP POLICY IF EXISTS "entreprises_select" ON public.entreprises;

CREATE POLICY "entreprises_select" ON public.entreprises
  FOR SELECT USING (
    id = get_user_entreprise_id()
  );

-- ─── 4. FIX — TABLE journaux_usage_ia ────────────────────────────────────────
DROP POLICY IF EXISTS "journaux_ia_entreprise" ON public.journaux_usage_ia;
DROP POLICY IF EXISTS "journaux_ia_select" ON public.journaux_usage_ia;

CREATE POLICY "journaux_ia_entreprise" ON public.journaux_usage_ia
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 5. FIX — TABLE rapports ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "rapports_select" ON public.rapports;
DROP POLICY IF EXISTS "rapports_entreprise" ON public.rapports;

CREATE POLICY "rapports_entreprise" ON public.rapports
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 6. FIX — TABLE clients ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "clients_entreprise" ON public.clients;

CREATE POLICY "clients_entreprise" ON public.clients
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 7. FIX — TABLE factures ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "factures_entreprise" ON public.factures;

CREATE POLICY "factures_entreprise" ON public.factures
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 8. FIX — TABLE paiements ────────────────────────────────────────────────
DROP POLICY IF EXISTS "paiements_entreprise" ON public.paiements;

CREATE POLICY "paiements_entreprise" ON public.paiements
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 9. FIX — TABLE scores_fiabilite_client ──────────────────────────────────
DROP POLICY IF EXISTS "scores_fiabilite_entreprise" ON public.scores_fiabilite_client;

CREATE POLICY "scores_fiabilite_entreprise" ON public.scores_fiabilite_client
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 10. FIX — TABLE documents_contrats ──────────────────────────────────────
DROP POLICY IF EXISTS "contrats_entreprise" ON public.documents_contrats;

CREATE POLICY "contrats_entreprise" ON public.documents_contrats
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 11. FIX — TABLE analyses_contrats ───────────────────────────────────────
DROP POLICY IF EXISTS "analyses_contrats_entreprise" ON public.analyses_contrats;

CREATE POLICY "analyses_contrats_entreprise" ON public.analyses_contrats
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 12. FIX — TABLE obligations ─────────────────────────────────────────────
DROP POLICY IF EXISTS "obligations_entreprise" ON public.obligations;

CREATE POLICY "obligations_entreprise" ON public.obligations
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 13. FIX — TABLE flux_financiers ─────────────────────────────────────────
DROP POLICY IF EXISTS "flux_financiers_entreprise" ON public.flux_financiers;

CREATE POLICY "flux_financiers_entreprise" ON public.flux_financiers
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 14. FIX — TABLE indicateurs_financiers ──────────────────────────────────
DROP POLICY IF EXISTS "indicateurs_financiers_entreprise" ON public.indicateurs_financiers;

CREATE POLICY "indicateurs_financiers_entreprise" ON public.indicateurs_financiers
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 15. FIX — TABLE supplier_assessments ────────────────────────────────────
DROP POLICY IF EXISTS "supplier_assessments_entreprise" ON public.supplier_assessments;

CREATE POLICY "supplier_assessments_entreprise" ON public.supplier_assessments
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 16. FIX — TABLE shadow_ai_detections ────────────────────────────────────
DROP POLICY IF EXISTS "shadow_ai_entreprise" ON public.shadow_ai_detections;

CREATE POLICY "shadow_ai_entreprise" ON public.shadow_ai_detections
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 17. FIX — TABLE scores_conformite ───────────────────────────────────────
DROP POLICY IF EXISTS "scores_conformite_entreprise" ON public.scores_conformite;

CREATE POLICY "scores_conformite_entreprise" ON public.scores_conformite
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 18. FIX — TABLE scores_globaux ──────────────────────────────────────────
DROP POLICY IF EXISTS "scores_globaux_entreprise" ON public.scores_globaux;

CREATE POLICY "scores_globaux_entreprise" ON public.scores_globaux
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 19. FIX — TABLE audit_logs ──────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_entreprise" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;

CREATE POLICY "audit_logs_entreprise" ON public.audit_logs
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 20. FIX — TABLE equipe_invitations ──────────────────────────────────────
DROP POLICY IF EXISTS "equipe_invitations_entreprise" ON public.equipe_invitations;
DROP POLICY IF EXISTS "equipe_invitations_select" ON public.equipe_invitations;

CREATE POLICY "equipe_invitations_entreprise" ON public.equipe_invitations
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 21. FIX — TABLE formation_progress ──────────────────────────────────────
DROP POLICY IF EXISTS "formation_progress_entreprise" ON public.formation_progress;
DROP POLICY IF EXISTS "formation_progress_select" ON public.formation_progress;

CREATE POLICY "formation_progress_entreprise" ON public.formation_progress
  USING (entreprise_id = get_user_entreprise_id());

-- ─── 22. FIX — TABLE training_completions ────────────────────────────────────
DROP POLICY IF EXISTS "training_completions_entreprise" ON public.training_completions;
DROP POLICY IF EXISTS "training_completions_select" ON public.training_completions;

CREATE POLICY "training_completions_entreprise" ON public.training_completions
  USING (entreprise_id = get_user_entreprise_id());

-- ─── VÉRIFICATION ─────────────────────────────────────────────────────────────
-- Après exécution, testez avec :
-- SELECT get_user_entreprise_id();  -- doit retourner votre entreprise_id si connecté
