-- ============================================
-- supabase/modules/score_global.sql
-- Score global unifié — agrège les 5 modules
-- ============================================

CREATE TABLE IF NOT EXISTS scores_globaux (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id         UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  score_global          INTEGER CHECK (score_global BETWEEN 0 AND 100),
  score_conformite_ia   INTEGER,  -- poids 20%
  score_impayes         INTEGER,  -- poids 20%
  score_obligations     INTEGER,  -- poids 25%
  score_contractuel     INTEGER,  -- poids 15%
  score_financier       INTEGER,  -- poids 20%
  niveau                TEXT CHECK (niveau IN ('critique','insuffisant','partiel','bon','excellent')),
  recommandations_cles  JSONB DEFAULT '[]',
  calcule_a             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_globaux_entreprise ON scores_globaux(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_scores_globaux_calcule ON scores_globaux(entreprise_id, calcule_a DESC);

-- RLS
ALTER TABLE scores_globaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_globaux_select" ON scores_globaux FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "scores_globaux_insert" ON scores_globaux FOR INSERT
  WITH CHECK (true); -- service_role uniquement
