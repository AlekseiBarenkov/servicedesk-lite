export const DB_SCHEMA_VERSION = 1

export const PRIORITY = {
  1: 'Низкий',
  2: 'Обычный',
  3: 'Высокий',
  4: 'Срочный',
  5: 'Аварийный',
} as const

export type Priority = keyof typeof PRIORITY

export const PRIORITY_VALUES = [1, 2, 3, 4, 5] as const satisfies readonly Priority[]

export const REQUEST_STATUS = {
  new: 'new',
  assigned: 'assigned',
  inProgress: 'in_progress',
  done: 'done',
  cancelled: 'cancelled',
} as const

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS]

export const REQUEST_STATUS_VALUES = [
  REQUEST_STATUS.new,
  REQUEST_STATUS.assigned,
  REQUEST_STATUS.inProgress,
  REQUEST_STATUS.done,
  REQUEST_STATUS.cancelled,
] as const

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Новая',
  assigned: 'Назначена',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export const HISTORY_EVENT_TYPE = {
  created: 'created',
  fieldsChanged: 'fields_changed',
  statusChanged: 'status_changed',
  masterAssigned: 'master_assigned',
  masterChanged: 'master_changed',
} as const

export type HistoryEventType = (typeof HISTORY_EVENT_TYPE)[keyof typeof HISTORY_EVENT_TYPE]
