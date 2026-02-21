-- ============================================
-- supabase/seed/training-modules.sql
-- 8 modules de formation AI Literacy Hub
-- ============================================

INSERT INTO training_modules (titre, description, target_role, difficulty, duration_minutes, order_index, content, quiz) VALUES

-- MODULE 1
(
  'Qu''est-ce que l''AI Act ?',
  'Comprendre le premier règlement mondial sur l''intelligence artificielle',
  'all', 'beginner', 5, 1,
  '[
    {"type":"intro","title":"Le règlement qui change tout","body":"Le 1er août 2024, l''Union européenne a publié le Règlement (UE) 2024/1689 sur l''intelligence artificielle — l''AI Act. C''est la première loi au monde à encadrer spécifiquement l''IA.","key_point":"L''AI Act s''applique à TOUTES les entreprises qui utilisent des outils IA dans l''UE"},
    {"type":"content","title":"Qui est concerné ?","items":["Votre entreprise si elle utilise ChatGPT, Copilot, ou tout autre outil IA","Les éditeurs qui développent des solutions IA","Les entreprises non-européennes dont les IA sont utilisées dans l''UE","En résumé : si vous utilisez de l''IA professionnellement → vous êtes concerné"]},
    {"type":"content","title":"Quand s''applique-t-il ?","items":["Août 2024 : Règlement en vigueur","Février 2025 : Interdictions pratiques IA inacceptables","Août 2026 : Obligations systèmes haut risque","Août 2027 : Toutes les autres dispositions"]},
    {"type":"content","title":"Les sanctions","items":["Jusqu''à 35 millions d''euros","Ou 7% du chiffre d''affaires mondial annuel","Pour les violations les plus graves (risque inacceptable)","Jusqu''à 15M€ ou 3% CA pour les autres violations"]},
    {"type":"summary","title":"Ce qu''il faut retenir","points":["L''AI Act est le RGPD de l''IA","Il s''applique à vous si vous utilisez des outils IA","Les sanctions sont très élevées","Agir maintenant = se préparer à 2026"]}
  ]',
  '[
    {"question":"À partir de quand les obligations sur les systèmes haut risque s''appliquent-elles ?","options":["Août 2024","Février 2025","Août 2026","Janvier 2027"],"correct":2,"explanation":"Les obligations pour les systèmes à haut risque (Annexe III) entrent en vigueur en août 2026."},
    {"question":"Quelle est la sanction maximale pour une violation grave de l''AI Act ?","options":["500 000 €","15 millions € ou 3% du CA","35 millions € ou 7% du CA","Pas de sanction financière"],"correct":2,"explanation":"Les violations les plus graves (pratiques interdites) exposent à des amendes de 35M€ ou 7% du CA mondial."},
    {"question":"L''AI Act s''applique-t-il à une PME française qui utilise uniquement ChatGPT pour rédiger des emails ?","options":["Non, uniquement aux grands groupes","Non, uniquement aux éditeurs d''IA","Oui, dès lors qu''elle utilise un outil IA en contexte professionnel","Oui, mais seulement si elle dépasse 50M€ de CA"],"correct":2,"explanation":"L''AI Act s''applique à toutes les entreprises qui utilisent des systèmes IA, quelle que soit leur taille."}
  ]'
),

