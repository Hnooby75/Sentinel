-- ============================================
-- supabase/modules/marketing.sql
-- Module Marketing Complet + SAV
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Helper : get_user_entreprise_id (déjà défini si copilot-executive.sql exécuté)
CREATE OR REPLACE FUNCTION get_user_entreprise_id()
RETURNS UUID AS $$
  SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- 1. agents_sentinel — Équipe interne Sentinel
-- ============================================
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
-- Pas de RLS : accès uniquement via admin client (service_role)

-- ============================================
-- 2. marketing_missions — 1 mission active par entreprise
-- ============================================
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
-- Pas de RLS : accès uniquement via admin client (service_role)

-- ============================================
-- 3. rendez_vous_marketing — RDV client/agent
-- ============================================
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
CREATE POLICY "rendez_vous_marketing_isolation"
  ON rendez_vous_marketing
  USING (entreprise_id = get_user_entreprise_id());

-- ============================================
-- 4. messages_marketing — Chat agent↔client
-- ============================================
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
CREATE POLICY "messages_marketing_isolation"
  ON messages_marketing
  USING (entreprise_id = get_user_entreprise_id());

-- ============================================
-- 5. campagnes_marketing
-- ============================================
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
CREATE POLICY "campagnes_marketing_isolation"
  ON campagnes_marketing
  USING (entreprise_id = get_user_entreprise_id());

-- ============================================
-- 6. kpis_marketing — KPIs mensuels
-- ============================================
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
CREATE POLICY "kpis_marketing_isolation"
  ON kpis_marketing
  USING (entreprise_id = get_user_entreprise_id());

-- ============================================
-- 7. heures_marketing — Suivi heures/mois
-- ============================================
CREATE TABLE IF NOT EXISTS heures_marketing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  mission_id      UUID REFERENCES marketing_missions(id) ON DELETE CASCADE,
  mois            DATE NOT NULL,
  heures_utilisees FLOAT DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, mois)
);

ALTER TABLE heures_marketing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "heures_marketing_isolation"
  ON heures_marketing
  USING (entreprise_id = get_user_entreprise_id());

-- ============================================
-- 8. messages_sav — Support SAV général Sentinel
-- ============================================
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
CREATE POLICY "messages_sav_isolation"
  ON messages_sav
  USING (entreprise_id = get_user_entreprise_id() OR is_from_support = true);

-- ============================================
-- Triggers updated_at
-- ============================================
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
