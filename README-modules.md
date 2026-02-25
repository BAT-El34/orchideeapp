# Orchidée NMS — Modules Métier (Phase 2)

## Modules livrés

### Module 1 — Produits & Stocks
- **Catalogue** (`/admin/produits`, `/manager/produits`) : liste + grille switchable, recherche instantanée, badges stock (vert/orange/rouge), filtres catégorie/statut
- **Gestion stocks** (`/admin/stock`) : tableau dense par produit, ajustement IN/OUT/ADJUSTMENT avec motif, historique des mouvements, configuration des seuils d'alerte
- **Seuils d'alerte** : dialog ThresholdDialog — stock min, quantité à recommander, commande auto, validation manuelle
- **API** : `POST /api/stock/adjust`, `GET|POST /api/stock/thresholds`

### Module 2 — Fiche de facturation
- **Formulaire 2 étapes** (`/vendeur/factures/nouvelle`) : step 1 = sélection produit avec autocomplete, step 2 = récapitulatif
- Prix non modifiables par vendeur/caissier (manager+ uniquement)
- Calcul rendu monnaie en temps réel, affiché en grand
- **Offline** : si hors ligne → `addToQueue` IndexedDB → sync auto à reconnexion
- Stock décrémenté immédiatement à validation via `POST /api/invoices`
- **API** : `POST /api/invoices` (crée facture + lignes + mouvement stock + déclenchement commande auto si seuil atteint)

### Module 3 — Interface Caissier
- **Session obligatoire** avant toute opération, fond de caisse initial requis
- **4 onglets** : Vente | Mouvements | Calculatrice | Résumé
- Onglet Vente : recherche produit, rendu monnaie affiché en gros (vert/rouge), bouton Valider
- Onglet Calculatrice : +/−/×/÷/%, mémoire M+/M−/MR/MC, historique 20 calculs
- Onglet Résumé : fond initial, ventes, dépenses, solde calculé
- **Fermeture** : montant compté vs calculé, alerte rouge (>500 FCFA), alerte orange (>100 FCFA), notification auto admin
- **Anti-fraude** : timestamp serveur, pas de suppression, audit log systématique
- **API** : `POST /api/cash-sessions`, `POST /api/cash-sessions/[id]/close`, `POST /api/cash-movements`

### Module 4 — Commandes
- **Formulaire manuel** : recherche produit, quantités, date livraison (min J+2 ouvrés), commentaire
- **Commandes automatiques** : déclenchées par `POST /api/invoices` quand stock ≤ seuil — statut `pending_validation` ou `sent` selon config
- **Workflow** : pending_validation → sent → in_preparation → shipped → delivered | cancelled
- **Tableau** : filtres par statut, badges couleur, détails expandables par ligne, avancement et annulation selon rôle
- **Notification** admin à chaque création de commande
- **API** : `POST|GET /api/orders`, `PATCH /api/orders/[id]`

### Module 5 — Notifications
- **Centre in-app** : cloche dans header avec badge count, panneau dropdownt temps réel (Supabase Realtime)
- **Page dédiée** : `/admin/notifications` — tableau avec type, message, canal, statut, date
- **WhatsApp via Twilio** : `POST /api/whatsapp` — templates par type (ORDER/ALERT/CASH/VALIDATION/REPORT)
- **Paramètres** : `/admin/parametres` — test WhatsApp, config alertes
- Toutes notifications tracées en BDD (`notifications` table)

### Module 6 — Mode Hors-ligne
- **Indicateur persistant** : barre top (rouge = hors ligne, amber = opérations en attente)
- **IndexedDB** (Dexie.js) : produits, stock, factures, sessions caisse
- **Sync automatique** : event `online` → vider queue → Supabase, ordre chronologique
- **Cache refresh** : `useCacheRefresh` — rafraîchit produits + stock toutes les 15 min si en ligne
- **Offline queue** : Zustand `useSyncStore` persiste dans localStorage

## Architecture des composants

```
src/components/modules/
├── cash/
│   └── cash-interface.tsx      # Interface caissier complète (4 tabs + calculatrice)
├── invoices/
│   ├── invoice-form.tsx        # Formulaire 2 étapes avec offline support
│   └── invoices-list.tsx       # Tableau avec filtres statut
├── orders/
│   ├── new-order-form.tsx      # Modal création commande manuelle
│   └── orders-table.tsx        # Tableau avec workflow et expand
└── products/
    ├── product-catalog.tsx     # Vue liste + grille avec filtres
    ├── stock-table.tsx         # Tableau stock + actions
    ├── stock-adjustment-dialog.tsx
    ├── stock-history-dialog.tsx
    └── threshold-dialog.tsx    # Config seuils d'alerte + commande auto

src/components/shared/
├── store-initializer.tsx       # Hydrate Zustand depuis server data
├── online-status.tsx           # Barre indicateur connexion/sync
├── notification-center.tsx     # Cloche + dropdown + Realtime
└── sidebar.tsx                 # Nav avec couleur entité dynamique

src/hooks/
├── use-offline-sync.ts         # Connectivity watcher + sync
├── use-cache-refresh.ts        # Refresh produits/stock toutes 15min
└── use-toast.ts                # Toast system (Zustand)
```

## API Routes

| Route | Méthodes | Usage |
|-------|----------|-------|
| `/api/invoices` | POST | Créer facture + lignes + mouvements stock + commande auto |
| `/api/invoices/list` | GET, PATCH | Lister/modifier factures |
| `/api/stock/adjust` | POST | Ajustement de stock avec audit |
| `/api/stock/thresholds` | GET, POST | Seuils d'alerte par produit/entité |
| `/api/cash-sessions` | POST | Ouvrir session caisse |
| `/api/cash-sessions/[id]/close` | POST | Fermer + alerte si écart |
| `/api/cash-movements` | POST | Enregistrer mouvement |
| `/api/orders` | GET, POST | Commandes manuelles |
| `/api/orders/[id]` | PATCH | Avancement statut |
| `/api/notifications` | GET, PATCH | Notifications + marquer lu |
| `/api/whatsapp` | GET, POST | Envoi WhatsApp via Twilio |
| `/api/reports` | GET, POST | Rapports quotidiens |
| `/api/users` | GET, POST, PATCH | Gestion utilisateurs |

## Variables d'environnement supplémentaires

```
SUPABASE_SERVICE_ROLE_KEY=...   # Pour création utilisateurs côté admin
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Design System respecté
- Border-radius : 4px max (`rounded-sm`) — aucun `rounded-xl`
- Icônes : Lucide React uniquement, 0 emoji
- Prix : format FCFA avec séparateur milliers via `formatFCFA()`
- Couleur active sidebar : dynamique selon `entity.theme_color`
- Toasts : coin bas-droite, 3s max, border-left colorée
