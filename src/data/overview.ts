import { REQUEST_STATUS } from './model/constants'
import { isSameLocalMonth, nowTimestamp } from './model/dates'
import { isRequestOverdue } from './model/request'
import type { Db, Request } from './model/types'

const ACTIVE_STATUSES: readonly Request['status'][] = [
  REQUEST_STATUS.new,
  REQUEST_STATUS.assigned,
  REQUEST_STATUS.inProgress,
]

const FINAL_STATUSES: readonly Request['status'][] = [REQUEST_STATUS.done, REQUEST_STATUS.cancelled]

export const OVERVIEW_UPCOMING_LIMIT = 5

export type OverviewMetrics = {
  newCount: number
  activeCount: number
  overdueCount: number
  doneThisMonthCount: number
}

export type OverviewSelection = {
  metrics: OverviewMetrics
  upcoming: Request[]
}

const isUpcoming = (request: Request): boolean =>
  request.plannedDate !== null && !FINAL_STATUSES.includes(request.status)

const comparePlannedDates = (left: Request, right: Request): number => {
  if (left.plannedDate === null || right.plannedDate === null) {
    return 0
  }

  if (left.plannedDate === right.plannedDate) {
    return left.createdAt - right.createdAt
  }

  return left.plannedDate < right.plannedDate ? -1 : 1
}

export const selectOverview = (db: Db, today: string, now: number = nowTimestamp()): OverviewSelection => {
  const { requests } = db.tables

  const metrics: OverviewMetrics = {
    newCount: requests.filter((request) => request.status === REQUEST_STATUS.new).length,
    activeCount: requests.filter((request) => ACTIVE_STATUSES.includes(request.status)).length,
    overdueCount: requests.filter((request) => isRequestOverdue(request, today)).length,
    doneThisMonthCount: requests.filter(
      (request) =>
        request.status === REQUEST_STATUS.done &&
        request.completedAt !== null &&
        isSameLocalMonth(request.completedAt, now),
    ).length,
  }

  const upcoming = requests.filter(isUpcoming).sort(comparePlannedDates).slice(0, OVERVIEW_UPCOMING_LIMIT)

  return { metrics, upcoming }
}
