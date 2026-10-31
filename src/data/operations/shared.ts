import { HISTORY_EVENT_TYPE, REQUEST_STATUS } from '../model/constants'
import type { RequestStatus } from '../model/constants'
import type { Category, Db, DbTables, FieldChange, HistoryEntry, Master, Request } from '../model/types'
import { categoriesRepo, mastersRepo, requestsRepo } from '../repositories'
import { commitDb, getDbState } from '../storage/store'
import { dbSchema } from '../validation/db-schema'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'

export const getDbOrThrow = (): Db => {
  const state = getDbState()

  if (state.status !== 'ready') {
    throw new RuleViolation(RULE_VIOLATION_CODE.dbUnavailable)
  }

  return state.db
}

export const findRequestOrThrow = (db: Db, requestId: string): Request => {
  const request = requestsRepo.findById(db, requestId)

  if (request === null) {
    throw new RuleViolation(RULE_VIOLATION_CODE.requestNotFound)
  }

  return request
}

export const getMasterOrThrow = (db: Db, masterId: string, categoryId: string): Master => {
  const master = mastersRepo.findById(db, masterId)

  if (master === null) {
    throw new RuleViolation(RULE_VIOLATION_CODE.unknownMaster)
  }

  if (!master.categoryIds.includes(categoryId)) {
    throw new RuleViolation(RULE_VIOLATION_CODE.categoryNotAllowed)
  }

  return master
}

export const getCategoryOrThrow = (db: Db, categoryId: string): Category => {
  const category = categoriesRepo.findById(db, categoryId)

  if (category === null) {
    throw new RuleViolation(RULE_VIOLATION_CODE.unknownCategory)
  }

  return category
}

export const isFinalStatus = (status: RequestStatus): boolean =>
  status === REQUEST_STATUS.done || status === REQUEST_STATUS.cancelled

export const createStatusChangedEntry = (
  requestId: string,
  userId: string,
  at: number,
  from: RequestStatus,
  to: RequestStatus,
): HistoryEntry => ({
  historyId: crypto.randomUUID(),
  requestId,
  createdAt: at,
  userId,
  type: HISTORY_EVENT_TYPE.statusChanged,
  from,
  to,
})

export const createMasterAssignedEntry = (
  requestId: string,
  userId: string,
  at: number,
  masterId: string,
): HistoryEntry => ({
  historyId: crypto.randomUUID(),
  requestId,
  createdAt: at,
  userId,
  type: HISTORY_EVENT_TYPE.masterAssigned,
  masterId,
})

export const createMasterChangedEntry = (
  requestId: string,
  userId: string,
  at: number,
  fromMasterId: string,
  toMasterId: string,
): HistoryEntry => ({
  historyId: crypto.randomUUID(),
  requestId,
  createdAt: at,
  userId,
  type: HISTORY_EVENT_TYPE.masterChanged,
  fromMasterId,
  toMasterId,
})

export const createFieldsChangedEntry = (
  requestId: string,
  userId: string,
  at: number,
  changes: FieldChange[],
): HistoryEntry => ({
  historyId: crypto.randomUUID(),
  requestId,
  createdAt: at,
  userId,
  type: HISTORY_EVENT_TYPE.fieldsChanged,
  changes,
})

export const saveRequest = async (db: Db, request: Request, extraTables: Partial<DbTables> = {}): Promise<Request> => {
  const nextDb: Db = {
    ...db,
    tables: {
      ...db.tables,
      ...extraTables,
      requests: db.tables.requests.map((item) => (item.requestId === request.requestId ? request : item)),
    },
  }

  await commitDb(dbSchema.parse(nextDb))

  return request
}
