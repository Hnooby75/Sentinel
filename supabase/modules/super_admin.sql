-- ============================================
-- supabase/modules/super_admin.sql
-- Rôle super_admin pour le panel d'administration
-- ============================================

-- 1. Ajouter super_admin comme rôle valide
ALTER TABLE utilisateurs
  DROP CONSTRAINT IF EXISTS utilisateurs_role_check;

ALTER TABLE utilisateurs
  ADD CONSTRAINT utilisateurs_role_check
  CHECK (role IN ('admin', 'manager', 'employe', 'lecteur', 'membre', 'super_admin'));

-- 2. Définir votre compte comme super_admin
--    Remplacer l'email par le vôtre si nécessaire
UPDATE utilisateurs
SET role = 'super_admin'
WHERE email = 'chafiqui@icloud.com';

-- Vérification
SELECT id, email, role FROM utilisateurs WHERE role = 'super_admin';