-- MODULE 2
(
  'Comprendre les niveaux de risque',
  'Savoir classer un système IA selon l''AI Act : des 4 niveaux de risque',
  'all', 'beginner', 7, 2,
  '[
    {"type":"intro","title":"Une approche basée sur le risque","body":"L''AI Act classe les systèmes IA en 4 niveaux de risque. Plus le risque est élevé, plus les obligations sont strictes. L''objectif est de ne pas freiner l''innovation tout en protégeant les citoyens."},
    {"type":"content","title":"Risque INACCEPTABLE — Interdit","items":["Notation sociale de citoyens par l''État","Identification biométrique en temps réel dans l''espace public","Manipulation des comportements par techniques subliminales","Exploitation de vulnérabilités (enfants, personnes âgées...)","→ Ces usages sont INTERDITS depuis février 2025"]},
    {"type":"content","title":"Risque ÉLEVÉ — Obligations strictes","items":["Recrutement et sélection de CV par IA","Systèmes de crédit scoring et assurance","IA dans l''éducation (notation d''élèves)","Systèmes de surveillance et d''identification biométrique","→ Documentation technique + supervision humaine obligatoires"]},
    {"type":"content","title":"Risque LIMITÉ — Transparence obligatoire","items":["Chatbots interagissant avec des clients","Génération de textes, images, vidéos (deepfakes)","Reconnaissance d''émotions","→ Vous DEVEZ informer les utilisateurs qu''ils interagissent avec une IA"]},
    {"type":"content","title":"Risque MINIMAL — Peu de restrictions","items":["Filtres anti-spam","IA dans les jeux vidéo","Outils de productivité généralistes","→ Bonnes pratiques recommandées mais pas d''obligation légale spécifique"]},
    {"type":"quiz_intro","title":"Testez vos connaissances !","body":"À quel niveau de risque appartiennent les cas suivants ?"}
  ]',
  '[
    {"question":"Votre RH utilise un logiciel IA pour trier automatiquement les CV sans intervention humaine. Quel niveau de risque ?","options":["Minimal","Limité","Élevé","Inacceptable"],"correct":2,"explanation":"L''utilisation de l''IA dans le recrutement figure explicitement dans l''Annexe III de l''AI Act → risque élevé. Une supervision humaine est obligatoire."},
    {"question":"Votre site e-commerce intègre un chatbot IA pour répondre aux questions clients. Quel niveau ?","options":["Minimal","Limité","Élevé","Inacceptable"],"correct":1,"explanation":"Les chatbots qui interagissent avec des personnes = risque limité (Art. 50). Vous devez informer vos clients qu''ils parlent à une IA."},
    {"question":"Vous utilisez ChatGPT pour générer des newsletters internes. Quel niveau de risque ?","options":["Minimal","Limité","Élevé","Inacceptable"],"correct":0,"explanation":"La génération de contenu interne sans impact direct sur des décisions concernant des personnes = risque minimal. Peu d''obligations spécifiques."},
    {"question":"Un système IA qui analyse les expressions faciales des employés en réunion. Quel niveau ?","options":["Minimal","Limité","Élevé","Inacceptable"],"correct":3,"explanation":"L''analyse des émotions en milieu professionnel est une pratique INTERDITE par l''AI Act (Art. 5)."}
  ]'
),

