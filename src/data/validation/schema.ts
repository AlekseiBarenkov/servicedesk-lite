import { z } from 'zod'

import { HISTORY_EVENT_TYPE, PRIORITY_VALUES, REQUEST_STATUS, REQUEST_STATUS_VALUES } from '../model/constants'
import type { RequestStatus } from '../model/constants'
import { PHONE_NORMALIZED_PATTERN } from '../model/phone'
import type { Category, Client, Comment, FieldChange, HistoryEntry, Master, Request, User } from '../model/types'

const idSchema = z.string().min(1, 'Идентификатор обязателен')
const timestampSchema = z.number().int().nonnegative()
const statusSchema: z.ZodType<RequestStatus> = z.enum(REQUEST_STATUS_VALUES)

export const requiredText = (message: string) => z.string().trim().min(1, message)
const nullableText = (message: string) => requiredText(message).nullable()

const personSchema = z.object({
  firstName: requiredText('Укажите имя'),
  lastName: nullableText('Фамилия не может быть пустой'),
  patronymic: nullableText('Отчество не может быть пустым'),
  phone: z.string().regex(PHONE_NORMALIZED_PATTERN, 'Телефон должен быть в формате +7XXXXXXXXXX'),
  email: z.email('Некорректный email').nullable(),
})

export const userSchema: z.ZodType<User> = personSchema.extend({
  userId: idSchema,
})

export const clientSchema: z.ZodType<Client> = personSchema.extend({
  clientId: idSchema,
  lastAddress: requiredText('Укажите адрес'),
})

export const categorySchema: z.ZodType<Category> = z.object({
  categoryId: idSchema,
  name: requiredText('Название категории обязательно'),
})

export const masterSchema: z.ZodType<Master> = personSchema.extend({
  masterId: idSchema,
  categoryIds: z.array(idSchema).min(1, 'У мастера должна быть хотя бы одна категория'),
})

export const commentSchema: z.ZodType<Comment> = z.object({
  commentId: idSchema,
  requestId: idSchema,
  userId: idSchema,
  text: requiredText('Комментарий не может быть пустым'),
  createdAt: timestampSchema,
})

const fieldChangeSchema: z.ZodType<FieldChange> = z.object({
  field: requiredText('Не указано изменённое поле'),
  from: z.string(),
  to: z.string(),
})

const historyEntryBaseSchema = z.object({
  historyId: idSchema,
  requestId: idSchema,
  createdAt: timestampSchema,
  userId: idSchema,
})

export const historyEntrySchema: z.ZodType<HistoryEntry> = z.discriminatedUnion('type', [
  historyEntryBaseSchema.extend({ type: z.literal(HISTORY_EVENT_TYPE.created) }),
  historyEntryBaseSchema.extend({
    type: z.literal(HISTORY_EVENT_TYPE.fieldsChanged),
    changes: z.array(fieldChangeSchema).min(1, 'Список изменений не может быть пустым'),
  }),
  historyEntryBaseSchema.extend({
    type: z.literal(HISTORY_EVENT_TYPE.statusChanged),
    from: statusSchema,
    to: statusSchema,
  }),
  historyEntryBaseSchema.extend({
    type: z.literal(HISTORY_EVENT_TYPE.masterAssigned),
    masterId: idSchema,
  }),
  historyEntryBaseSchema.extend({
    type: z.literal(HISTORY_EVENT_TYPE.masterChanged),
    fromMasterId: idSchema,
    toMasterId: idSchema,
  }),
])

export const requestSchema: z.ZodType<Request> = z
  .object({
    requestId: idSchema,
    clientId: idSchema,
    masterId: idSchema.nullable(),
    categoryId: idSchema,
    number: z.string().regex(/^SD-\d{4,}$/, 'Номер должен быть в формате SD-0001'),
    address: requiredText('Укажите адрес выезда'),
    priority: z.literal(PRIORITY_VALUES),
    description: requiredText('Опишите неисправность'),
    plannedDate: z.iso.date('Некорректная плановая дата').nullable(),
    status: statusSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    completedAt: timestampSchema.nullable(),
    cancelReason: nullableText('Причина отмены не может быть пустой'),
    resolution: nullableText('Результат не может быть пустым'),
  })
  .superRefine((request, ctx) => {
    const addIssue = (message: string, field: keyof Request): void => {
      ctx.addIssue({ code: 'custom', message, path: [field] })
    }

    if (request.updatedAt < request.createdAt) {
      addIssue('Дата обновления не может быть раньше даты создания', 'updatedAt')
    }

    if (request.status === REQUEST_STATUS.new) {
      if (request.masterId !== null) {
        addIssue('У новой заявки не может быть мастера', 'masterId')
      }
      if (request.completedAt !== null) {
        addIssue('У новой заявки не может быть даты завершения', 'completedAt')
      }
      if (request.resolution !== null) {
        addIssue('У новой заявки не может быть результата', 'resolution')
      }
      if (request.cancelReason !== null) {
        addIssue('У новой заявки не может быть причины отмены', 'cancelReason')
      }
      return
    }

    if (request.status === REQUEST_STATUS.assigned || request.status === REQUEST_STATUS.inProgress) {
      if (request.masterId === null) {
        addIssue('Назначенная заявка должна иметь мастера', 'masterId')
      }
      return
    }

    if (request.status === REQUEST_STATUS.done) {
      if (request.completedAt === null) {
        addIssue('У выполненной заявки должна быть дата завершения', 'completedAt')
      }
      if (request.resolution === null) {
        addIssue('У выполненной заявки должен быть результат', 'resolution')
      }
      if (request.cancelReason !== null) {
        addIssue('У выполненной заявки не может быть причины отмены', 'cancelReason')
      }
      return
    }

    if (request.cancelReason === null) {
      addIssue('У отменённой заявки должна быть причина отмены', 'cancelReason')
    }
    if (request.completedAt !== null) {
      addIssue('У отменённой заявки не может быть даты завершения', 'completedAt')
    }
    if (request.resolution !== null) {
      addIssue('У отменённой заявки не может быть результата', 'resolution')
    }
  })
