-- ============================================
-- supabase/modules/copilot.sql
-- Feature 2 — Copilote Compliance Conversationnel
-- ============================================

ALTER TABLE journaux_usage_ia
  ADD COLUMN IF NOT EXISTS ai_classification    JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_classified       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS classification_confidence FLOAT,
  ADD COLUMN IF NOT EXISTS operator_status       TEXT CHECK (operator_status IN ('provider','deployer','distributor','importer')),
  ADD COLUMN IF NOT EXISTS ai_act_articles       JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS required_documentation JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_action_plan       JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS copilot_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  titre           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS copilot_messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id     UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content             TEXT NOT NULL,
  metadata            JSONB DEFAULT '{}',
  citations           JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_conversations_entreprise ON copilot_conversations(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON copilot_messages(conversation_id);

CREATE TRIGGER trg_copilot_conv_updated_at
  BEFORE UPDATE ON copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_select" ON copilot_conversations FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "conv_insert" ON copilot_conversations FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "conv_delete" ON copilot_conversations FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND utilisateur_id = auth.uid());

CREATE POLICY "msg_select" ON copilot_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM copilot_conversations WHERE entreprise_id = auth.entreprise_id()
  ));
CREATE POLICY "msg_insert" ON copilot_messages FOR INSERT
  WITH CHECK (true); -- service_role gère l'insertion
