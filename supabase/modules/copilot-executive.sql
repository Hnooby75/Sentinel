-- ============================================================
-- supabase/modules/copilot-executive.sql
-- Copilote Exécutif IA — Finance, RH, CRM, Opérations
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- MODULE FINANCE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS depenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  libelle       TEXT NOT NULL,
  montant       NUMERIC(12,2) NOT NULL,
  categorie     TEXT NOT NULL DEFAULT 'autre',
  date_depense  DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_cashflow_predictions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  genere_a         TIMESTAMPTZ NOT NULL DEFAULT now(),
  prevision_30j    NUMERIC(12,2),
  prevision_60j    NUMERIC(12,2),
  prevision_90j    NUMERIC(12,2),
  tendance         TEXT,
  niveau_risque    TEXT,
  analyse_texte    TEXT,
  anomalies        JSONB DEFAULT '[]',
  recommandations  JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS ai_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  module        TEXT NOT NULL,
  severite      TEXT NOT NULL CHECK (severite IN ('critical','warning','info')),
  titre         TEXT NOT NULL,
  description   TEXT,
  lu            BOOLEAN NOT NULL DEFAULT false,
  resolu        BOOLEAN NOT NULL DEFAULT false,
  donnees       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- MODULE RH
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id    UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  prenom           TEXT NOT NULL,
  nom              TEXT NOT NULL,
  email            TEXT,
  poste            TEXT,
  departement      TEXT,
  type_contrat     TEXT NOT NULL DEFAULT 'cdi' CHECK (type_contrat IN ('cdi','cdd','freelance','stage','alternance')),
  date_embauche    DATE,
  date_fin_contrat DATE,
  salaire_brut     NUMERIC(10,2),
  statut           TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','inactif','conge')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id    UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT 'cp' CHECK (type IN ('cp','maladie','rtt','autre')),
  date_debut    DATE NOT NULL,
  date_fin      DATE NOT NULL,
  statut        TEXT NOT NULL DEFAULT 'demande' CHECK (statut IN ('demande','approuve','refuse','annule')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_hr_reports (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id          UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  genere_a               TIMESTAMPTZ NOT NULL DEFAULT now(),
  score_sante_rh         INT,
  taux_absenteisme       FLOAT,
  employes_surcharge     INT,
  contrats_a_renouveler  INT,
  risques                JSONB DEFAULT '[]',
  recommandations        JSONB DEFAULT '[]',
  analyse_texte          TEXT
);

CREATE TABLE IF NOT EXISTS ai_employee_health_score (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id      UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  calcule_a       TIMESTAMPTZ NOT NULL DEFAULT now(),
  score           INT CHECK (score BETWEEN 0 AND 100),
  facteurs        JSONB DEFAULT '{}',
  risque_turnover TEXT
);

-- ─────────────────────────────────────────────
-- MODULE CRM
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id  UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  email          TEXT,
  telephone      TEXT,
  entreprise_nom TEXT,
  source         TEXT NOT NULL DEFAULT 'autre' CHECK (source IN ('site','referral','cold','event','autre')),
  statut         TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau','contacte','qualifie','disqualifie')),
  score_ia       INT,
  notes          TEXT,
  assigne_a      UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunites (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  titre               TEXT NOT NULL,
  montant_estime      NUMERIC(12,2),
  probabilite         INT DEFAULT 50 CHECK (probabilite BETWEEN 0 AND 100),
  etape               TEXT NOT NULL DEFAULT 'prospection' CHECK (etape IN ('prospection','qualification','proposition','negociation','gagne','perdu')),
  date_cloture_prevue DATE,
  score_risque_ia     INT,
  assigne_a           UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_sales_predictions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id          UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  genere_a               TIMESTAMPTZ NOT NULL DEFAULT now(),
  revenu_prevu_30j       NUMERIC(12,2),
  revenu_prevu_90j       NUMERIC(12,2),
  nb_deals_prevus        INT,
  taux_conversion_prevu  FLOAT,
  deals_en_danger        JSONB DEFAULT '[]',
  recommandations        JSONB DEFAULT '[]',
  analyse_texte          TEXT
);

CREATE TABLE IF NOT EXISTS ai_lead_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  calcule_a     TIMESTAMPTZ NOT NULL DEFAULT now(),
  score         INT CHECK (score BETWEEN 0 AND 100),
  facteurs      JSONB DEFAULT '{}',
  prochaine_action TEXT
);

-- ─────────────────────────────────────────────
-- MODULE OPÉRATIONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS taches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id  UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  titre          TEXT NOT NULL,
  description    TEXT,
  statut         TEXT NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire','en_cours','bloquee','terminee','annulee')),
  priorite       TEXT NOT NULL DEFAULT 'normale' CHECK (priorite IN ('critique','haute','normale','faible')),
  priorite_ia    TEXT,
  score_impact   INT,
  assigne_a      UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  module_origine TEXT,
  echeance       TIMESTAMPTZ,
  completee_a    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_strategy_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  genere_a            TIMESTAMPTZ NOT NULL DEFAULT now(),
  type_rapport        TEXT NOT NULL DEFAULT 'quotidien' CHECK (type_rapport IN ('quotidien','hebdomadaire','mensuel')),
  score_productivite  INT,
  taches_bloquees     INT,
  goulots             JSONB DEFAULT '[]',
  synthese_executive  TEXT,
  actions_prioritaires JSONB DEFAULT '[]',
  modules_snapshot    JSONB DEFAULT '{}'
);

