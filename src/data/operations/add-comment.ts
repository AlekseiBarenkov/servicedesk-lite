import { nowTimestamp } from '../model/dates'
import type { Comment, Request } from '../model/types'
import { RULE_VIOLATION_CODE, RuleViolation } from '../validation/rules'
import { findRequestOrThrow, getDbOrThrow, saveRequest } from './shared'

export const addComment = async (requestId: string, text: string): Promise<Request> => {
  const db = getDbOrThrow()
  const request = findRequestOrThrow(db, requestId)
  const trimmedText = text.trim()

  if (trimmedText === '') {
    throw new RuleViolation(RULE_VIOLATION_CODE.commentRequired)
  }

  const now = nowTimestamp()
  const comment: Comment = {
    commentId: crypto.randomUUID(),
    requestId: request.requestId,
    userId: db.meta.userId,
    text: trimmedText,
    createdAt: now,
  }

  const updated: Request = {
    ...request,
    updatedAt: now,
  }

  return saveRequest(db, updated, { comments: [...db.tables.comments, comment] })
}
