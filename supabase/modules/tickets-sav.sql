-- ============================================
-- supabase/modules/tickets-sav.sql
-- Système de tickets SAV catégorisé
-- À exécuter dans Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.tickets_sav (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  sujet           TEXT NOT NULL,
  categorie       TEXT NOT NULL,
  description     TEXT NOT NULL,
  statut          TEXT NOT NULL DEFAULT 'ouvert'
                    CHECK (statut IN ('ouvert', 'en_attente', 'résolu', 'clôturé')),
  notes_admin     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS tickets_sav_entreprise_idx ON public.tickets_sav(entreprise_id);
CREATE INDEX IF NOT EXISTS tickets_sav_statut_idx     ON public.tickets_sav(statut);
CREATE INDEX IF NOT EXISTS tickets_sav_categorie_idx  ON public.tickets_sav(categorie);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_tickets_sav_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_sav_updated_at ON public.tickets_sav;
CREATE TRIGGER tickets_sav_updated_at
  BEFORE UPDATE ON public.tickets_sav
  FOR EACH ROW EXECUTE FUNCTION public.update_tickets_sav_updated_at();

-- RLS
ALTER TABLE public.tickets_sav ENABLE ROW LEVEL SECURITY;

-- Les clients voient uniquement leurs propres tickets
CREATE POLICY "tickets_sav_client_select" ON public.tickets_sav
  FOR SELECT USING (
    entreprise_id = (
      SELECT entreprise_id FROM public.utilisateurs
      WHERE id = auth.uid() LIMIT 1
    )
  );

-- Les clients peuvent créer des tickets pour leur entreprise
CREATE POLICY "tickets_sav_client_insert" ON public.tickets_sav
  FOR INSERT WITH CHECK (
    entreprise_id = (
      SELECT entreprise_id FROM public.utilisateurs
      WHERE id = auth.uid() LIMIT 1
    )
  );
