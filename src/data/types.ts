import type { HISTORY_EVENT_TYPE, Priority, RequestStatus } from './constants'

export type Person = {
  lastName: string | null
  firstName: string
  patronymic: string | null
  phone: string
  email: string | null
}

export type User = Person & {
  userId: string
}

export type Client = Person & {
  clientId: string
  lastAddress: string
}

export type Category = {
  categoryId: string
  name: string
}

export type Master = Person & {
  masterId: string
  categoryIds: Category['categoryId'][]
}

export type Comment = {
  commentId: string
  userId: User['userId']
  text: string
  createdAt: number
}

export type FieldChange = {
  field: string
  from: string
  to: string
}

type HistoryEntryBase = {
  historyId: string
  createdAt: number
  userId: User['userId']
}

export type CreatedHistoryEntry = HistoryEntryBase & {
  type: typeof HISTORY_EVENT_TYPE.created
}

export type FieldsChangedHistoryEntry = HistoryEntryBase & {
  type: typeof HISTORY_EVENT_TYPE.fieldsChanged
  changes: FieldChange[]
}

export type StatusChangedHistoryEntry = HistoryEntryBase & {
  type: typeof HISTORY_EVENT_TYPE.statusChanged
  from: RequestStatus
  to: RequestStatus
}

export type MasterAssignedHistoryEntry = HistoryEntryBase & {
  type: typeof HISTORY_EVENT_TYPE.masterAssigned
  masterId: Master['masterId']
}

export type MasterChangedHistoryEntry = HistoryEntryBase & {
  type: typeof HISTORY_EVENT_TYPE.masterChanged
  fromMasterId: Master['masterId']
  toMasterId: Master['masterId']
}

export type HistoryEntry =
  | CreatedHistoryEntry
  | FieldsChangedHistoryEntry
  | StatusChangedHistoryEntry
  | MasterAssignedHistoryEntry
  | MasterChangedHistoryEntry

export type Request = {
  requestId: string
  clientId: Client['clientId']
  masterId: Master['masterId'] | null
  categoryId: Category['categoryId']
  number: string
  address: string
  priority: Priority
  description: string
  plannedDate: string | null
  status: RequestStatus
  createdAt: number
  updatedAt: number
  completedAt: number | null
  cancelReason: string | null
  resolution: string | null
  comments: Comment[]
  history: HistoryEntry[]
}

export type DbMeta = {
  userId: User['userId']
  nextRequestNumber: number
}

export type DbTables = {
  users: User[]
  clients: Client[]
  masters: Master[]
  categories: Category[]
  requests: Request[]
}

export type Db = {
  schemaVersion: number
  tables: DbTables
  meta: DbMeta
}
