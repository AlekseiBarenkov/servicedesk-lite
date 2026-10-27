const PHONE_ALLOWED_CHARS = /^[\d\s()+.-]+$/
const PREPARED_PHONE_DIGITS = 10
const FULL_PHONE_DIGITS = 11
const RU_COUNTRY_CODE = '7'

export const PHONE_NORMALIZED_PATTERN = /^\+7\d{10}$/

export const normalizePhone = (value: string): string | null => {
  if (!PHONE_ALLOWED_CHARS.test(value)) {
    return null
  }

  const digits = value.replace(/\D/g, '')

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
