import { REQUEST_STATUS } from './constants'
import { isOverdue } from './dates'
import type { Request } from './types'

export const isRequestOverdue = (request: Request, today: string): boolean =>
  request.status !== REQUEST_STATUS.done &&
  request.status !== REQUEST_STATUS.cancelled &&
  isOverdue(request.plannedDate, today)
