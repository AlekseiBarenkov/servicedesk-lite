import type { Person } from './types'

export const formatPersonName = (person: Person): string => {
  return [person.lastName, person.firstName, person.patronymic]
    .filter((part): part is string => part !== null)
    .join(' ')
}
