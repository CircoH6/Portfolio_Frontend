# Portfolio — Front-end (Vue 3 + Vite + Tailwind)

Front-end professionnel pour un portfolio de développeur web/mobile. Interface
publique élégante (direction « Luxury Tech ») + tableau de bord privé pour gérer
le profil, les contenus, les messages et **construire plusieurs CV** à partir
d'une source de données unique, connecté à l'API REST Laravel (`/api/v1`).

> Le back-end est un projet Laravel indépendant (Sanctum + DomPDF). Ce dépôt ne
> contient que le front-end. Le PDF des CV est généré par le serveur ; le front
> n'embarque aucun moteur PDF.

---

## 1. Prérequis

- **Node.js ≥ 20** (testé avec Node 24 / npm 10+)
- Le back-end Laravel démarré et accessible (voir `VITE_API_URL`).

## 2. Installation

```bash
npm install
cp .env.example .env      # puis adapter VITE_API_URL si besoin
npm run dev               # serveur de développement (Vite) — http://localhost:5173
npm run build             # build de production → dist/
npm run preview           # prévisualise le build de production
npx vitest run            # tests unitaires
```

### Variables d'environnement (`.env`)

| Variable          | Défault                         | Rôle                                   |
| ----------------- | ------------------------------- | -------------------------------------- |
| `VITE_API_URL`    | `http://localhost:8000/api/v1` | URL de base de l'API REST Laravel      |
| `VITE_APP_NAME`   | `Portfolio`                     | Nom utilisé dans les titres de page    |

Aucune clé secrète n'est présente côté client.

## 3. Authentification

Le back-end utilise **Laravel Sanctum en jetons Bearer** (Personal Access
Tokens, `supports_credentials: false` — pas de cookies de session). Au login,
le jeton est stocké dans `localStorage` (`portfolio.token`) et envoyé via
l'en-tête `Authorization: Bearer`. Le mot de passe n'est jamais conservé.

- `POST /auth/login` → `{ token, user }`
- `GET  /auth/me`, `POST /auth/logout`
- Sur `401`, le client nettoie la session et redirige vers la connexion.

## 4. Direction artistique (Luxury Tech)

Palette définie en tokens Tailwind (`src/styles/main.css`) :

- Fonds : `#050505` (principal), `#0D0D0D` / `#111111` (secondaires), cartes `#161616`
- Bordures `#252525`, texte `#F5F5F5` / secondaire `#A1A1AA`
- Doré champagne `#C6AD7A`, doré discret `#A88D59`
- Le noir domine, le doré souligne les actions principales et éléments actifs.

Classes utilitaires : `bg-ink`, `bg-ink-2`, `bg-ink-3`, `text-paper`,
`text-muted`, `text-gold`, `text-gold-deep`, `border-line`, `border-line-2`,
`bg-gold`, `text-danger`, `text-success`, `text-warning`, `.panel`,
`.container-page`, `.font-serif`.

## 5. Architecture

```
src/
├── assets/
├── components/
│   ├── common/        # AppButton, AppInput, AppTextarea, AppSelect, AppCard,
│   │                  # AppBadge, AppModal, AppPagination, AppAvatar,
│   │                  # ToggleSwitch, LoadingState, EmptyState, ErrorState,
│   │                  # ToastHost, ConfirmDialog, icônes custom…
│   ├── portfolio/     # SiteHeader, SiteFooter, SectionHeading, ProjectCard,
│   │                  # TimelineList, ContactMethods…
│   ├── cv/            # CvSheet (feuille A4 partagée public + aperçu admin)
│   └── admin/         # CrudPageView, CrudTable, CrudFormModal, PhotoUploader,
│                      # ProjectImagesModal, CvOrderList
├── layouts/           # PublicLayout, AdminLayout
├── views/
│   ├── public/        # Home, About, Skills, Projects, ProjectDetail, Journey,
│   │                  # Contact, CvList, CvDetail
│   ├── auth/          # AdminLogin
│   ├── admin/         # Dashboard, Profile, ContactMethods, Skills, Projects,
│   │                  # Experiences, Educations, Certifications, Languages,
│   │                  # CvList, CvEditor, Messages, Settings
│   └── errors/        # NotFound
├── router/            # routes publiques + admin (guard d'authentification)
├── stores/            # auth, profile (cache), toast, confirm (Pinia)
├── services/          # api.js (Axios centralisé) + un service par domaine
├── composables/       # useAsync, useCrud, usePageMeta
├── utils/             # dates, validators, contact-links, cv-data, project-status
├── styles/            # tokens Tailwind + styles globaux
├── App.vue
└── main.js
```

## 6. Services API et endpoints réels

Tous les appels passent par le client Axios centralisé (`src/services/api.js`) :
en-tête `Authorization: Bearer` automatique, timeout, gestion centralisée des
erreurs (`ApiError` avec `isValidation`/`isUnauthorized`/`isNotFound`), 401 →
nettoyage de session, support `FormData` (upload) et téléchargement binaire PDF
(nom de fichier lu dans `Content-Disposition`). Les services retournent la
charge `data` de l'enveloppe `{ success, message, data }`.

