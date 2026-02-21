-- ============================================
-- supabase/seed/known-ai-tools.sql
-- Base de données de 100+ outils IA connus
-- ============================================

INSERT INTO known_ai_tools (name, category, default_risk_level, description, vendor, url) VALUES

-- CHATBOTS & ASSISTANTS GÉNÉRAUX
('ChatGPT', 'chatbot', 'limited', 'Assistant IA conversationnel généraliste', 'OpenAI', 'https://chat.openai.com'),
('Claude', 'chatbot', 'limited', 'Assistant IA conversationnel d''Anthropic', 'Anthropic', 'https://claude.ai'),
('Gemini', 'chatbot', 'limited', 'Assistant IA de Google', 'Google', 'https://gemini.google.com'),
('Copilot', 'chatbot', 'limited', 'Assistant IA de Microsoft intégré à Office 365', 'Microsoft', 'https://copilot.microsoft.com'),
('Mistral Le Chat', 'chatbot', 'limited', 'Assistant IA de Mistral AI (France)', 'Mistral AI', 'https://chat.mistral.ai'),
('Perplexity AI', 'chatbot', 'limited', 'Moteur de recherche et assistant IA', 'Perplexity', 'https://perplexity.ai'),
('Pi', 'chatbot', 'limited', 'Assistant IA conversationnel personnel', 'Inflection AI', 'https://pi.ai'),
('Character.ai', 'chatbot', 'limited', 'Chatbot IA pour conversations de personnages', 'Character.ai', 'https://character.ai'),
('Meta AI', 'chatbot', 'limited', 'Assistant IA de Meta (Facebook, Instagram, WhatsApp)', 'Meta', 'https://meta.ai'),
('Poe', 'chatbot', 'limited', 'Plateforme multi-chatbots IA', 'Quora', 'https://poe.com'),

-- GÉNÉRATION DE TEXTE & CONTENU
('Jasper AI', 'redaction', 'limited', 'Rédaction marketing et contenu IA', 'Jasper', 'https://jasper.ai'),
('Copy.ai', 'redaction', 'limited', 'Génération de textes marketing et commerciaux', 'Copy.ai', 'https://copy.ai'),
('Writesonic', 'redaction', 'limited', 'Assistant rédactionnel IA pour marketing', 'Writesonic', 'https://writesonic.com'),
('Rytr', 'redaction', 'limited', 'Assistant d''écriture IA économique', 'Rytr', 'https://rytr.me'),
('Notion AI', 'productivite', 'limited', 'IA intégrée dans Notion pour rédaction et résumé', 'Notion', 'https://notion.so'),
('Grammarly AI', 'redaction', 'minimal', 'Correction grammaticale et amélioration de texte', 'Grammarly', 'https://grammarly.com'),
('QuillBot', 'redaction', 'minimal', 'Paraphrase et reformulation IA', 'QuillBot', 'https://quillbot.com'),
('Wordtune', 'redaction', 'minimal', 'Réécriture et amélioration de texte IA', 'AI21 Labs', 'https://wordtune.com'),
('DeepL Write', 'redaction', 'minimal', 'Amélioration de texte et paraphrase', 'DeepL', 'https://deepl.com'),
('Sudowrite', 'redaction', 'minimal', 'Assistant IA pour l''écriture créative', 'Sudowrite', 'https://sudowrite.com'),

-- GÉNÉRATION D''IMAGES
('Midjourney', 'image', 'limited', 'Génération d''images IA par prompt textuel', 'Midjourney', 'https://midjourney.com'),
('DALL-E 3', 'image', 'limited', 'Génération d''images IA d''OpenAI', 'OpenAI', 'https://openai.com'),
('Stable Diffusion', 'image', 'limited', 'Modèle de génération d''images open-source', 'Stability AI', 'https://stability.ai'),
('Adobe Firefly', 'image', 'limited', 'Génération d''images IA d''Adobe', 'Adobe', 'https://firefly.adobe.com'),
('Canva AI', 'image', 'limited', 'Outils IA intégrés dans Canva (Magic Design, Text to Image)', 'Canva', 'https://canva.com'),
('Leonardo AI', 'image', 'limited', 'Génération d''images pour le design et le jeu', 'Leonardo AI', 'https://leonardo.ai'),
('Ideogram', 'image', 'limited', 'Génération d''images avec texte précis', 'Ideogram', 'https://ideogram.ai'),
('Freepik Pikaso', 'image', 'limited', 'Génération et édition d''images IA', 'Freepik', 'https://freepik.com'),
('Bing Image Creator', 'image', 'limited', 'Génération d''images via DALL-E par Microsoft', 'Microsoft', 'https://bing.com/images/create'),
('Runway', 'video', 'limited', 'Génération et édition de vidéos par IA', 'Runway', 'https://runwayml.com'),

