import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '@/views/public/HomeView.vue'

/**
 * Page d'accueil : les données affichées viennent de l'API.
 * On vérifie le rendu réel (succès / erreur / vide) — aucune donnée de
 * substitution ne doit apparaître quand une requête échoue.
 */

const {
  profileService,
  skillsService,
  projectsService,
  experiencesService,
  educationsService,
} = vi.hoisted(() => ({
  profileService: { getPublic: vi.fn() },
  skillsService: { listPublic: vi.fn() },
  projectsService: { listPublic: vi.fn() },
  experiencesService: { listPublic: vi.fn() },
  educationsService: { listPublic: vi.fn() },
}))

vi.mock('@/services/profile.service', () => ({ profileService }))
vi.mock('@/services/skills.service', () => ({ skillsService }))
vi.mock('@/services/projects.service', () => ({ projectsService }))
vi.mock('@/services/experiences.service', () => ({ experiencesService }))
vi.mock('@/services/educations.service', () => ({ educationsService }))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/projets', component: { template: '<div />' } },
    { path: '/projets/:slug', component: { template: '<div />' } },
    { path: '/cv', component: { template: '<div />' } },
    { path: '/a-propos', component: { template: '<div />' } },
    { path: '/competences', component: { template: '<div />' } },
    { path: '/parcours', component: { template: '<div />' } },
    { path: '/contact', component: { template: '<div />' } },
  ],
})

function mountHome() {
  return mount(HomeView, {
    global: { plugins: [createPinia(), router] },
  })
}

const PROFILE = {
  full_name: 'Camille Rivière',
  professional_title: 'Développeuse web & mobile',
  short_bio: 'Je conçois des interfaces sobres.',
  long_bio: 'Parcours détaillé côté API.',
  location: 'Lyon, France',
  profile_image: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  skillsService.listPublic.mockResolvedValue([])
  projectsService.listPublic.mockResolvedValue({ projects: [], pagination: {} })
  experiencesService.listPublic.mockResolvedValue([])
  educationsService.listPublic.mockResolvedValue([])
})

describe('HomeView — état de succès', () => {
  it('affiche le profil renvoyé par l’API (nom, titre, bio, localisation)', async () => {
    profileService.getPublic.mockResolvedValue(PROFILE)

    const wrapper = mountHome()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Camille Rivière')
    expect(text).toContain('Développeuse web & mobile')
    expect(text).toContain('Je conçois des interfaces sobres.')
    expect(text).toContain('Lyon, France')
  })

  it('propose les appels à l’action vers les projets et le CV', async () => {
    profileService.getPublic.mockResolvedValue(PROFILE)

    const wrapper = mountHome()
    await flushPromises()

    const links = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(links).toContain('/projets')
    expect(links).toContain('/cv')
  })
})

describe('HomeView — état d’erreur', () => {
  it('affiche l’erreur réseau au lieu d’un contenu inventé', async () => {
    profileService.getPublic.mockRejectedValue({
      name: 'ApiError',
      status: 0,
      message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    })

    const wrapper = mountHome()
    await flushPromises()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Impossible de joindre le serveur')
    expect(wrapper.text()).not.toContain('Camille Rivière')
  })

  it('propose un bouton « Réessayer » qui relance la requête', async () => {
    profileService.getPublic
      .mockRejectedValueOnce({ name: 'ApiError', status: 0, message: 'Erreur réseau.' })
      .mockResolvedValueOnce(PROFILE)

    const wrapper = mountHome()
    await flushPromises()

    const retry = wrapper.findAll('button').find((b) => b.text().includes('Réessayer'))
    expect(retry).toBeTruthy()

    await retry.trigger('click')
    await flushPromises()

    expect(profileService.getPublic).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Camille Rivière')
  })
})

describe('HomeView — état vide', () => {
  it('affiche un message discret quand aucune donnée n’est disponible', async () => {
    profileService.getPublic.mockResolvedValue(null)

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('Les informations de profil ne sont pas encore disponibles.')
    expect(wrapper.text()).toContain('Aucune compétence publiée pour le moment.')
    expect(wrapper.text()).toContain('Aucun projet en vedette pour le moment.')
  })

  it('affiche un état vide quand le profil existe mais sans contenu', async () => {
    profileService.getPublic.mockResolvedValue({})

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('Profil en cours de configuration')
    expect(wrapper.text()).toContain('Aucune présentation renseignée pour le moment.')
  })
})

describe('HomeView — données dynamiques', () => {
  it('affiche les compétences et les projets renvoyés par l’API', async () => {
    profileService.getPublic.mockResolvedValue(PROFILE)
    skillsService.listPublic.mockResolvedValue([
      { id: 1, name: 'Vue 3', icon: null },
      { id: 2, name: 'Laravel', icon: null },
    ])
    projectsService.listPublic.mockResolvedValue({
      projects: [
        {
          id: 1,
          slug: 'portfolio',
          title: 'Portfolio',
          short_description: 'Site vitrine',
          status: 'completed',
          technologies: [],
          cover_image: null,
        },
      ],
      pagination: {},
    })

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('Vue 3')
    expect(wrapper.text()).toContain('Laravel')
    expect(wrapper.text()).toContain('Portfolio')
    expect(wrapper.text()).toContain('Site vitrine')
  })
})
