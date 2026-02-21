-- ============================================
-- cleanup_orphaned.sql
-- À exécuter dans Supabase SQL Editor
-- Supprime toutes les entreprises sans utilisateurs (créées par le bug auth/setup)
-- ============================================

-- 1. Créer une fonction RPC appelable depuis l'API
CREATE OR REPLACE FUNCTION cleanup_orphaned_entreprises()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- Supprimer d'abord les données enfants des entreprises orphelines
  -- (pour éviter les violations FK)
  DELETE FROM sites_clients
  WHERE entreprise_id NOT IN (
    SELECT DISTINCT entreprise_id FROM utilisateurs WHERE entreprise_id IS NOT NULL
  );

  DELETE FROM journaux_usage_ia
  WHERE entreprise_id NOT IN (
    SELECT DISTINCT entreprise_id FROM utilisateurs WHERE entreprise_id IS NOT NULL
  );

  -- Supprimer les entreprises sans aucun utilisateur
  DELETE FROM entreprises
  WHERE id NOT IN (
    SELECT DISTINCT entreprise_id
    FROM utilisateurs
    WHERE entreprise_id IS NOT NULL
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 2. Vérification : combien d'orphelines existent ?
SELECT COUNT(*) AS orphelines
FROM entreprises
WHERE id NOT IN (
  SELECT DISTINCT entreprise_id
  FROM utilisateurs
  WHERE entreprise_id IS NOT NULL
);
