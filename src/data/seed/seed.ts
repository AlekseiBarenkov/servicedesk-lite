import { DB_SCHEMA_VERSION } from '../model/constants'
import type { Db } from '../model/types'
import { SEED_CATEGORIES, SEED_CLIENTS, SEED_MASTERS, SEED_USER } from './seed-data'

export const createInitialDb = (): Db => {
  const userId = crypto.randomUUID()

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    tables: {
      users: [{ ...SEED_USER, userId }],
      clients: [...SEED_CLIENTS],
      masters: [...SEED_MASTERS],
      categories: [...SEED_CATEGORIES],
      requests: [],
    },
    meta: {
      userId,
      nextRequestNumber: 1,
    },
  }
}
