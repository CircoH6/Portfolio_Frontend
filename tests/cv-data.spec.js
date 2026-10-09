import { describe, it, expect } from 'vitest'
import {
  isCvData,
  isCvResource,
  normalizeCv,
  fromAdminResource,
  cvPdfFilename,
} from '@/utils/cv-data'

/**
 * Contrat vérifié : la transformation admin reproduit CvBuilderService
 * (groupement des skills par catégorie, dates m/Y et Y, filtrage show_*
 * sur les contacts, show_photo / show_location) SANS filtre is_visible —
 * l'aperçu admin inclut les éléments masqués, comme le PDF admin.
 */
const adminResource = {
  id: 1,
  name: 'CV Développeur',
  slug: 'cv-dev',
  template: 'default',
  language: 'fr',
  options: {
    show_photo: true,
    show_phone: true,
    show_whatsapp: false,
    show_email: true,
    show_github: true,
    show_linkedin: false,
    show_location: true,
  },
  is_public: true,
  is_default: true,
  profile: {
    first_name: 'Ada',
    last_name: 'Lovelace',
    full_name: 'Ada Lovelace',
    professional_title: 'Développeuse',
    short_bio: 'Courte.',
    long_bio: 'Longue.',
    location: 'Paris',
    profile_image: 'http://cdn/photo.jpg',
    website: 'https://ada.dev',
    contact_methods: [
      { type: 'phone', label: 'Fixe', value: '+33100000000' },
      { type: 'whatsapp', label: 'Mobile', value: '+33600000000' },
      { type: 'email', label: 'Pro', value: 'ada@dev.com' },
      { type: 'github', label: 'GH', value: 'https://github.com/ada' },
      { type: 'linkedin', label: 'LI', value: 'https://linkedin.com/in/ada' },
    ],
  },
  projects: [
    { id: 5, title: 'Portfolio', slug: 'portfolio', technologies: [{ name: 'Vue', slug: 'vue' }] },
  ],
  skills: [
    { id: 1, name: 'Vue', description: 'fw', category: { id: 9, name: 'Frontend' } },
    { id: 2, name: 'CSS', description: null, category: { id: 9, name: 'Frontend' } },
    { id: 3, name: 'Laravel', category: { id: 10, name: 'Backend' } },
    { id: 4, name: 'SansCatégorie' },
  ],
  experiences: [
    { id: 1, title: 'Dev', company: 'A', start_date: '2023-05-01', end_date: null, is_current: true },
  ],
  educations: [
    { id: 1, institution: 'Uni', degree: 'Master', start_date: '2019-09-01', end_date: '2021-06-01', is_current: false },
  ],
  certifications: [
    { id: 1, name: 'Cert', organization: 'Org', issue_date: '2022-03-01', expiration_date: null },
  ],
}

describe('cv-data — détection de forme', () => {
  it('isCvData reconnaît le CV Data backend', () => {
    expect(isCvData({ cv: {}, contact: [] })).toBe(true)
    expect(isCvData(adminResource)).toBe(false)
  })

  it('isCvResource reconnaît la CvProfileResource admin', () => {
    expect(isCvResource(adminResource)).toBe(true)
  })
})

describe('cv-data — normalizeCv', () => {
  it('laisse passer le CV Data public tel quel', () => {
    const data = { cv: { name: 'x' }, contact: [] }
    expect(normalizeCv(data)).toBe(data)
  })

  it('transforme une Resource admin', () => {
    const out = normalizeCv(adminResource)
    expect(out.cv.slug).toBe('cv-dev')
    expect(out.profile.full_name).toBe('Ada Lovelace')
  })

  it('retourne null si forme inconnue', () => {
    expect(normalizeCv({ foo: 1 })).toBeNull()
  })
})

describe('cv-data — fromAdminResource (cohérence PDF)', () => {
  const out = fromAdminResource(adminResource)

  it('filtre les contacts selon show_* (whatsapp et linkedin masqués)', () => {
    const types = out.contact.map((c) => c.type)
    expect(types).toContain('phone')
    expect(types).toContain('email')
    expect(types).toContain('github')
    expect(types).not.toContain('whatsapp')
    expect(types).not.toContain('linkedin')
  })

  it('regroupe les compétences par catégorie', () => {
    expect(out.skills).toHaveLength(3) // Frontend, Backend, Autres
    const frontend = out.skills.find((g) => g.name === 'Frontend')
    expect(frontend.items.map((i) => i.name)).toEqual(['Vue', 'CSS'])
    const autres = out.skills.find((g) => g.name === 'Autres')
    expect(autres.items[0].name).toBe('SansCatégorie')
  })

  it('formate les dates expérience en m/Y et end_date null si en cours', () => {
    expect(out.experiences[0].start_date).toBe('05/2023')
    expect(out.experiences[0].end_date).toBeNull()
    expect(out.experiences[0].is_current).toBe(true)
  })

  it('formate les dates formation en année', () => {
    expect(out.educations[0].start_date).toBe('2019')
    expect(out.educations[0].end_date).toBe('2021')
  })

  it('respecte show_location et show_photo', () => {
    expect(out.profile.location).toBe('Paris')
    expect(out.profile.photo_url).toBe('http://cdn/photo.jpg')
  })

  it('masque la localisation quand show_location=false', () => {
    const noLoc = fromAdminResource({
      ...adminResource,
      options: { ...adminResource.options, show_location: false },
    })
    expect(noLoc.profile.location).toBeNull()
  })
})

describe('cv-data — cvPdfFilename', () => {
  it('construit le nom de fichier attendu', () => {
    expect(cvPdfFilename('cv-dev')).toBe('CV-cv-dev.pdf')
    expect(cvPdfFilename('Mon CV !')).toBe('CV-moncv.pdf')
    expect(cvPdfFilename('')).toBe('CV-cv.pdf')
  })
})
