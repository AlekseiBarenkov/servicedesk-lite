import { z } from 'zod'

import { HISTORY_EVENT_TYPE, PRIORITY_VALUES, REQUEST_STATUS } from '../model/constants'
import { nowTimestamp } from '../model/dates'
import { normalizePhone } from '../model/phone'
import type { Client, Db, HistoryEntry, Request } from '../model/types'
import { categoriesRepo, clientsRepo, mastersRepo } from '../repositories'
import { commitDb, getDbState } from '../storage/store'
import { dbSchema } from '../validation/db-schema'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'
import { requiredText } from '../validation/schema'

const optionalInputText = z.string().transform((value) => {
  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
})

const phoneInputSchema = z.string().transform((value, ctx) => {
  const normalized = normalizePhone(value)

  if (normalized === null) {
    ctx.addIssue({ code: 'custom', message: 'Укажите телефон в формате +7 (999) 123-45-67' })
    return z.NEVER
  }

  return normalized
})

const emailInputSchema = z
  .string()
  .transform((value) => {
    const trimmed = value.trim().toLowerCase()

    return trimmed === '' ? null : trimmed
  })
  .pipe(z.email('Некорректный email').nullable())

export const createRequestInputSchema = z.object({
  firstName: requiredText('Укажите имя'),
  lastName: optionalInputText,
  patronymic: optionalInputText,
  phone: phoneInputSchema,
  email: emailInputSchema,
  address: requiredText('Укажите адрес выезда'),
  categoryId: requiredText('Выберите категорию'),
  description: requiredText('Опишите неисправность'),
  priority: z.literal(PRIORITY_VALUES),
  masterId: z.string().nullable(),
  plannedDate: z.iso.date('Некорректная плановая дата').nullable(),
})

export type CreateRequestFormValues = z.input<typeof createRequestInputSchema>
export type CreateRequestValues = z.output<typeof createRequestInputSchema>

const formatRequestNumber = (value: number): string => `SD-${String(value).padStart(4, '0')}`

const buildClient = (values: CreateRequestValues, existingClient: Client | null): Client => ({
  clientId: existingClient === null ? crypto.randomUUID() : existingClient.clientId,
  firstName: values.firstName,
  lastName: values.lastName,
  patronymic: values.patronymic,
  phone: values.phone,
  email: values.email,
  lastAddress: values.address,
})

const buildHistory = (values: CreateRequestValues, userId: string, at: number): HistoryEntry[] => {
  const entries: HistoryEntry[] = [
    {
      historyId: crypto.randomUUID(),
      createdAt: at,
      userId,
      type: HISTORY_EVENT_TYPE.created,
    },
  ]

  if (values.masterId !== null) {
    entries.push({
      historyId: crypto.randomUUID(),
      createdAt: at,
      userId,
      type: HISTORY_EVENT_TYPE.masterAssigned,
      masterId: values.masterId,
    })
  }

  return entries
}
export const createRequest = async (rawValues: CreateRequestFormValues): Promise<Request> => {
  const state = getDbState()

  if (state.status !== 'ready') {
    throw new RuleViolation(RULE_VIOLATION_CODE.dbUnavailable)
  }

  const db = state.db
  const values = createRequestInputSchema.parse(rawValues)

  if (categoriesRepo.findById(db, values.categoryId) === null) {
    throw new RuleViolation(RULE_VIOLATION_CODE.unknownCategory)
  }

  if (values.masterId !== null) {
    const master = mastersRepo.findById(db, values.masterId)

    if (master === null) {
      throw new RuleViolation(RULE_VIOLATION_CODE.unknownMaster)
    }

    if (!master.categoryIds.includes(values.categoryId)) {
      throw new RuleViolation(RULE_VIOLATION_CODE.categoryNotAllowed)
    }
  }

  const existingClient = clientsRepo.findByPhone(db, values.phone)
  const client = buildClient(values, existingClient)
  const number = formatRequestNumber(db.meta.nextRequestNumber)

  if (db.tables.requests.some((request) => request.number === number)) {
    throw new RuleViolation(RULE_VIOLATION_CODE.numberTaken)
  }

  const now = nowTimestamp()
  const request: Request = {
    requestId: crypto.randomUUID(),
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
    comments: [],
    history: buildHistory(values, db.meta.userId, now),
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
    },
    meta: {
      ...db.meta,
      nextRequestNumber: db.meta.nextRequestNumber + 1,
    },
  }

  await commitDb(dbSchema.parse(nextDb))

  return request
}
