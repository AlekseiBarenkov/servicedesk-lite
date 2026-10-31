import type { ReactNode } from 'react'

import { AutoComplete, DatePicker, Form, Input, Select } from 'antd'
import { Controller, useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'

import { PRIORITY, PRIORITY_VALUES } from '../data/model/constants'
import { CALENDAR_DATE_DISPLAY_FORMAT, fromCalendarDate, toCalendarDate } from '../data/model/dates'
import type { RequestInputValues } from '../data/operations/request-input'

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type RequestFormFieldsProps = {
  control: Control<RequestInputValues>
  categoryOptions: SelectOption[]
  masterOptions: SelectOption[]
  allowMasterClear: boolean
  clientOptions?: SelectOption[]
  onClientSelect?: (phone: string) => void
  onCategoryChange?: (categoryId: string) => void
}

const PRIORITY_OPTIONS = PRIORITY_VALUES.map((priority) => ({
  value: priority,
  label: PRIORITY[priority],
}))

type FormFieldProps = {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}

const FormField = ({ label, error, required, children }: FormFieldProps) => (
  <Form.Item
    label={label}
    required={required}
    validateStatus={error === undefined ? undefined : 'error'}
    help={error}
    style={{ marginBottom: 12 }}
  >
    {children}
  </Form.Item>
)

export const RequestFormFields = ({
  control,
  categoryOptions,
  masterOptions,
  allowMasterClear,
  clientOptions,
  onClientSelect,
  onCategoryChange,
}: RequestFormFieldsProps) => {
  const categoryId = useWatch({ control, name: 'categoryId' })

  return (
    <Form component={false} layout="vertical" requiredMark>
      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => (
          <FormField label="Имя" required error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field, fieldState }) => (
          <FormField label="Фамилия" error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="patronymic"
        render={({ field, fieldState }) => (
          <FormField label="Отчество" error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <FormField label="Телефон" required error={fieldState.error?.message}>
            <AutoComplete
              value={field.value}
              options={clientOptions ?? []}
              placeholder="+7 (999) 123-45-67"
              filterOption={false}
              notFoundContent={null}
              onChange={(value: string) => {
                field.onChange(value)
              }}
              onSelect={(value: string) => {
                if (onClientSelect !== undefined) {
                  onClientSelect(value)
                }
              }}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField label="Email" error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" placeholder="client@example.com" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field, fieldState }) => (
          <FormField label="Адрес выезда" required error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" placeholder="Улица, дом, квартира" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <FormField label="Категория техники" required error={fieldState.error?.message}>
            <Select
              value={field.value === '' ? undefined : field.value}
              options={categoryOptions}
              placeholder="Выберите категорию"
              onChange={(value: string) => {
                field.onChange(value)

                if (onCategoryChange !== undefined) {
                  onCategoryChange(value)
                }
              }}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <FormField label="Описание неисправности" required error={fieldState.error?.message}>
            <Input.TextArea {...field} autoComplete="off" rows={3} />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field, fieldState }) => (
          <FormField label="Приоритет" error={fieldState.error?.message}>
            <Select value={field.value} options={PRIORITY_OPTIONS} onChange={field.onChange} />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="masterId"
        render={({ field, fieldState }) => (
          <FormField label="Мастер" error={fieldState.error?.message}>
            <Select
              value={field.value === null ? undefined : field.value}
              options={masterOptions}
              disabled={categoryId === ''}
              allowClear={allowMasterClear}
              placeholder={categoryId === '' ? 'Сначала выберите категорию' : 'Не назначать'}
              onChange={(value?: string) => {
                field.onChange(value ?? null)
              }}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="plannedDate"
        render={({ field, fieldState }) => (
          <FormField label="Плановая дата" error={fieldState.error?.message}>
            <DatePicker
              value={fromCalendarDate(field.value)}
              format={CALENDAR_DATE_DISPLAY_FORMAT}
              style={{ width: '100%' }}
              onChange={(value) => {
                field.onChange(toCalendarDate(value))
              }}
            />
          </FormField>
        )}
      />
    </Form>
  )
}