-- MODULE 3
(
  'Vos obligations en tant que déployeur',
  'Comprendre ce que l''AI Act exige concrètement de votre entreprise',
  'executive', 'intermediate', 10, 3,
  '[
    {"type":"intro","title":"Vous êtes un déployeur","body":"Dans la grande majorité des PME, vous êtes un DÉPLOYEUR : vous utilisez des systèmes IA développés par des tiers (OpenAI, Microsoft, etc.) pour vos propres activités. L''AI Act vous impose des obligations spécifiques."},
    {"type":"content","title":"Obligation 1 : Tenir un registre","items":["Lister tous les systèmes IA que vous utilisez","Décrire leur usage, leur niveau de risque, les personnes concernées","Conserver ces informations à jour","→ C''est précisément ce que Sentinel vous aide à faire !"]},
    {"type":"content","title":"Obligation 2 : Informer vos utilisateurs","items":["Si vous utilisez un chatbot IA → dire que c''est une IA","Si vous générez des contenus IA pour des tiers → le mentionner","Si vous utilisez un outil IA dans un processus qui affecte des personnes → transparence"]},
    {"type":"content","title":"Obligation 3 : Supervision humaine","items":["Pour les systèmes à haut risque, une personne doit superviser les décisions IA","Pas de décision entièrement automatisée affectant significativement une personne","Documenter qui supervise et comment"]},
    {"type":"content","title":"Obligation 4 : Vérifier vos fournisseurs","items":["Vous assurer que vos outils IA haut risque sont conformes CE","Demander la documentation de conformité à vos prestataires IA","Vérifier les clauses contractuelles relatives à l''IA"]},
    {"type":"content","title":"Le calendrier à retenir","items":["Maintenant : Commencer à documenter vos usages IA","Avant août 2026 : Systèmes haut risque conformes","Avant août 2027 : Toutes autres obligations en place"]}
  ]',
  '[
    {"question":"En tant que PME utilisant ChatGPT pour son support client, quel est votre statut sous l''AI Act ?","options":["Fournisseur","Déployeur","Distributeur","Non concerné"],"correct":1,"explanation":"Vous êtes un DÉPLOYEUR : vous utilisez un système IA développé par OpenAI pour vos propres activités commerciales."},
    {"question":"Votre entreprise doit-elle tenir un registre de ses usages IA ?","options":["Non, uniquement les entreprises de +250 salariés","Oui, pour tous les systèmes à haut risque","Non, c''est optionnel","Oui, pour tous les systèmes IA utilisés"],"correct":1,"explanation":"L''Art. 26 impose aux déployeurs de tenir un registre pour les systèmes à haut risque. Pour les autres niveaux, c''est une bonne pratique fortement recommandée."},
    {"question":"Un client interagit avec votre chatbot IA. Devez-vous l''informer qu''il parle à une IA ?","options":["Non, si le chatbot répond bien","Oui, obligatoirement (Art. 50)","Seulement s''il pose la question","Oui, mais seulement pour les grandes entreprises"],"correct":1,"explanation":"L''Art. 50 impose d''informer les personnes lorsqu''elles interagissent avec un système IA. Cette information doit être claire et visible."}
  ]'
),

-- MODULE 4
(
  'Identifier l''IA dans votre organisation',
  'Méthode pratique pour cartographier tous vos usages IA',
  'all', 'beginner', 5, 4,
  '[
    {"type":"intro","title":"Le shadow AI : le risque invisible","body":"Selon les études, 40 à 70% des usages IA en entreprise ne sont pas déclarés à la direction. Des employés utilisent des outils IA personnels pour des tâches professionnelles. Ce phénomène s''appelle le ''Shadow AI''."},
    {"type":"content","title":"Où chercher les usages IA ?","items":["Les outils déjà payés par l''entreprise (Microsoft 365 Copilot, Notion AI...)", "Les abonnements personnels utilisés au travail (ChatGPT Plus, Claude Pro...)", "Les outils gratuits utilisés quotidiennement (Grammarly, DeepL...)", "Les intégrations dans vos logiciels métier (CRM, ERP, RH avec IA)","Les plugins et extensions de navigateur"]},
    {"type":"content","title":"Comment auditer vos usages ?","items":["Interroger les équipes : un questionnaire simple suffit","Regarder les logiciels installés et les abonnements","Analyser les accès aux domaines IA dans les logs réseau (si disponible)","Créer un canal de signalement dédié"]},
    {"type":"content","title":"Les questions à poser à vos équipes","items":["''Utilisez-vous des outils IA dans votre quotidien ?''","''Pour quelles tâches spécifiques ?''","''Ces outils ont-ils accès à des données clients ou confidentielles ?''","''Qui d''autre dans votre équipe utilise ces outils ?''"]},
    {"type":"content","title":"Prioriser vos investigations","items":["Commencer par les usages qui touchent aux données personnelles","Puis les usages qui influencent des décisions importantes","Ensuite les usages récurrents et à grande échelle","Enfin, les usages ponctuels sur données non sensibles"]}
  ]',
  '[
    {"question":"Qu''est-ce que le ''Shadow AI'' ?","options":["Des IA qui opèrent en mode sombre","Des usages IA non déclarés à la direction","Des IA avec des biais algorithmiques","Des outils IA non réglementés"],"correct":1,"explanation":"Le Shadow AI désigne les usages d''IA par des employés sans validation ou connaissance de la direction. C''est un risque de conformité majeur."},
    {"question":"Un employé utilise ChatGPT gratuit sur son téléphone pour résumer des emails clients. C''est :","options":["Totalement sans risque","Un usage IA à déclarer","Interdit par l''AI Act","Uniquement soumis au RGPD"],"correct":1,"explanation":"Même un usage personnel d''un outil IA sur des données professionnelles doit être documenté. Si des données clients sont impliquées, le RGPD s''applique aussi."}
  ]'
),

