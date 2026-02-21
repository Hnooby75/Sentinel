-- ============================================
-- supabase/modules/shadow-ai.sql
-- Feature 1 — Shadow AI Radar
-- ============================================

CREATE TABLE IF NOT EXISTS known_ai_tools (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL UNIQUE,
  category            TEXT,
  default_risk_level  TEXT CHECK (default_risk_level IN ('high','limited','minimal')),
  description         TEXT,
  url                 TEXT,
  ai_act_relevant     BOOLEAN DEFAULT true,
  vendor              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shadow_ai_detections (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  tool_name         TEXT NOT NULL,
  tool_category     TEXT,
  detection_source  TEXT DEFAULT 'manual',
  confidence        FLOAT DEFAULT 1.0,
  risk_assessment   TEXT,
  statut            TEXT CHECK (statut IN ('detected','declared','dismissed','under_review')) DEFAULT 'detected',
  detected_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shadow_detections_entreprise ON shadow_ai_detections(entreprise_id, statut);
CREATE INDEX IF NOT EXISTS idx_known_tools_category ON known_ai_tools(category);

ALTER TABLE shadow_ai_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "known_tools_select" ON known_ai_tools FOR SELECT TO authenticated USING (true);

CREATE POLICY "shadow_select" ON shadow_ai_detections FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "shadow_insert" ON shadow_ai_detections FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "shadow_update" ON shadow_ai_detections FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
