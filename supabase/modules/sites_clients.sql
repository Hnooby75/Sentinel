-- ============================================
-- supabase/modules/sites_clients.sql
-- Site web géré par entreprise (multi-tenant)
-- ============================================

CREATE TABLE IF NOT EXISTS sites_clients (
  entreprise_id UUID PRIMARY KEY REFERENCES entreprises(id) ON DELETE CASCADE,
  contenu       JSONB NOT NULL DEFAULT '{}',
  url           TEXT,
  statut        TEXT DEFAULT 'en_creation' CHECK (statut IN ('en_creation', 'en_ligne', 'en_maintenance', 'inactif')),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : chaque entreprise voit et modifie uniquement son propre site
ALTER TABLE sites_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture site propre entreprise"
  ON sites_clients FOR SELECT
  USING (
    entreprise_id IN (
      SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid()
    )
  );

-- Les écritures passent par le admin client (service_role, bypass RLS)
-- donc pas de policy INSERT/UPDATE nécessaire côté client

COMMENT ON TABLE sites_clients IS 'Contenu du site web géré pour chaque entreprise cliente';
