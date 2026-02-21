-- ============================================
-- supabase/modules/veille.sql
-- Feature 7 — Veille Réglementaire
-- ============================================

CREATE TABLE IF NOT EXISTS regulatory_updates (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre                 TEXT NOT NULL,
  source                TEXT NOT NULL,
  source_url            TEXT,
  resume                TEXT,
  impact_analysis       TEXT,
  affected_risk_levels  TEXT[] DEFAULT '{}',
  affected_articles     TEXT[] DEFAULT '{}',
  severity              TEXT CHECK (severity IN ('critical','important','informational')),
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_impacts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  update_id           UUID REFERENCES regulatory_updates(id) ON DELETE CASCADE,
  entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  journal_id          UUID REFERENCES journaux_usage_ia(id) ON DELETE SET NULL,
  impact_description  TEXT,
  action_required     TEXT,
  score_impact        INTEGER,
  acknowledged        BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published ON regulatory_updates(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_regulatory_impacts_entreprise ON regulatory_impacts(entreprise_id, acknowledged);

ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_impacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reg_updates_select" ON regulatory_updates FOR SELECT TO authenticated USING (true);

CREATE POLICY "reg_impacts_select" ON regulatory_impacts FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "reg_impacts_update" ON regulatory_impacts FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
