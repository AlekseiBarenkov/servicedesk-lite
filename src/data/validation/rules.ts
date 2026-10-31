import { z } from 'zod'

export const RULE_VIOLATION_CODE = {
  dbUnavailable: 'DB_UNAVAILABLE',
  unknownCategory: 'UNKNOWN_CATEGORY',
  unknownMaster: 'UNKNOWN_MASTER',
  numberTaken: 'NUMBER_TAKEN',
  masterRequired: 'MASTER_REQUIRED',
  categoryNotAllowed: 'CATEGORY_NOT_ALLOWED',
  requestNotFound: 'REQUEST_NOT_FOUND',
  statusTransitionForbidden: 'STATUS_TRANSITION_FORBIDDEN',
  masterCannotBeRemoved: 'MASTER_CANNOT_BE_REMOVED',
  resolutionRequired: 'RESOLUTION_REQUIRED',
  cancelReasonRequired: 'CANCEL_REASON_REQUIRED',
  commentRequired: 'COMMENT_REQUIRED',
  phoneTaken: 'PHONE_TAKEN',
  statusIsFinal: 'STATUS_IS_FINAL',
  storageFailed: 'STORAGE_FAILED',
} as const

export type RuleViolationCode = (typeof RULE_VIOLATION_CODE)[keyof typeof RULE_VIOLATION_CODE]

const RULE_VIOLATION_MESSAGE: Record<RuleViolationCode, string> = {
  DB_UNAVAILABLE: 'Данные демо недоступны. Обновите страницу или сбросьте данные.',
  UNKNOWN_CATEGORY: 'Категория не найдена. Обновите страницу и попробуйте снова.',
  UNKNOWN_MASTER: 'Мастер не найден. Выберите другого мастера.',
  NUMBER_TAKEN: 'Не удалось выдать номер заявки. Обновите страницу и попробуйте снова.',
  MASTER_REQUIRED: 'Сначала назначьте мастера.',
  MASTER_CANNOT_BE_REMOVED: 'Снять мастера нельзя, можно только заменить.',
  CATEGORY_NOT_ALLOWED: 'Мастер не обслуживает выбранную категорию.',
  REQUEST_NOT_FOUND: 'Заявка не найдена. Обновите страницу.',
  STATUS_TRANSITION_FORBIDDEN: 'Такой переход статуса невозможен. Обновите страницу.',
  RESOLUTION_REQUIRED: 'Укажите результат работ.',
  CANCEL_REASON_REQUIRED: 'Укажите причину отмены.',
  COMMENT_REQUIRED: 'Введите текст комментария.',
  PHONE_TAKEN: 'Клиент с таким телефоном уже есть в демо.',
  STATUS_IS_FINAL: 'Заявка завершена, менять её нельзя.',
  STORAGE_FAILED:
    'Не удалось сохранить данные демо. Проверьте, что браузер не блокирует хранилище, и попробуйте снова.',
}

export class RuleViolation extends Error {
  readonly code: RuleViolationCode

  constructor(code: RuleViolationCode) {
    super(RULE_VIOLATION_MESSAGE[code])
    this.name = 'RuleViolation'
    this.code = code
  }
}

export const describeError = (error: unknown): string => {
  if (error instanceof RuleViolation) {
    return error.message
  }

  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Проверьте заполнение полей.'
  }

  return 'Не удалось выполнить действие. Попробуйте ещё раз.'
}
