import type { ZodError } from 'zod'

import { DB_SCHEMA_VERSION } from '../model/constants'
import type { Db } from '../model/types'
import { dbSchema } from '../validation/db-schema'

export const STORAGE_ISSUE = {
  unavailable: 'unavailable',
  corrupted: 'corrupted',
  version: 'version',
} as const

export type StorageIssue = (typeof STORAGE_ISSUE)[keyof typeof STORAGE_ISSUE]

export type DbReadResult =
  { status: 'loaded'; db: Db } | { status: 'missing' } | { status: 'broken'; issue: StorageIssue; details: string }

export class StorageError extends Error {
  constructor() {
    super('Браузер не разрешил работу с хранилищем.')
    this.name = 'StorageError'
  }
}

const IDB_NAME = 'servicedesk-lite'
const IDB_VERSION = 1
const IDB_STORE = 'db'
const IDB_RECORD_KEY = 'current'

let databasePromise: Promise<IDBDatabase> | null = null

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(IDB_STORE)) {
        database.createObjectStore(IDB_STORE)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new StorageError())
    }

    request.onblocked = () => {
      reject(new StorageError())
    }
  })

const getDatabase = (): Promise<IDBDatabase> => {
  if (databasePromise === null) {
    databasePromise = openDatabase().catch(() => {
      databasePromise = null
      throw new StorageError()
    })
  }

  return databasePromise
}

const readRecord = async (): Promise<unknown | null> => {
  const database = await getDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDB_STORE, 'readonly')
    const request: IDBRequest<unknown> = transaction.objectStore(IDB_STORE).get(IDB_RECORD_KEY)

    request.onsuccess = () => {
      resolve(request.result === undefined ? null : request.result)
    }

    request.onerror = () => {
      reject(new StorageError())
    }
  })
}

const writeRecord = async (db: Db): Promise<void> => {
  const database = await getDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(IDB_STORE, 'readwrite')
    transaction.objectStore(IDB_STORE).put(db, IDB_RECORD_KEY)

    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject(new StorageError())
    }

    transaction.onabort = () => {
      reject(new StorageError())
    }
  })
}

const readSchemaVersion = (value: unknown): number | null => {
  if (typeof value !== 'object' || value === null || !('schemaVersion' in value)) {
    return null
  }

  const { schemaVersion } = value

  return typeof schemaVersion === 'number' ? schemaVersion : null
}

const describeIssues = (error: ZodError): string => {
  if (error.issues.length === 0) {
    return 'Данные демо не прошли проверку.'
  }

  return `Данные демо не прошли проверку: ${error.issues[0].message}`
}

export const readDb = async (): Promise<DbReadResult> => {
  let stored: unknown | null

  try {
    stored = await readRecord()
  } catch {
    return {
      status: 'broken',
      issue: STORAGE_ISSUE.unavailable,
      details: 'Браузер не разрешил чтение из хранилища.',
    }
  }

  if (stored === null) {
    return { status: 'missing' }
  }

  const schemaVersion = readSchemaVersion(stored)

  if (schemaVersion !== null && schemaVersion !== DB_SCHEMA_VERSION) {
    return {
      status: 'broken',
      issue: STORAGE_ISSUE.version,
      details: `Несовместимая версия данных: ожидается ${DB_SCHEMA_VERSION}, найдена ${schemaVersion}.`,
    }
  }

  const parsedDb = dbSchema.safeParse(stored)

  if (!parsedDb.success) {
    return {
      status: 'broken',
      issue: STORAGE_ISSUE.corrupted,
      details: describeIssues(parsedDb.error),
    }
  }

  return { status: 'loaded', db: parsedDb.data }
}

export const writeDb = async (db: Db): Promise<void> => {
  await writeRecord(db)
}
