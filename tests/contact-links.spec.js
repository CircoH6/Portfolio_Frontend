import { describe, it, expect } from 'vitest'
import { buildContactHref, whatsappDigits } from '@/utils/contact-links'

describe('contact-links — protocoles appropriés', () => {
  it('téléphone → tel: (chiffres et + conservés)', () => {
    expect(buildContactHref('phone', '+33 6 12 34 56 78')).toBe('tel:+33612345678')
  })

  it('whatsapp → https://wa.me/<chiffres>', () => {
    expect(buildContactHref('whatsapp', '+33 6 12 34 56 78')).toBe(
      'https://wa.me/33612345678',
    )
    expect(whatsappDigits('06-12-34-56-78')).toBe('0612345678')
  })

  it('email → mailto:', () => {
    expect(buildContactHref('email', 'contact@exemple.dev')).toBe('mailto:contact@exemple.dev')
  })

  it('email invalide → null', () => {
    expect(buildContactHref('email', 'pas-un-email')).toBeNull()
  })

  it('github/linkedin/website → https ajouté si absent', () => {
    expect(buildContactHref('github', 'github.com/ada')).toBe('https://github.com/ada')
    expect(buildContactHref('linkedin', 'https://linkedin.com/in/ada')).toBe(
      'https://linkedin.com/in/ada',
    )
  })

  it('valeur vide → null', () => {
    expect(buildContactHref('phone', '')).toBeNull()
    expect(buildContactHref('email', null)).toBeNull()
  })
})
