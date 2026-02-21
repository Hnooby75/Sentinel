-- ============================================
-- supabase/modules/fournisseurs.sql
-- Feature 9 — Supplier Risk Scanner
-- ============================================

CREATE TABLE IF NOT EXISTS supplier_assessments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  supplier_name     TEXT NOT NULL,
  supplier_url      TEXT,
  risk_score        INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  ai_usage_detected JSONB DEFAULT '[]',
  policy_analysis   JSONB DEFAULT '{}',
  findings          JSONB DEFAULT '[]',
  recommendations   JSONB DEFAULT '[]',
  summary           TEXT,
  last_scanned_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_assessments_entreprise ON supplier_assessments(entreprise_id);

ALTER TABLE supplier_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_select" ON supplier_assessments FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "supplier_insert" ON supplier_assessments FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "supplier_delete" ON supplier_assessments FOR DELETE
  USING (entreprise_id = auth.entreprise_id());
