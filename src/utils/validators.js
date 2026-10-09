/**
 * Validation légère côté client — alignée sur les règles Laravel
 * (Form Requests du backend). Le backend reste l'arbitre final.
 */

export const messages = {
  required: 'Ce champ est obligatoire.',
  email: "L'adresse e-mail n'est pas valide.",
  url: "L'adresse n'est pas une URL valide (https://…).",
  min: (n) => `Au moins ${n} caractères.`,
  max: (n) => `Maximum ${n} caractères.`,
  minNumber: (n) => `Au moins ${n}.`,
}

export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())
}

export function isUrl(value) {
  try {
    const url = new URL(String(value).trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Exécute un jeu de règles sur un objet de valeurs.
 * Règles : 'required' | 'email' | 'url' | { min, max, email, required, url }
 * @returns {Record<string, string>} erreurs par champ (vide = valide)
 */
export function validate(values, rules) {
  const errors = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = values[field]
    const list = Array.isArray(rule) ? rule : [rule]
    let error = null

    for (const item of list) {
      const r = typeof item === 'string' ? { [item]: true } : item

      if (r.required && isEmpty(value)) {
        error = messages.required
        break
      }
      if (isEmpty(value)) continue // les règles suivantes s'appliquent sur valeur présente

      const str = String(value).trim()

      if (r.email && !isEmail(str)) {
        error = messages.email
        break
      }
      if (r.url && !isUrl(str)) {
        error = messages.url
        break
      }
      if (r.min !== undefined && str.length < r.min) {
        error = messages.min(r.min)
        break
      }
      if (r.max !== undefined && str.length > r.max) {
        error = messages.max(r.max)
        break
      }
    }

    if (error) errors[field] = error
  }

  return errors
}

/** Fusionne les erreurs backend (`errors.champ = [msg]`) au format local. */
export function backendErrorsToMap(errors) {
  const map = {}
  if (!errors || typeof errors !== 'object') return map
  for (const [field, list] of Object.entries(errors)) {
    map[field] = Array.isArray(list) ? list[0] : String(list)
  }
  return map
}
