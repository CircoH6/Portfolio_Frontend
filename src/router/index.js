import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Routes paresseuses (lazy loading).
 * meta.requiresAuth : protection côté client (la sécurité réelle reste
 *   côté backend : jeton + rôle admin).
 */
const routes = [
  /* ---------------- Public ---------------- */
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/public/HomeView.vue'),
        meta: { title: 'Accueil' },
      },
      {
        path: 'a-propos',
        name: 'about',
        component: () => import('@/views/public/AboutView.vue'),
        meta: { title: 'À propos' },
      },
      {
        path: 'competences',
        name: 'skills',
        component: () => import('@/views/public/SkillsView.vue'),
        meta: { title: 'Compétences' },
      },
      {
        path: 'projets',
        name: 'projects',
        component: () => import('@/views/public/ProjectsView.vue'),
        meta: { title: 'Projets' },
      },
      {
        path: 'projets/:slug',
        name: 'project-detail',
        component: () => import('@/views/public/ProjectDetailView.vue'),
        meta: { title: 'Projet' },
      },
      {
        path: 'parcours',
        name: 'journey',
        component: () => import('@/views/public/JourneyView.vue'),
        meta: { title: 'Parcours' },
      },
      {
        path: 'contact',
        name: 'contact',
        component: () => import('@/views/public/ContactView.vue'),
        meta: { title: 'Contact' },
      },
      {
        path: 'cv',
        name: 'cv-list',
        component: () => import('@/views/public/CvListView.vue'),
        meta: { title: 'CV' },
      },
      {
        path: 'cv/:slug',
        name: 'cv-detail',
        component: () => import('@/views/public/CvDetailView.vue'),
        meta: { title: 'CV' },
      },
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/errors/NotFoundView.vue'),
        meta: { title: 'Page introuvable' },
      },
    ],
  },

  /* ---------------- Auth ---------------- */
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/auth/AdminLoginView.vue'),
    meta: { title: 'Connexion', guestOnly: true },
  },

  /* ---------------- Admin ---------------- */
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: 'Tableau de bord', requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('@/views/admin/ProfileView.vue'),
        meta: { title: 'Profil', requiresAuth: true },
      },
      {
        path: 'contact-methods',
        name: 'admin-contact-methods',
        component: () => import('@/views/admin/ContactMethodsView.vue'),
        meta: { title: 'Moyens de contact', requiresAuth: true },
      },
      {
        path: 'skills',
        name: 'admin-skills',
        component: () => import('@/views/admin/SkillsView.vue'),
        meta: { title: 'Compétences', requiresAuth: true },
      },
      {
        path: 'projects',
        name: 'admin-projects',
        component: () => import('@/views/admin/ProjectsView.vue'),
        meta: { title: 'Projets', requiresAuth: true },
      },
      {
        path: 'experiences',
        name: 'admin-experiences',
        component: () => import('@/views/admin/ExperiencesView.vue'),
        meta: { title: 'Expériences', requiresAuth: true },
      },
      {
        path: 'educations',
        name: 'admin-educations',
        component: () => import('@/views/admin/EducationsView.vue'),
        meta: { title: 'Formations', requiresAuth: true },
      },
      {
        path: 'certifications',
        name: 'admin-certifications',
        component: () => import('@/views/admin/CertificationsView.vue'),
        meta: { title: 'Certifications', requiresAuth: true },
      },
      {
        path: 'languages',
        name: 'admin-languages',
        component: () => import('@/views/admin/LanguagesView.vue'),
        meta: { title: 'Langues', requiresAuth: true },
      },
      {
        path: 'cv',
        name: 'admin-cv-list',
        component: () => import('@/views/admin/CvListView.vue'),
        meta: { title: 'Constructeur de CV', requiresAuth: true },
      },
      {
        path: 'cv/:id',
        name: 'admin-cv-editor',
        component: () => import('@/views/admin/CvEditorView.vue'),
        meta: { title: 'Éditeur de CV', requiresAuth: true },
      },
      {
        path: 'messages',
        name: 'admin-messages',
        component: () => import('@/views/admin/MessagesView.vue'),
        meta: { title: 'Messages', requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/views/admin/SettingsView.vue'),
        meta: { title: 'Paramètres', requiresAuth: true },
      },
      {
        path: ':pathMatch(.*)*',
        name: 'admin-not-found',
        component: () => import('@/views/errors/NotFoundView.vue'),
        meta: { title: 'Page introuvable', requiresAuth: true },
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_NAME || 'Portfolio'
  document.title = to.meta.title ? `${to.meta.title} — ${base}` : base
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Attendre la vérification réelle de la session au premier passage.
  if (!auth.ready) await auth.init()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'admin-dashboard' }
  }

  return true
})