-- MODULE 5
(
  'Documenter vos systèmes IA',
  'Comment rédiger une fiche de déclaration conforme à l''AI Act',
  'technical', 'intermediate', 8, 5,
  '[
    {"type":"intro","title":"La documentation : votre bouclier juridique","body":"En cas de contrôle, votre première ligne de défense est votre documentation. Une fiche bien remplie démontre votre bonne foi et votre démarche de conformité."},
    {"type":"content","title":"Les 6 éléments indispensables","items":["1. Identification : quel outil IA, quelle version, quel fournisseur ?","2. Usage : à quoi sert-il exactement dans votre organisation ?","3. Données : traite-t-il des données personnelles ? Lesquelles ?","4. Risque : quel niveau de risque AI Act (inacceptable/élevé/limité/minimal) ?","5. Mesures : quelles protections avez-vous mises en place ?","6. Responsable : qui supervise cet usage ?"]},
    {"type":"content","title":"Bien décrire l''usage","items":["Soyez précis : pas ''utilisation de ChatGPT'' mais ''rédaction de réponses emails clients SAV avec ChatGPT''","Mentionnez la fréquence (quotidien, hebdomadaire...)","Indiquez le nombre de personnes concernées","Décrivez l''impact sur des décisions réelles"]},
    {"type":"content","title":"Les mesures de mitigation","items":["Supervision humaine : relecture avant envoi, validation des décisions","Formation : les utilisateurs connaissent les limites de l''IA","Contrôle des données : pas de données sensibles dans les prompts","Transparence : information des personnes concernées","Clause contractuelle : vérification des CGU du fournisseur IA"]},
    {"type":"content","title":"Mettre à jour régulièrement","items":["Après chaque changement d''outil ou de version majeure","Après un incident lié à l''IA","Au moins une fois par an pour les systèmes actifs","Quand le contexte d''usage change significativement"]}
  ]',
  '[
    {"question":"Qu''est-ce qui est indispensable dans une fiche de déclaration IA ?","options":["Uniquement le nom de l''outil","Le nom, l''usage, les données traitées et les mesures de protection","Le prix de la licence IA","Le code source de l''outil IA"],"correct":1,"explanation":"Une fiche complète doit couvrir au minimum : l''identification de l''outil, son usage précis, les données traitées et les mesures de protection mises en place."},
    {"question":"À quelle fréquence minimum doit-on réviser une déclaration de système IA actif ?","options":["Jamais si rien ne change","Tous les mois","Au moins une fois par an","Uniquement si la réglementation change"],"correct":2,"explanation":"Une révision annuelle minimum est recommandée pour les systèmes actifs, en plus des mises à jour déclenchées par des changements d''usage ou d''incidents."}
  ]'
),

