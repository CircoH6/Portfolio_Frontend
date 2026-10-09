import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock du service d'auth pour contrôler la session sans réseau.
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
import { router } from '@/router'

/**
 * On navigue réellement avec le routeur : cela exécute le vrai guard
 * (meta.requiresAuth / guestOnly) enrobant init() (vérification serveur).
 * Le guard redirige via router.push, ce qui met à jour currentRoute.
 */
async function goAndRedirect(name, params = {}) {
  // Pas de `router.isReady()` ici : hors installation `app.use(router)`,
  // cette promesse attend une navigation initiale que seul `push` déclenche
  // (interblocage). `push` suffit et met à jour `currentRoute`.
  await router.push({ name, params })
  return router.currentRoute.value
}

describe('protection des routes (guard réel du routeur)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authService.hasSession.mockReturnValue(false)
  })

  it('redirige une route privée sans session vers la connexion', async () => {
    const route = await goAndRedirect('admin-dashboard')
    expect(route.name).toBe('admin-login')
  })

  it('autorise une route privée quand la session est valide', async () => {
    authService.hasSession.mockReturnValue(true)
    authService.me.mockResolvedValue({ user: { id: 1, role: 'admin' } })
    const auth = useAuthStore()
    await auth.init()

    const route = await goAndRedirect('admin-dashboard')
    expect(route.name).toBe('admin-dashboard')
  })

  it('redirige un utilisateur connecté hors de la page de connexion', async () => {
    authService.hasSession.mockReturnValue(true)
    authService.me.mockResolvedValue({ user: { id: 1, role: 'admin' } })
    const auth = useAuthStore()
    await auth.init()

    const route = await goAndRedirect('admin-login')
    expect(route.name).toBe('admin-dashboard')
  })

  it('laisse passer une page publique sans session', async () => {
    const route = await goAndRedirect('home')
    expect(route.name).toBe('home')
  })
})
