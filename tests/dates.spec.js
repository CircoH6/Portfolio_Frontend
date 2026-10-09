import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatMonthYear,
  formatYear,
  formatMonthYearLong,
  formatDateRange,
} from '@/utils/dates'

describe('dates — formatage ISO indépendant du fuseau', () => {
  it('formatDate : 2024-05-12 → "12 mai 2024"', () => {
    expect(formatDate('2024-05-12')).toBe('12 mai 2024')
  })

  it('formatMonthYear : format CV m/Y', () => {
    expect(formatMonthYear('2024-05-12')).toBe('05/2024')
    expect(formatMonthYear('2023-01-02')).toBe('01/2023')
  })

  it('formatYear', () => {
    expect(formatYear('2024-05-12')).toBe('2024')
  })

  it('formatMonthYearLong : "mai 2024"', () => {
    expect(formatMonthYearLong('2024-05-12')).toBe('mai 2024')
  })

  it('valeurs nulles → chaîne vide', () => {
    expect(formatDate(null)).toBe('')
    expect(formatMonthYear(undefined)).toBe('')
    expect(formatYear('')).toBe('')
  })
})

describe('dates — formatDateRange', () => {
  it('intervalle complet', () => {
    expect(formatDateRange({ start: '2023-05-01', end: '2024-05-01' })).toBe(
      'mai 2023 – mai 2024',
    )
  })

  it('en cours → "aujourd\'hui"', () => {
    expect(formatDateRange({ start: '2023-05-01', current: true })).toBe(
      "mai 2023 – aujourd'hui",
    )
    expect(formatDateRange({ current: true })).toBe("aujourd'hui")
  })

  it('format court (05/2023)', () => {
    expect(formatDateRange({ start: '2023-05-01', end: '2024-05-01' }, { short: true })).toBe(
      '05/2023 – 05/2024',
    )
  })

  it('sans dates → chaîne vide', () => {
    expect(formatDateRange({})).toBe('')
  })
})
