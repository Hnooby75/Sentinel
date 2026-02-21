-- ============================================================
-- SENTINEL — Fix complet V2
-- Résout : tables manquantes, RLS récursion, colonnes manquantes
-- À exécuter dans Supabase SQL Editor APRÈS schema-complet.sql
-- ============================================================

-- ─── 0. EXTENSION ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. TABLE RELANCES (manquante dans schema-complet.sql) ───
CREATE TABLE IF NOT EXISTS public.relances (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id       UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  entreprise_id    UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('amiable','formelle','mise_en_demeure')),
  statut           TEXT DEFAULT 'envoyee' CHECK (statut IN ('planifiee','envoyee','sans_reponse','reponse_recue')),
  date_envoi       TIMESTAMPTZ DEFAULT NOW(),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_relances_facture ON public.relances(facture_id);
CREATE INDEX IF NOT EXISTS idx_relances_entreprise ON public.relances(entreprise_id);

-- ─── 2. TABLE SITE_SETTINGS (module CMS) ─────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  cle        TEXT PRIMARY KEY,
  valeur     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DO $$ BEGIN
  CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Valeurs par défaut
INSERT INTO public.site_settings (cle, valeur) VALUES (
  'packs',
  '[
    {"name": "Solo", "price": 49, "desc": "Gestion légale & fiscale complète", "features": ["Obligations légales automatisées", "Optimisation fiscale IA", "Gestion des contrats", "Suivi des impayés", "Copilote juridique", "Support email"], "popular": false},
    {"name": "Présence", "price": 149, "desc": "Solo + Site web professionnel", "features": ["Tout Solo", "Site web pro créé en 48h", "Hébergement France inclus", "CMS depuis le dashboard", "Support prioritaire"], "popular": false},
    {"name": "Croissance", "price": 349, "desc": "Présence + 4h marketing/mois", "features": ["Tout Présence", "4h marketing/mois", "Réseaux sociaux gérés", "Rapport mensuel KPIs", "Manager marketing dédié"], "popular": true},
    {"name": "Accélération", "price": 699, "desc": "Tout inclus + 12h marketing + ADS", "features": ["Tout Croissance", "12h marketing/mois", "ADS Meta & Google gérés", "Budget ADS optimisé", "Suivi hebdomadaire"], "popular": false}
  ]'::jsonb
) ON CONFLICT (cle) DO NOTHING;

INSERT INTO public.site_settings (cle, valeur) VALUES (
  'hero',
  '{"titre": "Votre PME,\npilotée sereinement", "sous_titre": "Obligations légales · Optimisation fiscale · Site web · Marketing", "description": "De la déclaration TVA à l''optimisation de votre IS — tout centralisé, automatisé et simplifié."}'::jsonb
) ON CONFLICT (cle) DO NOTHING;

INSERT INTO public.site_settings (cle, valeur) VALUES (
  'contact',
  '{"telephone": "", "email": "contact@sentinel.fr", "instagram": "", "linkedin": "", "facebook": ""}'::jsonb
) ON CONFLICT (cle) DO NOTHING;

