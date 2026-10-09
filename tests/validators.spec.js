import { describe, it, expect } from 'vitest'
import { validate, isEmpty, isEmail, isUrl, backendErrorsToMap } from '@/utils/validators'

describe('validators — isEmpty', () => {
  it('détecte les valeurs vides', () => {
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty([])).toBe(true)
  })

  it('accepte les valeurs remplies', () => {
    expect(isEmpty('x')).toBe(false)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty([1])).toBe(false)
  })
})

describe('validators — isEmail / isUrl', () => {
  it('valide les e-mails', () => {
    expect(isEmail('a@b.com')).toBe(true)
    expect(isEmail('pas-un-email')).toBe(false)
    expect(isEmail('a@b')).toBe(false)
  })

  it('valide les URL http(s)', () => {
    expect(isUrl('https://exemple.com')).toBe(true)
    expect(isUrl('http://exemple.com/x')).toBe(true)
    expect(isUrl('ftp://exemple.com')).toBe(false)
    expect(isUrl('exemple.com')).toBe(false)
  })
})

describe('validators — validate', () => {
  it('retourne vide quand tout est valide', () => {
    const errors = validate(
      { name: 'Ada', email: 'ada@lovelace.dev' },
      { name: [{ required: true }], email: [{ email: true }] },
    )
    expect(errors).toEqual({})
  })

  it('signale un champ obligatoire manquant', () => {
    const errors = validate({ name: '' }, { name: [{ required: true }] })
    expect(errors.name).toBeTruthy()
  })

  it('ignore les règles optionnelles si valeur absente', () => {
    const errors = validate({ email: '' }, { email: [{ email: true }] })
    expect(errors).toEqual({})
  })

  it('applique la contrainte max', () => {
    const errors = validate({ name: 'abc' }, { name: [{ max: 2 }] })
    expect(errors.name).toContain('Maximum 2')
  })
})

describe('validators — backendErrorsToMap', () => {
  it('aplatit le premier message de chaque champ Laravel', () => {
    const map = backendErrorsToMap({ email: ['invalide', 'autre'], name: ['requis'] })
    expect(map).toEqual({ email: 'invalide', name: 'requis' })
  })

  it('retourne un objet vide sans erreur', () => {
    expect(backendErrorsToMap(null)).toEqual({})
  })
})
