import { zodResolver } from '@hookform/resolvers/zod'
import { App as AntApp, AutoComplete, Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

import { PRIORITY, PRIORITY_VALUES } from '../data/model/constants'
import { CALENDAR_DATE_DISPLAY_FORMAT, fromCalendarDate, toCalendarDate } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import { extractPhoneDigits, formatPhone } from '../data/model/phone'
import { createRequest, createRequestInputSchema } from '../data/operations/create-request'
import type { CreateRequestFormValues } from '../data/operations/create-request'
import { categoriesRepo, clientsRepo, mastersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { describeError } from '../data/validation/rules'

const DEFAULT_VALUES: CreateRequestFormValues = {
  firstName: '',
  lastName: '',
  patronymic: '',
  phone: '',
  email: '',
  address: '',
  categoryId: '',
  description: '',
  priority: 1,
  masterId: null,
  plannedDate: null,
}

const PRIORITY_OPTIONS = PRIORITY_VALUES.map((priority) => ({
  value: priority,
  label: PRIORITY[priority],
}))

const DRAWER_SIZE = 'min(520px, 100vw)'
const CLIENT_SEARCH_MIN_DIGITS = 3

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

type CreateRequestDrawerProps = {
  open: boolean
  onClose: () => void
  onCreated: (requestId: string) => void
}

export const CreateRequestDrawer = ({ open, onClose, onCreated }: CreateRequestDrawerProps) => {
  const db = useDb()
  const { message, modal } = AntApp.useApp()
  const {
    control,
    formState: { isDirty, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<CreateRequestFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(createRequestInputSchema),
  })

  const categoryId = watch('categoryId')

  const categoryOptions = categoriesRepo.list(db).map((category) => {
    const hasMasters = mastersRepo.listByCategory(db, category.categoryId).length > 0

    return {
      value: category.categoryId,
      label: hasMasters ? category.name : `${category.name} - нет мастера`,
      disabled: !hasMasters,
    }
  })

  const masterOptions = mastersRepo.listByCategory(db, categoryId).map((master) => ({
    value: master.masterId,
    label: formatPersonName(master),
  }))

  const handleCategoryChange = (nextCategoryId: string): void => {
    const currentMasterId = getValues('masterId')

    if (
      currentMasterId !== null &&
      !mastersRepo.listByCategory(db, nextCategoryId).some((master) => master.masterId === currentMasterId)
    ) {
      setValue('masterId', null)
    }
  }

  const buildClientOptions = (query: string): { value: string; label: string }[] => {
    const digits = extractPhoneDigits(query)

    if (digits.length < CLIENT_SEARCH_MIN_DIGITS) {
      return []
    }

    return clientsRepo.listByPhonePart(db, digits).map((client) => ({
      value: client.phone,
      label: `${formatPersonName(client)} — ${formatPhone(client.phone)}`,
    }))
  }

  const applyClient = (clientPhone: string): void => {
    const client = clientsRepo.findByPhone(db, clientPhone)

    if (client === null) {
      return
    }

    const options = { shouldDirty: true, shouldValidate: true }

    setValue('firstName', client.firstName, options)
    setValue('lastName', client.lastName ?? '', options)
    setValue('patronymic', client.patronymic ?? '', options)
    setValue('email', client.email ?? '', options)
    setValue('address', client.lastAddress, options)
  }

  const submit = handleSubmit(async (values) => {
    try {
      const request = await createRequest(values)

      reset(DEFAULT_VALUES)
      message.success('Заявка создана')
      onCreated(request.requestId)
    } catch (error) {
      message.error(describeError(error))
    }
  })

  const requestClose = (): void => {
    if (!isDirty) {
      onClose()
      return
    }

    modal.confirm({
      title: 'Закрыть без сохранения?',
      content: 'Введённые данные будут потеряны.',
      okText: 'Закрыть',
      cancelText: 'Вернуться',
      okButtonProps: { danger: true },
      onOk: () => {
        reset(DEFAULT_VALUES)
        onClose()
      },
    })
  }

  return (
    <Drawer
      title="Новая заявка"
      size={DRAWER_SIZE}
      open={open}
      onClose={requestClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={requestClose}>Отмена</Button>
          <Button
            type="primary"
            loading={isSubmitting}
            disabled={!isDirty}
            onClick={() => {
              void submit()
            }}
          >
            Создать заявку
          </Button>
        </Space>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          void submit(event)
        }}
      >
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
                  options={buildClientOptions(field.value)}
                  placeholder="+7 (999) 123-45-67"
                  filterOption={false}
                  notFoundContent={null}
                  onChange={(value: string) => {
                    field.onChange(value)
                  }}
                  onSelect={(value: string) => {
                    applyClient(value)
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
                    handleCategoryChange(value)
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
                  allowClear
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
      </form>
    </Drawer>
  )
}