-- ─── 3. TABLE SITES_CLIENTS (site web multi-tenant) ──────────
CREATE TABLE IF NOT EXISTS public.sites_clients (
  entreprise_id UUID PRIMARY KEY REFERENCES public.entreprises(id) ON DELETE CASCADE,
  contenu       JSONB NOT NULL DEFAULT '{}',
  url           TEXT,
  statut        TEXT DEFAULT 'en_creation' CHECK (statut IN ('en_creation', 'en_ligne', 'en_maintenance', 'inactif')),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sites_clients ENABLE ROW LEVEL SECURITY;

-- ─── 4. TABLE RAPPORTS (référencée dans rls_policies.sql) ────
CREATE TABLE IF NOT EXISTS public.rapports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  type            TEXT DEFAULT 'audit',
  titre           TEXT,
  contenu         JSONB DEFAULT '{}',
  genere_par      UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;

-- ─── 5. COLONNES MANQUANTES ──────────────────────────────────
-- paiements.entreprise_id (peut manquer si module utilisé au lieu de schema-complet)
DO $$ BEGIN
  ALTER TABLE public.paiements ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- paiements.notes
DO $$ BEGIN
  ALTER TABLE public.paiements ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─── 6. SUPER_ADMIN ROLE ─────────────────────────────────────
ALTER TABLE public.utilisateurs
  DROP CONSTRAINT IF EXISTS utilisateurs_role_check;

ALTER TABLE public.utilisateurs
  ADD CONSTRAINT utilisateurs_role_check
  CHECK (role IN ('admin', 'manager', 'employe', 'lecteur', 'membre', 'super_admin'));

-- ─── 7. FONCTION SECURITY DEFINER (anti-récursion RLS) ───────
CREATE OR REPLACE FUNCTION get_user_entreprise_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── 8. FIX RLS — TOUTES LES TABLES ─────────────────────────
-- Supprime les anciennes policies récursives et les remplace

-- utilisateurs
DROP POLICY IF EXISTS "utilisateurs_select" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_select_company" ON public.utilisateurs;
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.utilisateurs;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.utilisateurs;
CREATE POLICY "utilisateurs_select" ON public.utilisateurs
  FOR SELECT USING (id = auth.uid() OR entreprise_id = get_user_entreprise_id());

DROP POLICY IF EXISTS "utilisateurs_insert" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_insert_admin" ON public.utilisateurs;
CREATE POLICY "utilisateurs_insert" ON public.utilisateurs
  FOR INSERT WITH CHECK (entreprise_id = get_user_entreprise_id());

DROP POLICY IF EXISTS "utilisateurs_update_self" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_update_admin" ON public.utilisateurs;
CREATE POLICY "utilisateurs_update" ON public.utilisateurs
  FOR UPDATE USING (id = auth.uid() OR entreprise_id = get_user_entreprise_id());

-- entreprises
DROP POLICY IF EXISTS "entreprises_select" ON public.entreprises;
DROP POLICY IF EXISTS "entreprise_select_own" ON public.entreprises;
CREATE POLICY "entreprises_select" ON public.entreprises
  FOR SELECT USING (id = get_user_entreprise_id());

DROP POLICY IF EXISTS "entreprise_update_admin" ON public.entreprises;
CREATE POLICY "entreprises_update" ON public.entreprises
  FOR UPDATE USING (id = get_user_entreprise_id());

-- clients
DROP POLICY IF EXISTS "clients_entreprise" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_all" ON public.clients
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- factures
DROP POLICY IF EXISTS "factures_entreprise" ON public.factures;
DROP POLICY IF EXISTS "factures_select" ON public.factures;
DROP POLICY IF EXISTS "factures_insert" ON public.factures;
DROP POLICY IF EXISTS "factures_update" ON public.factures;
DROP POLICY IF EXISTS "factures_delete" ON public.factures;
CREATE POLICY "factures_all" ON public.factures
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- paiements
DROP POLICY IF EXISTS "paiements_entreprise" ON public.paiements;
DROP POLICY IF EXISTS "paiements_select" ON public.paiements;
DROP POLICY IF EXISTS "paiements_insert" ON public.paiements;
DROP POLICY IF EXISTS "paiements_update" ON public.paiements;
CREATE POLICY "paiements_all" ON public.paiements
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- relances
DROP POLICY IF EXISTS "relances_entreprise" ON public.relances;
DROP POLICY IF EXISTS "relances_select" ON public.relances;
DROP POLICY IF EXISTS "relances_insert" ON public.relances;
CREATE POLICY "relances_all" ON public.relances
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- scores_fiabilite_client
DROP POLICY IF EXISTS "scores_fiabilite_entreprise" ON public.scores_fiabilite_client;
CREATE POLICY "scores_fiabilite_all" ON public.scores_fiabilite_client
  USING (entreprise_id = get_user_entreprise_id());

-- documents_contrats
DROP POLICY IF EXISTS "contrats_entreprise" ON public.documents_contrats;
CREATE POLICY "contrats_all" ON public.documents_contrats
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- analyses_contrats
DROP POLICY IF EXISTS "analyses_contrats_entreprise" ON public.analyses_contrats;
CREATE POLICY "analyses_contrats_all" ON public.analyses_contrats
  USING (entreprise_id = get_user_entreprise_id());

-- obligations
DROP POLICY IF EXISTS "obligations_entreprise" ON public.obligations;
CREATE POLICY "obligations_all" ON public.obligations
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- flux_financiers
DROP POLICY IF EXISTS "flux_financiers_entreprise" ON public.flux_financiers;
CREATE POLICY "flux_financiers_all" ON public.flux_financiers
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- indicateurs_financiers
DROP POLICY IF EXISTS "indicateurs_financiers_entreprise" ON public.indicateurs_financiers;
CREATE POLICY "indicateurs_financiers_all" ON public.indicateurs_financiers
  USING (entreprise_id = get_user_entreprise_id());

-- supplier_assessments
DROP POLICY IF EXISTS "supplier_assessments_entreprise" ON public.supplier_assessments;
CREATE POLICY "supplier_assessments_all" ON public.supplier_assessments
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- journaux_usage_ia
DROP POLICY IF EXISTS "journaux_ia_entreprise" ON public.journaux_usage_ia;
DROP POLICY IF EXISTS "journaux_select_company" ON public.journaux_usage_ia;
DROP POLICY IF EXISTS "journaux_insert_authenticated" ON public.journaux_usage_ia;
DROP POLICY IF EXISTS "journaux_update" ON public.journaux_usage_ia;
DROP POLICY IF EXISTS "journaux_delete_admin" ON public.journaux_usage_ia;
CREATE POLICY "journaux_all" ON public.journaux_usage_ia
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- shadow_ai_detections
DROP POLICY IF EXISTS "shadow_ai_entreprise" ON public.shadow_ai_detections;
CREATE POLICY "shadow_ai_all" ON public.shadow_ai_detections
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- scores_conformite
DROP POLICY IF EXISTS "scores_conformite_entreprise" ON public.scores_conformite;
DROP POLICY IF EXISTS "scores_select_company" ON public.scores_conformite;
DROP POLICY IF EXISTS "scores_insert_blocked" ON public.scores_conformite;
CREATE POLICY "scores_conformite_all" ON public.scores_conformite
  USING (entreprise_id = get_user_entreprise_id());

-- scores_globaux
DROP POLICY IF EXISTS "scores_globaux_entreprise" ON public.scores_globaux;
CREATE POLICY "scores_globaux_all" ON public.scores_globaux
  USING (entreprise_id = get_user_entreprise_id());

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_entreprise" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert_blocked" ON public.audit_logs;
CREATE POLICY "audit_logs_all" ON public.audit_logs
  USING (entreprise_id = get_user_entreprise_id());

-- equipe_invitations
DROP POLICY IF EXISTS "invitations_entreprise" ON public.equipe_invitations;
DROP POLICY IF EXISTS "equipe_invitations_entreprise" ON public.equipe_invitations;
CREATE POLICY "equipe_invitations_all" ON public.equipe_invitations
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- formation_progress
DROP POLICY IF EXISTS "formation_entreprise" ON public.formation_progress;
DROP POLICY IF EXISTS "formation_progress_entreprise" ON public.formation_progress;
CREATE POLICY "formation_progress_all" ON public.formation_progress
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- training_completions
DROP POLICY IF EXISTS "training_completions_entreprise" ON public.training_completions;
CREATE POLICY "training_completions_all" ON public.training_completions
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- rapports
DROP POLICY IF EXISTS "rapports_entreprise" ON public.rapports;
DROP POLICY IF EXISTS "rapports_select_company" ON public.rapports;
DROP POLICY IF EXISTS "rapports_insert_manager" ON public.rapports;
CREATE POLICY "rapports_all" ON public.rapports
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- sites_clients
DROP POLICY IF EXISTS "Lecture site propre entreprise" ON public.sites_clients;
DROP POLICY IF EXISTS "sites_clients_all" ON public.sites_clients;
CREATE POLICY "sites_clients_all" ON public.sites_clients
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ─── 9. SET SUPER_ADMIN ──────────────────────────────────────
-- Remplace l'email par le tien si différent
UPDATE public.utilisateurs
SET role = 'super_admin'
WHERE email = 'chafiqui@icloud.com';

-- ─── VÉRIFICATION ─────────────────────────────────────────────
SELECT 'Tables créées' AS check_type,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables;

SELECT id, email, role FROM public.utilisateurs WHERE role = 'super_admin';