-- VIDÉO & AUDIO
('Synthesia', 'video', 'limited', 'Génération de vidéos avec avatars IA', 'Synthesia', 'https://synthesia.io'),
('HeyGen', 'video', 'limited', 'Création de vidéos avec avatars IA personnalisés', 'HeyGen', 'https://heygen.com'),
('ElevenLabs', 'audio', 'limited', 'Synthèse et clonage de voix IA', 'ElevenLabs', 'https://elevenlabs.io'),
('Murf AI', 'audio', 'limited', 'Génération de voix off professionnelle IA', 'Murf AI', 'https://murf.ai'),
('Descript', 'audio', 'limited', 'Édition audio/vidéo avec transcription IA', 'Descript', 'https://descript.com'),
('Sora', 'video', 'limited', 'Génération de vidéos IA d''OpenAI', 'OpenAI', 'https://openai.com/sora'),
('Pika Labs', 'video', 'limited', 'Génération de vidéos IA', 'Pika', 'https://pika.art'),
('Otter.ai', 'transcription', 'minimal', 'Transcription de réunions et prise de notes IA', 'Otter AI', 'https://otter.ai'),
('Fireflies.ai', 'transcription', 'minimal', 'Transcription et résumé de réunions', 'Fireflies', 'https://fireflies.ai'),

-- CODE & DÉVELOPPEMENT
('GitHub Copilot', 'code', 'minimal', 'Assistant de programmation IA intégré à GitHub', 'GitHub/Microsoft', 'https://github.com/features/copilot'),
('Tabnine', 'code', 'minimal', 'Autocomplétion de code IA', 'Tabnine', 'https://tabnine.com'),
('Cursor', 'code', 'minimal', 'Éditeur de code avec IA intégrée', 'Cursor', 'https://cursor.so'),
('Replit AI', 'code', 'minimal', 'IA de développement dans Replit', 'Replit', 'https://replit.com'),
('Amazon CodeWhisperer', 'code', 'minimal', 'Assistant de programmation IA d''Amazon', 'AWS', 'https://aws.amazon.com/codewhisperer'),
('Codeium', 'code', 'minimal', 'Autocomplétion de code IA gratuite', 'Codeium', 'https://codeium.com'),
('Sourcegraph Cody', 'code', 'minimal', 'Assistant de code IA pour codebase', 'Sourcegraph', 'https://sourcegraph.com'),

-- VENTES & CRM
('Gong', 'ventes', 'high', 'Analyse IA des appels commerciaux et coaching', 'Gong', 'https://gong.io'),
('Clari', 'ventes', 'limited', 'Prévisions de ventes et analyse IA', 'Clari', 'https://clari.com'),
('Outreach', 'ventes', 'limited', 'Automatisation des ventes avec IA', 'Outreach', 'https://outreach.io'),
('Salesloft', 'ventes', 'limited', 'Engagement client avec IA', 'Salesloft', 'https://salesloft.com'),
('Lavender', 'ventes', 'limited', 'Optimisation d''emails commerciaux par IA', 'Lavender', 'https://lavender.ai'),
('Apollo.io', 'ventes', 'limited', 'Prospection et engagement IA', 'Apollo', 'https://apollo.io'),
('Drift', 'service_client', 'limited', 'Chatbot IA pour engagement client', 'Drift', 'https://drift.com'),
('Intercom Fin', 'service_client', 'limited', 'Agent IA pour support client', 'Intercom', 'https://intercom.com'),
('Zendesk AI', 'service_client', 'limited', 'IA pour automatisation du support client', 'Zendesk', 'https://zendesk.com'),
('Freshdesk AI', 'service_client', 'limited', 'Freddy AI pour service client', 'Freshworks', 'https://freshdesk.com'),

