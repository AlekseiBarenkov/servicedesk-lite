import type { Person } from './types'

export const formatPersonName = (person: Person): string => {
  return [person.lastName, person.firstName, person.patronymic]
    .filter((part): part is string => part !== null)
    .join(' ')
}

export const normalizeOptionalText = (value: string): string | null => (value === '' ? null : value)

export const normalizeEmail = (value: string): string | null => (value === '' ? null : value.toLowerCase())
