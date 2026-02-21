-- ============================================================
-- supabase/diagnostic.sql
-- Exécuter dans Supabase SQL Editor pour voir l'état actuel
-- ============================================================

-- 1. Vérifier le compte chafiqui@icloud.com
SELECT u.id, u.email, u.role, u.entreprise_id, u.actif,
       e.nom, e.plan, e.plan_actif, e.site_web_actif
FROM public.utilisateurs u
LEFT JOIN public.entreprises e ON e.id = u.entreprise_id
WHERE u.email = 'chafiqui@icloud.com';

-- 2. Vérifier le compte auth
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'chafiqui@icloud.com';

-- 3. Vérifier si site_web_actif existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'entreprises' AND column_name = 'site_web_actif'
    )
    THEN '✓ Colonne site_web_actif EXISTE'
    ELSE '✗ Colonne site_web_actif MANQUANTE — exécuter a-executer.sql'
  END AS statut_colonne;

-- 4. Vérifier sites_clients pour chafiqui
SELECT sc.entreprise_id, sc.url, sc.statut, sc.updated_at, e.nom
FROM public.sites_clients sc
JOIN public.entreprises e ON e.id = sc.entreprise_id
JOIN public.utilisateurs u ON u.entreprise_id = e.id
WHERE u.email = 'chafiqui@icloud.com';

-- 5. Vérifier la table tickets_sav
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets_sav')
    THEN '✓ Table tickets_sav EXISTE'
    ELSE '✗ Table tickets_sav MANQUANTE — exécuter a-executer.sql'
  END AS statut_tickets;
