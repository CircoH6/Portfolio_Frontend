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

- **Node.js ≥ 20** (vérifié ici avec Node 22.22.3 / npm 10.9.8)
- Le back-end Laravel démarré et accessible (voir `VITE_API_URL`). Sans
  back-end, le site démarre quand même : chaque section affiche son état
  d'erreur réseau ou son état vide, jamais de contenu inventé.

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
| `VITE_DEV_HOST`   | `0.0.0.0` (dev server)          | Interface d'écoute de Vite (dev)       |
| `VITE_DEV_ALLOWED_HOSTS` | `.e2b.app`               | Hôtes autorisés par le dev server      |

Les deux dernières variables ne concernent que le serveur de développement.

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
- **Flags de visibilité** — vérifié ressource par ressource dans le backend
  (`app/Http/Resources/*`). L'affirmation précédente (« aucun flag renvoyé »)
  était **fausse** ; voici l'état réel :

  | Resource | Flags réellement renvoyés |
  | -------- | ------------------------- |
  | `ProjectResource` | `is_visible` (**admin uniquement**, `null` en public), `is_featured` |
  | `ContactMethodResource` | `is_primary`, `display_order` — **pas** `is_public` |
  | `CvProfileResource` | `is_public`, `is_default` |
  | `SkillResource` / `SkillCategoryResource` | aucun flag de visibilité |
  | `ExperienceResource` / `EducationResource` | `is_current` seulement |
  | `CertificationResource` / `LanguageResource` | aucun |
  | `ContactMessageResource` | `status` (`new`/`read`/`replied`/`archived`), `read_at` |

  Conséquence : les vues Projet affichent l'état réel de `is_visible` ; les
  vues Compétences, Catégories, Expériences, Formations, Certifications,
  Langues et Moyens de contact conservent une mention indiquant que la valeur
  remplacera le réglage existant à l'enregistrement (pas de faux état actif).
  `ProjectResource` est la seule Resource à calculer `$isAdmin`.

- **Modèle de CV** : seul `default` existe côté backend ; le sélecteur le propose
  sans inventer d'autres modèles.
- **`/admin/settings`** : pas d'endpoint dédié → préférences locales (thème
  d'aperçu) et informations de compte réelles uniquement.
- **Statistiques du tableau de bord** : issues exclusivement des compteurs
  fournis par l'API (`pagination.total`, `unread_count`) ; aucun indicateur
  inventé, aucun bloc affiché si la donnée est absente.
- **Tests live** : non exécutés. Le backend a depuis été cloné et **lu**
  (voir § 9 bis), mais jamais **exécuté** ici : aucun PHP ni SGBD dans cet
  environnement. La conformité au contrat est donc établie par lecture du code
  (`routes/api.php`, Form Requests, Resources, `CvBuilderService`), pas par un
  échange HTTP réel. Les tests automatisés s'appuient sur un Axios simulé.

## 9. Résultats des tests exécutés

```
npm run build   → succès (dist/ généré, aucune erreur de compilation)
npm test        → 11 fichiers, 85 tests, tous verts
```

