import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth.store'
import { useToastStore } from './stores/toast.store'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)
const toast = useToastStore(pinia)

// Session expirée / jeton invalide : nettoyage + retour à la connexion.
window.addEventListener('api:unauthorized', () => {
  auth.handleUnauthorized()
  if (router.currentRoute.value.meta.requiresAuth) {
    router.push({ name: 'admin-login' })
  }
})

// 403 : authentifié mais rôle insuffisant — message, pas de faux contenu.
window.addEventListener('api:forbidden', (event) => {
  toast.error(event.detail?.message || 'Accès refusé.')
})

// Restauration de session au démarrage (vérification réelle via /auth/me).
auth.init().finally(() => {
  router.isReady().then(() => app.mount('#app'))
})
