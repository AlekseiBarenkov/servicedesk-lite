import { HISTORY_EVENT_TYPE, REQUEST_STATUS } from '../model/constants'
import { nowTimestamp } from '../model/dates'
import { normalizeEmail, normalizeOptionalText } from '../model/person'
import type { Client, Db, HistoryEntry, Request } from '../model/types'
import { clientsRepo } from '../repositories'
import { commitDb } from '../storage/store'
import { dbSchema } from '../validation/db-schema'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'
import { requestInputSchema } from './request-input'
import type { RequestInputData, RequestInputValues } from './request-input'
import { getCategoryOrThrow, getDbOrThrow, getMasterOrThrow } from './shared'

const formatRequestNumber = (value: number): string => `SD-${String(value).padStart(4, '0')}`

const buildClient = (values: RequestInputData, existingClient: Client | null): Client => ({
  clientId: existingClient === null ? crypto.randomUUID() : existingClient.clientId,
  firstName: values.firstName,
  lastName: normalizeOptionalText(values.lastName),
  patronymic: normalizeOptionalText(values.patronymic),
  phone: values.phone,
  email: normalizeEmail(values.email),
  lastAddress: values.address,
})

const buildHistory = (requestId: string, values: RequestInputData, userId: string, at: number): HistoryEntry[] => {
  const entries: HistoryEntry[] = [
    {
      historyId: crypto.randomUUID(),
      requestId,
      createdAt: at,
      userId,
      type: HISTORY_EVENT_TYPE.created,
    },
  ]

  if (values.masterId !== null) {
    entries.push({
      historyId: crypto.randomUUID(),
      requestId,
      createdAt: at,
      userId,
      type: HISTORY_EVENT_TYPE.masterAssigned,
      masterId: values.masterId,
    })
  }

  return entries
}

export const createRequest = async (rawValues: RequestInputValues): Promise<Request> => {
  const db = getDbOrThrow()
  const values = requestInputSchema.parse(rawValues)

  getCategoryOrThrow(db, values.categoryId)

  if (values.masterId !== null) {
    getMasterOrThrow(db, values.masterId, values.categoryId)
  }

  const existingClient = clientsRepo.findByPhone(db, values.phone)
  const client = buildClient(values, existingClient)
  const number = formatRequestNumber(db.meta.nextRequestNumber)

  if (db.tables.requests.some((request) => request.number === number)) {
    throw new RuleViolation(RULE_VIOLATION_CODE.numberTaken)
  }

  const now = nowTimestamp()
  const requestId = crypto.randomUUID()
  const request: Request = {
    requestId,
    clientId: client.clientId,
    masterId: values.masterId,
    categoryId: values.categoryId,
    number,
    address: values.address,
    priority: values.priority,
    description: values.description,
    plannedDate: values.plannedDate,
    status: values.masterId === null ? REQUEST_STATUS.new : REQUEST_STATUS.assigned,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelReason: null,
    resolution: null,
  }

  const nextDb: Db = {
    ...db,
    tables: {
      ...db.tables,
      clients:
        existingClient === null
          ? [...db.tables.clients, client]
          : db.tables.clients.map((item) => (item.clientId === client.clientId ? client : item)),
      requests: [...db.tables.requests, request],
      history: [...db.tables.history, ...buildHistory(requestId, values, db.meta.userId, now)],
    },
    meta: {
      ...db.meta,
      nextRequestNumber: db.meta.nextRequestNumber + 1,
    },
  }

  await commitDb(dbSchema.parse(nextDb))

  return request
}
