import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock du service d'authentification (aucun appel réseau réel).
vi.mock('@/services/auth.service', () => ({
  authService: {
    hasSession: vi.fn(() => false),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authService.hasSession.mockReturnValue(false)
  })

  it('init() sans session : non authentifié et prêt', async () => {
    const auth = useAuthStore()
    await auth.init()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.ready).toBe(true)
    expect(authService.me).not.toHaveBeenCalled()
  })

  it('init() restaure la session via /auth/me quand un jeton existe', async () => {
    authService.hasSession.mockReturnValue(true)
    authService.me.mockResolvedValue({ user: { id: 1, name: 'Ada', role: 'admin' } })

    const auth = useAuthStore()
    await auth.init()

    expect(authService.me).toHaveBeenCalledOnce()
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isAdmin).toBe(true)
    expect(auth.ready).toBe(true)
  })

  it('init() efface la session si /auth/me échoue (jeton invalide)', async () => {
    authService.hasSession.mockReturnValue(true)
    authService.me.mockRejectedValue(new Error('401'))

    const auth = useAuthStore()
    await auth.init()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.ready).toBe(true)
  })

  it('login() mémorise le user et ne conserve jamais le mot de passe', async () => {
    authService.login.mockResolvedValue({ user: { id: 2, name: 'Bob', role: 'admin' } })

    const auth = useAuthStore()
    const user = await auth.login('bob@example.com', 'SuperSecret123')

    expect(authService.login).toHaveBeenCalledWith('bob@example.com', 'SuperSecret123')
    expect(user).toEqual({ id: 2, name: 'Bob', role: 'admin' })
    expect(auth.isAuthenticated).toBe(true)
    // Le store ne conserve aucun mot de passe dans son état.
    expect(JSON.stringify(auth.$state)).not.toContain('SuperSecret123')
  })

  it('logout() réinitialise le user même si l’appel API échoue', async () => {
    authService.hasSession.mockReturnValue(true)
    authService.me.mockResolvedValue({ user: { id: 1, role: 'admin' } })
    const auth = useAuthStore()
    await auth.init()

    authService.logout.mockRejectedValue(new Error('réseau'))
    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
  })
})
