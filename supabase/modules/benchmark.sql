-- ============================================
-- supabase/modules/benchmark.sql
-- Feature 11 — Benchmark Sectoriel
-- ============================================

CREATE TABLE IF NOT EXISTS benchmark_data (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  secteur         TEXT NOT NULL,
  taille          TEXT,
  score           INTEGER,
  nb_systemes     INTEGER,
  snapshot_date   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_secteur ON benchmark_data(secteur, snapshot_date DESC);

ALTER TABLE benchmark_data ENABLE ROW LEVEL SECURITY;

-- Les données benchmark sont anonymisées, seule l'insertion est protégée
CREATE POLICY "benchmark_insert" ON benchmark_data FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
-- SELECT public pour les données agrégées (gérée côté API)
