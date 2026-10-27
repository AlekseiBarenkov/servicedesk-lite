import type { Db } from '../model/types'
import { createInitialDb } from '../seed/seed'
import { dbSchema } from '../validation/db-schema'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'
import { STORAGE_ISSUE, readDb, writeDb } from './storage'
import type { StorageIssue } from './storage'

export type DbStoreState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly db: Db }
  | { readonly status: 'failed'; readonly issue: StorageIssue; readonly details: string }

const listeners = new Set<() => void>()

const notify = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

let state: DbStoreState = { status: 'loading' }

const setState = (next: DbStoreState): void => {
  state = next
  notify()
}

const createValidatedDb = (): Db => dbSchema.parse(createInitialDb())

const saveDb = async (db: Db): Promise<void> => {
  try {
    await writeDb(db)
  } catch {
    throw new RuleViolation(RULE_VIOLATION_CODE.storageFailed)
  }
}

const loadInitialState = async (): Promise<DbStoreState> => {
  const stored = await readDb()

  if (stored.status === 'loaded') {
    return { status: 'ready', db: stored.db }
  }

  if (stored.status === 'broken') {
    return { status: 'failed', issue: stored.issue, details: stored.details }
  }

  let db: Db

  try {
    db = createValidatedDb()
  } catch {
    return {
      status: 'failed',
      issue: STORAGE_ISSUE.corrupted,
      details: 'Демо-данные не прошли проверку схемы.',
    }
  }

  try {
    await saveDb(db)
  } catch {
    return {
      status: 'failed',
      issue: STORAGE_ISSUE.unavailable,
      details: 'Браузер не разрешил запись в хранилище.',
    }
  }

  return { status: 'ready', db }
}

void loadInitialState().then(
  (loaded) => {
    setState(loaded)
  },
  () => {
    setState({
      status: 'failed',
      issue: STORAGE_ISSUE.unavailable,
      details: 'Не удалось инициализировать демо-данные.',
    })
  },
)

export const subscribeDb = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getDbState = (): DbStoreState => state

export const commitDb = async (next: Db): Promise<void> => {
  await saveDb(next)
  setState({ status: 'ready', db: next })
}

export const resetDb = async (): Promise<void> => {
  const db = createValidatedDb()
  await saveDb(db)
  setState({ status: 'ready', db })
}
