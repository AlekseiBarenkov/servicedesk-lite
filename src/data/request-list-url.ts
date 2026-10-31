import { PRIORITY_VALUES, REQUEST_STATUS_VALUES } from './model/constants'
import type { Priority, RequestStatus } from './model/constants'
import { DEFAULT_REQUEST_LIST_SORT, isRequestListSort } from './request-list'
import type { RequestListParams } from './request-list'

const URL_PARAM = {
  query: 'q',
  statuses: 'status',
  priorities: 'priority',
  masterIds: 'master',
  overdue: 'overdue',
  sort: 'sort',
  page: 'page',
} as const

const OVERDUE_VALUE = '1'

const parseList = (value: string | null): string[] => (value === null || value === '' ? [] : value.split(','))

const parseStatuses = (value: string | null): RequestStatus[] =>
  parseList(value).filter((item): item is RequestStatus => REQUEST_STATUS_VALUES.some((status) => status === item))

const parsePriorities = (value: string | null): Priority[] =>
  parseList(value)
    .map((item) => Number(item))
    .filter((item): item is Priority => PRIORITY_VALUES.some((priority) => priority === item))

const parsePage = (value: string | null): number => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export const readRequestListParams = (searchParams: URLSearchParams): RequestListParams => {
  const sort = searchParams.get(URL_PARAM.sort)

  return {
    query: searchParams.get(URL_PARAM.query) ?? '',
    statuses: parseStatuses(searchParams.get(URL_PARAM.statuses)),
    priorities: parsePriorities(searchParams.get(URL_PARAM.priorities)),
    masterIds: parseList(searchParams.get(URL_PARAM.masterIds)),
    overdueOnly: searchParams.get(URL_PARAM.overdue) === OVERDUE_VALUE,
    sort: sort !== null && isRequestListSort(sort) ? sort : DEFAULT_REQUEST_LIST_SORT,
    page: parsePage(searchParams.get(URL_PARAM.page)),
  }
}

export const writeRequestListParams = (params: RequestListParams): URLSearchParams => {
  const searchParams = new URLSearchParams()
  const query = params.query.trim()

  if (query !== '') {
    searchParams.set(URL_PARAM.query, query)
  }

  if (params.statuses.length > 0) {
    searchParams.set(URL_PARAM.statuses, params.statuses.join(','))
  }

  if (params.priorities.length > 0) {
    searchParams.set(URL_PARAM.priorities, params.priorities.join(','))
  }

  if (params.masterIds.length > 0) {
    searchParams.set(URL_PARAM.masterIds, params.masterIds.join(','))
  }

  if (params.overdueOnly) {
    searchParams.set(URL_PARAM.overdue, OVERDUE_VALUE)
  }

  if (params.sort !== DEFAULT_REQUEST_LIST_SORT) {
    searchParams.set(URL_PARAM.sort, params.sort)
  }

  if (params.page > 1) {
    searchParams.set(URL_PARAM.page, String(params.page))
  }

  return searchParams
}