-- RH & RECRUTEMENT (HAUT RISQUE)
('Eightfold AI', 'rh', 'high', 'IA de matching et gestion des talents', 'Eightfold', 'https://eightfold.ai'),
('Pymetrics', 'rh', 'high', 'Évaluation des candidats par jeux IA', 'Pymetrics', 'https://pymetrics.ai'),
('HireVue', 'rh', 'high', 'Analyse de vidéos d''entretien par IA', 'HireVue', 'https://hirevue.com'),
('Paradox (Olivia)', 'rh', 'high', 'Chatbot IA pour le recrutement', 'Paradox', 'https://paradox.ai'),
('SeekOut', 'rh', 'high', 'Sourcing de candidats par IA', 'SeekOut', 'https://seekout.com'),
('Beamery', 'rh', 'high', 'CRM et talent intelligence IA', 'Beamery', 'https://beamery.com'),
('Textio', 'rh', 'limited', 'Amélioration des offres d''emploi par IA', 'Textio', 'https://textio.com'),
('LinkedIn Recruiter AI', 'rh', 'high', 'Recommandation de candidats par IA de LinkedIn', 'LinkedIn/Microsoft', 'https://linkedin.com'),
('Workday AI', 'rh', 'high', 'Modules IA dans Workday HCM', 'Workday', 'https://workday.com'),
('SAP SuccessFactors AI', 'rh', 'high', 'IA dans la suite RH SAP', 'SAP', 'https://sap.com'),

-- FINANCE & COMPTABILITÉ
('Kensho', 'finance', 'high', 'Analyse de données financières par IA', 'S&P Global', 'https://kensho.com'),
('Alphasense', 'finance', 'limited', 'Recherche et analyse de marchés par IA', 'AlphaSense', 'https://alpha-sense.com'),
('Spendesk AI', 'finance', 'minimal', 'Gestion des dépenses avec IA', 'Spendesk', 'https://spendesk.com'),
('Stripe Radar', 'finance', 'high', 'Détection de fraude par IA', 'Stripe', 'https://stripe.com/radar'),
('Featurespace ARIC', 'finance', 'high', 'Détection de fraude temps réel par IA', 'Featurespace', 'https://featurespace.com'),
('Coupa AI', 'finance', 'limited', 'Analyse des dépenses et prévisions IA', 'Coupa', 'https://coupa.com'),

-- MARKETING & PUBLICITÉ
('Persado', 'marketing', 'limited', 'Génération de messages marketing par IA', 'Persado', 'https://persado.com'),
('Albert AI', 'marketing', 'limited', 'Automatisation des campagnes publicitaires par IA', 'Albert', 'https://albert.ai'),
('Salesforce Einstein', 'crm', 'limited', 'IA intégrée dans Salesforce', 'Salesforce', 'https://salesforce.com'),
('HubSpot AI', 'crm', 'limited', 'Outils IA dans HubSpot CRM', 'HubSpot', 'https://hubspot.com'),
('Mailchimp AI', 'marketing', 'limited', 'Optimisation d''emails par IA', 'Mailchimp', 'https://mailchimp.com'),
('Klaviyo AI', 'marketing', 'limited', 'Personnalisation email par IA', 'Klaviyo', 'https://klaviyo.com'),
('SEMrush AI', 'seo', 'minimal', 'Outils IA pour le SEO et le contenu', 'SEMrush', 'https://semrush.com'),
('Surfer SEO', 'seo', 'minimal', 'Optimisation de contenu par IA', 'Surfer', 'https://surferseo.com'),

-- LÉGAL & CONFORMITÉ
('Harvey AI', 'legal', 'limited', 'Assistant IA pour avocats et juristes', 'Harvey', 'https://harvey.ai'),
('Luminance', 'legal', 'limited', 'Analyse de documents juridiques par IA', 'Luminance', 'https://luminance.com'),
('Kira Systems', 'legal', 'limited', 'Extraction d''informations de contrats par IA', 'Kira', 'https://kirasystems.com'),
('Ironclad AI', 'legal', 'limited', 'Gestion des contrats assistée par IA', 'Ironclad', 'https://ironcladapp.com'),
('Juro', 'legal', 'limited', 'Création et gestion de contrats par IA', 'Juro', 'https://juro.com'),

