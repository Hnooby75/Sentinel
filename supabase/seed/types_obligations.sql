-- ============================================
-- supabase/seed/types_obligations.sql
-- Référentiel de base — ~20 obligations légales françaises
-- ============================================

INSERT INTO types_obligations (code, libelle, description, categorie, frequence, mois_echeance, source_legale) VALUES

-- FISCAL
('TVA_MENSUELLE', 'Déclaration TVA mensuelle', 'Déclaration et paiement de la TVA collectée mensuelle', 'fiscal', 'mensuel', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'CGI art. 287'),
('TVA_TRIMESTRIELLE', 'Déclaration TVA trimestrielle', 'Déclaration et paiement de la TVA collectée trimestrielle (régime simplifié)', 'fiscal', 'trimestriel', '{4,7,10,1}', 'CGI art. 287'),
('IS_ANNUEL', 'Déclaration Impôt sur les Sociétés', 'Déclaration annuelle de l''IS et paiement du solde', 'fiscal', 'annuel', '{5}', 'CGI art. 223'),
('LIASSE_FISCALE', 'Liasse fiscale annuelle', 'Dépôt de la liasse fiscale (bilan, compte de résultat)', 'fiscal', 'annuel', '{5}', 'CGI art. 54'),
('ACOMPTE_IS_T1', 'Acompte IS — 1er trimestre', 'Premier acompte d''impôt sur les sociétés', 'fiscal', 'annuel', '{3}', 'CGI art. 1668'),
('ACOMPTE_IS_T2', 'Acompte IS — 2e trimestre', 'Deuxième acompte d''impôt sur les sociétés', 'fiscal', 'annuel', '{6}', 'CGI art. 1668'),
('ACOMPTE_IS_T3', 'Acompte IS — 3e trimestre', 'Troisième acompte d''impôt sur les sociétés', 'fiscal', 'annuel', '{9}', 'CGI art. 1668'),
('ACOMPTE_IS_T4', 'Acompte IS — 4e trimestre', 'Quatrième acompte d''impôt sur les sociétés', 'fiscal', 'annuel', '{12}', 'CGI art. 1668'),

-- SOCIAL
('COTISATIONS_SOCIALES', 'Cotisations sociales patronales', 'Déclaration et paiement des cotisations sociales mensuelles', 'social', 'mensuel', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'Code de la Sécurité Sociale'),
('DSN_MENSUELLE', 'Déclaration Sociale Nominative (DSN)', 'Déclaration mensuelle des données sociales des salariés', 'social', 'mensuel', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'Loi 2012-387'),
('DPAE', 'Déclaration Préalable à l''Embauche (DPAE)', 'Déclaration obligatoire avant toute embauche de salarié', 'social', 'ponctuel', NULL, 'CSS art. L1221-10'),
('FORMATION_PROFESSIONNELLE', 'Contribution formation professionnelle', 'Déclaration annuelle de la contribution à la formation professionnelle', 'social', 'annuel', '{2}', 'Code du Travail L6331-1'),

-- JURIDIQUE
('AG_ANNUELLE', 'Assemblée Générale Ordinaire annuelle', 'Tenue obligatoire de l''AGO dans les 6 mois suivant la clôture', 'juridique', 'annuel', '{6}', 'Code de Commerce L225-100'),
('DEPOT_COMPTES', 'Dépôt des comptes annuels au greffe', 'Dépôt obligatoire des comptes approuvés au greffe du tribunal', 'juridique', 'annuel', '{7}', 'Code de Commerce L232-23'),
('MISE_A_JOUR_KBIS', 'Mise à jour du Kbis / statuts', 'Déclaration de toute modification statutaire au registre du commerce', 'juridique', 'ponctuel', NULL, 'Code de Commerce R123-66'),

-- RGPD
('REGISTRE_TRAITEMENTS', 'Registre des traitements de données', 'Tenue et mise à jour du registre des activités de traitement (RGPD art. 30)', 'rgpd', 'annuel', '{1}', 'RGPD art. 30'),
('ANALYSE_IMPACT', 'Analyse d''impact (DPIA)', 'Réalisation des analyses d''impact pour les traitements à risque élevé', 'rgpd', 'ponctuel', NULL, 'RGPD art. 35'),
('NOTIFICATION_VIOLATION', 'Notification de violation de données', 'Notification à la CNIL dans les 72h en cas de violation de données personnelles', 'rgpd', 'ponctuel', NULL, 'RGPD art. 33'),

-- SECTORIEL
('CERTIFICATION_HYGIENE', 'Formation hygiène alimentaire', 'Formation obligatoire pour les établissements de restauration', 'sectoriel', 'ponctuel', NULL, 'Règlement CE 852/2004'),

-- ENVIRONNEMENT
('BILAN_CARBONE', 'Bilan GES (Bilan Carbone)', 'Bilan des émissions de gaz à effet de serre pour les entreprises de +500 salariés', 'environnement', 'annuel', '{7}', 'Loi Grenelle 2 art. 75')

ON CONFLICT (code) DO NOTHING;
