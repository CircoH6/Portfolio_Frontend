import { describe, it, expect, vi, afterEach } from 'vitest'
import { api, ApiError } from '@/services/api.js'

/**
 * Téléchargement du PDF de CV.
 *
 * Ces tests font passer `api.download()` dans la VRAIE chaîne d'intercepteurs
 * Axios : seul l'`adapter` (la couche transport) est remplacé. On vérifie donc
 * le comportement réellement livré au navigateur, et non un mock du client.
 */

function stubAdapter(handler) {
  const original = api.http.defaults.adapter
  api.http.defaults.adapter = async (config) => handler(config)
  return () => {
    api.http.defaults.adapter = original
  }
}

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) // "%PDF-"

function pdfBlob() {
  return new Blob([PDF_BYTES], { type: 'application/pdf' })
}

function jsonBlob(payload) {
  return new Blob([JSON.stringify(payload)], { type: 'application/json' })
}

function okResponse(config, { body, headers }) {
  return { data: body, status: 200, statusText: 'OK', headers, config }
}

function errorResponse(config, { status, body }) {
  const error = new Error(`Request failed with status code ${status}`)
  error.response = { data: body, status, statusText: '', headers: {}, config }
  error.config = config
  error.isAxiosError = true
  throw error
}

const restores = []
afterEach(() => {
  while (restores.length) restores.pop()()
})

describe('api.download — export PDF du CV', () => {
  it('récupère le Blob PDF avec son type MIME', async () => {
    restores.push(
      stubAdapter((config) =>
        okResponse(config, { body: pdfBlob(), headers: { 'content-disposition': 'attachment; filename="cv.pdf"' } }),
      ),
    )

    const { blob } = await api.download('/cv/frontend/pdf')

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  })

  it('lit le nom de fichier dans Content-Disposition (forme simple)', async () => {
    restores.push(
      stubAdapter((config) =>
        okResponse(config, {
          body: pdfBlob(),
          headers: { 'content-disposition': 'attachment; filename="cv-frontend.pdf"' },
        }),
      ),
    )

    const { filename } = await api.download('/cv/frontend/pdf')
    expect(filename).toBe('cv-frontend.pdf')
  })

  it('lit le nom de fichier RFC 5987 avec accents (filename*=UTF-8\'\')', async () => {
    restores.push(
      stubAdapter((config) =>
        okResponse(config, {
          body: pdfBlob(),
          headers: {
            'content-disposition':
              "attachment; filename=\"cv.pdf\"; filename*=UTF-8''CV%20D%C3%A9veloppeur.pdf",
          },
        }),
      ),
    )

    const { filename } = await api.download('/cv/frontend/pdf')
    expect(filename).toBe('CV Développeur.pdf')
  })

  it('renvoie un nom de fichier null plutôt que de deviner quand l’en-tête est absent', async () => {
    restores.push(stubAdapter((config) => okResponse(config, { body: pdfBlob(), headers: {} })))

    const { filename } = await api.download('/cv/frontend/pdf')
    expect(filename).toBeNull()
  })

  it('demande explicitement une réponse binaire avec un timeout allongé', async () => {
    let seen = null
    restores.push(
      stubAdapter((config) => {
        seen = config
        return okResponse(config, { body: pdfBlob(), headers: {} })
      }),
    )

    await api.download('/cv/frontend/pdf')

    expect(seen.responseType).toBe('blob')
    expect(seen.timeout).toBe(60000)
    expect(seen.url).toBe('/cv/frontend/pdf')
  })

  it('remonte le message réel du backend quand l’export échoue (corps JSON en Blob)', async () => {
    restores.push(
      stubAdapter((config) =>
        errorResponse(config, {
          status: 500,
          body: jsonBlob({ message: 'Génération du PDF impossible.' }),
        }),
      ),
    )

    const error = await api.download('/cv/frontend/pdf').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.message).toBe('Génération du PDF impossible.')
  })

  it('signale une ressource inexistante (404) sur l’export', async () => {
    restores.push(
      stubAdapter((config) =>
        errorResponse(config, { status: 404, body: jsonBlob({ message: 'CV introuvable.' }) }),
      ),
    )

    const error = await api.download('/cv/inconnu/pdf').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.isNotFound).toBe(true)
  })

  it('refuse un corps JSON renvoyé avec un statut 200 (export déguisé en succès)', async () => {
    restores.push(
      stubAdapter((config) =>
        okResponse(config, {
          body: jsonBlob({ success: false, message: 'Aucune donnée de CV.' }),
          headers: {},
        }),
      ),
    )

    const error = await api.download('/cv/frontend/pdf').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Aucune donnée de CV.')
  })
})

describe('api.saveBlob — déclenchement du téléchargement', () => {
  it('crée un lien de téléchargement portant le nom de fichier et le clique', async () => {
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    globalThis.URL.createObjectURL = createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURL

    const click = vi.fn()
    const created = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        created.push(el)
        el.click = click
      }
      return el
    })

    api.saveBlob(pdfBlob(), 'cv-frontend.pdf')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(created[0].download).toBe('cv-frontend.pdf')
    expect(created[0].href).toBe('blob:fake')
    expect(document.body.contains(created[0])).toBe(false) // lien retiré du DOM

    vi.restoreAllMocks()
  })

  it('utilise un nom de repli quand aucun nom de fichier n’est fourni', () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake')
    globalThis.URL.revokeObjectURL = vi.fn()

    const click = vi.fn()
    let captured = null
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        captured = el
        el.click = click
      }
      return el
    })

    api.saveBlob(pdfBlob(), null)

    expect(captured.download).toBe('fichier.pdf')
    vi.restoreAllMocks()
  })
})
