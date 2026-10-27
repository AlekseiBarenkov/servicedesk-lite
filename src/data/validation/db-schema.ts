import { z } from 'zod'

import { categorySchema, clientSchema, masterSchema, requestSchema, userSchema } from './schema'
import type { Db, DbMeta, DbTables } from '../model/types'

const dbTablesSchema: z.ZodType<DbTables> = z.object({
  users: z.array(userSchema),
  clients: z.array(clientSchema),
  masters: z.array(masterSchema),
  categories: z.array(categorySchema),
  requests: z.array(requestSchema),
})

const dbMetaSchema: z.ZodType<DbMeta> = z.object({
  userId: z.string().trim().min(1, 'Идентификатор пользователя обязателен'),
  nextRequestNumber: z.number().int().min(1),
})

export const dbSchema: z.ZodType<Db> = z
  .object({
    schemaVersion: z.number().int().nonnegative(),
    tables: dbTablesSchema,
    meta: dbMetaSchema,
  })
  .superRefine((db, ctx) => {
    const { users, clients, masters, categories, requests } = db.tables

    const userIds = new Set(users.map((user) => user.userId))
    const clientIds = new Set(clients.map((client) => client.clientId))
    const categoryIds = new Set(categories.map((category) => category.categoryId))
    const mastersById = new Map(masters.map((master) => [master.masterId, master] as const))

    if (!userIds.has(db.meta.userId)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Текущий пользователь отсутствует в справочнике',
        path: ['meta', 'userId'],
      })
    }

    for (const [index, master] of masters.entries()) {
      for (const categoryId of master.categoryIds) {
        if (!categoryIds.has(categoryId)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Мастер обслуживает категорию, которой нет в справочнике',
            path: ['tables', 'masters', index, 'categoryIds'],
          })
        }
      }
    }

    const usedNumbers = new Set<string>()

    for (const [index, request] of requests.entries()) {
      if (usedNumbers.has(request.number)) {
        ctx.addIssue({
          code: 'custom',
          message: `Номер ${request.number} уже используется`,
          path: ['tables', 'requests', index, 'number'],
        })
      }
      usedNumbers.add(request.number)

      if (!clientIds.has(request.clientId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Клиент заявки отсутствует в справочнике',
          path: ['tables', 'requests', index, 'clientId'],
        })
      }

      if (!categoryIds.has(request.categoryId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Категория заявки отсутствует в справочнике',
          path: ['tables', 'requests', index, 'categoryId'],
        })
      }

      if (request.masterId !== null) {
        const master = mastersById.get(request.masterId)

        if (master === undefined) {
          ctx.addIssue({
            code: 'custom',
            message: 'Мастер заявки отсутствует в справочнике',
            path: ['tables', 'requests', index, 'masterId'],
          })
        } else if (!master.categoryIds.includes(request.categoryId)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Мастер не обслуживает выбранную категорию',
            path: ['tables', 'requests', index, 'categoryId'],
          })
        }
      }

      for (const [commentIndex, comment] of request.comments.entries()) {
        if (!userIds.has(comment.userId)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Автор комментария отсутствует в справочнике',
            path: ['tables', 'requests', index, 'comments', commentIndex, 'userId'],
          })
        }
      }

      for (const [historyIndex, entry] of request.history.entries()) {
        if (!userIds.has(entry.userId)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Автор события отсутствует в справочнике',
            path: ['tables', 'requests', index, 'history', historyIndex, 'userId'],
          })
        }
      }
    }
  })