-- MODULE 6
(
  'IA et recrutement : les règles essentielles',
  'Les obligations spécifiques quand l''IA intervient dans les décisions RH',
  'hr', 'intermediate', 7, 6,
  '[
    {"type":"intro","title":"Le recrutement IA : zone de haute vigilance","body":"L''AI Act place les outils IA utilisés dans le recrutement dans la catégorie HAUT RISQUE (Annexe III). Cela signifie des obligations strictes — même pour les PME."},
    {"type":"content","title":"Quels outils sont concernés ?","items":["Logiciels de tri automatique de CV","Chatbots de pré-qualification de candidats","Outils d''analyse de vidéos d''entretien","Scoring et matching de profils par IA","Tests de personnalité analysés par IA","Tout outil IA influençant une décision d''embauche"]},
    {"type":"content","title":"Vos obligations si vous utilisez ces outils","items":["Informer les candidats qu''une IA intervient dans le processus","Garantir qu''une personne humaine prend la décision finale","Permettre aux candidats de contester une décision automatisée","Documenter le fonctionnement de l''outil (Art. 11 AI Act)","Vérifier que le fournisseur de l''outil est conforme CE"]},
    {"type":"content","title":"Ce que vous NE pouvez PAS faire","items":["Rejeter automatiquement un CV sans validation humaine","Utiliser la reconnaissance d''émotions pour évaluer des candidats","Prendre des décisions d''embauche basées uniquement sur l''IA","Collecter des données biométriques sans base légale solide"]},
    {"type":"content","title":"Les bonnes pratiques","items":["Informer dès l''offre d''emploi que l''IA est utilisée","Former les recruteurs aux biais algorithmiques","Audit régulier des résultats (biais par genre, âge, origine ?)","Conserver les logs des décisions IA pour pouvoir justifier"]}
  ]',
  '[
    {"question":"Un outil IA trie automatiquement les CV et rejette les candidats sans score minimum. Est-ce conforme à l''AI Act ?","options":["Oui si l''outil est certifié","Non, une validation humaine est obligatoire","Oui si les candidats en sont informés","Oui pour les postes de moins de 50k€ annuels"],"correct":1,"explanation":"L''Art. 14 de l''AI Act impose une supervision humaine pour les systèmes à haut risque. Une décision d''embauche ne peut pas être entièrement automatisée."},
    {"question":"Devez-vous informer un candidat qu''une IA analyse sa candidature ?","options":["Non, c''est un détail technique interne","Oui, avant ou pendant le processus","Seulement s''il pose la question","Seulement pour les postes cadres"],"correct":1,"explanation":"La transparence envers les personnes concernées par une décision IA (Art. 13 et 26) est obligatoire. Un candidat doit savoir qu''une IA intervient dans son évaluation."}
  ]'
),

-- MODULE 7
(
  'IA et données personnelles',
  'L''intersection entre l''AI Act et le RGPD : double conformité',
  'legal', 'intermediate', 10, 7,
  '[
    {"type":"intro","title":"AI Act + RGPD : deux règlements, une réalité","body":"L''AI Act et le RGPD se superposent. Si votre système IA traite des données personnelles, VOUS DEVEZ respecter les deux règlements simultanément. Les deux peuvent sanctionner indépendamment."},
    {"type":"content","title":"Quand les deux s''appliquent-ils ?","items":["Votre IA traite des noms, emails, données comportementales → RGPD","Votre IA prend des décisions automatisées sur des personnes → AI Act + RGPD","Votre IA utilise des photos de personnes → Les deux + réglementations biométriques","Votre chatbot collecte des données → Les deux"]},
    {"type":"content","title":"La base légale RGPD pour l''IA","items":["Consentement : difficile à obtenir valablement pour les systèmes IA complexes","Intérêt légitime : possible mais doit être justifié et documenté","Exécution d''un contrat : si le traitement est nécessaire au service fourni","Obligation légale : rarement applicable sauf contexte réglementaire spécifique"]},
    {"type":"content","title":"L''analyse d''impact (DPIA) obligatoire","items":["Obligatoire si l''IA traite des données à grande échelle","Obligatoire si l''IA prend des décisions automatisées significatives","Obligatoire si l''IA utilise des données sensibles (santé, biométrie...)","À faire AVANT de déployer le système, pas après"]},
    {"type":"content","title":"Ce qu''il faut documenter","items":["Base légale RGPD pour chaque traitement de données","Catégories de données traitées par l''IA","Durée de conservation et lieu de stockage","Droits des personnes : comment exercer accès, rectification, opposition ?","Transferts hors UE éventuels (vos outils IA sont-ils hébergés aux US ?)"]}
  ]',
  '[
    {"question":"Votre chatbot IA collecte le prénom et l''email des visiteurs. Avez-vous besoin d''une base légale RGPD ?","options":["Non, c''est une donnée publique","Oui, obligatoirement","Seulement si vous envoyez des emails marketing","Seulement pour les mineurs"],"correct":1,"explanation":"Toute collecte de données personnelles (prénom + email = données personnelles) nécessite une base légale RGPD valide, quelle que soit l''utilisation."},
    {"question":"Votre IA de scoring client est hébergée sur des serveurs aux États-Unis. Qu''est-ce que cela implique ?","options":["Rien de particulier","Un transfert de données hors UE soumis à l''Art. 46+ RGPD","L''outil est automatiquement interdit","Uniquement une notification à la CNIL"],"correct":1,"explanation":"Le transfert de données personnelles hors UE est soumis à des règles strictes (chapitre V RGPD). Il faut vérifier les garanties appropriées (clauses contractuelles types, Privacy Shield successeur, etc.)."}
  ]'
),