-- ─────────────────────────────────────────────
-- TRANSVERSAL
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id  UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  module         TEXT NOT NULL,
  action         TEXT NOT NULL,
  donnees        JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TRIGGERS updated_at (réutilise la fonction existante)
-- ─────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_employes_updated_at ON employes;
CREATE TRIGGER trg_employes_updated_at
  BEFORE UPDATE ON employes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_opportunites_updated_at ON opportunites;
CREATE TRIGGER trg_opportunites_updated_at
  BEFORE UPDATE ON opportunites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_taches_updated_at ON taches;
CREATE TRIGGER trg_taches_updated_at
  BEFORE UPDATE ON taches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- RLS — Row Level Security
-- ─────────────────────────────────────────────

ALTER TABLE depenses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cashflow_predictions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_alerts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE employes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE conges                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_hr_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_employee_health_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunites             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sales_predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_lead_scores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_strategy_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs            ENABLE ROW LEVEL SECURITY;

-- depenses
DROP POLICY IF EXISTS "depenses_entreprise" ON depenses;
CREATE POLICY "depenses_entreprise" ON depenses
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_cashflow_predictions
DROP POLICY IF EXISTS "cashflow_predictions_entreprise" ON ai_cashflow_predictions;
CREATE POLICY "cashflow_predictions_entreprise" ON ai_cashflow_predictions
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_alerts
DROP POLICY IF EXISTS "alerts_entreprise" ON ai_alerts;
CREATE POLICY "alerts_entreprise" ON ai_alerts
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- employes
DROP POLICY IF EXISTS "employes_entreprise" ON employes;
CREATE POLICY "employes_entreprise" ON employes
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- conges
DROP POLICY IF EXISTS "conges_entreprise" ON conges;
CREATE POLICY "conges_entreprise" ON conges
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_hr_reports
DROP POLICY IF EXISTS "hr_reports_entreprise" ON ai_hr_reports;
CREATE POLICY "hr_reports_entreprise" ON ai_hr_reports
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_employee_health_score
DROP POLICY IF EXISTS "employee_health_entreprise" ON ai_employee_health_score;
CREATE POLICY "employee_health_entreprise" ON ai_employee_health_score
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- leads
DROP POLICY IF EXISTS "leads_entreprise" ON leads;
CREATE POLICY "leads_entreprise" ON leads
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- opportunites
DROP POLICY IF EXISTS "opportunites_entreprise" ON opportunites;
CREATE POLICY "opportunites_entreprise" ON opportunites
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_sales_predictions
DROP POLICY IF EXISTS "sales_predictions_entreprise" ON ai_sales_predictions;
CREATE POLICY "sales_predictions_entreprise" ON ai_sales_predictions
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_lead_scores
DROP POLICY IF EXISTS "lead_scores_entreprise" ON ai_lead_scores;
CREATE POLICY "lead_scores_entreprise" ON ai_lead_scores
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- taches
DROP POLICY IF EXISTS "taches_entreprise" ON taches;
CREATE POLICY "taches_entreprise" ON taches
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ai_strategy_reports
DROP POLICY IF EXISTS "strategy_reports_entreprise" ON ai_strategy_reports;
CREATE POLICY "strategy_reports_entreprise" ON ai_strategy_reports
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- activity_logs
DROP POLICY IF EXISTS "activity_logs_entreprise" ON activity_logs;
CREATE POLICY "activity_logs_entreprise" ON activity_logs
  USING (entreprise_id = get_user_entreprise_id())
  WITH CHECK (entreprise_id = get_user_entreprise_id());

-- ─────────────────────────────────────────────
-- INDEX UNIQUES (simples — sur colonnes directes)
-- La déduplication par jour est gérée côté API (cooldown 1h)
-- ─────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_cashflow
  ON ai_cashflow_predictions (entreprise_id, genere_a);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_hr_report
  ON ai_hr_reports (entreprise_id, genere_a);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_employee_health
  ON ai_employee_health_score (employe_id, calcule_a);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_sales_pred
  ON ai_sales_predictions (entreprise_id, genere_a);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_lead_score
  ON ai_lead_scores (lead_id, calcule_a);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_strategy_report
  ON ai_strategy_reports (entreprise_id, type_rapport, genere_a);

-- ─────────────────────────────────────────────
-- INDEX pour performances
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_depenses_entreprise ON depenses(entreprise_id, date_depense DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_entreprise ON ai_cashflow_predictions(entreprise_id, genere_a DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_entreprise ON ai_alerts(entreprise_id, resolu, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employes_entreprise ON employes(entreprise_id, statut);
CREATE INDEX IF NOT EXISTS idx_conges_employe ON conges(employe_id, date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_leads_entreprise ON leads(entreprise_id, score_ia DESC);
CREATE INDEX IF NOT EXISTS idx_opportunites_entreprise ON opportunites(entreprise_id, etape);
CREATE INDEX IF NOT EXISTS idx_taches_entreprise ON taches(entreprise_id, statut, score_impact DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entreprise ON activity_logs(entreprise_id, created_at DESC);
