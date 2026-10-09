import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// On mocke axios pour capturer la configuration passée à create()
// et simuler les réponses/intercepteurs sans réseau réel.
const requestUse = vi.fn()
const responseUse = vi.fn()
const fakeInstance = {
  interceptors: { request: { use: requestUse }, response: { use: responseUse } },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => fakeInstance),
  },
}))

beforeEach(() => {
  vi.resetModules()
  requestUse.mockReset()
  responseUse.mockReset()
})

async function importApi() {
  const mod = await import('@/services/api.js')
  return mod
}

describe('client API centralisé', () => {
  it('utilise la base URL de l’environnement', async () => {
    await importApi()
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.stringContaining('/api/v1'),
        timeout: 20000,
      }),
    )
  })

  it('enregistre un intercepteur de requête et de réponse', async () => {
    await importApi()
    expect(requestUse).toHaveBeenCalled()
    expect(responseUse).toHaveBeenCalled()
  })

  it('injecte l’en-tête Authorization Bearer quand un jeton est présent', async () => {
    window.localStorage.setItem('portfolio.token', 'token-abc')
    await importApi()

    const requestInterceptor = requestUse.mock.calls.at(-1)[0]
    const config = { headers: {} }
    requestInterceptor(config)
    expect(config.headers.Authorization).toBe('Bearer token-abc')

    window.localStorage.removeItem('portfolio.token')
  })

  it('n’ajoute pas Authorization sans jeton', async () => {
    window.localStorage.removeItem('portfolio.token')
    await importApi()
    const requestInterceptor = requestUse.mock.calls.at(-1)[0]
    const config = { headers: {} }
    requestInterceptor(config)
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('normalise une réponse 401 en ApiError d’accès non autorisé', async () => {
    const { ApiError } = await importApi()
    const responseInterceptor = responseUse.mock.calls.at(-1)[1]
    const error = { response: { status: 401, data: { message: 'Non authentifié.' } } }

    await expect(responseInterceptor(error)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Non authentifié.',
      isUnauthorized: true,
    })
  })

  it('normalise une erreur de validation 422 avec le détail des champs', async () => {
    const { ApiError } = await importApi()
    const responseInterceptor = responseUse.mock.calls.at(-1)[1]
    const error = {
      response: {
        status: 422,
        data: { message: 'Données invalides.', errors: { title: ['Le titre est requis.'] } },
      },
    }

    await expect(responseInterceptor(error)).rejects.toMatchObject({
      status: 422,
      isValidation: true,
      errors: { title: ['Le titre est requis.'] },
    })
  })

  it('normalise une 404 en ressource introuvable', async () => {
    const { ApiError } = await importApi()
    const responseInterceptor = responseUse.mock.calls.at(-1)[1]
    const error = { response: { status: 404, data: {} } }

    await expect(responseInterceptor(error)).rejects.toMatchObject({
      status: 404,
      isNotFound: true,
    })
  })

  it('normalise une erreur réseau (pas de response) sans masquer le problème', async () => {
    const { ApiError } = await importApi()
    const responseInterceptor = responseUse.mock.calls.at(-1)[1]
    const error = { message: 'Network Error' }

    const thrown = await responseInterceptor(error).catch((e) => e)
    expect(thrown).toBeInstanceOf(ApiError)
    expect(thrown.status).toBe(0)
    expect(thrown.message).toContain('Impossible de joindre le serveur')
  })
})
