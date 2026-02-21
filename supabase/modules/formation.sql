-- ============================================
-- supabase/modules/formation.sql
-- Feature 6 — AI Literacy Hub Gamifié
-- Idempotent : peut être ré-exécuté sans erreur
-- ============================================

CREATE TABLE IF NOT EXISTS training_modules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre            TEXT NOT NULL,
  description      TEXT,
  target_role      TEXT CHECK (target_role IN ('executive','technical','hr','legal','all')),
  difficulty       TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  content          JSONB NOT NULL DEFAULT '[]',
  quiz             JSONB DEFAULT '[]',
  duration_minutes INTEGER,
  order_index      INTEGER,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  statut          TEXT CHECK (statut IN ('not_started','in_progress','completed')) DEFAULT 'not_started',
  score_quiz      INTEGER,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (utilisateur_id, module_id)
);

CREATE TABLE IF NOT EXISTS training_leaderboard (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id        UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  utilisateur_id       UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  total_points         INTEGER DEFAULT 0,
  modules_completed    INTEGER DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entreprise_id, utilisateur_id)
);

-- Colonnes supplémentaires (idempotent)
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS categorie TEXT;
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
ALTER TABLE training_leaderboard ADD COLUMN IF NOT EXISTS rang INTEGER DEFAULT 0;

-- Index
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_entreprise ON training_progress(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entreprise ON training_leaderboard(entreprise_id, total_points DESC);

-- RLS
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies — DROP IF EXISTS pour idempotence
DROP POLICY IF EXISTS "modules_select" ON training_modules;
DROP POLICY IF EXISTS "progress_select" ON training_progress;
DROP POLICY IF EXISTS "progress_insert" ON training_progress;
DROP POLICY IF EXISTS "progress_update" ON training_progress;
DROP POLICY IF EXISTS "leaderboard_select" ON training_leaderboard;

CREATE POLICY "modules_select" ON training_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "progress_select" ON training_progress
  FOR SELECT USING (
    entreprise_id = (SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid())
  );

CREATE POLICY "progress_insert" ON training_progress
  FOR INSERT WITH CHECK (
    entreprise_id = (SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid())
  );

CREATE POLICY "progress_update" ON training_progress
  FOR UPDATE USING (
    entreprise_id = (SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid())
    AND utilisateur_id = auth.uid()
  );

CREATE POLICY "leaderboard_select" ON training_leaderboard
  FOR SELECT USING (
    entreprise_id = (SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid())
  );
