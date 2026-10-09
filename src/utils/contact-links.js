/**
 * Construction des liens publics à partir des moyens de contact
 * (types du modèle ContactMethod : phone, whatsapp, email, github,
 * linkedin, website). Protocoles appropriés : tel:, mailto:, wa.me, https.
 */

export const CONTACT_TYPE_META = {
  phone: { label: 'Téléphone', icon: 'Phone' },
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle' },
  email: { label: 'E-mail', icon: 'Mail' },
  github: { label: 'GitHub', icon: 'Github' },
  linkedin: { label: 'LinkedIn', icon: 'Linkedin' },
  website: { label: 'Site web', icon: 'Globe' },
}

/** Chiffres purs d'un numéro (indicatif inclus) pour wa.me. */
export function whatsappDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

/**
 * @param {string} type
 * @param {string} value
 * @returns {string|null} href utilisable ou null si la valeur est inutilisable
 */
export function buildContactHref(type, value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  switch (type) {
    case 'phone': {
      const digits = raw.replace(/[^\d+]/g, '')
      return digits ? `tel:${digits}` : null
    }
    case 'whatsapp': {
      const digits = whatsappDigits(raw)
      return digits ? `https://wa.me/${digits}` : null
    }
    case 'email':
      return isPlainEmail(raw) ? `mailto:${raw}` : null
    case 'github':
    case 'linkedin':
    case 'website':
      return ensureUrl(raw)
    default:
      return ensureUrl(raw)
  }
}

function isPlainEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

function ensureUrl(value) {
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}
