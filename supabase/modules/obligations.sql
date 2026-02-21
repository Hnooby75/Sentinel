-- ============================================
-- supabase/modules/obligations.sql
-- Module 3 — Obligations administratives
-- ============================================

-- Catalogue d'obligations (référentiel global)
CREATE TABLE IF NOT EXISTS types_obligations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             TEXT UNIQUE NOT NULL,
  libelle          TEXT NOT NULL,
  description      TEXT,
  categorie        TEXT CHECK (categorie IN ('fiscal','social','juridique','environnement','sectoriel','rgpd')),
  frequence        TEXT CHECK (frequence IN ('mensuel','trimestriel','semestriel','annuel','ponctuel')),
  mois_echeance    INTEGER[],
  pays             TEXT DEFAULT 'FR',
  source_legale    TEXT,
  actif            BOOLEAN DEFAULT true
);

-- Obligations assignées à une entreprise
CREATE TABLE IF NOT EXISTS obligations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id         UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  type_obligation_id    UUID REFERENCES types_obligations(id),
  libelle_custom        TEXT,
  statut                TEXT NOT NULL DEFAULT 'a_faire'
                          CHECK (statut IN ('a_faire','en_cours','valide','en_retard','non_applicable')),
  echeance              DATE,
  responsable_id        UUID REFERENCES utilisateurs(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preuves archivées
CREATE TABLE IF NOT EXISTS preuves_obligations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obligation_id    UUID NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  nom_fichier      TEXT NOT NULL,
  fichier_url      TEXT,
  type_preuve      TEXT CHECK (type_preuve IN ('declaration','recu','document','screenshot','autre')),
  uploaded_by      UUID REFERENCES utilisateurs(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_obligations_entreprise ON obligations(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_obligations_statut ON obligations(statut);
CREATE INDEX IF NOT EXISTS idx_obligations_echeance ON obligations(echeance);
CREATE INDEX IF NOT EXISTS idx_preuves_obligation ON preuves_obligations(obligation_id);

-- Trigger updated_at
CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON obligations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE types_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE preuves_obligations ENABLE ROW LEVEL SECURITY;

-- types_obligations est un catalogue global lisible par tous
CREATE POLICY "types_obligations_select" ON types_obligations FOR SELECT
  TO authenticated USING (true);

-- Policies obligations
CREATE POLICY "obligations_select" ON obligations FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "obligations_insert" ON obligations FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "obligations_update" ON obligations FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "obligations_delete" ON obligations FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- Policies preuves
CREATE POLICY "preuves_select" ON preuves_obligations FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "preuves_insert" ON preuves_obligations FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
