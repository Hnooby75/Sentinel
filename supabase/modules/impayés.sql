-- ============================================
-- supabase/modules/impayés.sql
-- Module 2 — Protection contre les impayés
-- ============================================

-- Clients de l'entreprise
CREATE TABLE IF NOT EXISTS clients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  nom              TEXT NOT NULL,
  email            TEXT,
  telephone        TEXT,
  siret            TEXT,
  secteur          TEXT,
  pays             TEXT DEFAULT 'FR',
  notes            TEXT,
  actif            BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Factures émises
CREATE TABLE IF NOT EXISTS factures (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES clients(id),
  numero           TEXT NOT NULL,
  montant_ht       NUMERIC(12,2) NOT NULL,
  montant_ttc      NUMERIC(12,2) NOT NULL,
  devise           TEXT DEFAULT 'EUR',
  statut           TEXT NOT NULL DEFAULT 'envoyee'
                     CHECK (statut IN ('brouillon','envoyee','partielle','payee','en_retard','contentieux')),
  date_emission    DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance    DATE NOT NULL,
  date_paiement    DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Paiements reçus (une facture peut avoir plusieurs paiements partiels)
CREATE TABLE IF NOT EXISTS paiements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id       UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  montant          NUMERIC(12,2) NOT NULL,
  date_paiement    DATE NOT NULL,
  mode             TEXT CHECK (mode IN ('virement','cheque','carte','especes','autre')),
  reference        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relances envoyées
CREATE TABLE IF NOT EXISTS relances (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id       UUID NOT NULL REFERENCES factures(id),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('amiable','formelle','mise_en_demeure')),
  statut           TEXT DEFAULT 'envoyee' CHECK (statut IN ('planifiee','envoyee','sans_reponse','reponse_recue')),
  date_envoi       TIMESTAMPTZ DEFAULT NOW(),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Score de fiabilité par client
CREATE TABLE IF NOT EXISTS scores_fiabilite_client (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  score            INTEGER CHECK (score BETWEEN 0 AND 100),
  nb_factures      INTEGER DEFAULT 0,
  nb_retards       INTEGER DEFAULT 0,
  delai_moyen_paiement INTEGER,
  montant_total    NUMERIC(12,2) DEFAULT 0,
  montant_impaye   NUMERIC(12,2) DEFAULT 0,
  calcule_a        TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_clients_entreprise ON clients(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_entreprise ON factures(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_relances_facture ON relances(facture_id);
CREATE INDEX IF NOT EXISTS idx_scores_fiabilite_client ON scores_fiabilite_client(client_id);

-- Triggers updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_factures_updated_at
  BEFORE UPDATE ON factures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE relances ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_fiabilite_client ENABLE ROW LEVEL SECURITY;

-- Policies clients
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "clients_delete" ON clients FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- Policies factures
CREATE POLICY "factures_select" ON factures FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "factures_insert" ON factures FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());
CREATE POLICY "factures_update" ON factures FOR UPDATE
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "factures_delete" ON factures FOR DELETE
  USING (entreprise_id = auth.entreprise_id() AND auth.user_role() = 'admin');

-- Policies paiements (via facture)
CREATE POLICY "paiements_select" ON paiements FOR SELECT
  USING (facture_id IN (SELECT id FROM factures WHERE entreprise_id = auth.entreprise_id()));
CREATE POLICY "paiements_insert" ON paiements FOR INSERT
  WITH CHECK (facture_id IN (SELECT id FROM factures WHERE entreprise_id = auth.entreprise_id()));
CREATE POLICY "paiements_update" ON paiements FOR UPDATE
  USING (facture_id IN (SELECT id FROM factures WHERE entreprise_id = auth.entreprise_id()));

-- Policies relances
CREATE POLICY "relances_select" ON relances FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
CREATE POLICY "relances_insert" ON relances FOR INSERT
  WITH CHECK (entreprise_id = auth.entreprise_id());

-- Policies scores_fiabilite
CREATE POLICY "scores_fiabilite_select" ON scores_fiabilite_client FOR SELECT
  USING (entreprise_id = auth.entreprise_id());
