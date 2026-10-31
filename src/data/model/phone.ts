const PHONE_ALLOWED_CHARS = /^[\d\s()+.-]+$/
const PREPARED_PHONE_DIGITS = 10
const FULL_PHONE_DIGITS = 11
const RU_COUNTRY_CODE = '7'

export const PHONE_NORMALIZED_PATTERN = /^\+7\d{10}$/

export const extractPhoneDigits = (value: string): string => value.replace(/\D/g, '')

export const formatPhone = (value: string): string => {
  const digits = extractPhoneDigits(value)

  if (digits.length !== FULL_PHONE_DIGITS) {
    return value
  }

  const area = digits.slice(1, 4)
  const first = digits.slice(4, 7)
  const second = digits.slice(7, 9)
  const third = digits.slice(9, 11)

  return `+${digits.slice(0, 1)} (${area}) ${first}-${second}-${third}`
}

export const normalizePhone = (value: string): string | null => {
  if (!PHONE_ALLOWED_CHARS.test(value)) {
    return null
  }

  const digits = extractPhoneDigits(value)

  if (digits.length === PREPARED_PHONE_DIGITS) {
    return `+${RU_COUNTRY_CODE}${digits}`
  }

  if (digits.length !== FULL_PHONE_DIGITS) {
    return null
  }

  if (digits.startsWith('8')) {
    return `+${RU_COUNTRY_CODE}${digits.slice(1)}`
  }

  if (digits.startsWith(RU_COUNTRY_CODE)) {
    return `+${digits}`
  }

  return null
}
