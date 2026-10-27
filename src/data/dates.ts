import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export const CALENDAR_DATE_STORAGE_FORMAT = 'YYYY-MM-DD'

const CALENDAR_DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
const DATE_TIME_DISPLAY_FORMAT = 'DD.MM.YYYY, HH:mm'
const EMPTY_DATE_PLACEHOLDER = '—'

export const nowTimestamp = (): number => Date.now()

export const todayCalendarDate = (): string => dayjs().format(CALENDAR_DATE_STORAGE_FORMAT)

export const isOverdue = (plannedDate: string | null, today: string): boolean =>
  plannedDate !== null && plannedDate < today

export const isSameLocalMonth = (timestamp: number, now: number = nowTimestamp()): boolean =>
  dayjs(timestamp).isSame(dayjs(now), 'month')

export const formatCalendarDate = (value: string | null): string =>
  value === null
    ? EMPTY_DATE_PLACEHOLDER
    : dayjs(value, CALENDAR_DATE_STORAGE_FORMAT).format(CALENDAR_DATE_DISPLAY_FORMAT)

export const formatDateTime = (timestamp: number): string => dayjs(timestamp).format(DATE_TIME_DISPLAY_FORMAT)
