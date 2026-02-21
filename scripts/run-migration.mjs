// ============================================
// scripts/run-migration.mjs
// Exécute marketing.sql via Supabase Management API
// Usage: node scripts/run-migration.mjs <PERSONAL_ACCESS_TOKEN>
// ============================================

const PROJECT_REF = 'kbbfajxdlctjrjppoksb'
const PAT = process.argv[2]

if (!PAT) {
  console.error('Usage: node scripts/run-migration.mjs <PERSONAL_ACCESS_TOKEN>')
  console.error('Get your PAT at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const SQL = `
-- Helper fonction
CREATE OR REPLACE FUNCTION get_user_entreprise_id()
RETURNS UUID AS $$
  SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. agents_sentinel
CREATE TABLE IF NOT EXISTS agents_sentinel (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom      TEXT NOT NULL,
  nom         TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  photo_url   TEXT,
  role        TEXT NOT NULL CHECK (role IN ('agent_junior', 'agent_senior', 'manager', 'directeur')),
  specialites TEXT[] DEFAULT '{}',
  bio         TEXT,
  actif       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. marketing_missions
CREATE TABLE IF NOT EXISTS marketing_missions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id            UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  agent_id                 UUID REFERENCES agents_sentinel(id) ON DELETE SET NULL,
  heures_allouees_par_mois FLOAT DEFAULT 4,
  statut                   TEXT NOT NULL CHECK (statut IN ('active', 'pause', 'terminee')) DEFAULT 'active',
  date_debut               DATE,
  date_fin                 DATE,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entreprise_id)
);

-- 3. rendez_vous_marketing
CREATE TABLE IF NOT EXISTS rendez_vous_marketing (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mission_id    UUID REFERENCES marketing_missions(id) ON DELETE CASCADE,
  titre         TEXT NOT NULL,
  description   TEXT,
  date_rdv      TIMESTAMPTZ NOT NULL,
  duree_minutes INT DEFAULT 30,
  statut        TEXT NOT NULL CHECK (statut IN ('planifie', 'confirme', 'annule', 'complete')) DEFAULT 'planifie',
  lien_visio    TEXT,
  notes_agent   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rendez_vous_marketing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous_marketing' AND policyname = 'rendez_vous_marketing_isolation') THEN
    CREATE POLICY "rendez_vous_marketing_isolation" ON rendez_vous_marketing
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

-- 4. messages_marketing
CREATE TABLE IF NOT EXISTS messages_marketing (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mission_id    UUID REFERENCES marketing_missions(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  content       TEXT NOT NULL,
  is_from_agent BOOLEAN DEFAULT false,
  lu            BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages_marketing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages_marketing' AND policyname = 'messages_marketing_isolation') THEN
    CREATE POLICY "messages_marketing_isolation" ON messages_marketing
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

-- 5. campagnes_marketing
CREATE TABLE IF NOT EXISTS campagnes_marketing (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mission_id    UUID REFERENCES marketing_missions(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('reseaux_sociaux', 'ads', 'email', 'seo', 'influence', 'autre')),
  statut        TEXT NOT NULL CHECK (statut IN ('setup', 'actif', 'pause', 'termine')) DEFAULT 'setup',
  objectif      TEXT,
  budget        NUMERIC,
  plateforme    TEXT,
  date_debut    DATE,
  date_fin      DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE campagnes_marketing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campagnes_marketing' AND policyname = 'campagnes_marketing_isolation') THEN
    CREATE POLICY "campagnes_marketing_isolation" ON campagnes_marketing
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

-- 6. kpis_marketing
CREATE TABLE IF NOT EXISTS kpis_marketing (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mois             DATE NOT NULL,
  portee           INT DEFAULT 0,
  engagement       FLOAT DEFAULT 0,
  nouveaux_abonnes INT DEFAULT 0,
  leads            INT DEFAULT 0,
  conversions      INT DEFAULT 0,
  ca_genere        NUMERIC DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entreprise_id, mois)
);

ALTER TABLE kpis_marketing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kpis_marketing' AND policyname = 'kpis_marketing_isolation') THEN
    CREATE POLICY "kpis_marketing_isolation" ON kpis_marketing
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

-- 7. heures_marketing
CREATE TABLE IF NOT EXISTS heures_marketing (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mission_id       UUID REFERENCES marketing_missions(id) ON DELETE CASCADE,
  mois             DATE NOT NULL,
  heures_utilisees FLOAT DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, mois)
);

ALTER TABLE heures_marketing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'heures_marketing' AND policyname = 'heures_marketing_isolation') THEN
    CREATE POLICY "heures_marketing_isolation" ON heures_marketing
      USING (entreprise_id = get_user_entreprise_id());
  END IF;
END $$;

-- 8. messages_sav
CREATE TABLE IF NOT EXISTS messages_sav (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id   UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  content         TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT false,
  lu              BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages_sav ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages_sav' AND policyname = 'messages_sav_isolation') THEN
    CREATE POLICY "messages_sav_isolation" ON messages_sav
      USING (entreprise_id = get_user_entreprise_id() OR is_from_support = true);
  END IF;
END $$;

-- Triggers updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marketing_missions_updated_at ON marketing_missions;
CREATE TRIGGER marketing_missions_updated_at
  BEFORE UPDATE ON marketing_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS campagnes_marketing_updated_at ON campagnes_marketing;
CREATE TRIGGER campagnes_marketing_updated_at
  BEFORE UPDATE ON campagnes_marketing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`

async function runMigration() {
  console.log('🚀 Exécution de la migration marketing sur Supabase...')
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

  console.log('✅ Migration réussie ! Toutes les tables ont été créées.')
  console.log('   Tables créées :')
  console.log('   - agents_sentinel')
  console.log('   - marketing_missions')
  console.log('   - rendez_vous_marketing')
  console.log('   - messages_marketing')
  console.log('   - campagnes_marketing')
  console.log('   - kpis_marketing')
  console.log('   - heures_marketing')
  console.log('   - messages_sav')
  console.log('')
  console.log('💡 Tu peux maintenant supprimer ton Personal Access Token sur supabase.com/dashboard/account/tokens')
}

runMigration()
