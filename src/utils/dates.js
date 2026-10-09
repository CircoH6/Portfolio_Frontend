/**
 * Formatage des dates — uniquement les données réelles de l'API
 * (formats ISO `YYYY-MM-DD` renvoyés par les Resources Laravel).
 */

const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const MONTHS_FR_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/**
 * Parse une date `YYYY-MM-DD` (ou ISO complète) de façon insensible au fuseau.
 * @returns {Date|null}
 */
export function parseDate(value) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
  if (!match) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** `2024-05-12` → `12 mai 2024` ; null → ''. */
export function formatDate(value) {
  const d = parseDate(value)
  if (!d) return ''
  return `${d.getDate()} ${MONTHS_FR_LONG[d.getMonth()]} ${d.getFullYear()}`
}

/** `2024-05-12` → `05/2024` (format CV `m/Y`) ; null → ''. */
export function formatMonthYear(value) {
  const d = parseDate(value)
  if (!d) return ''
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** `2024-05-12` → `2024` ; null → ''. */
export function formatYear(value) {
  const d = parseDate(value)
  return d ? String(d.getFullYear()) : ''
}

/** `2024-05-12` → `mai 2024` (timeline). */
export function formatMonthYearLong(value) {
  const d = parseDate(value)
  if (!d) return ''
  return `${MONTHS_FR_LONG[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Intervalle lisible pour les timelines : `12 mai 2023 – aujourd'hui`.
 * @param {{start?: string, end?: string, current?: boolean}} range
 * @param {{short?: boolean}} [opts] `short: true` → `05/2023`
 */
export function formatDateRange({ start, end, current = false } = {}, opts = {}) {
  const fmt = opts.short ? formatMonthYear : formatMonthYearLong
  const from = fmt(start)
  if (current) return from ? `${from} – aujourd'hui` : "aujourd'hui"
  const to = fmt(end)
  if (from && to) return `${from} – ${to}`
  return from || to || ''
}
