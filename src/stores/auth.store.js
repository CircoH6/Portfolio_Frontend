import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'

/**
 * Session admin — Sanctum token.
 * - init() : restaure la session via GET /auth/me (vérification réelle).
 * - Aucun mot de passe n'est conservé après l'appel de login.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false, // init() terminé
    checking: false,
    loginLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async init() {
      if (!authService.hasSession()) {
        this.user = null
        this.ready = true
        return
      }
      this.checking = true
      try {
        const data = await authService.me()
        this.user = data?.user ?? null
      } catch {
        // 401 : jeton purgé par l'intercepteur + événement global.
        this.user = null
      } finally {
        this.checking = false
        this.ready = true
      }
    },

    async login(email, password) {
      this.loginLoading = true
      try {
        const data = await authService.login(email, password)
        this.user = data?.user ?? null
        return this.user
      } finally {
        this.loginLoading = false
      }
    },

    async logout() {
      try {
        await authService.logout()
      } catch {
        // Déconnexion locale quoi qu'il arrive : on ne bloque pas l'UI
        // (le jeton est déjà purgé par le service, même hors ligne).
      } finally {
        this.user = null
      }
    },

    /** Appelé par main.js sur l'événement global `api:unauthorized`. */
    handleUnauthorized() {
      this.user = null
    },
  },
})
