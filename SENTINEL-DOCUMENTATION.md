# SENTINEL — Documentation Technique & Fonctionnelle Complète

> Document destiné à un audit systémique approfondi.
> Rédigé pour Claude Opus 4.6.
> Version : Février 2026.

---

## TABLE DES MATIÈRES

1. [Structure du projet](#1-structure-du-projet)
2. [Architecture actuelle](#2-architecture-actuelle)
3. [Attentes fonctionnelles](#3-attentes-fonctionnelles)
4. [Problèmes majeurs identifiés](#4-problèmes-majeurs-identifiés)
5. [Demandes utilisateur et état de résolution](#5-demandes-utilisateur-et-état-de-résolution)
6. [Chaînes d'actions et dépendances](#6-chaînes-dactions-et-dépendances)
7. [État global du système](#7-état-global-du-système)

---

## 1. STRUCTURE DU PROJET

### 1.1 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 15+ (App Router) |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth (GoTrue) |
| ORM | Supabase JS Client v2 |
| IA | GROQ API via `lib/ai/anthropic.ts` (modèles : `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`) |
| Paiement | Stripe (configuré, webhook secret vide) |
| Styles | Tailwind CSS |
| Icônes | Lucide React |
| Déploiement | Non spécifié (Vercel probable) |
| Plateforme dev | Windows 11, shell bash |

### 1.2 Arborescence globale

```
sentinel/
├── app/
│   ├── (auth)/                   # Groupe auth (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (marketing)/              # Pages publiques marketing
│   │   ├── page.tsx              # Page d'accueil
│   │   ├── packs/page.tsx
│   │   ├── saas/page.tsx
│   │   ├── services-marketing/page.tsx
│   │   └── web/page.tsx
│   ├── admin/                    # Panel super_admin
│   │   ├── layout.tsx            # Guard rôle super_admin
│   │   ├── page.tsx              # Vue d'ensemble
│   │   ├── clients/              # Gestion clients
│   │   │   ├── page.tsx          # Liste clients
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Détail + édition
│   │   │       └── apercu/page.tsx
│   │   ├── marketing/            # Gestion missions marketing
│   │   │   ├── page.tsx
│   │   │   └── agents/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── sav/
│   │   │   ├── page.tsx          # Chat SAV admin
│   │   │   └── tickets/page.tsx  # Tickets groupés par catégorie
│   │   ├── tarifs/page.tsx       # (page obsolète, à supprimer)
│   │   └── vitrine/page.tsx
│   ├── api/                      # Routes API Next.js
│   │   ├── admin/                # API réservées super_admin
│   │   │   ├── clients/[id]/route.ts
│   │   │   ├── clients/route.ts
│   │   │   ├── marketing/[entreprise_id]/route.ts
│   │   │   ├── marketing/agents/route.ts
│   │   │   ├── marketing/route.ts
│   │   │   ├── sav/[entreprise_id]/route.ts
│   │   │   ├── sav/route.ts
│   │   │   ├── sav/tickets/route.ts
│   │   │   ├── tarifs/route.ts
│   │   │   ├── vitrine/route.ts  # GET + POST contenu vitrine
│   │   │   ├── cleanup/route.ts
│   │   │   └── delete-all-users/route.ts
│   │   ├── ai/                   # Endpoints IA GROQ
│   │   │   ├── copilot/route.ts
│   │   │   ├── classify/route.ts
│   │   │   ├── analyse-finance/route.ts
│   │   │   ├── analyse-crm/route.ts
│   │   │   ├── analyse-hr/route.ts
│   │   │   ├── analyse-operations/route.ts
│   │   │   ├── alertes/route.ts
│   │   │   ├── generate-document/route.ts
│   │   │   ├── onboarding/route.ts
│   │   │   └── scan-supplier/route.ts
│   │   ├── vitrine/
│   │   │   ├── route.ts          # GET public — contenu CMS vitrine
│   │   │   └── contenu/route.ts  # (doublon potentiel)
│   │   ├── v1/                   # API publique externe
│   │   │   ├── packs/route.ts
│   │   │   ├── services/route.ts
│   │   │   └── vitrine/route.ts
│   │   ├── sav/
│   │   │   ├── messages/route.ts
│   │   │   └── tickets/route.ts  # GET+POST tickets client
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   └── [autres modules]/...  # impayes, contrats, crm, employes, etc.
│   ├── dashboard/                # Application client authentifiée
│   │   ├── layout.tsx            # Shell + sidebar + création profil auto
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── cockpit/              # Copilote dirigeant — cockpit général
│   │   ├── copilot/              # Copilote IA conversationnel
│   │   ├── copilot-finance/      # Analyse financière IA
│   │   ├── copilot-rh/           # Analyse RH IA
│   │   ├── copilot-crm/          # Analyse CRM IA
│   │   ├── copilot-operations/   # Analyse ops IA
│   │   ├── journaux/             # Journaux d'usage IA (AI Act)
│   │   ├── score/                # Score de conformité AI Act
│   │   ├── impayes/              # Gestion des impayés
│   │   ├── contrats/             # Gestion et analyse IA des contrats
│   │   ├── financier/            # Module financier + saisie
│   │   ├── obligations/          # Obligations légales
│   │   ├── formation/            # Formation IA
│   │   ├── fournisseurs/         # Évaluation fournisseurs IA
│   │   ├── benchmark/            # Benchmark sectoriel
│   │   ├── crosswalk/            # Veille réglementaire croisée
│   │   ├── radar/                # Radar conformité
│   │   ├── veille/               # Veille réglementaire
│   │   ├── marketing/            # Module marketing (plans pro/enterprise)
│   │   ├── equipe/               # Gestion équipe + invitations
│   │   ├── sav/                  # Chat support + tickets
│   │   │   ├── page.tsx
│   │   │   └── tickets/page.tsx
│   │   ├── site-web/             # Module Mon Site Web
│   │   │   ├── page.tsx          # 4 cas selon profil
│   │   │   └── CmsEditor.tsx     # Éditeur CMS (super_admin)
│   │   ├── cms/                  # Page CMS générique (existante mais non reliée)
│   │   ├── rapports/             # Rapports et audit
│   │   ├── parametres/           # Paramètres compte + abonnement
│   │   ├── fiscal/               # Analyse fiscale
│   │   ├── onboarding/           # Onboarding IA
│   │   ├── seed-demo/            # Données de démonstration
│   │   └── aide/                 # Centre d'aide
│   ├── cgu/page.tsx
│   └── confidentialite/page.tsx
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx           # Navigation dashboard
│   │   └── NPSModal.tsx
│   └── copilot/
│       └── FloatingCopilot.tsx   # Copilote flottant
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts          # Client GROQ (nommé anthropic par legacy)
│   │   ├── prompts.ts
│   │   └── types.ts
│   ├── scoring/
│   │   ├── engine.ts             # Score conformité AI Act (4 dimensions)
│   │   ├── global.ts
│   │   ├── financier.ts
│   │   ├── impayes.ts
│   │   ├── contrats.ts
│   │   └── obligations.ts
│   ├── services/ai/
│   │   ├── finance.ts
│   │   ├── rh.ts
│   │   ├── crm.ts
│   │   └── operations.ts
│   ├── supabase/
│   │   ├── server.ts             # Client SSR (cookies)
│   │   ├── client.ts             # Client navigateur
│   │   ├── admin.ts              # Client service_role (bypass RLS)
│   │   └── getUtilisateur.ts     # Lecture profil via admin client
│   ├── contrats/analyseur.ts
│   ├── obligations/catalogue.ts
│   ├── tarifs.ts                 # Tarifs par défaut (services + packs)
│   ├── tickets.ts                # Mapping sujets → catégories SAV
│   └── email.ts
├── public/
│   └── vitrine/
│       └── index.html            # Vitrine statique HTML avec CMS JS dynamique
├── supabase/
│   ├── a-executer.sql            # Setup post-inscription (DDL + permissions)
│   ├── supprimer-comptes.sql     # Suppression compte chafiqui
│   ├── diagnostic.sql            # Diagnostic état DB
│   ├── schema-complet.sql        # Schéma de base complet
│   ├── rls_policies.sql          # Politiques RLS centralisées
│   ├── fix-rls-recursion.sql     # Correctif récursion RLS
│   ├── fix-complet-v2.sql
│   ├── migration-audit-fix.sql
│   ├── modules/                  # Migrations par module
│   │   ├── copilot-executive.sql
│   │   ├── marketing.sql
│   │   ├── tickets-sav.sql
│   │   ├── site-web-activation.sql
│   │   ├── sites_clients.sql
│   │   ├── financier.sql
│   │   ├── contrats.sql
│   │   ├── impayés.sql
│   │   ├── obligations.sql
│   │   ├── formation.sql
│   │   ├── fournisseurs.sql
│   │   ├── benchmark.sql
│   │   ├── veille.sql
│   │   ├── shadow-ai.sql
│   │   ├── score_global.sql
│   │   ├── copilot.sql
│   │   ├── tarifs.sql
│   │   ├── super_admin.sql
│   │   ├── site_settings.sql
│   │   └── cleanup_orphaned.sql
│   └── seed/
│       ├── training-modules.sql
│       ├── types_obligations.sql
│       └── known-ai-tools.sql
├── proxy.ts                      # Middleware auth (proxy vers Supabase)
└── SENTINEL-DOCUMENTATION.md    # Ce fichier
```

### 1.3 Système d'authentification

- **Provider** : Supabase Auth (GoTrue)
- **Méthode** : Email + mot de passe
- **Middleware** : `proxy.ts` à la racine (pas `middleware.ts`)
- **Flux login** :
  1. L'utilisateur s'inscrit via `/register`
  2. Supabase Auth crée une entrée dans `auth.users`
  3. Un trigger Supabase peut créer un enregistrement dans `public.utilisateurs` (comportement observé)
  4. Le layout dashboard (`app/dashboard/layout.tsx`) vérifie si `utilisateurs` existe → si non, il crée `entreprises` + `utilisateurs` automatiquement avec `role = 'admin'` par défaut
- **Rôles** :
  - `super_admin` : accès total, panel `/admin`, gestion clients
  - `admin` : compte standard, accès dashboard client
  - Autres rôles (invitation équipe) : non complètement implémentés

---

## 2. ARCHITECTURE ACTUELLE

### 2.1 Type d'architecture

Architecture **monolithique modulaire** :
- Tout dans un seul projet Next.js
- Séparation logique par modules (journaux, copilote, marketing, SAV, etc.)
- Pas de microservices séparés
- L'API est colocalisée avec le front (`app/api/`)

### 2.2 Séparation Front / Back

| Couche | Technologie | Détail |
|--------|-------------|--------|
| Front client | React (client components) | Pages interactives avec state |
| Front serveur | Next.js Server Components | Pages avec données initiales |
| Back API | Next.js API Routes (`route.ts`) | REST, pas de GraphQL |
| Base de données | Supabase PostgreSQL | Accès direct via client JS |
| IA | GROQ via fetch côté serveur | Appelé depuis les routes API |

### 2.3 Logique multi-entreprise (multi-tenant)

- Chaque `utilisateur` appartient à une `entreprise` via `entreprise_id` (UUID FK)
- **Isolation via RLS** (Row Level Security) Supabase : chaque requête client filtre automatiquement par `entreprise_id = auth.uid()` mappé à l'utilisateur
- **Contournement RLS** : le client admin (`lib/supabase/admin.ts`) utilise `service_role` et bypass le RLS — utilisé dans toutes les routes API côté serveur
- **Problème identifié** : certaines tables n'ont pas de RLS, ou les politiques ont des récursions (voir `fix-rls-recursion.sql`)

### 2.4 Fonctionnement des rôles et permissions

```
super_admin
  ├── Accès : /admin/* (panel)
  ├── Accès : /dashboard/* (dashboard client également)
  ├── Peut : gérer tous les clients, modifier sites, tickets SAV admin, marketing
  └── Identifié par : utilisateurs.role = 'super_admin'

admin (client standard)
  ├── Accès : /dashboard/* uniquement
  ├── Peut : utiliser toutes les fonctionnalités de son plan
  └── Identifié par : utilisateurs.role = 'admin'
```

**Guard d'accès** :
- `app/admin/layout.tsx` : vérifie `role === 'super_admin'`, sinon redirect `/dashboard`
- Routes API admin : fonction `checkSuperAdmin()` en tête de chaque route
- Routes API client : `getUtilisateur()` + vérification `entreprise_id`

### 2.5 Système de scoring AI Act

Fichier : `lib/scoring/engine.ts`

Score 0–100, calculé sur 4 dimensions pondérées :

| Dimension | Poids | Critères |
|-----------|-------|----------|
| Documentation | 30% | Titres/descriptions, outil IA, dates, base légale RGPD, fréquence |
| Classification des risques | 30% | Niveaux de risque, pénalité usages inacceptables (–40pts/usage) |
| Mesures de mitigation | 25% | % d'usages avec mesures documentées |
| Gouvernance | 15% | Admin désigné, fraîcheur des journaux (<90j), journaux "à revoir" |

Niveaux : `critique` (0–24) / `insuffisant` (25–49) / `partiel` (50–69) / `bon` (70–84) / `excellent` (85–100)

Scores additionnels (modules séparés) :
- `lib/scoring/financier.ts` — score santé financière
- `lib/scoring/impayes.ts` — score de fiabilité client
- `lib/scoring/contrats.ts` — score conformité contrats
- `lib/scoring/obligations.ts` — score obligations légales
- `lib/scoring/global.ts` — agrégation score global

### 2.6 Système IA (GROQ)

- **Provider** : GROQ (fichier nommé `anthropic.ts` par erreur legacy)
- **Modèles** :
  - Rapide : `llama-3.1-8b-instant` (copilote, classify)
  - Intelligent : `llama-3.3-70b-versatile` (analyses approfondies)
- **Services** :
  - `lib/services/ai/finance.ts` — analyse cash-flow, alertes
  - `lib/services/ai/rh.ts` — analyse RH, santé équipe
  - `lib/services/ai/crm.ts` — prédictions ventes, scoring leads
  - `lib/services/ai/operations.ts` — rapports stratégiques
- **Endpoints IA** : tous dans `app/api/ai/`

### 2.7 Système de tickets SAV

Créé récemment. Table `tickets_sav` :

```sql
id UUID, entreprise_id FK, sujet TEXT, categorie TEXT,
description TEXT, statut CHECK('ouvert','en_attente','résolu','clôturé'),
notes_admin TEXT, created_at, updated_at
```

- **Catégorisation automatique** : `lib/tickets.ts` mappe sujet → catégorie
- **Vue client** : `/dashboard/sav/tickets` — création + suivi
- **Vue admin** : `/admin/sav/tickets` — groupé par catégorie, édition statut + notes
- **RLS** : clients voient seulement leurs tickets; admin utilise service_role

### 2.8 Module "Mon Site Web"

Logique 4 cas dans `app/dashboard/site-web/page.tsx` :

| Cas | Condition | Affichage |
|-----|-----------|-----------|
| 1 | `role = super_admin` | Info vitrine Sentinel + éditeur CMS |
| 2 | `site_web_actif = false` | Page upsell (acheter le pack) |
| 3 | `site_web_actif = true` mais pas `en_ligne` | Page "en cours de création" + ticket |
| 4 | `site_web_actif = true` + URL + `en_ligne` | Dashboard du site client |

Données :
- `entreprises.site_web_actif` (BOOLEAN) : flag d'activation du module par l'admin
- `sites_clients.url, .statut, .contenu` : configuration du site

**CMS dynamique** : `CmsEditor.tsx` (client component) + `POST /api/admin/vitrine` + script JS dans `public/vitrine/index.html` qui fetch `/api/vitrine` pour hydrater le contenu

### 2.9 Module Marketing

Accessible aux plans `pro` et `enterprise` uniquement.
Tables : `marketing_missions`, `rendez_vous_marketing`, `messages_marketing`, `campagnes_marketing`, `kpis_marketing`, `heures_marketing`, `messages_sav`, `agents_sentinel`

---

## 3. ATTENTES FONCTIONNELLES

### 3.1 Gestion des comptes et profils

- Inscription via email/mot de passe
- Création automatique de l'entreprise et du profil à la première connexion
- Dashboard layout crée `entreprises` (plan=trial, 14j) + `utilisateurs` (role=admin)
- Le `super_admin` doit être défini manuellement via SQL (le layout crée toujours avec `role='admin'`)
- Paramètres de profil éditables

### 3.2 Gestion multi-tenant des entreprises

- Isolation stricte : chaque client ne voit que ses propres données
- L'`entreprise_id` est le pivot de toute la logique RLS
- Plans : `trial` (14j), `starter` (79€), `pro` (149€), `enterprise` (499€)
- **Attention** : les prix dans `lib/tarifs.ts` (services/packs) NE CORRESPONDENT PAS aux plans DB (`starter`, `pro`, `enterprise`). Les tarifs sont des services marketing-side, les plans sont les abonnements SaaS-side.

### 3.3 Gestion des documents

- Contrats : upload + analyse IA
- Rapports : génération en 1 clic
- Audit package : export complet

### 3.4 Score de conformité AI Act

- Calculé à la demande depuis `lib/scoring/engine.ts`
- Sauvegardé dans `scores_conformite`
- Score global dans `scores_globaux` (agrégation)
- Affiché dans `/dashboard/score`

### 3.5 Module marketing

- Accessible plans `pro` et `enterprise`
- Assignation d'agents Sentinel à des missions client
- Dashboard KPIs, campagnes, rendez-vous, messages

### 3.6 Module "Mon Site Web"

- Plan gratuit/trial → page upsell
- Pack acheté (admin active `site_web_actif`) + pas de site → ticket SAV
- Pack acheté + site configuré → dashboard client
- Super admin → gestion + CMS édition vitrine

### 3.7 Panel Admin

- Vue d'ensemble (clients, MRR, tickets ouverts)
- Gestion clients : plan, suspension, site web, marketing
- Tickets SAV groupés par catégorie
- Chat SAV admin
- Marketing : assignation agents

### 3.8 Système de tickets SAV

- 8 catégories prédéfinies
- Création client → visible immédiatement dans le panel admin
- Admin change le statut (ouvert → en_attente → résolu → clôturé)
- Notes internes admin non visibles du client

### 3.9 Isolation multi-tenant stricte

- Toute table liée aux données client doit avoir `entreprise_id` + RLS
- Le client admin (service_role) bypass le RLS pour les opérations admin légitimes
- Les routes API client doivent toujours vérifier `utilisateur.entreprise_id`

---

## 4. PROBLÈMES MAJEURS IDENTIFIÉS

### 4.1 Problème critique : création de compte et trigger Supabase

**Symptôme** : Lors de l'exécution du script `a-executer.sql` (création manuelle de compte via SQL), une erreur `duplicate key value violates unique constraint "utilisateurs_pkey"` apparaît.

**Cause technique** : Supabase possède un trigger sur `auth.users` qui crée automatiquement un enregistrement dans `public.utilisateurs` dès qu'un utilisateur est inséré. Ce trigger s'exécute de manière synchrone dans la même transaction, AVANT que notre `INSERT INTO utilisateurs` ne s'exécute, causant un conflit de clé primaire (même UUID).

**Statut** : Partiellement résolu via `ON CONFLICT (id) DO UPDATE` dans `a-executer.sql`. Mais le trigger Supabase peut créer l'enregistrement avec des valeurs partielles (sans `entreprise_id`), ce qui cause des incohérences.

**Solution recommandée** : Identifier et analyser le trigger dans Supabase (`supabase/triggers` ou `pg_trigger`). Soit le modifier pour qu'il ne crée pas l'utilisateur si `public.utilisateurs` existe déjà, soit utiliser `ON CONFLICT` systématiquement.

### 4.2 Problème : rôle super_admin non assigné automatiquement

**Symptôme** : Après inscription sur le site, `chafiqui@icloud.com` a le rôle `admin` et ne peut pas accéder à `/admin`.

**Cause technique** : Le layout dashboard `app/dashboard/layout.tsx` crée systématiquement avec `role: 'admin'`. Le rôle `super_admin` doit être forcé via SQL manuellement (`a-executer.sql`).

**Statut** : Le script `a-executer.sql` corrige cela post-inscription. Mais dépend de l'exécution manuelle du script.

**Solution recommandée** : Créer une logique dans le layout ou un hook de vérification qui, si l'email est `chafiqui@icloud.com`, assigne automatiquement `super_admin` — ou mieux, créer un endpoint protégé par clé secrète pour promouvoir un compte.

### 4.3 Problème : colonne `site_web_actif` inexistante au premier déploiement

**Symptôme** : `/dashboard/site-web` peut planter si la colonne `site_web_actif` n'a pas encore été ajoutée via `a-executer.sql`.

**Cause technique** : La colonne est ajoutée par migration DDL dans `a-executer.sql`. Si ce script n'est pas exécuté, `select('*')` retourne un objet sans ce champ → `undefined ?? false` → CAS 2 (upsell) s'affiche correctement. Mais les routes API qui tentent de mettre à jour `site_web_actif` pourraient retourner une erreur PostgREST 400.

**Statut** : Contourné via `select('*')` au lieu de `select('nom, plan, site_web_actif')`.

**Solution recommandée** : Intégrer cette migration dans le schéma principal (`schema-complet.sql`) avec `ADD COLUMN IF NOT EXISTS`.

### 4.4 Problème : logique d'accès au module "Mon Site Web" incohérente

**Symptôme** : Les nouveaux comptes (plan=trial, role=admin) voient le module "Mon Site Web" avec des fonctionnalités de modification, alors qu'ils n'ont pas acheté le service.

**Cause technique** : Si `site_web_actif` n'existe pas encore en DB (migration non exécutée), la valeur est `false` → CAS 2 (upsell) s'affiche. Si `site_web_actif = true` est activé pour le compte (script exécuté), c'est le comportement attendu. Le problème est que l'utilisateur confond CAS 1 (super_admin avec CMS) avec "des fonctionnalités de modification non désirées".

**Statut** : La logique 4 cas est correctement implémentée. La confusion vient du fait que le super_admin voit un CMS d'édition complet, ce qui est le comportement attendu.

**Solution recommandée** : Clarifier visuellement le CAS 1 pour que l'administrateur comprenne qu'il voit sa propre vitrine. Ajouter un badge "Mode Super Admin" plus visible.

### 4.5 Problème : synchronisation DB — incohérences entre `auth.users` et `public.utilisateurs`

**Symptôme** : Après un `supprimer-comptes.sql` et une réinscription, des états partiels peuvent exister : `auth.users` créé mais `public.utilisateurs` sans `entreprise_id`, ou `entreprises` orphelines.

**Cause technique** : Le DO block SQL qui crée manuellement les enregistrements est dans une transaction unique. Si une étape échoue, PostgreSQL rollback tout — SAUF les insertions dans `auth.users` qui semblent être dans une transaction séparée (comportement GoTrue/Supabase).

**Statut** : Script `a-executer.sql` réécrit en mode idempotent avec vérifications à chaque étape. Mais le problème de fond (isolation transaction auth.users) n'est pas résolu.

### 4.6 Problème : duplication de routes vitrine

**Routes en conflit** :
- `app/api/vitrine/route.ts` — GET public (créé dans cette session)
- `app/api/vitrine/contenu/route.ts` — doublon probable
- `app/api/v1/vitrine/route.ts` — ancienne version API externe
- `app/api/admin/vitrine/route.ts` — GET+POST admin (existait déjà, réécrit)

**Risque** : Ambiguïté sur quelle route est utilisée par le script JS de `public/vitrine/index.html`. La route `/api/vitrine` est celle ciblée.

### 4.7 Problème : RLS avec récursion

**Symptôme** : Certaines politiques RLS causent des boucles infinies (ex: politique sur `utilisateurs` qui requête `utilisateurs`).

**Preuve** : Existence de `supabase/fix-rls-recursion.sql` dans le projet.

**Cause technique** : Une politique FOR SELECT sur `utilisateurs` qui vérifie `entreprise_id = (SELECT entreprise_id FROM utilisateurs WHERE id = auth.uid())` crée une référence circulaire.

**Statut** : Un fix partiel a été appliqué. Nécessite audit complet de toutes les politiques RLS.

### 4.8 Problème : module Marketing — accès non contrôlé par le plan

**Symptôme** : La page marketing dashboard (`/dashboard/marketing`) ne vérifie peut-être pas le plan de l'utilisateur côté serveur — un compte `trial` pourrait y accéder.

**Cause technique** : La vérification du plan est souvent faite côté client (conditionnelle dans l'UI) mais rarement avec un guard serveur strict.

**Statut** : Non résolu, à vérifier.

### 4.9 Problème : Stripe webhook sans secret

**Symptôme** : `STRIPE_WEBHOOK_SECRET` est vide dans `.env.local`. Les webhooks Stripe ne sont pas vérifiés.

**Risque** : N'importe qui peut forger une requête webhook et déclencher des changements de plan.

**Statut** : Non résolu.

### 4.10 Problème mineur : page `/admin/tarifs` obsolète

La page `app/admin/tarifs/page.tsx` existe toujours mais a été retirée de la sidebar. Elle est accessible en URL directe et peut être confuse.

---

## 5. DEMANDES UTILISATEUR ET ÉTAT DE RÉSOLUTION

### DEMANDE 1 — Nettoyage de la vitrine HTML (suppression des emojis)

**Attendu** : Supprimer tous les emojis de `public/vitrine/index.html` — nav, hero, sections, boutons, footer.

**Tenté** : Remplacement de chaque occurrence d'emoji par du texte ou suppression. Ajout de classes CSS `.color-emerald`, `.color-violet`, `.color-cyan` pour remplacer les styles inline.

**Résultat** : Fait. Les garanties ont été remplacées par des codes texte (`FR`, `30j`, `Libre`, `SAV`, `48h`).

**Reste** : Vérification visuelle dans un navigateur que aucun emoji ne subsiste.

---

### DEMANDE 2 — Retirer "Tarifs" du panel admin, ajouter "Tickets"

**Attendu** : Sidebar admin — supprimer lien `/admin/tarifs`, ajouter lien `/admin/sav/tickets`.

**Tenté** : Modification de `app/admin/layout.tsx` — retrait de l'import `Tag`, remplacement par `Ticket`, modification du tableau nav.

**Résultat** : Fait. La page `/admin/tarifs` existe encore dans le filesystem mais n'est plus dans la navigation.

**Reste** : Supprimer le fichier `app/admin/tarifs/page.tsx` pour nettoyer.

---

### DEMANDE 3 — Module "Mon Site Web" — logique par profil

**Attendu** :
- Plan gratuit / trial → page upsell (acheter le pack)
- Pack acheté, pas de site configuré → page "en attente" + ticket SAV
- Pack acheté + site configuré → dashboard du site
- `super_admin` (chafiqui) → vue de sa vitrine + éditeur CMS

**Tenté** :
- Réécriture complète de `app/dashboard/site-web/page.tsx` en server component avec 4 sous-composants
- Utilisation de `select('*')` pour éviter l'erreur PostgREST si la colonne n'existe pas
- Création de `CmsEditor.tsx` pour l'édition vitrine super_admin
- Ajout de IDs dans `public/vitrine/index.html` + script fetch CMS

**Résultat** : La logique est en place. Le CMS fonctionnel pour super_admin.

**Reste** :
- S'assurer que `a-executer.sql` est exécuté pour configurer `site_web_actif` et `sites_clients`
- Tester le CAS 2 (upsell) depuis un compte régulier sans `site_web_actif`

---

### DEMANDE 4 — Système de tickets SAV

**Attendu** :
- Table `tickets_sav` en DB avec catégorisation automatique
- Vue client : créer un ticket, voir l'historique
- Vue admin : voir tous les tickets groupés par catégorie, changer statut, ajouter notes
- Bandeau sur `/dashboard/sav` pour accéder rapidement aux tickets

**Tenté** :
- Création de `lib/tickets.ts` (mapping sujets/catégories)
- `app/api/sav/tickets/route.ts` (GET/POST client)
- `app/api/admin/sav/tickets/route.ts` (GET/PATCH admin)
- `app/dashboard/sav/tickets/page.tsx` (vue client)
- `app/admin/sav/tickets/page.tsx` (vue admin)
- Mise à jour `app/dashboard/sav/page.tsx` (bandeau)
- `supabase/modules/tickets-sav.sql` + inclus dans `a-executer.sql`

**Résultat** : Complet en code. Dépend de l'exécution de `a-executer.sql` pour créer la table.

**Reste** : Tester end-to-end après exécution SQL.

---

### DEMANDE 5 — Activation module "Mon Site Web" par client depuis le panel admin

**Attendu** : Dans `/admin/clients/[id]`, toggle `site_web_actif` pour activer/désactiver le module site web par client.

**Tenté** :
- Ajout de `siteWebActif` state dans `app/admin/clients/[id]/page.tsx`
- Ajout toggle UI (switch on/off bleu)
- Inclusion dans `handleSaveSite()` → PATCH `/api/admin/clients/[id]` avec `{ site_url, site_statut, site_web_actif }`
- Ajout de `if (body.site_web_actif !== undefined) updates.site_web_actif = body.site_web_actif` dans le handler PATCH

**Résultat** : Fait. L'admin peut activer/désactiver depuis la fiche client.

**Reste** : Dépend de la migration SQL (colonne `site_web_actif` sur `entreprises`).

---

### DEMANDE 6 — Suppression de compte et réinitialisation propre

**Attendu** : Script SQL pour supprimer complètement le compte `chafiqui@icloud.com` et toutes ses données liées (9 groupes de tables).

**Tenté** :
- `supabase/supprimer-comptes.sql` — DO block qui sauvegarde les IDs, supprime dans l'ordre correct (enfants avant parents), supprime `auth.identities` + `auth.users` en dernier
- Plusieurs itérations pour gérer les cas bords (account pas trouvé, v_e_ids NULL, etc.)

**Résultat** : Script fonctionnel. Cible uniquement `chafiqui@icloud.com`.

**Reste** : Script testé une seule fois. Dépend de l'ordre de suppression respectant les contraintes FK.

---

### DEMANDE 7 — Création de compte via SQL avec mot de passe

**Attendu** : Créer le compte `chafiqui@icloud.com` / `Habibou.8` directement en SQL sans passer par l'interface d'inscription.

**Tenté** :
- INSERT dans `auth.users` avec `crypt('Habibou.8', gen_salt('bf'))`
- INSERT dans `auth.identities` (nécessaire pour la connexion)
- INSERT dans `public.entreprises` + `public.utilisateurs`
- Plusieurs versions du script face aux erreurs (`duplicate key`, `aucun compte trouvé`)

**Problème rencontré** : Un trigger Supabase sur `auth.users` crée automatiquement un enregistrement dans `public.utilisateurs` → conflit de clé primaire lors de notre propre INSERT.

**Résolution** : Abandon de la création via SQL. L'utilisateur crée son compte via l'interface → exécute `a-executer.sql` pour assigner les permissions.

**Reste** : Identifier le trigger exact dans Supabase et le documenter.

---

### DEMANDE 8 — CMS éditeur de la vitrine pour super_admin

**Attendu** : Dans `/dashboard/site-web`, pour le compte super_admin, afficher un formulaire permettant d'éditer le contenu du H1 et du sous-titre de la vitrine. Les modifications doivent être visibles sur `/vitrine/`.

**Tenté** :
- Création de `app/dashboard/site-web/CmsEditor.tsx` (client component)
- Champs : `hero_ligne1`, `hero_ligne2`, `hero_sous_titre` avec aperçu live
- Sauvegarde via `POST /api/admin/vitrine` → mise à jour de `sites_clients.contenu`
- Ajout d'IDs dans `public/vitrine/index.html` : `v-h1-l1`, `v-h1-l2`, `v-hero-sub`
- Script JS fetch dans `public/vitrine/index.html` qui appelle `/api/vitrine` et injecte le contenu

**Résultat** : Implémenté. Pipeline complet : édition dashboard → DB → fetch public.

**Reste** : Tester que le fetch cross-origin fonctionne (la vitrine est en `/public/`, le fetch appelle `/api/vitrine` qui est Next.js). En prod, les deux sont sur le même domaine, donc ça devrait fonctionner.

---

## 6. CHAÎNES D'ACTIONS ET DÉPENDANCES

### 6.1 Chaîne : Inscription d'un nouveau client

```
1. Utilisateur remplit /register (email, password, nom_entreprise)
2. Supabase Auth → INSERT auth.users (id auto-généré)
3. Trigger Supabase (si configuré) → INSERT public.utilisateurs (partiel)
4. Redirection vers /dashboard
5. dashboard/layout.tsx → lecture public.utilisateurs via getUtilisateur()
6. Si non trouvé → INSERT entreprises (plan='trial', 14j) + INSERT utilisateurs (role='admin')
7. Dashboard chargé avec le profil complet
```

**Risques** :
- Si le trigger (étape 3) ET le layout (étape 6) s'exécutent tous les deux → conflit FK sur utilisateurs
- Si le layout échoue → redirect('/login'), utilisateur bloqué

### 6.2 Chaîne : Connexion super_admin

```
1. Connexion sur /login avec chafiqui@icloud.com
2. auth.users trouvé → session créée
3. dashboard/layout.tsx → lecture utilisateurs → role='super_admin' (si a-executer.sql a été exécuté)
4. Dashboard chargé normalement
5. Navigation vers /admin → admin/layout.tsx vérifie role === 'super_admin' → accès accordé
```

**Dépendance critique** : `a-executer.sql` DOIT être exécuté après chaque nouvelle inscription de chafiqui. Si oublié → role='admin' → accès /admin refusé.

### 6.3 Chaîne : Edition du site web par l'admin

```
1. Admin ouvre /admin/clients/[id]
2. GET /api/admin/clients/[id] → retourne entreprises.* + sites_clients.*
3. UI charge siteWebActif, siteUrl, siteStatut
4. Admin modifie les valeurs → clique "Sauvegarder le site"
5. PATCH /api/admin/clients/[id] avec {site_url, site_statut, site_web_actif}
6. API → UPDATE entreprises.site_web_actif
7. API → UPSERT sites_clients {url, statut, updated_at}
8. Client recharge /dashboard/site-web
9. page.tsx lit entreprises.* + sites_clients.* → détermine le CAS → affiche UI correspondante
```

**Dépendances** :
- Colonne `site_web_actif` doit exister (migration SQL)
- Table `sites_clients` doit exister avec contrainte UNIQUE sur `entreprise_id`
- Le CAS 4 requiert `statut='en_ligne'` ET `url` non null

### 6.4 Chaîne : Score de conformité AI Act

```
1. Utilisateur navigue vers /dashboard/score
2. Requête GET /api/score
3. lib/scoring/engine.ts → lecture journaux_usage_ia filtrée par entreprise_id
4. Calcul 4 dimensions → score_global 0-100
5. UPSERT scores_conformite
6. Score agrégé dans scores_globaux via lib/scoring/global.ts
7. Affichage dashboard avec recommandations
```

### 6.5 Chaîne : Ticket SAV

```
Client:
1. /dashboard/sav/tickets → formulaire
2. POST /api/sav/tickets {sujet, description}
3. API → getCategorieFromSujet() → categorie auto
4. INSERT tickets_sav {entreprise_id, sujet, categorie, description, statut='ouvert'}
5. Ticket visible dans la liste client

Admin:
6. /admin/sav/tickets → GET /api/admin/sav/tickets
7. Retourne tous tickets + join entreprises(nom), groupés par categorie
8. Admin change statut/notes → PATCH /api/admin/sav/tickets?id={ticketId}
9. UPDATE tickets_sav {statut, notes_admin}
10. Client rafraîchit → voit nouveau statut avec badge coloré
```

### 6.6 Dépendances inter-modules

| Module | Dépend de | Tables requises |
|--------|-----------|-----------------|
| Score global | Journaux IA, Finances, Contrats, Impayés, Obligations | `journaux_usage_ia`, `flux_financiers`, `documents_contrats`, `factures`, `obligations` |
| Marketing dashboard | Mission assignée par admin | `marketing_missions`, `agents_sentinel`, `messages_marketing` |
| Mon Site Web | Flag admin + sites_clients | `entreprises.site_web_actif`, `sites_clients` |
| Tickets SAV | Table tickets | `tickets_sav` (migration SQL obligatoire) |
| Copilote dirigeant | Données RH, Finance, CRM, Ops | `employes`, `depenses`, `leads`, `taches` |
| Formation | Modules seed | `training-modules.sql` exécuté |

---

## 7. ÉTAT GLOBAL DU SYSTÈME

### 7.1 Niveau de stabilité actuel

| Zone | Stabilité | Commentaire |
|------|-----------|-------------|
| Auth + sessions | Moyen | Fonctionne, mais trigger Supabase crée des conflits |
| Dashboard client (core) | Bon | Journaux, score, contrats, impayés, obligations |
| Panel admin | Bon | Clients, marketing, SAV |
| Module marketing | Bon | Complet, testé en code |
| Module Mon Site Web | Moyen | Logique correcte, dépend des migrations SQL |
| CMS vitrine | Non testé | Implémenté mais jamais testé end-to-end |
| Tickets SAV | Non testé | Complet en code, dépend de la table SQL |
| Scoring IA Act | Bon | Engine solide, 4 dimensions |
| Copilote GROQ | Bon en code | Dépend de GROQ_API_KEY configurée |
| Stripe | Incomplet | Webhook sans secret, pas de mise à jour plan automatique |
| RLS | Risqué | Récursions connues, politiques incomplètes |
| SQL migrations | Manuel | Aucune automatisation, tout exécuté à la main |

### 7.2 Zones critiques

1. **RLS incomplet ou récursif** — Des données clients pourraient être lisibles par d'autres tenants si les politiques sont mal configurées. Audit complet nécessaire de toutes les tables.

2. **Trigger Supabase non documenté** — Ce trigger crée des états partiels imprévisibles lors de la création manuelle de comptes. Il doit être identifié et documenté.

3. **Stripe non opérationnel** — Le webhook n'est pas sécurisé. Les changements de plan ne sont pas automatisés. Les clients ne peuvent pas s'abonner de manière autonome.

4. **Migrations SQL manuelles** — Il n'y a pas de système de migration automatique. L'état de la DB dépend entièrement des scripts SQL exécutés manuellement dans Supabase SQL Editor. Il n'existe pas de registre de quelle migration a été appliquée.

5. **Duplication de routes API vitrine** — 4 routes différentes pour la vitrine, risque de confusion et de comportement inattendu.

### 7.3 Risques majeurs

| Risque | Probabilité | Impact | Priorité |
|--------|-------------|--------|----------|
| Données clients visibles entre tenants (RLS) | Moyen | Critique | P0 |
| Webhook Stripe forgeable | Faible (dev) | Critique (prod) | P1 |
| Blocage complet si trigger Supabase change | Moyen | Élevé | P1 |
| Migrations non appliquées en prod | Élevé | Élevé | P1 |
| Compte super_admin sans script SQL → bloqué | Élevé | Moyen | P2 |
| Routes API vitrine en conflit | Faible | Faible | P3 |

### 7.4 Priorités de correction recommandées pour l'audit Opus 4.6

**P0 — Immédiat**
- [ ] Auditer et corriger toutes les politiques RLS (récursions, tables sans RLS)
- [ ] Documenter et contrôler le trigger Supabase sur `auth.users`

**P1 — Court terme**
- [ ] Sécuriser le webhook Stripe (`STRIPE_WEBHOOK_SECRET`)
- [ ] Créer un système de migration SQL versionné (ou au minimum un script unique idempotent)
- [ ] Automatiser l'assignation du rôle `super_admin` pour l'email administrateur

**P2 — Moyen terme**
- [ ] Tester end-to-end le CMS vitrine (édition → DB → fetch public)
- [ ] Tester end-to-end les tickets SAV (création client → panel admin)
- [ ] Vérifier les guards de plan dans tous les modules (marketing, site-web)
- [ ] Supprimer les routes API en doublon (vitrine)
- [ ] Supprimer les pages obsolètes (`/admin/tarifs`)

**P3 — Optimisation**
- [ ] Remplacer le fichier `lib/ai/anthropic.ts` par `lib/ai/groq.ts` pour éviter la confusion de nommage
- [ ] Typer `getUtilisateur()` correctement (retourne `any` actuellement)
- [ ] Centraliser la vérification de rôle dans un middleware unifié
- [ ] Implémenter un système de feature flags basé sur le plan (plutôt que des vérifications éparpillées)

---

## ANNEXE — Variables d'environnement requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# GROQ (provider IA, pas Anthropic malgré le nom du fichier)
GROQ_API_KEY=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=  # ← VIDE, à configurer
```

## ANNEXE — Scripts SQL à exécuter dans l'ordre

```
1. supabase/schema-complet.sql       → Schéma de base
2. supabase/rls_policies.sql         → Politiques RLS
3. supabase/modules/*.sql            → Un par module (dans l'ordre des dépendances)
4. supabase/seed/*.sql               → Données de référence
5. supabase/a-executer.sql           → Post-inscription super_admin (à chaque réinscription)
```

---

*Document généré le 21 février 2026. À mettre à jour après chaque correction majeure.*
