import { PRIORITY, REQUEST_STATUS } from '../model/constants'
import type { RequestStatus } from '../model/constants'
import { formatCalendarDate, nowTimestamp } from '../model/dates'
import { normalizeEmail, normalizeOptionalText } from '../model/person'
import type { Client, Db, FieldChange, Request } from '../model/types'
import { categoriesRepo, clientsRepo } from '../repositories'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'
import { requestInputSchema } from './request-input'
import type { RequestInputData, RequestInputValues } from './request-input'
import {
  createFieldsChangedEntry,
  createMasterAssignedEntry,
  createMasterChangedEntry,
  createStatusChangedEntry,
  findRequestOrThrow,
  getCategoryOrThrow,
  getDbOrThrow,
  getMasterOrThrow,
  isFinalStatus,
  saveRequest,
} from './shared'

const EMPTY_VALUE = '-'

const toValue = (value: string | null): string => (value === null || value === '' ? EMPTY_VALUE : value)

const getCategoryName = (db: Db, categoryId: string): string =>
  categoriesRepo.findById(db, categoryId)?.name ?? EMPTY_VALUE

const collectChanges = (db: Db, client: Client, request: Request, values: RequestInputData): FieldChange[] => {
  const changes: FieldChange[] = []

  const push = (field: string, from: string, to: string): void => {
    if (from !== to) {
      changes.push({ field, from, to })
    }
  }

  push('firstName', toValue(client.firstName), toValue(values.firstName))
  push('lastName', toValue(client.lastName), toValue(normalizeOptionalText(values.lastName)))
  push('patronymic', toValue(client.patronymic), toValue(normalizeOptionalText(values.patronymic)))
  push('phone', client.phone, values.phone)
  push('email', toValue(client.email), toValue(normalizeEmail(values.email)))
  push('address', request.address, values.address)
  push('categoryId', getCategoryName(db, request.categoryId), getCategoryName(db, values.categoryId))
  push('description', request.description, values.description)
  push('priority', PRIORITY[request.priority], PRIORITY[values.priority])
  push('plannedDate', formatCalendarDate(request.plannedDate), formatCalendarDate(values.plannedDate))

  return changes
}

export const updateRequest = async (requestId: string, rawValues: RequestInputValues): Promise<Request> => {
  const db = getDbOrThrow()
  const request = findRequestOrThrow(db, requestId)

  if (isFinalStatus(request.status)) {
    throw new RuleViolation(RULE_VIOLATION_CODE.statusIsFinal)
  }

  const values = requestInputSchema.parse(rawValues)
  getCategoryOrThrow(db, values.categoryId)

  const client = clientsRepo.findById(db, request.clientId)

  if (client === null) {
    throw new RuleViolation(RULE_VIOLATION_CODE.requestNotFound)
  }

  const phoneOwner = clientsRepo.findByPhone(db, values.phone)

  if (phoneOwner !== null && phoneOwner.clientId !== client.clientId) {
    throw new RuleViolation(RULE_VIOLATION_CODE.phoneTaken)
  }

  const changes = collectChanges(db, client, request, values)
  const now = nowTimestamp()
  const userId = db.meta.userId
  const entries = changes.length === 0 ? [] : [createFieldsChangedEntry(request.requestId, userId, now, changes)]

  let nextStatus: RequestStatus = request.status

  if (values.masterId !== request.masterId) {
    if (request.masterId !== null && values.masterId === null) {
      throw new RuleViolation(RULE_VIOLATION_CODE.masterCannotBeRemoved)
    }

    if (values.masterId !== null) {
      getMasterOrThrow(db, values.masterId, values.categoryId)
    }

    if (request.masterId === null && values.masterId !== null) {
      entries.push(createMasterAssignedEntry(request.requestId, userId, now, values.masterId))
      entries.push(
        createStatusChangedEntry(request.requestId, userId, now, REQUEST_STATUS.new, REQUEST_STATUS.assigned),
      )
      nextStatus = REQUEST_STATUS.assigned
    } else if (request.masterId !== null && values.masterId !== null) {
      entries.push(createMasterChangedEntry(request.requestId, userId, now, request.masterId, values.masterId))
    }
  } else if (values.categoryId !== request.categoryId && request.masterId !== null) {
    getMasterOrThrow(db, request.masterId, values.categoryId)
  }

  if (entries.length === 0) {
    return request
  }

  const nextClient: Client = {
    ...client,
    firstName: values.firstName,
    lastName: normalizeOptionalText(values.lastName),
    patronymic: normalizeOptionalText(values.patronymic),
    phone: values.phone,
    email: normalizeEmail(values.email),
    lastAddress: values.address,
  }

  const nextRequest: Request = {
    ...request,
    address: values.address,
    categoryId: values.categoryId,
    description: values.description,
    priority: values.priority,
    plannedDate: values.plannedDate,
    masterId: values.masterId,
    status: nextStatus,
    updatedAt: now,
  }

  const nextClients = db.tables.clients.map((item) => (item.clientId === nextClient.clientId ? nextClient : item))

  return saveRequest(db, nextRequest, {
    clients: nextClients,
    history: [...db.tables.history, ...entries],
  })
}