-- MODULE 8
(
  'Préparer un audit AI Act',
  'Guide pratique pour être prêt en cas de contrôle',
  'executive', 'advanced', 15, 8,
  '[
    {"type":"intro","title":"L''audit : une opportunité, pas une menace","body":"Un audit AI Act bien préparé est une démonstration de maturité. Les autorités ne cherchent pas à sanctionner les entreprises de bonne foi qui ont fait des efforts documentés. Voici comment vous préparer."},
    {"type":"content","title":"Ce que les auditeurs vérifient","items":["L''existence et la complétude du registre des systèmes IA","La classification correcte des risques","La documentation technique pour les systèmes haut risque","Les preuves de formation des équipes","Les processus de supervision humaine en place","Les contrats avec les fournisseurs IA"]},
    {"type":"content","title":"Votre registre : la pièce maîtresse","items":["Doit être à jour et exhaustif","Doit couvrir TOUS les systèmes IA, même mineurs","Doit mentionner le niveau de risque avec justification","Doit indiquer qui est responsable de chaque système","Sentinel vous aide à constituer et maintenir ce registre"]},
    {"type":"content","title":"Les documents à préparer","items":["Registre des systèmes IA (Sentinel)","Politique interne d''utilisation de l''IA","Formation des équipes (certificats de completion)","Contrats fournisseurs avec clauses IA","DPIA si applicable (données personnelles)","Preuves de supervision humaine (logs, procédures)"]},
    {"type":"content","title":"Plan d''action 90 jours","items":["J+0 : Cartographie de tous les usages IA (utilisez Sentinel)","J+30 : Classification des risques + documentation prioritaire","J+60 : Formation de toutes les équipes concernées","J+90 : Revue complète + rapport de conformité","Ongoing : Veille réglementaire et mise à jour annuelle"]},
    {"type":"content","title":"En cas de contrôle","items":["Restez calme et coopératif — les auditeurs apprécient la bonne foi","Présentez votre registre et vos documents immédiatement","Montrez votre plan d''action même si tout n''est pas finalisé","Ne promettez que ce que vous pouvez tenir","Documentez chaque échange avec l''autorité de contrôle"]}
  ]',
  '[
    {"question":"Quel est le document le plus important à présenter lors d''un audit AI Act ?","options":["Les CGU de vos outils IA","Votre registre des systèmes IA avec classifications","Le contrat de votre DSI","Les factures de vos logiciels IA"],"correct":1,"explanation":"Le registre des systèmes IA, avec leur classification et documentation associée, est la première chose qu''un auditeur va demander. C''est la preuve de votre démarche de conformité."},
    {"question":"Une entreprise sans registre IA mais qui a commencé une démarche documentée sera-t-elle nécessairement sanctionnée ?","options":["Oui, automatiquement","Non, la bonne foi et la démarche engagée sont prises en compte","Oui, une amende minimale est toujours appliquée","Seulement si elle a plus de 10 usages IA"],"correct":1,"explanation":"Les autorités de régulation tiennent compte de la bonne foi et des efforts engagés. Une entreprise qui peut démontrer qu''elle a commencé une démarche structurée est dans une position bien meilleure qu''une entreprise sans aucune action."}
  ]'
)

ON CONFLICT DO NOTHING;
