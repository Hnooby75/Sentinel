-- ============================================
-- supabase/modules/contrats.sql
-- Module 4 — Analyse des risques contractuels
-- ============================================

-- Documents déposés
CREATE TABLE IF NOT EXISTS documents_contrats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  uploaded_by      UUID NOT NULL REFERENCES utilisateurs(id),
  nom              TEXT NOT NULL,
  type_contrat     TEXT CHECK (type_contrat IN (
                     'prestataire','client','partenariat','emploi','bail','cgu','autre'
                   )),
  taille_fichier   INTEGER,
  fichier_url      TEXT,
  contenu_texte    TEXT,
  statut           TEXT DEFAULT 'en_analyse'
                     CHECK (statut IN ('en_analyse','analyse','archive')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analyses produites
CREATE TABLE IF NOT EXISTS analyses_contrats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id      UUID NOT NULL REFERENCES documents_contrats(id) ON DELETE CASCADE,
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  score_risque     INTEGER CHECK (score_risque BETWEEN 0 AND 100),
  niveau_risque    TEXT CHECK (niveau_risque IN ('faible','modere','eleve','critique')),
  resume           TEXT,
  points_sensibles JSONB DEFAULT '[]',
  recommandations  JSONB DEFAULT '[]',
  analyse_a        TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_documents_contrats_entreprise ON documents_contrats(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_documents_contrats_statut ON documents_contrats(statut);
CREATE INDEX IF NOT EXISTS idx_analyses_contrats_document ON analyses_contrats(document_id);
CREATE INDEX IF NOT EXISTS idx_analyses_contrats_entreprise ON analyses_contrats(entreprise_id);

-- RLS
ALTER TABLE documents_contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses_contrats ENABLE ROW LEVEL SECURITY;

-- Policies documents_contrats
CREATE POLICY "documents_contrats_select" ON documents_contrats FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "documents_contrats_insert" ON documents_contrats FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "documents_contrats_update" ON documents_contrats FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "documents_contrats_delete" ON documents_contrats FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- Policies analyses_contrats
CREATE POLICY "analyses_contrats_select" ON analyses_contrats FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "analyses_contrats_insert" ON analyses_contrats FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
