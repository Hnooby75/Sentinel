-- ============================================================
-- supabase/supprimer-comptes.sql
-- ÉTAPE 1 — Supprimer le compte chafiqui@icloud.com et toutes ses données
-- ⚠️  IRRÉVERSIBLE  ⚠️
-- Copier-coller dans Supabase SQL Editor → Run
-- Ensuite : exécuter a-executer.sql
-- ============================================================

DO $$
DECLARE
  v_emails TEXT[]  := ARRAY['chafiqui@icloud.com'];
  v_e_ids  UUID[];
  v_u_ids  UUID[];
BEGIN

  -- ── 0. Sauvegarder les IDs AVANT toute suppression ──────
  SELECT ARRAY_AGG(DISTINCT u.entreprise_id) INTO v_e_ids
  FROM public.utilisateurs u
  WHERE u.email = ANY(v_emails) AND u.entreprise_id IS NOT NULL;

  SELECT ARRAY_AGG(DISTINCT a.id) INTO v_u_ids
  FROM auth.users a
  WHERE a.email = ANY(v_emails);

  IF v_e_ids IS NULL THEN
    RAISE WARNING '✗ Aucun compte trouvé pour chafiqui@icloud.com — peut-être déjà supprimé ?';
    RETURN;
  END IF;

  RAISE NOTICE '→ Entreprises ciblées : %', v_e_ids;
  RAISE NOTICE '→ Auth users ciblés   : %', v_u_ids;

  -- ── 1. Tables SAV & Tickets ───────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tickets_sav') THEN
    DELETE FROM public.tickets_sav WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages_sav') THEN
    DELETE FROM public.messages_sav WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [1/9] SAV & Tickets';

  -- ── 2. Marketing ─────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketing_missions') THEN
    DELETE FROM public.marketing_missions WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rendez_vous_marketing') THEN
    DELETE FROM public.rendez_vous_marketing WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages_marketing') THEN
    DELETE FROM public.messages_marketing WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campagnes_marketing') THEN
    DELETE FROM public.campagnes_marketing WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='kpis_marketing') THEN
    DELETE FROM public.kpis_marketing WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='heures_marketing') THEN
    DELETE FROM public.heures_marketing WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [2/9] Marketing';

  -- ── 3. Copilote dirigeant ─────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='depenses') THEN
    DELETE FROM public.depenses WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_cashflow_predictions') THEN
    DELETE FROM public.ai_cashflow_predictions WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_alerts') THEN
    DELETE FROM public.ai_alerts WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employes') THEN
    DELETE FROM public.employes WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conges') THEN
    DELETE FROM public.conges WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_hr_reports') THEN
    DELETE FROM public.ai_hr_reports WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_employee_health_score') THEN
    DELETE FROM public.ai_employee_health_score WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
    DELETE FROM public.leads WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opportunites') THEN
    DELETE FROM public.opportunites WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_sales_predictions') THEN
    DELETE FROM public.ai_sales_predictions WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_lead_scores') THEN
    DELETE FROM public.ai_lead_scores WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='taches') THEN
    DELETE FROM public.taches WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_strategy_reports') THEN
    DELETE FROM public.ai_strategy_reports WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    DELETE FROM public.activity_logs WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [3/9] Copilote dirigeant';

  -- ── 4. Business (obligations, finances, contrats) ────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='obligations') THEN
    DELETE FROM public.obligations WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='flux_financiers') THEN
    DELETE FROM public.flux_financiers WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='indicateurs_financiers') THEN
    DELETE FROM public.indicateurs_financiers WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents_contrats') THEN
    DELETE FROM public.documents_contrats WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='analyses_contrats') THEN
    DELETE FROM public.analyses_contrats WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [4/9] Business';

  -- ── 5. Clients, factures, paiements ─────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='paiements') THEN
    DELETE FROM public.paiements WHERE facture_id IN (
      SELECT id FROM public.factures WHERE entreprise_id = ANY(v_e_ids)
    );
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='factures') THEN
    DELETE FROM public.factures WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    DELETE FROM public.clients WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [5/9] Clients & Factures';

  -- ── 6. IA & Scores ───────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journaux_usage_ia') THEN
    DELETE FROM public.journaux_usage_ia WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shadow_ai_detections') THEN
    DELETE FROM public.shadow_ai_detections WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scores_conformite') THEN
    DELETE FROM public.scores_conformite WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scores_globaux') THEN
    DELETE FROM public.scores_globaux WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scores_fiabilite_client') THEN
    DELETE FROM public.scores_fiabilite_client WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [6/9] IA & Scores';

  -- ── 7. Équipe & Formation ────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='equipe_invitations') THEN
    DELETE FROM public.equipe_invitations WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='formation_progress') THEN
    DELETE FROM public.formation_progress WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='training_completions') THEN
    DELETE FROM public.training_completions WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_assessments') THEN
    DELETE FROM public.supplier_assessments WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    DELETE FROM public.audit_logs WHERE entreprise_id = ANY(v_e_ids);
  END IF;
  RAISE NOTICE '✓ [7/9] Équipe & Formation';

  -- ── 8. Sites ─────────────────────────────────────────────
  DELETE FROM public.sites_clients WHERE entreprise_id = ANY(v_e_ids);
  RAISE NOTICE '✓ [8/9] sites_clients';

  -- ── 9. Profils & Auth (en dernier) ───────────────────────
  DELETE FROM public.utilisateurs WHERE email = ANY(v_emails);
  DELETE FROM public.entreprises  WHERE id = ANY(v_e_ids);
  IF v_u_ids IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = ANY(v_u_ids);
    DELETE FROM auth.users      WHERE id = ANY(v_u_ids);
  END IF;
  RAISE NOTICE '✓ [9/9] utilisateurs + entreprises + auth.identities + auth.users';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '  SUPPRESSION COMPLÈTE';
  RAISE NOTICE '  Exécutez maintenant a-executer.sql';
  RAISE NOTICE '════════════════════════════════════════════════';

END $$;
