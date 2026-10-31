import type { Category, Client, Db, Master, Request } from './model/types'

export const requestsRepo = {
  findById: (db: Db, requestId: string): Request | null =>
    db.tables.requests.find((request) => request.requestId === requestId) ?? null,
}

export const clientsRepo = {
  findById: (db: Db, clientId: string): Client | null =>
    db.tables.clients.find((client) => client.clientId === clientId) ?? null,
  findByPhone: (db: Db, phone: string): Client | null =>
    db.tables.clients.find((client) => client.phone === phone) ?? null,
  listByPhonePart: (db: Db, digits: string): Client[] =>
    digits === '' ? [] : db.tables.clients.filter((client) => client.phone.includes(digits)),
}

export const mastersRepo = {
  list: (db: Db): Master[] => db.tables.masters,
  findById: (db: Db, masterId: string): Master | null =>
    db.tables.masters.find((master) => master.masterId === masterId) ?? null,
  listByCategory: (db: Db, categoryId: string): Master[] =>
    db.tables.masters.filter((master) => master.categoryIds.includes(categoryId)),
}

export const categoriesRepo = {
  list: (db: Db): Category[] => db.tables.categories,
  findById: (db: Db, categoryId: string): Category | null =>
    db.tables.categories.find((category) => category.categoryId === categoryId) ?? null,
}