| Service | Endpoints consommés |
| ------- | ------------------- |
| `auth.service` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| `profile.service` | `GET /profile`, `GET /admin/profile`, `PUT /admin/profile`, `POST /admin/profile/photo`, `DELETE /admin/profile/photo` |
| `contact.service` | `POST /contact` (public) · CRUD `/admin/contact-methods` |
| `skills.service` | `GET /skills` · CRUD `/admin/skill-categories`, `/admin/skills` |
| `technologies.service` | `GET /admin/technologies` (liste) · CRUD |
| `projects.service` | `GET /projects` (paginé), `GET /projects/{slug}` · CRUD `/admin/projects` · `POST /admin/projects/{id}/images`, `PUT /admin/project-images/{id}`, `DELETE /admin/project-images/{id}` |
| `experiences/educations/certifications/languages` | `GET /…` (public) · CRUD `/admin/…` |
| `cv.service` | `GET /cv`, `GET /cv/{slug}`, `GET /cv/{slug}/pdf` · CRUD `/admin/cv` · `GET /admin/cv/{id}/pdf` |
| `messages.service` | `GET /admin/messages` (+ `unread_count`), `GET/PUT/DELETE /admin/messages/{id}` |

## 7. Fonctionnalités terminées

- **Public** : accueil dynamique, à propos, compétences groupées par catégorie,
  projets (grille + filtre technologie + pagination), détail de projet, parcours
  (chronologie), contact (formulaire validé + moyens `tel:`/`mailto:`/WhatsApp),
  liste et détail de CV (feuille A4), page 404.
- **Administration** : connexion (Sanctum Bearer), protection réelle des routes
  (guard + `GET /auth/me`), tableau de bord (compteurs réels), profil (+ upload
  photo avec prévisualisation), moyens de contact, compétences (catégories +
  compétences), projets (CRUD + technologies + images + statuts + pagination),
  expériences, formations, certifications, langues, messages (lecture/statut),
  paramètres (préférences locales + compte — pas d'endpoint dédié backend).
- **Constructeur de CV** : liste, éditeur deux volets (config / aperçu A4),
  sélection et **réordonnancement** des rubriques (`*_ids[]` persistés côté
  backend), options d'affichage (`show_*`), statut public/par défaut, export PDF
  via l'endpoint backend (blob + nom de fichier).
- **Transverse** : états chargement/vide/erreur/404, notifications, confirmations
  pour actions sensibles, responsive, accessibilité (labels, focus, `aria`,
  `prefers-reduced-motion`).

## 8. Écarts et fonctionnalités limitées par le backend

- **Aucun endpoint de prévisualisation HTML du CV** : l'aperçu admin est
  reconstruit côté front (`utils/cv-data.js` reproduit `CvBuilderService` :
  groupement des compétences par catégorie, formats de dates `m/Y`/`Y`, filtrage
  des contacts selon `show_*`). Le **PDF backend (DomPDF) reste la référence**.
- **Flags de visibilité** : `is_visible`/`is_public`/`is_primary` sont acceptés
  en écriture par le backend mais **non renvoyés par les Resources admin** ;
  les interrupteurs affichent une mention indiquant que la valeur remplacera le
  réglage existant à l'enregistrement (pas de faux état actif).
- **Modèle de CV** : seul `default` existe côté backend ; le sélecteur le propose
  sans inventer d'autres modèles.
- **`/admin/settings`** : pas d'endpoint dédié → préférences locales (thème
  d'aperçu) et informations de compte réelles uniquement.
- **Statistiques du tableau de bord** : issues exclusivement des compteurs
  fournis par l'API (`pagination.total`, `unread_count`) ; aucun indicateur
  inventé, aucun bloc affiché si la donnée est absente.
- **Tests live** : non exécutés — le backend n'était pas joignable sur cette
  machine (service MySQL absent et driver `pdo_sqlite` indisponible dans le PHP
  installé). La validation réseau s'appuie sur les tests unitaires ci-dessous
  (client Axios simulé) et sur la conformité au contrat vérifié dans le code
  backend.

## 9. Résultats des tests exécutés

```
npm run build   → succès (dist/ généré, aucune erreur de compilation)
npm test        → 7 fichiers, 54 tests, tous verts
```

- `api-client.spec.js` — intercepteurs, enveloppe, 401/422/404, téléchargement PDF.
- `auth.store.spec.js` — login/logout/init, persistance du jeton, nettoyage.
- `router-guard.spec.js` — protection réelle des routes privées (redirection
  vers la connexion + retour à la page demandée).
- `cv-data.spec.js` — transformation Resource → « CV Data » (groupement,
  dates, options d'affichage, nom de fichier PDF).
- `validators`, `dates`, `contact-links` — règles de validation, formats de
  dates, protocoles `tel:`/`mailto:`/WhatsApp.

Serveur de dev vérifié : `npm run dev` répond **HTTP 200** avec `#app` et
`/src/main.js` servis.

## 10. Prochaines étapes recommandées

1. Démarrer un SGBD (MySQL ou ajouter le driver SQLite au PHP) puis exécuter
   `php artisan migrate --seed` pour un **test d'intégration live** bout-en-bout.
2. Ajouter des tests d'intégration front (Axios mocké sur les parcours CRUD
   complets) une fois l'API joignable.
3. Prérendu/SSR (Nuxt ou `vite-ssg`) si le référencement devient prioritaire,
   car le rendu 100 % client limite l'indexation.
4. Exposer côté backend les champs de visibilité dans les Resources admin pour
   supprimer les mentions d'incertitude dans les formulaires.
5. Internationaliser (i18n) les libellés pour exploiter pleinement la notion de
   langue de CV déjà présente dans le modèle.
