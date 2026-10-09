/**
 * Client HTTP centralisé — API Laravel `/api/v1`.
 *
 * Authentification : Sanctum Personal Access Tokens (Authorization: Bearer).
 * Le backend utilise `supports_credentials: false` (pas de cookies de
 * session) : le jeton Bearer est le mécanisme réellement fourni.
 *
 * Enveloppe : { success, message, data } | { success, message, errors }
 */
import axios from 'axios'

const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
export const API_BASE_URL = String(RAW_BASE).replace(/\/+$/, '')

const TOKEN_KEY = 'portfolio.token'

/** Erreur normalisée lisible par toute la couche applicative. */
export class ApiError extends Error {
  constructor({ status = 0, message = 'Erreur réseau', errors = null, code = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.code = code
  }

  get isValidation() {
    return this.status === 422
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isNotFound() {
    return this.status === 404
  }
}

/* ------------------------------------------------------------------ */
/* Jeton : restauré au démarrage pour la session — jamais de mot de    */
/* passe conservé en navigation. Nettoyé à la déconnexion.             */
/* ------------------------------------------------------------------ */

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* stockage indisponible : session non persistée */
  }
}

/* ------------------------------------------------------------------ */
/* Instance Axios                                                       */
/* ------------------------------------------------------------------ */

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // FormData : Axios pose seul le Content-Type multipart.
  return config
})

function extractMessage(payload, fallback) {
  if (payload && typeof payload.message === 'string' && payload.message) {
    if (payload.message !== 'OK' && payload.message !== 'Error') {
      return payload.message
    }
  }
  return fallback
}

http.interceptors.response.use(
  (response) => response.data, // les services consomment l'enveloppe
  async (error) => {
    if (!error.response) {
      throw new ApiError({
        status: 0,
        message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
        code: 'NETWORK',
      })
    }

    const { status, data } = error.response
    const payload = data && typeof data === 'object' ? data : {}
    const message = extractMessage(
      payload,
      status === 401
        ? 'Session expirée.'
        : status === 403
          ? 'Accès refusé.'
          : status === 404
            ? 'Ressource introuvable.'
            : status === 429
              ? 'Trop de requêtes. Réessayez dans un instant.'
              : `Erreur serveur (${status}).`,
    )

    if (status === 401) {
      setToken(null)
      window.dispatchEvent(new CustomEvent('api:unauthorized'))
    }
    if (status === 403) {
      window.dispatchEvent(new CustomEvent('api:forbidden', { detail: { message } }))
    }

    throw new ApiError({
      status,
      message,
      errors: payload.errors && typeof payload.errors === 'object' ? payload.errors : null,
      code: payload.code || null,
    })
  },
)

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Extrait `data` de l'enveloppe et vérifie `success`. */
async function unwrap(promise) {
  const envelope = await promise
  if (envelope && envelope.success === false) {
    throw new ApiError({ status: 0, message: envelope.message || 'Erreur.' })
  }
  return envelope ? envelope.data : null
}

const get = (url, config) => unwrap(http.get(url, config))
const post = (url, body, config) => unwrap(http.post(url, body, config))
const put = (url, body, config) => unwrap(http.put(url, body, config))
const patch = (url, body, config) => unwrap(http.patch(url, body, config))
const del = (url, config) => unwrap(http.delete(url, config))

function filenameFromDisposition(value) {
  if (!value) return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(value)
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim())
    } catch {
      /* ignore */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(value)
  return plain ? plain[1].trim() : null
}

/**
 * Téléchargement binaire (PDF) : nom de fichier lu dans Content-Disposition
 * (header exposé par la config CORS backend). Les erreurs JSON sont
 * décodées même avec responseType blob.
 * @returns {Promise<{blob: Blob, filename: string|null}>}
 */
async function download(url, config = {}) {
  let response
  try {
    response = await http.get(url, { ...config, responseType: 'blob', timeout: 60000 })
  } catch (error) {
    if (error instanceof ApiError) throw error
    const blob = error.response?.data
    if (blob instanceof Blob && blob.type.includes('json')) {
      let payload = {}
      try {
        payload = JSON.parse(await blob.text())
      } catch {
        /* corps illisible */
      }
      throw new ApiError({
        status: error.response.status || 400,
        message: extractMessage(payload, 'Échec du téléchargement.'),
        errors: payload.errors || null,
      })
    }
    throw new ApiError({ status: 0, message: 'Échec du téléchargement.' })
  }

  // En responseType blob, l'intercepteur renvoie le Blob lui-même
  // (plus d'enveloppe) : on distingue les deux formes possibles.
  const blob = response instanceof Blob ? response : response?.data
  if (blob instanceof Blob && blob.type.includes('json')) {
    let payload = {}
    try {
      payload = JSON.parse(await blob.text())
    } catch {
      /* corps illisible */
    }
    throw new ApiError({
      status: 400,
      message: extractMessage(payload, 'Échec du téléchargement.'),
      errors: payload.errors || null,
    })
  }

  const headers = response?.headers || {}
  return { blob, filename: filenameFromDisposition(headers['content-disposition']) }
}

/** Déclenche le téléchargement d'un Blob dans le navigateur. */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'fichier.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export const api = { get, post, put, patch, del, download, saveBlob, http }

