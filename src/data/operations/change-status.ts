import { REQUEST_STATUS } from '../model/constants'
import { nowTimestamp } from '../model/dates'
import type { Request } from '../model/types'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'
import {
  createMasterAssignedEntry,
  createStatusChangedEntry,
  findRequestOrThrow,
  getDbOrThrow,
  getMasterOrThrow,
  isFinalStatus,
  saveRequest,
} from './shared'

export type ChangeStatusInput =
  | { status: typeof REQUEST_STATUS.assigned; masterId: string }
  | { status: typeof REQUEST_STATUS.inProgress }
  | { status: typeof REQUEST_STATUS.done; resolution: string }
  | { status: typeof REQUEST_STATUS.cancelled; cancelReason: string }

const forbiddenTransition = (): RuleViolation => new RuleViolation(RULE_VIOLATION_CODE.statusTransitionForbidden)

export const changeStatus = async (requestId: string, input: ChangeStatusInput): Promise<Request> => {
  const db = getDbOrThrow()
  const request = findRequestOrThrow(db, requestId)

  if (isFinalStatus(request.status)) {
    throw new RuleViolation(RULE_VIOLATION_CODE.statusIsFinal)
  }

  const now = nowTimestamp()
  const userId = db.meta.userId

  if (input.status === REQUEST_STATUS.assigned) {
    if (request.status !== REQUEST_STATUS.new) {
      throw forbiddenTransition()
    }

    getMasterOrThrow(db, input.masterId, request.categoryId)

    const updated: Request = {
      ...request,
      masterId: input.masterId,
      status: REQUEST_STATUS.assigned,
      updatedAt: now,
    }

    const entries = [
      createMasterAssignedEntry(request.requestId, userId, now, input.masterId),
      createStatusChangedEntry(request.requestId, userId, now, REQUEST_STATUS.new, REQUEST_STATUS.assigned),
    ]

    return saveRequest(db, updated, { history: [...db.tables.history, ...entries] })
  }

  if (input.status === REQUEST_STATUS.inProgress) {
    if (request.status !== REQUEST_STATUS.assigned) {
      throw forbiddenTransition()
    }

    if (request.masterId === null) {
      throw new RuleViolation(RULE_VIOLATION_CODE.masterRequired)
    }

    const updated: Request = {
      ...request,
      status: REQUEST_STATUS.inProgress,
      updatedAt: now,
    }

    const entries = [
      createStatusChangedEntry(request.requestId, userId, now, REQUEST_STATUS.assigned, REQUEST_STATUS.inProgress),
    ]

    return saveRequest(db, updated, { history: [...db.tables.history, ...entries] })
  }

  if (input.status === REQUEST_STATUS.done) {
    if (request.status !== REQUEST_STATUS.inProgress) {
      throw forbiddenTransition()
    }

    const resolution = input.resolution.trim()

    if (resolution === '') {
      throw new RuleViolation(RULE_VIOLATION_CODE.resolutionRequired)
    }

    const updated: Request = {
      ...request,
      status: REQUEST_STATUS.done,
      resolution,
      completedAt: now,
      updatedAt: now,
    }

    const entries = [
      createStatusChangedEntry(request.requestId, userId, now, REQUEST_STATUS.inProgress, REQUEST_STATUS.done),
    ]

    return saveRequest(db, updated, { history: [...db.tables.history, ...entries] })
  }

  const cancelReason = input.cancelReason.trim()

  if (cancelReason === '') {
    throw new RuleViolation(RULE_VIOLATION_CODE.cancelReasonRequired)
  }

  const updated: Request = {
    ...request,
    status: REQUEST_STATUS.cancelled,
    cancelReason,
    updatedAt: now,
  }

  const entries = [createStatusChangedEntry(request.requestId, userId, now, request.status, REQUEST_STATUS.cancelled)]

  return saveRequest(db, updated, { history: [...db.tables.history, ...entries] })
}
