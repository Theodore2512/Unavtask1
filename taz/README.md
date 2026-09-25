# TAZ — billetterie des associations étudiantes (V1)

Shotgun équitable, billetterie et organisation d'événements pour les BDE, associations et listes de campagne.

**Stack :** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui · Lucide · Supabase (Postgres + RLS, Auth, Storage, Realtime) · Stripe Checkout / Connect (ou paiement simulé).

---

## Fonctionnalités

| Domaine | Ce qui est livré |
| --- | --- |
| **Auth étudiants** | Inscription (prénom, nom, email, mot de passe), choix **ville → école/campus** filtré, vérification du **domaine email de l'école** (côté serveur *et* en SQL), confirmation email Supabase. |
| **Rôles** | `student` → `organizer` (automatique à la création d'une asso) → `admin`. Les membres d'asso ont un rôle `owner` / `admin` / `staff`. |
| **Espace asso** | Profil (logo via Supabase Storage, description, Instagram/TikTok/LinkedIn/site), compte Stripe Connect. |
| **Événements** | Titre, description, visuel, lieu, dates, quota total, brouillon/publication/annulation. |
| **Billetterie** | Tarif standard, **tarif adhérent protégé par code**, **événement gratuit**. Aperçu de la commission 3 %. |
| **Accès** | « Mon école uniquement » ou **inter-écoles avec quotas par école**. |
| **Shotgun** | Compte à rebours, verrouillage avant l'heure H (vérifié en base), **panier bloqué 5 min**, anti-survente transactionnel. |
| **Paiement** | `PAYMENT_PROVIDER=mock` (simulé) ou `stripe` (Checkout + Connect, `application_fee_amount` = 3 %, webhook, remboursement auto si paiement tardif sur un événement complet). |
| **Billet** | QR code unique (jeton 64 caractères hex), page « Mes billets ». |
| **Dashboard orga** | Participants **en temps réel** (Supabase Realtime), statut payé/gratuit/annulé, recettes, annulation d'un billet, **export CSV d'émargement** (Excel FR). |
| **Admin** | Statistiques, validation des associations. |

---

## Comment l'anti-crash / anti-survente fonctionne

Tout passe par la fonction SQL `reserve_ticket()` (SECURITY DEFINER) :

1. `SELECT … FOR UPDATE` sur la ligne de l'événement → les réservations d'un même événement sont **sérialisées** dans Postgres.
2. Refus si le shotgun n'est pas ouvert (`now() < shotgun_opens_at`) : le compte à rebours du front n'est qu'un affichage.
3. Les paniers expirés sont libérés, puis on vérifie : capacité totale, quota du tarif, quota de l'école, accès école, code adhérent.
4. Billet gratuit → billet émis immédiatement. Billet payant → commande `pending` avec `hold_expires_at = now() + 5 min`.
5. Un index unique partiel garantit **un seul billet actif par étudiant et par événement** (recharger la page renvoie la même commande).

Testé : 150 réservations simultanées sur 20 places → exactement 20 commandes.

Les écritures sur `orders` / `tickets` sont **impossibles en direct** (aucune policy INSERT/UPDATE). `confirm_order_payment()` n'est exécutable que par `service_role` (webhook Stripe ou serveur en mode mock).

---

## Arborescence

```
taz/
├── supabase/
│   ├── migrations/20260925000000_init.sql   # tables, fonctions, RLS, storage, realtime
│   └── seed.sql                              # villes + écoles/campus + domaines email
├── src/
│   ├── proxy.ts                              # (ex-middleware) refresh session + routes protégées
│   ├── app/
│   │   ├── page.tsx                          # accueil + événements à venir (filtre ville)
│   │   ├── (auth)/login | signup             # connexion / inscription ville → école
│   │   ├── auth/callback | signout           # confirmation email, déconnexion
│   │   ├── events/[slug]/                    # page publique, compte à rebours, shotgun
│   │   ├── checkout/[orderId]/               # panier 5 min + paiement ; /success
│   │   ├── tickets/ & tickets/[id]/          # mes billets, billet QR
│   │   ├── associations/[slug]/              # page publique de l'asso
│   │   ├── dashboard/                        # espace organisateur
│   │   │   ├── associations/new | [id]       # création / profil asso
│   │   │   ├── associations/[id]/events/new  # création d'événement + billetterie + quotas
│   │   │   └── events/[id]/                  # participants temps réel, statut, annulation
│   │   ├── admin/                            # validation des assos
│   │   └── api/
│   │       ├── events/[id]/export/           # CSV d'émargement
│   │       └── stripe/webhook/               # confirmation paiement Stripe
│   ├── components/                           # composants métier + ui/ (shadcn)
│   ├── hooks/use-form-action.ts              # server actions sans reset du formulaire
│   ├── lib/                                  # supabase/, auth, payments, storage, format…
│   └── types/database.ts                     # types générés depuis le schéma
└── .env.example
```

---

## Installation

### 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → exécute `supabase/migrations/20260925000000_init.sql`, puis `supabase/seed.sql`.
   *(ou avec la CLI : `npx supabase link --project-ref <ref>` puis `npx supabase db push` et exécuter le seed)*
3. **Authentication → Providers → Email** : active **« Confirm email »** (c'est ce qui prouve que l'étudiant possède l'adresse de son école).
4. **Authentication → URL Configuration** :
   - Site URL : `https://ton-domaine.vercel.app`
   - Redirect URLs : `https://ton-domaine.vercel.app/auth/callback` (et `http://localhost:3000/auth/callback` en local)
5. Vérifie/complète les **domaines email** des écoles dans `schools.email_domains` (ceux du seed sont à valider).
6. Pour te donner le rôle admin après ton inscription :
   ```sql
   update public.profiles set role = 'admin' where email = 'toi@ecole.fr';
   ```

### 2. Local

```bash
cd taz
cp .env.example .env.local   # puis renseigne les clés Supabase
npm install
npm run dev                  # http://localhost:3000
```

Scripts utiles : `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:types` (regénère `src/types/database.ts` après `supabase link`).

### 3. Déploiement Vercel

1. Importe le dépôt GitHub dans Vercel.
2. **Root Directory : `taz`** (le reste du dépôt contient une autre application).
3. Ajoute les variables de `.env.example` (avec `NEXT_PUBLIC_SITE_URL` = l'URL Vercel).
4. Déploie.

### 4. Passer au vrai paiement Stripe

1. `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY=sk_…`.
2. Webhook Stripe → `https://ton-domaine/api/stripe/webhook`, événements `checkout.session.completed` et `checkout.session.expired` → copie le secret dans `STRIPE_WEBHOOK_SECRET`.
3. Chaque asso doit avoir un compte **Stripe Connect** (`acct_…`) renseigné dans son profil. L'onboarding Connect automatisé (Account Links) est la prochaine étape.

Modèle économique : l'étudiant paie le prix affiché ; TAZ prélève **3 %** (`application_fee_amount`), le reste est viré à l'asso. Le taux est défini dans `src/lib/pricing.ts` **et** dans `reserve_ticket()` en SQL : garde-les alignés.

---

## Sécurité (résumé)

- RLS activée sur **toutes** les tables ; helpers `is_admin()`, `is_association_member()`, `is_event_organizer()` en SECURITY DEFINER (pas de récursion RLS).
- Un utilisateur ne peut pas modifier son rôle, son statut vérifié, son école ni son email (trigger).
- Le code adhérent vit dans `event_secrets`, illisible par les étudiants.
- La liste des participants n'est accessible que via `get_event_attendees()` (organisateurs de l'événement uniquement).
- Storage : upload autorisé seulement dans le dossier `<association_id>/` des membres de l'asso.
- Export CSV protégé contre l'injection de formules Excel.

## Prochaines étapes suggérées

- Onboarding Stripe Connect (Account Links) depuis le dashboard asso.
- Page de scan QR pour l'entrée (la fonction SQL `check_in_ticket()` est déjà prête).
- Édition d'un événement publié, gestion des membres staff d'une asso.
- File d'attente virtuelle en amont (ex. Vercel Edge + Upstash) pour les très gros shotguns.
- Emails transactionnels (billet envoyé par mail).
