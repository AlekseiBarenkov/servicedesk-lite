import type { Priority, RequestStatus } from './model/constants'
import { todayCalendarDate } from './model/dates'
import { formatPersonName } from './model/person'
import { extractPhoneDigits } from './model/phone'
import { isRequestOverdue } from './model/request'
import type { Client, Db, Request } from './model/types'

export const REQUEST_LIST_SORT = {
  createdAtAsc: 'createdAt_asc',
  createdAtDesc: 'createdAt_desc',
  plannedDateAsc: 'plannedDate_asc',
  plannedDateDesc: 'plannedDate_desc',
} as const

export type RequestListSort = (typeof REQUEST_LIST_SORT)[keyof typeof REQUEST_LIST_SORT]

export const REQUEST_LIST_SORT_VALUES = [
  REQUEST_LIST_SORT.createdAtAsc,
  REQUEST_LIST_SORT.createdAtDesc,
  REQUEST_LIST_SORT.plannedDateAsc,
  REQUEST_LIST_SORT.plannedDateDesc,
] as const

export const DEFAULT_REQUEST_LIST_SORT: RequestListSort = REQUEST_LIST_SORT.createdAtDesc

export const isRequestListSort = (value: string): value is RequestListSort =>
  REQUEST_LIST_SORT_VALUES.some((sort) => sort === value)

export const REQUEST_LIST_PAGE_SIZE = 10

export type RequestListParams = {
  query: string
  statuses: RequestStatus[]
  priorities: Priority[]
  masterIds: string[]
  overdueOnly: boolean
  sort: RequestListSort
  page: number
}

export type RequestListSelection = {
  items: Request[]
  total: number
  page: number
  pageCount: number
}

export const createDefaultRequestListParams = (): RequestListParams => ({
  query: '',
  statuses: [],
  priorities: [],
  masterIds: [],
  overdueOnly: false,
  sort: DEFAULT_REQUEST_LIST_SORT,
  page: 1,
})

const matchesQuery = (client: Client | null, request: Request, query: string): boolean => {
  if (query === '') {
    return true
  }

  if (request.number.toLowerCase().includes(query)) {
    return true
  }

  if (client === null) {
    return false
  }

  if (formatPersonName(client).toLowerCase().includes(query)) {
    return true
  }

  const queryDigits = extractPhoneDigits(query)

  return queryDigits !== '' && client.phone.includes(queryDigits)
}

const matchesFilters = (request: Request, params: RequestListParams, today: string): boolean => {
  if (params.statuses.length > 0 && !params.statuses.includes(request.status)) {
    return false
  }

  if (params.priorities.length > 0 && !params.priorities.includes(request.priority)) {
    return false
  }

  if (params.masterIds.length > 0 && (request.masterId === null || !params.masterIds.includes(request.masterId))) {
    return false
  }

  return !params.overdueOnly || isRequestOverdue(request, today)
}

const comparePlannedDates = (left: Request, right: Request, direction: number): number => {
  if (left.plannedDate === null && right.plannedDate === null) {
    return 0
  }

  if (left.plannedDate === null) {
    return 1
  }

  if (right.plannedDate === null) {
    return -1
  }

  if (left.plannedDate === right.plannedDate) {
    return 0
  }

  return left.plannedDate < right.plannedDate ? -direction : direction
}

const sortRequests = (requests: Request[], sort: RequestListSort): Request[] => {
  const sorted = [...requests]

  if (sort === REQUEST_LIST_SORT.createdAtAsc) {
    sorted.sort((left, right) => left.createdAt - right.createdAt)
    return sorted
  }

  if (sort === REQUEST_LIST_SORT.createdAtDesc) {
    sorted.sort((left, right) => right.createdAt - left.createdAt)
    return sorted
  }

  if (sort === REQUEST_LIST_SORT.plannedDateAsc) {
    sorted.sort((left, right) => comparePlannedDates(left, right, 1))
    return sorted
  }

  sorted.sort((left, right) => comparePlannedDates(left, right, -1))
  return sorted
}

export const selectRequestList = (db: Db, params: RequestListParams): RequestListSelection => {
  const today = todayCalendarDate()
  const query = params.query.trim().toLowerCase()
  const clientsById = new Map(db.tables.clients.map((client) => [client.clientId, client] as const))

  const filtered = db.tables.requests.filter((request) => {
    const client = clientsById.get(request.clientId) ?? null

    return matchesQuery(client, request, query) && matchesFilters(request, params, today)
  })

  const sorted = sortRequests(filtered, params.sort)
  const pageCount = Math.max(1, Math.ceil(sorted.length / REQUEST_LIST_PAGE_SIZE))
  const page = Math.min(Math.max(1, params.page), pageCount)
  const start = (page - 1) * REQUEST_LIST_PAGE_SIZE

  return {
    items: sorted.slice(start, start + REQUEST_LIST_PAGE_SIZE),
    total: sorted.length,
    page,
    pageCount,
  }
}
