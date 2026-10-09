import { api, setToken, getToken } from './api.js'

/**
 * POST /auth/login { email, password } → data { token, user }
 * POST /auth/logout (Bearer)           → 200
 * GET  /auth/me (Bearer)               → data.user
 */
export const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    if (data?.token) setToken(data.token)
    return data
  },

  async logout() {
    if (!getToken()) return
    try {
      await api.post('/auth/logout')
    } finally {
      // Nettoyage local toujours effectué, même si l'appel échoue.
      setToken(null)
    }
  },

  me() {
    return api.get('/auth/me')
  },

  hasSession: () => Boolean(getToken()),
}
