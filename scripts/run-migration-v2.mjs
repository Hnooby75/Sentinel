// ============================================
// scripts/run-migration-v2.mjs
// Crée les tables conversations_copilote, nps_responses, alertes_envoyees
// Usage: node scripts/run-migration-v2.mjs <PERSONAL_ACCESS_TOKEN>
// ============================================

const PROJECT_REF = 'kbbfajxdlctjrjppoksb'
const PAT = process.argv[2]

if (!PAT) {
  console.error('Usage: node scripts/run-migration-v2.mjs <PERSONAL_ACCESS_TOKEN>')
  console.error('Get your PAT at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const SQL = `
-- Helper (idempotent)
CREATE OR REPLACE FUNCTION get_user_entreprise_id()
RETURNS UUID AS $$
  SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. conversations_copilote
CREATE TABLE IF NOT EXISTS conversations_copilote (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  titre         TEXT DEFAULT 'Nouvelle conversation',
  messages      JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations_copilote ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations_copilote' AND policyname = 'conversations_copilote_isolation') THEN
    CREATE POLICY "conversations_copilote_isolation" ON conversations_copilote
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

DROP TRIGGER IF EXISTS conversations_copilote_updated_at ON conversations_copilote;
CREATE TRIGGER conversations_copilote_updated_at
  BEFORE UPDATE ON conversations_copilote
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. nps_responses
CREATE TABLE IF NOT EXISTS nps_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  score         INT NOT NULL CHECK (score >= 0 AND score <= 10),
  commentaire   TEXT,
  mois          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(utilisateur_id, mois)
);

ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nps_responses' AND policyname = 'nps_responses_isolation') THEN
    CREATE POLICY "nps_responses_isolation" ON nps_responses
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

-- 3. alertes_envoyees
CREATE TABLE IF NOT EXISTS alertes_envoyees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  ref_id        TEXT NOT NULL,
  envoyee_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entreprise_id, type, ref_id)
);

ALTER TABLE alertes_envoyees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alertes_envoyees' AND policyname = 'alertes_envoyees_isolation') THEN
    CREATE POLICY "alertes_envoyees_isolation" ON alertes_envoyees
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;
`

async function runMigration() {
  console.log('🚀 Exécution de la migration v2 sur Supabase...')
  console.log(`   Project: ${PROJECT_REF}`)

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('❌ Erreur:', res.status, JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Migration v2 réussie !')
  console.log('   Tables créées :')
  console.log('   - conversations_copilote (avec RLS + trigger updated_at)')
  console.log('   - nps_responses (avec RLS + contrainte UNIQUE par mois/user)')
  console.log('   - alertes_envoyees (avec RLS + déduplication)')
  console.log('')
  console.log('💡 Tu peux maintenant supprimer ton Personal Access Token sur supabase.com/dashboard/account/tokens')
}

runMigration()