- `api-client.spec.js` — intercepteurs, enveloppe, 401/422/404, erreur réseau.
- `pdf-download.spec.js` — export PDF **dans la vraie chaîne d'intercepteurs
  Axios** (seul l'`adapter` transport est remplacé) : Blob et type MIME, nom de
  fichier `Content-Disposition` (forme simple et RFC 5987 avec accents), 404 /
  500 dont le corps JSON arrive en Blob, export refusé avec un statut 200, et
  déclenchement réel du téléchargement par `saveBlob`.
- `auth.store.spec.js` — login/logout/init, persistance du jeton, nettoyage.
- `router-guard.spec.js` — protection réelle des routes privées (redirection
  vers la connexion + retour à la page demandée).
- `home-view.spec.js` — **test de composant** : rendu du profil fourni par
  l'API, état d'erreur réseau (message affiché + bouton « Réessayer »
  fonctionnel), états vides, données dynamiques.
- `contact-form.spec.js` — **test de composant** : validation locale,
  `aria-invalid`, erreurs de validation 422 associées aux champs, confirmation
  d'envoi, erreurs réseau et 500 affichées sans faux succès.
- `cv-data.spec.js` — transformation Resource → « CV Data » (groupement,
  dates, options d'affichage, nom de fichier PDF).
- `validators`, `dates`, `contact-links` — règles de validation, formats de
  dates, protocoles `tel:`/`mailto:`/WhatsApp.

Serveur de dev vérifié : `npm run dev` répond **HTTP 200** sur `/`,
`/src/main.js`, `/src/styles/main.css` et sur une route profonde (`/projets`,
repli history). Build CSS vérifié : les tokens de la palette (`#050505`,
`#161616`, `#252525`, `#C6AD7A`, `#A88D59`, `#A1A1AA`, `#F5F5F5`) et les
utilitaires (`bg-ink`, `text-gold`, `border-line`, `container-page`, `.panel`),
ainsi que `prefers-reduced-motion` et `focus-visible`, sont bien émis.

### Corrections apportées lors de la revue

- **Export PDF — nom de fichier perdu.** L'intercepteur de réponse réduisait
  toute réponse à `response.data`, donc `api.download()` ne pouvait plus lire
  les en-têtes : `Content-Disposition` était ignoré et chaque PDF partait sous
  le nom de repli `fichier.pdf` (le nom construit côté client masquait le
  problème). Un drapeau `rawResponse` conserve désormais la réponse complète
  pour les téléchargements binaires. Vérifié par `pdf-download.spec.js`, qui
  **échoue (3 tests) contre l'ancien code**.
- **Export PDF — messages d'erreur perdus.** Avec `responseType: 'blob'`, un
  corps d'erreur JSON arrivait sous forme de `Blob` et produisait un message
  générique (« Erreur serveur (500). »). L'intercepteur décode maintenant ces
  corps pour restituer le message réel du backend.
- **Texte corrompu dans trois vues admin** (`MessagesView`, `CvListView`,
  `ProjectsView`) : double encodage UTF‑8 (`Ã©`, `Â«`), caractères de
  remplacement `U+FFFD` et `ï¿½`. À l'écran cela donnait
  `Chargement??` au lieu de `Chargement…`, `?chec de la suppression` au lieu
  d'`Échec de la suppression`, `Supprimer Â« x Â»` au lieu de
  `Supprimer « x »`, et `—` dégradé en `?"`. Les 14 occurrences sont réparées
  et un BOM UTF‑8 préexistant a été retiré de deux fichiers.
  Verrouillé par `encoding.spec.js` (garde‑fou qui **échoue — 4 tests —
  contre les fichiers corrompus**).
- Suppression de `src/_enc_test.txt`, fichier de brouillon (test d'encodage)
  référencé nulle part — il testait précisément les caractères ci-dessus.
- `vite.config.js` : `host` et `allowedHosts` configurables
  (`VITE_DEV_HOST`, `VITE_DEV_ALLOWED_HOSTS`) pour servir en conteneur.

## 9 bis. Contrat vérifié contre le backend réel

Le backend (`CircoH6/Portfolio_Backend`, Laravel) a été cloné et lu. Points
vérifiés ligne à ligne, et non plus déduits :

- **Authentification** : `config/sanctum.php` + `config/cors.php` →
  `supports_credentials: false`, jetons Bearer (`createToken('api')`),
  `POST /auth/login` → `{ token, user }`. Le stockage du jeton en
  `localStorage` est donc le bon mécanisme. Aucun flux CSRF/cookie requis.
- **`exposed_headers: ['Content-Disposition']`** — le nom de fichier du PDF est
  bien lisible en cross-origin : la correction `rawResponse` est exploitable.
- **Enveloppe** `{ success, message, data | errors }` conforme
  (`ApiResponse` trait).
- **Règles de validation identiques au front** : contact (`name`/`email`/
  `subject` ≤ 255, `message` 10–5000), profil (`short_bio` ≤ 500,
  `long_bio` ≤ 20000, `website` URL), CV (`name` ≤ 150, `slug` ≤ 180).
- **Upload photo** : champ `photo`, `mimes:jpg,jpeg,png,webp`, `max:4096` —
  exactement la validation locale de `PhotoUploader`.
- **Pagination** : `{ projects, pagination: { current_page, per_page, total,
  last_page } }`, idem pour les messages (`+ unread_count`).
- **Constructeur de CV** : `syncSelections()` utilise la **position dans le
  tableau** `*_ids[]` comme `display_order` → l'ordre envoyé par le front est
  bien celui affiché. `GET /admin/cv/{id}` charge toutes les relations
  (`profile.contactMethods`, `projects.technologies`, `skills.skillCategory`,
  `experiences`, `educations`, `certifications`), donc l'aperçu admin dispose
  de tout.
- **`CvBuilderService`** : la transformation `utils/cv-data.js` reproduit
  fidèlement la sortie (`skills` groupées par catégorie, dates `m/Y` pour
  expériences/certifications et `Y` pour formations, filtrage `show_*`).
- **Nom du PDF** : `CV-<slug>.pdf` (slug nettoyé `[a-z0-9-]`) — identique à
  `cvPdfFilename()`.
- **Modèle de CV** : la migration n'offre que `default` ; le front ne propose
  rien d'autre.
- **Messages** : `show()` fait passer `new` → `read` côté serveur ;
  `MessagesView` recharge la liste après consultation, le compteur non-lus
  reste donc juste.

**Reste non vérifié** : aucun test d'intégration *live* (le backend n'a pas été
exécuté ici — pas de SGBD ni de PHP dans cet environnement). La conformité est
établie par lecture du code, pas par échange HTTP réel.


## 10. Prochaines étapes recommandées

1. **Test d'intégration live** : démarrer le backend avec un SGBD
   (`php artisan migrate --seed`) puis valider les parcours réels — login,
   CRUD, upload photo, export PDF. C'est le seul point encore jamais exécuté.
2. Ajouter des tests d'intégration front (Axios mocké sur les parcours CRUD
   complets).
3. Prérendu/SSR (Nuxt ou `vite-ssg`) si le référencement devient prioritaire,
   car le rendu 100 % client limite l'indexation.
4. Côté backend, exposer `is_visible`/`is_public` dans `SkillResource`,
   `ExperienceResource`, `EducationResource`, `CertificationResource`,
   `LanguageResource` et `is_public` dans `ContactMethodResource` — comme le
   fait déjà `ProjectResource` — pour supprimer les mentions d'incertitude
   restantes dans les formulaires.
5. Internationaliser (i18n) les libellés pour exploiter pleinement la notion de
   langue de CV déjà présente dans le modèle.
