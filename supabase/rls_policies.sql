-- ============================================
-- SENTINEL — Row Level Security Policies
-- Exécuter APRÈS schema.sql dans Supabase
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE entreprises        ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journaux_usage_ia  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_conformite  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FONCTIONS HELPERS (sécurisées)
-- ============================================

-- Retourne l'entreprise_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION auth.entreprise_id()
RETURNS UUID AS $$
  SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Retourne le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM utilisateurs WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- ENTREPRISES
-- ============================================
CREATE POLICY "entreprise_select_own"
  ON entreprises FOR SELECT
  USING (id = auth.entreprise_id());

CREATE POLICY "entreprise_update_admin"
  ON entreprises FOR UPDATE
  USING (id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- ============================================
-- UTILISATEURS
-- ============================================
CREATE POLICY "utilisateurs_select_company"
  ON utilisateurs FOR SELECT
  USING (entreprise_id = auth.entreprise_id());

CREATE POLICY "utilisateurs_update_self"
  ON utilisateurs FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "utilisateurs_update_admin"
  ON utilisateurs FOR UPDATE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

CREATE POLICY "utilisateurs_insert_admin"
  ON utilisateurs FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- ============================================
-- JOURNAUX D'USAGE IA
-- ============================================
CREATE POLICY "journaux_select_company"
  ON journaux_usage_ia FOR SELECT
  USING (entreprise_id = auth.entreprise_id());

CREATE POLICY "journaux_insert_authenticated"
  ON journaux_usage_ia FOR INSERT
  WITH CHECK (
    entreprise_id = auth.entreprise_id()
    AND declarant_id = auth.uid()
  );

CREATE POLICY "journaux_update"
  ON journaux_usage_ia FOR UPDATE
  USING (
    entreprise_id = auth.entreprise_id()
    AND (declarant_id = auth.uid() OR auth.user_role() IN ('admin', 'manager'))
  );

CREATE POLICY "journaux_delete_admin"
  ON journaux_usage_ia FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- ============================================
-- SCORES
-- ============================================
CREATE POLICY "scores_select_company"
  ON scores_conformite FOR SELECT
  USING (entreprise_id = auth.entreprise_id());

-- Insert bloqué pour les users normaux → uniquement service_role (serveur)
CREATE POLICY "scores_insert_blocked"
  ON scores_conformite FOR INSERT
  WITH CHECK (false);

-- ============================================
-- RAPPORTS
-- ============================================
CREATE POLICY "rapports_select_company"
  ON rapports FOR SELECT
  USING (entreprise_id = auth.entreprise_id());

CREATE POLICY "rapports_insert_manager"
  ON rapports FOR INSERT
  WITH CHECK (
    entreprise_id = auth.entreprise_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE POLICY "audit_select_admin"
  ON audit_logs FOR SELECT
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- Insert/Update/Delete bloqués → uniquement service_role
CREATE POLICY "audit_insert_blocked"
  ON audit_logs FOR INSERT
  WITH CHECK (false);

-- Pas de UPDATE ni DELETE sur audit_logs → intégrité garantie par design
