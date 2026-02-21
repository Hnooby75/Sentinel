-- ============================================================
-- SENTINEL — Schéma complet de la base de données
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase
-- https://supabase.com/dashboard/project/kbbfajxdlctjrjppoksb/sql
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. CLIENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  email         TEXT,
  telephone     TEXT,
  siret         TEXT,
  secteur       TEXT,
  pays          TEXT DEFAULT 'FR',
  actif         BOOLEAN DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_entreprise" ON public.clients
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 2. FACTURES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.factures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  numero          TEXT NOT NULL,
  montant_ht      NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_ttc     NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise          TEXT DEFAULT 'EUR',
  statut          TEXT DEFAULT 'envoyee'
                  CHECK (statut IN ('brouillon','envoyee','partielle','payee','en_retard','contentieux')),
  date_emission   DATE NOT NULL,
  date_echeance   DATE NOT NULL,
  date_paiement   DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factures_entreprise" ON public.factures
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 3. PAIEMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paiements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id      UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  montant         NUMERIC(12,2) NOT NULL,
  date_paiement   DATE NOT NULL,
  mode            TEXT DEFAULT 'virement',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paiements_entreprise" ON public.paiements
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 4. SCORES FIABILITÉ CLIENT ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores_fiabilite_client (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  score           NUMERIC(5,2) DEFAULT 50,
  montant_impaye  NUMERIC(12,2) DEFAULT 0,
  montant_total   NUMERIC(12,2) DEFAULT 0,
  calcule_a       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.scores_fiabilite_client ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_fiabilite_entreprise" ON public.scores_fiabilite_client
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 5. DOCUMENTS CONTRATS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents_contrats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  uploaded_by     UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  nom             TEXT NOT NULL,
  type_contrat    TEXT DEFAULT 'autre'
                  CHECK (type_contrat IN ('prestataire','cgu','bail','partenariat','nda','autre')),
  contenu_texte   TEXT,
  fichier_url     TEXT,
  taille_fichier  BIGINT,
  statut          TEXT DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon','analyse','signe','archive')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents_contrats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrats_entreprise" ON public.documents_contrats
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 6. ANALYSES CONTRATS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses_contrats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents_contrats(id) ON DELETE CASCADE,
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  score_risque    INTEGER DEFAULT 0 CHECK (score_risque BETWEEN 0 AND 100),
  niveau_risque   TEXT DEFAULT 'faible'
                  CHECK (niveau_risque IN ('faible','modere','eleve','critique')),
  resume          TEXT,
  points_sensibles JSONB DEFAULT '[]',
  recommandations  JSONB DEFAULT '[]',
  analyse_a       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.analyses_contrats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyses_contrats_entreprise" ON public.analyses_contrats
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 7. OBLIGATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.obligations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  type_obligation_id UUID,
  libelle_custom    TEXT NOT NULL,
  statut            TEXT DEFAULT 'a_faire'
                    CHECK (statut IN ('a_faire','en_cours','valide','en_retard','non_applicable')),
  echeance          DATE,
  responsable_id    UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "obligations_entreprise" ON public.obligations
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 8. FLUX FINANCIERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flux_financiers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  saisi_par         UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  mois              DATE NOT NULL,
  ca_mensuel        NUMERIC(14,2) DEFAULT 0,
  charges_fixes     NUMERIC(14,2) DEFAULT 0,
  charges_variables NUMERIC(14,2) DEFAULT 0,
  tresorerie        NUMERIC(14,2) DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entreprise_id, mois)
);
ALTER TABLE public.flux_financiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flux_financiers_entreprise" ON public.flux_financiers
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 9. INDICATEURS FINANCIERS ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.indicateurs_financiers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  score_solidite  NUMERIC(5,2) DEFAULT 0,
  niveau          TEXT DEFAULT 'fragile'
                  CHECK (niveau IN ('fragile','correct','solide','excellent')),
  runway_mois     NUMERIC(5,1) DEFAULT 0,
  ratio_charges   NUMERIC(5,2) DEFAULT 0,
  ratio_tresorerie NUMERIC(5,2) DEFAULT 0,
  tendance_ca     TEXT CHECK (tendance_ca IN ('hausse','baisse','stable')),
  detail          JSONB DEFAULT '{}',
  calcule_a       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.indicateurs_financiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indicateurs_financiers_entreprise" ON public.indicateurs_financiers
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 10. SUPPLIER ASSESSMENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_assessments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  supplier_name     TEXT NOT NULL,
  supplier_url      TEXT,
  risk_score        INTEGER DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  ai_usage_detected BOOLEAN DEFAULT FALSE,
  summary           TEXT,
  policy_analysis   JSONB DEFAULT '{}',
  findings          JSONB DEFAULT '[]',
  recommendations   JSONB DEFAULT '[]',
  last_scanned_at   TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.supplier_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_assessments_entreprise" ON public.supplier_assessments
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 11. JOURNAUX USAGE IA ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journaux_usage_ia (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id             UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  declarant_id              UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  titre                     TEXT NOT NULL,
  description               TEXT,
  outil_ia                  TEXT,
  outil_ia_custom           TEXT,
  categorie_usage           TEXT,
  frequence_usage           TEXT,
  nb_utilisateurs_concernes INTEGER DEFAULT 1,
  date_premier_usage        DATE,
  traite_donnees_perso      BOOLEAN DEFAULT FALSE,
  types_donnees_perso       JSONB DEFAULT '[]',
  base_legale_rgpd          TEXT,
  decision_automatisee      BOOLEAN DEFAULT FALSE,
  impact_personnes          BOOLEAN DEFAULT FALSE,
  prompt_exemple            TEXT,
  mesures_mitigation        JSONB DEFAULT '[]',
  niveau_risque             TEXT DEFAULT 'faible'
                            CHECK (niveau_risque IN ('faible','limite','eleve','inacceptable')),
  statut                    TEXT DEFAULT 'actif'
                            CHECK (statut IN ('actif','inactif','archive')),
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.journaux_usage_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journaux_ia_entreprise" ON public.journaux_usage_ia
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 12. SHADOW AI DETECTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shadow_ai_detections (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  tool_name         TEXT NOT NULL,
  tool_category     TEXT,
  detection_source  TEXT,
  confidence        NUMERIC(4,2) DEFAULT 0.5,
  risk_assessment   TEXT,
  statut            TEXT DEFAULT 'detected'
                    CHECK (statut IN ('detected','under_review','declared','dismissed')),
  detected_at       TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shadow_ai_detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shadow_ai_entreprise" ON public.shadow_ai_detections
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 13. SCORES CONFORMITÉ ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores_conformite (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  score_global      NUMERIC(5,2) DEFAULT 0,
  score_documentation NUMERIC(5,2) DEFAULT 0,
  score_classification NUMERIC(5,2) DEFAULT 0,
  score_mitigation  NUMERIC(5,2) DEFAULT 0,
  score_gouvernance NUMERIC(5,2) DEFAULT 0,
  niveau_conformite TEXT DEFAULT 'non_conforme',
  detail_calcul     JSONB DEFAULT '{}',
  recommandations   JSONB DEFAULT '[]',
  calcule_a         TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.scores_conformite ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_conformite_entreprise" ON public.scores_conformite
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 14. SCORES GLOBAUX ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores_globaux (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id       UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  score_global        NUMERIC(5,2) DEFAULT 0,
  score_conformite_ia NUMERIC(5,2) DEFAULT 0,
  score_impayes       NUMERIC(5,2) DEFAULT 0,
  score_obligations   NUMERIC(5,2) DEFAULT 0,
  score_contractuel   NUMERIC(5,2) DEFAULT 0,
  score_financier     NUMERIC(5,2) DEFAULT 0,
  niveau              TEXT DEFAULT 'critique',
  recommandations_cles JSONB DEFAULT '[]',
  calcule_a           TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.scores_globaux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_globaux_entreprise" ON public.scores_globaux
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 15. AUDIT LOGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  utilisateur_id  UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  ressource_type  TEXT,
  ressource_id    UUID,
  avant           JSONB,
  apres           JSONB,
  succes          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_entreprise" ON public.audit_logs
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 16. EQUIPE INVITATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.equipe_invitations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'membre',
  invite_par      UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  statut          TEXT DEFAULT 'en_attente'
                  CHECK (statut IN ('en_attente','acceptee','expiree')),
  token           TEXT,
  expire_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.equipe_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_entreprise" ON public.equipe_invitations
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 17. FORMATION PROGRESS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formation_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  utilisateur_id  UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL,
  statut          TEXT DEFAULT 'non_commence'
                  CHECK (statut IN ('non_commence','en_cours','termine')),
  score           INTEGER,
  termine_a       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entreprise_id, utilisateur_id, module_id)
);
ALTER TABLE public.formation_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formation_entreprise" ON public.formation_progress
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 18. TRAINING COMPLETIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_completions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id   UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  utilisateur_id  UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  training_id     UUID,
  completed_at    TIMESTAMPTZ DEFAULT now(),
  score           INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_completions_entreprise" ON public.training_completions
  USING (entreprise_id IN (
    SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()
  ));

-- ─── 19. ASSURER QUE ENTREPRISES A LES BONNES COLONNES ───────
ALTER TABLE public.entreprises
  ADD COLUMN IF NOT EXISTS secteur TEXT,
  ADD COLUMN IF NOT EXISTS taille TEXT,
  ADD COLUMN IF NOT EXISTS siret TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_actif BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');

-- ─── 20. ASSURER QUE UTILISATEURS A LES BONNES COLONNES ──────
ALTER TABLE public.utilisateurs
  ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- ─── INDEX PERFORMANCES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_entreprise ON public.clients(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_entreprise ON public.factures(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON public.factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_client ON public.factures(client_id);
CREATE INDEX IF NOT EXISTS idx_obligations_entreprise ON public.obligations(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_flux_financiers_entreprise ON public.flux_financiers(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_journaux_ia_entreprise ON public.journaux_usage_ia(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_shadow_ai_entreprise ON public.shadow_ai_detections(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_supplier_entreprise ON public.supplier_assessments(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_contrats_entreprise ON public.documents_contrats(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_scores_globaux_entreprise ON public.scores_globaux(entreprise_id, calcule_a DESC);

-- ─── FIN ─────────────────────────────────────────────────────
-- Toutes les tables sont créées.
-- Retournez sur http://localhost:3000/dashboard/seed-demo pour charger les données démo.
