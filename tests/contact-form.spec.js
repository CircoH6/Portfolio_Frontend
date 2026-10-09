import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ContactView from '@/views/public/ContactView.vue'
import { ApiError } from '@/services/api.js'

/**
 * Formulaire de contact : validation locale, erreurs de validation du
 * backend (422) remontées champ par champ, confirmation d'envoi et
 * affichage des erreurs réseau (jamais masquées).
 */

const { contactService, profileService } = vi.hoisted(() => ({
  contactService: { send: vi.fn() },
  profileService: { getPublic: vi.fn() },
}))

vi.mock('@/services/contact.service', () => ({ contactService }))
vi.mock('@/services/profile.service', () => ({ profileService }))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

function mountContact() {
  return mount(ContactView, { global: { plugins: [createPinia(), router] } })
}

const VALID = {
  name: 'Camille Rivière',
  email: 'camille@example.com',
  subject: 'Proposition de mission',
  message: 'Bonjour, je souhaiterais échanger sur un projet.',
}

async function fill(wrapper, values) {
  const inputs = wrapper.findAll('input')
  // Ordre du formulaire : nom, e-mail, sujet
  await inputs[0].setValue(values.name)
  await inputs[1].setValue(values.email)
  await inputs[2].setValue(values.subject)
  await wrapper.find('textarea').setValue(values.message)
}

async function submit(wrapper) {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  profileService.getPublic.mockResolvedValue({ contact_methods: [], location: null })
  contactService.send.mockResolvedValue({ id: 1 })
})

describe('formulaire de contact — validation locale', () => {
  it('bloque l’envoi et signale les champs obligatoires vides', async () => {
    const wrapper = mountContact()
    await flushPromises()

    await submit(wrapper)

    expect(contactService.send).not.toHaveBeenCalled()
    const text = wrapper.text()
    expect(text).toContain('Ce champ est obligatoire.')
  })

  it('refuse une adresse e-mail invalide', async () => {
    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, { ...VALID, email: 'pas-un-email' })
    await submit(wrapper)

    expect(contactService.send).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain("L'adresse e-mail n'est pas valide.")
  })

  it('refuse un message trop court (minimum 10 caractères)', async () => {
    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, { ...VALID, message: 'court' })
    await submit(wrapper)

    expect(contactService.send).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Au moins 10 caractères.')
  })

  it('marque les champs invalides avec aria-invalid', async () => {
    const wrapper = mountContact()
    await flushPromises()

    await submit(wrapper)

    expect(wrapper.findAll('[aria-invalid="true"]').length).toBeGreaterThan(0)
  })
})

describe('formulaire de contact — envoi réussi', () => {
  it('envoie les données saisies et affiche la confirmation', async () => {
    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, VALID)
    await submit(wrapper)

    expect(contactService.send).toHaveBeenCalledTimes(1)
    expect(contactService.send).toHaveBeenCalledWith({
      name: VALID.name,
      email: VALID.email,
      subject: VALID.subject,
      message: VALID.message,
    })
    expect(wrapper.text()).toContain('Message envoyé.')
  })

  it('permet d’envoyer un autre message et réinitialise le formulaire', async () => {
    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, VALID)
    await submit(wrapper)

    const again = wrapper.findAll('button').find((b) => b.text().includes('Envoyer un autre message'))
    expect(again).toBeTruthy()
    await again.trigger('click')
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findAll('input')[0].element.value).toBe('')
  })
})

describe('formulaire de contact — erreurs du backend', () => {
  it('associe les erreurs de validation 422 aux champs concernés', async () => {
    contactService.send.mockRejectedValue(
      new ApiError({
        status: 422,
        message: 'Données invalides.',
        errors: { email: ['Cette adresse est déjà utilisée.'] },
      }),
    )

    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, VALID)
    await submit(wrapper)

    expect(wrapper.text()).toContain('Cette adresse est déjà utilisée.')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Message envoyé.')
  })

  it('affiche une erreur réseau visible sans la masquer', async () => {
    contactService.send.mockRejectedValue(
      new ApiError({
        status: 0,
        message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
      }),
    )

    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, VALID)
    await submit(wrapper)

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Impossible de joindre le serveur')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('signale une erreur serveur 500 sans prétendre que le message est parti', async () => {
    contactService.send.mockRejectedValue(new ApiError({ status: 500, message: 'Erreur serveur (500).' }))

    const wrapper = mountContact()
    await flushPromises()

    await fill(wrapper, VALID)
    await submit(wrapper)

    expect(wrapper.text()).toContain('Erreur serveur (500).')
    expect(wrapper.text()).not.toContain('Message envoyé.')
  })
})
