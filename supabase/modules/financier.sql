-- ============================================
-- supabase/modules/financier.sql
-- Module 5 — Indicateur de solidité financière
-- ============================================

-- Saisie mensuelle
CREATE TABLE IF NOT EXISTS flux_financiers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mois                DATE NOT NULL,
  ca_mensuel          NUMERIC(12,2) NOT NULL DEFAULT 0,
  charges_fixes       NUMERIC(12,2) NOT NULL DEFAULT 0,
  charges_variables   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tresorerie          NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  saisi_par           UUID REFERENCES utilisateurs(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entreprise_id, mois)
);

-- Indicateurs calculés
CREATE TABLE IF NOT EXISTS indicateurs_financiers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  calcule_a           TIMESTAMPTZ DEFAULT NOW(),
  ratio_tresorerie    NUMERIC(5,2),
  ratio_charges       NUMERIC(5,2),
  tendance_ca         TEXT CHECK (tendance_ca IN ('hausse','stable','baisse')),
  runway_mois         NUMERIC(5,1),
  score_solidite      INTEGER CHECK (score_solidite BETWEEN 0 AND 100),
  niveau              TEXT CHECK (niveau IN ('fragile','correct','solide','excellent')),
  detail              JSONB DEFAULT '{}'
);

-- Index
CREATE INDEX IF NOT EXISTS idx_flux_financiers_entreprise ON flux_financiers(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_flux_financiers_mois ON flux_financiers(entreprise_id, mois DESC);
CREATE INDEX IF NOT EXISTS idx_indicateurs_financiers_entreprise ON indicateurs_financiers(entreprise_id);

-- Trigger updated_at
CREATE TRIGGER update_flux_financiers_updated_at
  BEFORE UPDATE ON flux_financiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE flux_financiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicateurs_financiers ENABLE ROW LEVEL SECURITY;

-- Policies flux_financiers
CREATE POLICY "flux_financiers_select" ON flux_financiers FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "flux_financiers_insert" ON flux_financiers FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "flux_financiers_update" ON flux_financiers FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "flux_financiers_delete" ON flux_financiers FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- Policies indicateurs_financiers
CREATE POLICY "indicateurs_financiers_select" ON indicateurs_financiers FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "indicateurs_financiers_insert" ON indicateurs_financiers FOR INSERT
  WITH CHECK (true); -- service_role uniquement en pratique
