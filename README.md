# Orchidée Nature Management System

Application web de gestion commerciale multi-entités — **Orchidée Nature** & **Antigravity Mom**.

---

## Sommaire

1. [Stack technique](#stack-technique)
2. [Architecture du projet](#architecture-du-projet)
3. [Configuration Supabase](#configuration-supabase)
4. [Variables d'environnement](#variables-denvironnement)
5. [Configuration Twilio WhatsApp](#configuration-twilio-whatsapp)
6. [Déploiement sur Vercel](#déploiement-sur-vercel)
7. [Installation locale](#installation-locale)
8. [Rôles et permissions](#rôles-et-permissions)
9. [Modules fonctionnels](#modules-fonctionnels)
10. [PWA et mode hors-ligne](#pwa-et-mode-hors-ligne)
11. [Design system](#design-system)
12. [Tests et validation](#tests-et-validation)
13. [Maintenance](#maintenance)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Base de données | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth — JWT, cookies httpOnly |
| UI | Tailwind CSS |
| État global | Zustand |
| Offline | PWA, Service Worker, IndexedDB via Dexie.js |
| Graphiques | Recharts (chargement dynamique côté client) |
| Notifications | Supabase Realtime + Twilio WhatsApp |
| Analyse IA | Anthropic API (claude-sonnet-4-20250514) |
| Export PDF | jsPDF + html2canvas |
| Déploiement | Vercel |

---

## Architecture du projet

```
src/
├── app/
│   ├── (auth)/login/                    # Page de connexion
│   ├── (dashboard)/
│   │   ├── super-admin/                 # Dashboard super admin
│   │   │   ├── page.tsx                 # Vue globale toutes entités
│   │   │   ├── entites/                 # Gestion des entités
│   │   │   ├── audit/                   # Journal d'audit (200 dernières entrées)
│   │   │   ├── permissions/             # Matrice de permissions par rôle
│   │   │   ├── analyse/                 # Rapport IA (Claude API)
│   │   │   └── parametres/              # Paramètres globaux + notifications
│   │   ├── admin/
│   │   │   ├── page.tsx                 # Dashboard entité
│   │   │   ├── produits/                # Catalogue produits
│   │   │   ├── stock/                   # Gestion stock + seuils
│   │   │   ├── factures/                # Liste + détail + création
│   │   │   ├── commandes/               # Workflow commandes
│   │   │   ├── rapports/                # Rapports activité/stock/caisse/commandes
│   │   │   ├── notifications/           # Centre notifications
│   │   │   ├── utilisateurs/            # Gestion comptes
│   │   │   └── parametres/              # Paramètres entité + notifications
│   │   ├── manager/                     # Accès restreint (pas de gestion users)
│   │   ├── vendeur/                     # Interface vente mobile-first
│   │   ├── caissier/                    # Interface caisse 4 onglets
│   │   └── readonly/                    # Lecture seule
│   ├── api/
│   │   ├── invoices/                    # CRUD factures
│   │   ├── stock/                       # Stock, ajustements, seuils
│   │   ├── cash-sessions/               # Sessions caisse
│   │   ├── cash-movements/              # Mouvements caisse
│   │   ├── orders/                      # Commandes
│   │   ├── notifications/               # Notifications in-app
│   │   ├── notification-settings/       # Config notifications par rôle
│   │   ├── permissions/                 # Matrice permissions
│   │   ├── whatsapp/                    # Envoi WhatsApp via Twilio
│   │   ├── reports/                     # Données rapports + export PDF
│   │   ├── analyse/                     # Agrégation données pour IA
│   │   ├── export/csv/                  # Export CSV
│   │   ├── export/pdf/                  # Génération PDF HTML
│   │   ├── admin/settings/              # Paramètres admin (entités, users, audit)
│   │   └── users/                       # Gestion utilisateurs
│   └── layout.tsx                       # Root layout, PWA init
├── components/
│   ├── modules/
│   │   ├── cash/cash-interface.tsx      # Interface caissier (4 onglets + calculatrice)
│   │   ├── invoices/                    # Formulaire facture + liste
│   │   ├── orders/                      # Tableau commandes + formulaire
│   │   ├── products/                    # Catalogue + stock + dialogs
│   │   ├── reports/                     # Rapports + analyse IA
│   │   └── settings/                    # Paramètres admin + super admin
│   ├── shared/
│   │   ├── dashboard-layout.tsx         # Layout principal
│   │   ├── sidebar.tsx                  # Navigation latérale
│   │   ├── header.tsx                   # En-tête + notifications
│   │   ├── online-status.tsx            # Barre de statut offline/sync
│   │   ├── notification-center.tsx      # Cloche + Supabase Realtime
│   │   └── store-initializer.tsx        # Hydratation Zustand
│   └── ui/toast-container.tsx
├── hooks/
│   ├── use-offline-sync.ts             # Sync automatique à reconnexion
│   ├── use-cache-refresh.ts            # Refresh cache toutes les 15 min
│   └── use-toast.ts
├── lib/
│   ├── supabase/client.ts + server.ts
│   ├── offline/dexie-schema.ts         # Schéma IndexedDB
│   └── utils.ts                        # formatFCFA, formatDate, calcMargin
├── middleware.ts                        # Auth + routing par rôle
├── stores/app-store.ts                 # Zustand : user, entity, offline, sync
└── types/index.ts
```

---

## Configuration Supabase

### 1. Créer le projet

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Nom : `orchidee-nms`
3. Région : choisir la plus proche (Europe West pour Togo)
4. Copier l'**URL du projet** et les clés API

### 2. Exécuter le schéma SQL

Dans Supabase → **SQL Editor**, exécuter dans cet ordre :

```sql
-- Étape 1 : Schéma principal (tables, RLS, seed data)
-- Copier le contenu de supabase/schema.sql

-- Étape 2 : Schéma Phase 3 (notification_settings, permissions supplémentaires)
-- Copier le contenu de supabase/schema-phase3.sql
```

Les deux fichiers sont idempotents (`CREATE IF NOT EXISTS`). Exécuter `schema.sql` en entier avant `schema-phase3.sql`.

### 3. Tables créées

| Table | Description |
|-------|-------------|
| `entities` | Entités commerciales (Orchidée Nature, Antigravity Mom) |
| `users` | Utilisateurs avec rôle, entité, statut |
| `permissions` | Matrice rôle × action × ressource |
| `product_categories` | Catégories produits par entité |
| `products` | Catalogue produits (130+ en seed) |
| `stock` | Stock actuel par produit et entité |
| `stock_movements` | Historique mouvements de stock |
| `stock_thresholds` | Seuils d'alerte et commande automatique |
| `invoices` | Factures (draft / validated / cancelled) |
| `invoice_lines` | Lignes de facture |
| `cash_sessions` | Sessions caisse |
| `cash_movements` | Mouvements au sein d'une session |
| `orders` | Commandes (manuelle ou auto) |
| `order_lines` | Lignes de commande |
| `notifications` | Notifications in-app |
| `notification_settings` | Config notifications par rôle/entité |
| `audit_logs` | Journal complet de toutes les actions |
| `daily_reports` | Rapports journaliers agrégés |
| `sync_queue` | File de synchronisation offline |

### 4. Activer Realtime

Supabase → **Database → Replication** → activer les tables :
- `notifications`
- `stock`
- `cash_sessions`

### 5. Configurer l'authentification

Supabase → **Authentication → Settings** :
- **Site URL** : `https://votre-domaine.vercel.app`
- **Redirect URLs** : `https://votre-domaine.vercel.app/auth/callback`
- Désactiver **Email Confirmations** si environnement interne

### 6. Créer le premier super_admin

Après exécution du schéma, dans Supabase → **Authentication → Users → Add user** :
- Email : `admin@orchidee.com`
- Mot de passe : `Admin@2024!`

Puis dans SQL Editor :
```sql
UPDATE users
SET role = 'super_admin', status = 'active'
WHERE email = 'admin@orchidee.com';
```

### 7. Politiques RLS

Toutes les tables ont Row Level Security activée. Les politiques permettent :
- `super_admin` : accès total toutes entités
- `admin` / `manager` : accès leur entité uniquement
- `vendeur` / `caissier` : accès lecture produits + création factures/sessions
- `readonly` : lecture seule sur produits, stock, factures, rapports

---

## Variables d'environnement

### Fichier `.env.local` (développement)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Optionnel — SMTP pour notifications email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxx
SMTP_FROM=noreply@orchidee-nature.com
```

### Récupérer les clés Supabase

Supabase → **Project Settings → API** :
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (ne jamais exposer côté client)

---

## Configuration Twilio WhatsApp

### 1. Créer un compte Twilio

1. S'inscrire sur [twilio.com](https://www.twilio.com)
2. Vérifier le numéro de téléphone de test

### 2. Activer le Sandbox WhatsApp (développement)

1. Twilio Console → **Messaging → Try it out → Send a WhatsApp message**
2. Rejoindre le sandbox : envoyer `join [mot-de-passe]` au `+1 415 523 8886` depuis WhatsApp
3. Chaque numéro destinataire doit également rejoindre le sandbox

**Numéro sandbox** : `whatsapp:+14155238886`

### 3. Passer en production (WhatsApp Business)

1. Twilio Console → **Messaging → Senders → WhatsApp senders**
2. Soumettre le formulaire d'approbation Meta Business
3. Délai : 1 à 7 jours ouvrés
4. Une fois approuvé, mettre à jour `TWILIO_WHATSAPP_FROM` avec votre numéro dédié

### 4. Récupérer les credentials

Twilio Console → **Account → Account Info** :
- **Account SID** → `TWILIO_ACCOUNT_SID`
- **Auth Token** (cliquer Reveal) → `TWILIO_AUTH_TOKEN`

### 5. Tester l'envoi

Dans l'app → **Paramètres → Test WhatsApp**, saisir un numéro au format `+22890123456` et cliquer **Envoyer test**.

---

## Déploiement sur Vercel

### 1. Connecter le dépôt

1. [vercel.com](https://vercel.com) → **New Project**
2. Importer depuis GitHub/GitLab/Bitbucket
3. Framework : **Next.js** (détecté automatiquement)

### 2. Configurer les variables d'environnement

Vercel → **Project Settings → Environment Variables** :

| Variable | Environnement |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `TWILIO_ACCOUNT_SID` | Production |
| `TWILIO_AUTH_TOKEN` | Production |
| `TWILIO_WHATSAPP_FROM` | Production |

### 3. Paramètres de build

```
Build Command  : next build
Output Dir     : .next
Install Command: npm install
Node.js        : 20.x
```

### 4. Domaine custom (optionnel)

Vercel → **Domains** → ajouter `gestion.orchidee-nature.com`, puis configurer les DNS :
```
CNAME  @   cname.vercel-dns.com
```

### 5. Mettre à jour Supabase

Supabase → **Authentication → Settings** → ajouter l'URL Vercel dans **Site URL** et **Redirect URLs**.

### 6. Redéploiement

Tout push sur `main` déclenche un redéploiement automatique. Pour forcer :
```bash
vercel --prod
```

---

## Installation locale

```bash
# 1. Cloner le projet
git clone <repo-url>
cd orchidee-nms

# 2. Installer les dépendances
npm install

# 3. Copier et remplir le fichier d'environnement
cp .env.local.example .env.local

# 4. Lancer en développement
npm run dev
# → http://localhost:3000

# 5. Build de production
npm run build && npm start
```

**Connexion par défaut** : `admin@orchidee.com` / `Admin@2024!`

---

## Rôles et permissions

| Rôle | Accès | Description |
|------|-------|-------------|
| `super_admin` | Global toutes entités | Permissions, analyse IA, paramètres globaux |
| `admin` | Son entité complète | Gestion users, rapports, paramètres entité |
| `manager` | Son entité (sans users) | Commandes, rapports, stock |
| `vendeur` | Interface vente | Création factures uniquement |
| `caissier` | Interface caisse | Sessions caisse, ventes, calculatrice |
| `readonly` | Lecture seule | Produits, stock, factures, rapports |

### Matrice de permissions

Page `/super-admin/permissions` — tableau interactif rôle × action × ressource :
- **Cases violettes** : permission activée
- **Cases blanches** : permission désactivée
- **Cases grises** : verrouillée système (non modifiable)

Actions : Voir, Créer, Modifier, Supprimer, Exporter, Valider, Notifier

Ressources : Produits, Stock, Factures, Rapports, Utilisateurs, Caisse, Commandes, Notifications

---

## Modules fonctionnels

### Gestion produits & stock

- Catalogue en liste ou grille avec recherche instantanée
- Badges de statut : Vert (OK), Orange (seuil bas), Rouge (rupture)
- Ajustements de stock IN/OUT/ADJUSTMENT avec motif et historique 50 mouvements
- Seuils configurables par produit et entité : stock min, quantité à recommander, commande automatique, validation manuelle requise

### Facturation (vendeur)

Interface mobile-first en 2 étapes :
1. Recherche produit autocomplete, ajout au panier, quantités éditables
2. Récapitulatif, saisie montant reçu → rendu monnaie en temps réel (vert si OK, rouge si insuffisant)

Validation : crée la facture, décrémente le stock, déclenche commande auto si seuil atteint.

### Interface caissier

Session obligatoire avec fond de caisse initial. 4 onglets :
- **Vente** : panier + rendu monnaie
- **Mouvements** : dépenses, apports, remboursements
- **Calculatrice** : opérations + mémoire M+/M-/MR/MC + historique 20 calculs
- **Résumé** : solde session, total par type de mouvement

Fermeture avec saisie du montant compté — alerte critique admin si écart > 500 FCFA, attention si > 100 FCFA.

### Commandes

- **Manuelles** : formulaire avec date livraison >= J+2 ouvrés obligatoire
- **Automatiques** : déclenchées à la validation d'une facture si stock ≤ seuil

Workflow : `pending_validation → sent → in_preparation → shipped → delivered | cancelled`

### Notifications in-app & WhatsApp

**In-app** : cloche dans l'en-tête avec badge. Dropdown temps réel via Supabase Realtime.

**WhatsApp** via Twilio : alertes stock, nouvelles commandes, écarts caisse, rapports journaliers.

**Configuration par rôle** (`/parametres/notifications`) :
- Numéro WhatsApp + toggle actif/inactif
- Email + toggle actif/inactif
- Fréquence commandes : chaque commande | résumé horaire | résumé journalier
- Fréquence alertes stock : temps réel | résumé journalier | désactivé
- Fréquence rapports caisse : chaque session | synthèse 20h | désactivé
- Heure d'envoi de la synthèse journalière (timepicker)

### Rapports

Page `/rapports` — 4 types, accessibles selon les permissions :
1. **Activité** : CA, marge, ticket moyen, ventes journalières, par vendeur, par catégorie
2. **Stocks** : état actuel, mouvements sur période, produits en alerte
3. **Caissiers** : sessions, écarts, performances par caissier
4. **Commandes** : statuts, délais, fournisseurs

Chaque rapport : filtres période + entité + utilisateur → tableau de données + graphique Recharts + **export PDF** + **export CSV**.

### Analyse IA (super_admin uniquement)

Page `/super-admin/analyse` — 3 sections :
1. **Paramètres** : période, entité, axes d'analyse multi-sélection
2. **Dashboard KPIs** : 6 cards + 4 graphiques calculés depuis données Supabase réelles
3. **Rapport narratif** : généré par `claude-sonnet-4-20250514` avec données JSON réelles — résumé exécutif, analyse par axe, points forts, alertes, 3-5 recommandations

Axes : Performance commerciale, Gestion des stocks, Activité caissiers, Tendances produits, Comparaison inter-entités

**Export PDF complet** : en-tête Orchidée Nature + KPIs + rapport IA + tableau annexe + pied de page daté.

### Paramètres super_admin

Page `/super-admin/parametres` — 7 sections :
1. **Entités** : modifier nom, couleur, logo
2. **Produits** : import CSV, export catalogue, gestion catégories
3. **Comptes** : liste tous utilisateurs toutes entités, validation/suspension en masse
4. **Notifications** : configuration Twilio (SID, Token, numéro émetteur) + test SMTP
5. **Sécurité** : durée session, tentatives max, politique mot de passe
6. **Audit** : logs filtrables — qui a fait quoi, quand, quelle ressource
7. **Sauvegarde** : export BDD complète en JSON

---

## PWA et mode hors-ligne

### Comportement offline

Barre rouge persistante en haut de page affichant le nombre d'opérations en attente. Toutes les créations/modifications stockées dans IndexedDB (Dexie.js). À la reconnexion : sync automatique dans l'ordre chronologique.

### Cache local

Produits et stock : refresh automatique toutes les 15 minutes si en ligne.

### Schéma IndexedDB

Tables : `products`, `stock`, `invoices`, `invoice_lines`, `cash_sessions`, `cash_movements`, `orders`, `sync_queue`

### Conflits

Stratégie last-write-wins avec audit log systématique.

### Installation PWA

Mobile (Chrome/Safari) : **Menu → Ajouter à l'écran d'accueil**. L'application s'installe comme une app native avec icône et mode plein écran.

---

## Design system

| Élément | Valeur |
|---------|--------|
| Border-radius max | 4px (`rounded-sm`) — jamais `rounded-xl` |
| Couleur Orchidée Nature | `#7C3AED` (violet) |
| Couleur Antigravity Mom | `#EA580C` (orange) |
| Typographie body | Inter 14px |
| Typographie secondaire | Inter 13px |
| KPIs | Inter 20-28px bold |
| Tableaux | Header sticky, lignes alternées gray-50 / white |
| Cards | Flat, `border border-gray-200`, `shadow-sm` |
| Boutons primaires | Couleur entité, texte blanc |
| États loading | Skeletons animés (jamais de spinners seuls) |
| Format montants | `1 250 FCFA` (espace séparateur milliers) |
| Icônes | Lucide React uniquement (zéro emojis) |
| Toasts | Coin bas-droite, 3s, border-left colorée |

---

## Tests et validation

### Tests par module

**Authentification**
- [ ] Connexion `admin@orchidee.com` / `Admin@2024!` → redirection `/super-admin`
- [ ] Connexion avec compte vendeur → redirection `/vendeur`
- [ ] Blocage après 5 tentatives erronées
- [ ] Déconnexion et invalidation de session

**Gestion stock**
- [ ] Ajustement IN +50 unités sur un produit → stock mis à jour
- [ ] Configurer seuil à 10 unités, descendre dessous → badge orange
- [ ] Avec `auto_order = true`, vente déclenchant le seuil → commande automatique créée

**Facturation**
- [ ] Créer facture avec 3 produits en vendeur
- [ ] Rendu monnaie : vert si reçu ≥ total, rouge sinon
- [ ] Valider → stock décrémenté, facture en `validated`
- [ ] Créer facture hors-ligne → reconnecter → sync automatique

**Session caisse**
- [ ] Ouvrir session avec fond 50 000 FCFA
- [ ] Réaliser 3 ventes + 1 dépense → vérifier résumé (solde calculé)
- [ ] Fermer avec écart 1 000 FCFA → alerte admin critique reçue

**Commandes**
- [ ] Commande manuelle avec date J+2 ouvrés → créée en `pending_validation`
- [ ] Date J+1 → message d'erreur validation
- [ ] Workflow complet : `pending_validation → sent → delivered`

**Notifications WhatsApp**
- [ ] Configurer numéro dans Paramètres Notifications
- [ ] Bouton **Test WhatsApp** → message reçu sur téléphone
- [ ] Passer stock sous seuil → message WhatsApp automatique

**Rapport IA**
- [ ] Sélectionner 30 jours, axes Performance + Stock → **Générer**
- [ ] KPIs et graphiques affichés
- [ ] Rapport narratif Claude apparaît (skeleton puis texte)
- [ ] Export PDF → fichier valide avec en-tête et pied de page

**Permissions**
- [ ] Décocher `create - Factures` pour vendeur → bouton création disparu en vendeur
- [ ] **Réinitialiser aux défauts** → permissions restaurées

**Mode hors-ligne**
- [ ] DevTools → Network → Offline → créer facture → barre rouge avec compteur
- [ ] Repasser en ligne → sync, barre disparaît

### Tests de sécurité

- [ ] Accéder à `/admin` avec compte `vendeur` → redirection automatique
- [ ] `POST /api/stock/adjust` sans auth → 401
- [ ] `PATCH /api/permissions` avec compte `admin` → 403
- [ ] Données d'une entité invisibles depuis l'autre entité

### Tests de performance

- [ ] Tableau stock 130 produits : chargement < 2 secondes
- [ ] Graphiques Recharts : chargement après le reste (dynamic import)
- [ ] Recherche produit autocomplete : < 200ms
- [ ] Export CSV 500 lignes : < 3 secondes

---

## Maintenance

### Sauvegardes

Supabase effectue des backups automatiques quotidiens (plans payants). Manuel : Super Admin → Paramètres → Sauvegarde → **Exporter**.

### Montée de version

```bash
npx @next/codemod@latest upgrade
npm install && npm run build
```

### Rotation des clés Twilio

1. Twilio Console → créer nouveau Auth Token secondaire
2. Mettre à jour `TWILIO_AUTH_TOKEN` dans Vercel → Redéployer
3. Invalider l'ancien token dans Twilio

### Monitoring

- **Supabase → Reports** : latences requêtes, volume storage, erreurs RLS
- **Vercel → Logs** : filtrer par `error` pour détecter les erreurs d'API routes

---

## Compte de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | admin@orchidee.com | Admin@2024! |

Les autres comptes sont à créer via Super Admin → Paramètres → Comptes, ou directement dans Supabase Auth.

---

*Orchidée Nature Management System*
