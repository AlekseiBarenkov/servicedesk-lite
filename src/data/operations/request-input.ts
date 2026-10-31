import { z } from 'zod'

import { PRIORITY_VALUES } from '../model/constants'
import { normalizePhone } from '../model/phone'
import { requiredText } from '../validation/schema'

const optionalInputText = z.string().trim()

const phoneInputSchema = z.string().transform((value, ctx) => {
  const normalized = normalizePhone(value)

  if (normalized === null) {
    ctx.addIssue({ code: 'custom', message: 'Укажите телефон в формате +7 (999) 123-45-67' })
    return z.NEVER
  }

  return normalized
})

const emailInputSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, 'Некорректный email')

export const requestInputSchema = z.object({
  firstName: requiredText('Укажите имя'),
  lastName: optionalInputText,
  patronymic: optionalInputText,
  phone: phoneInputSchema,
  email: emailInputSchema,
  address: requiredText('Укажите адрес выезда'),
  categoryId: requiredText('Выберите категорию'),
  description: requiredText('Опишите неисправность'),
  priority: z.literal(PRIORITY_VALUES),
  masterId: z.string().nullable(),
  plannedDate: z.iso.date('Некорректная плановая дата').nullable(),
})

export type RequestInputValues = z.input<typeof requestInputSchema>
export type RequestInputData = z.output<typeof requestInputSchema>