-- SANTÉ (HAUT RISQUE)
('IBM Watson Health', 'sante', 'high', 'IA pour diagnostics et analyse médicale', 'IBM', 'https://ibm.com'),
('Babylon Health', 'sante', 'high', 'Triage et diagnostic médical par IA', 'Babylon', 'https://babylonhealth.com'),
('Tempus', 'sante', 'high', 'IA pour la médecine de précision et l''oncologie', 'Tempus', 'https://tempus.com'),

-- PRODUCTIVITÉ & COLLABORATION
('Microsoft 365 Copilot', 'productivite', 'limited', 'IA intégrée dans Word, Excel, PowerPoint, Teams', 'Microsoft', 'https://microsoft.com/copilot'),
('Google Workspace AI', 'productivite', 'limited', 'IA dans Gmail, Docs, Sheets (Duet AI)', 'Google', 'https://workspace.google.com'),
('Slack AI', 'productivite', 'limited', 'Résumé et recherche IA dans Slack', 'Salesforce/Slack', 'https://slack.com'),
('Zoom AI Companion', 'productivite', 'limited', 'IA pour transcription et résumé de réunions Zoom', 'Zoom', 'https://zoom.us'),
('Monday.com AI', 'productivite', 'minimal', 'Automatisation IA dans la gestion de projets', 'Monday', 'https://monday.com'),
('ClickUp AI', 'productivite', 'minimal', 'IA pour rédaction et synthèse dans ClickUp', 'ClickUp', 'https://clickup.com'),
('Zapier AI', 'automatisation', 'minimal', 'Automatisation de workflows par IA', 'Zapier', 'https://zapier.com'),
('Make AI', 'automatisation', 'minimal', 'Automatisation avancée avec modules IA', 'Make', 'https://make.com'),

-- SÉCURITÉ & SURVEILLANCE
('Darktrace', 'securite', 'high', 'Détection de cybermenaces par IA comportementale', 'Darktrace', 'https://darktrace.com'),
('CrowdStrike Falcon', 'securite', 'high', 'Sécurité endpoints basée sur IA', 'CrowdStrike', 'https://crowdstrike.com'),
('Verkada', 'surveillance', 'high', 'Systèmes de surveillance vidéo avec IA', 'Verkada', 'https://verkada.com'),
('Axon AI', 'surveillance', 'high', 'IA pour forces de l''ordre (caméras corporelles)', 'Axon', 'https://axon.com'),

-- ÉDUCATION
('Khanmigo', 'education', 'limited', 'Tuteur IA de Khan Academy', 'Khan Academy', 'https://khanacademy.org'),
('Duolingo Max', 'education', 'limited', 'Apprentissage des langues avec IA avancée', 'Duolingo', 'https://duolingo.com'),
('Chegg Study AI', 'education', 'limited', 'Aide aux devoirs par IA', 'Chegg', 'https://chegg.com'),
('Turnitin AI', 'education', 'high', 'Détection de contenu IA dans les devoirs', 'Turnitin', 'https://turnitin.com'),

-- RECHERCHE & ANALYSE
('Consensus', 'recherche', 'minimal', 'Moteur de recherche scientifique par IA', 'Consensus', 'https://consensus.app'),
('Elicit', 'recherche', 'minimal', 'Assistant de recherche académique par IA', 'Ought', 'https://elicit.com'),
('Tableau AI', 'analyse', 'minimal', 'IA pour la visualisation et l''analyse de données', 'Salesforce', 'https://tableau.com'),
('Power BI Copilot', 'analyse', 'minimal', 'IA dans Power BI pour analyse de données', 'Microsoft', 'https://powerbi.microsoft.com'),
('Qlik AI', 'analyse', 'minimal', 'IA pour business intelligence', 'Qlik', 'https://qlik.com'),

-- E-COMMERCE
('Nosto', 'ecommerce', 'limited', 'Personnalisation e-commerce par IA', 'Nosto', 'https://nosto.com'),
('Dynamic Yield', 'ecommerce', 'limited', 'Personnalisation et recommandations IA', 'Mastercard', 'https://dynamicyield.com'),
('Algolia AI', 'ecommerce', 'limited', 'Recherche et recommandations produits par IA', 'Algolia', 'https://algolia.com')

ON CONFLICT (name) DO NOTHING;
