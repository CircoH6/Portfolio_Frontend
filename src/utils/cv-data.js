import { formatMonthYear, formatYear } from './dates.js'

/**
 * Normalisation du CV : quelle que soit l'origine (GET /cv/{slug} public
 * qui renvoie déjà le "CV Data" du backend, ou GET /admin/cv/{id} qui
 * renvoie une CvProfileResource), on produit UNE structure unique pour
 * <CvSheet>. La transformation admin reproduit fidèlement la logique de
 * CvBuilderService (sans filtre is_visible : l'aperçu admin inclut les
 * éléments masqués, comme le PDF admin backend).
 */

/** La payload est-elle déjà du CV Data (sortie du pipeline backend) ? */
export function isCvData(data) {
  return Boolean(data && typeof data === 'object' && 'cv' in data && 'contact' in data)
}

/** La payload est-elle une CvProfileResource (API admin) ? */
export function isCvResource(data) {
  return Boolean(data && typeof data === 'object' && 'options' in data)
}

/** @returns {object|null} CV Data normalisé */
export function normalizeCv(data) {
  if (!data) return null
  if (isCvData(data)) return data
  if (isCvResource(data)) return fromAdminResource(data)
  return null
}

/** Transforme une CvProfileResource admin en CV Data. */
export function fromAdminResource(cv) {
  const options = cv.options || {}
  const profile = cv.profile || {}
  const methods = profile.contact_methods || []

  // Filtrage show_* (logique de CvBuilderService::contact) : les types
  // non listés (ex. website) restent visibles.
  const showMap = {
    phone: options.show_phone,
    whatsapp: options.show_whatsapp,
    email: options.show_email,
    github: options.show_github,
    linkedin: options.show_linkedin,
  }
  const contact = methods
    .filter((m) => showMap[m.type] === undefined || showMap[m.type] !== false)
    .map((m) => ({ type: m.type, label: m.label, value: m.value }))

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    cv.name

  const photo =
    options.show_photo !== false ? profile.profile_image || profile.photo_url || null : null

  return {
    cv: {
      name: cv.name,
      slug: cv.slug,
      template: cv.template || 'default',
      language: cv.language || 'fr',
    },
    profile: {
      first_name: profile.first_name ?? null,
      last_name: profile.last_name ?? null,
      full_name: fullName,
      professional_title: profile.professional_title ?? null,
      short_bio: profile.short_bio ?? null,
      long_bio: profile.long_bio ?? null,
      location: options.show_location !== false ? profile.location ?? null : null,
      photo_url: photo,
      website: profile.website ?? null,
    },
    contact,
    skills: groupSkills(cv.skills || []),
    projects: (cv.projects || []).map(mapProject),
    experiences: (cv.experiences || []).map(mapExperience),
    educations: (cv.educations || []).map(mapEducation),
    certifications: (cv.certifications || []).map(mapCertification),
  }
}

/** Regroupe les compétences par catégorie (ordre de rencontre conservé). */
function groupSkills(skills) {
  const groups = []
  const index = new Map()

  for (const skill of skills) {
    const category = skill.category || null
    const key = category?.id ?? category?.name ?? 'other'
    let group = index.get(key)
    if (!group) {
      group = {
        id: category?.id ?? null,
        name: category?.name || 'Autres',
        items: [],
      }
      index.set(key, group)
      groups.push(group)
    }
    group.items.push({
      id: skill.id,
      name: skill.name,
      description: skill.description ?? null,
    })
  }

  return groups
}

function mapProject(p) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    short_description: p.short_description ?? null,
    description: p.description ?? null,
    problem: p.problem ?? null,
    solution: p.solution ?? null,
    features: p.features ?? null,
    role: p.role ?? null,
    status: p.status ?? null,
    start_date: p.start_date ?? null,
    end_date: p.end_date ?? null,
    github_url: p.github_url ?? null,
    demo_url: p.demo_url ?? null,
    technologies: (p.technologies || []).map((t) => ({
      name: t.name,
      slug: t.slug,
    })),
  }
}

function mapExperience(e) {
  return {
    id: e.id,
    title: e.title,
    company: e.company,
    location: e.location ?? null,
    description: e.description ?? null,
    start_date: formatMonthYear(e.start_date),
    end_date: e.is_current ? null : formatMonthYear(e.end_date),
    is_current: Boolean(e.is_current),
  }
}

function mapEducation(ed) {
  return {
    id: ed.id,
    institution: ed.institution,
    degree: ed.degree,
    field: ed.field ?? null,
    description: ed.description ?? null,
    start_date: formatYear(ed.start_date),
    end_date: ed.is_current ? null : formatYear(ed.end_date),
    is_current: Boolean(ed.is_current),
  }
}

function mapCertification(c) {
  return {
    id: c.id,
    name: c.name,
    organization: c.organization,
    description: c.description ?? null,
    issue_date: formatMonthYear(c.issue_date),
    expiration_date: formatMonthYear(c.expiration_date),
    credential_url: c.credential_url ?? null,
  }
}

/** Nom de fichier PDF attendu (mêmes règles que le backend). */
export function cvPdfFilename(slug) {
  const clean = String(slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  return `CV-${clean || 'cv'}.pdf`
}
