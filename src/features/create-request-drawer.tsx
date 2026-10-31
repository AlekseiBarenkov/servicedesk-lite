import { zodResolver } from '@hookform/resolvers/zod'
import { App as AntApp, Button, Drawer, Space } from 'antd'
import { useForm } from 'react-hook-form'

import { formatPersonName } from '../data/model/person'
import { extractPhoneDigits, formatPhone } from '../data/model/phone'
import { createRequest } from '../data/operations/create-request'
import { requestInputSchema } from '../data/operations/request-input'
import type { RequestInputValues } from '../data/operations/request-input'
import { categoriesRepo, clientsRepo, mastersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { describeError } from '../data/validation/rules'
import { RequestFormFields } from './request-form-fields'
import { useConfirmDiscard } from './use-confirm-discard'

const CLIENT_SEARCH_MIN_DIGITS = 3
const DRAWER_SIZE = 'min(520px, 100vw)'

const DEFAULT_VALUES: RequestInputValues = {
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

type CreateRequestDrawerProps = {
  open: boolean
  onClose: () => void
  onCreated: (requestId: string) => void
}

export const CreateRequestDrawer = ({ open, onClose, onCreated }: CreateRequestDrawerProps) => {
  const db = useDb()
  const { message } = AntApp.useApp()
  const confirmDiscard = useConfirmDiscard()
  const {
    control,
    formState: { isDirty, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<RequestInputValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(requestInputSchema),
  })

  const categoryId = watch('categoryId')
  const phone = watch('phone')

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

  const buildClientOptions = (query: string): { value: string; label: string }[] => {
    const digits = extractPhoneDigits(query)

    if (digits.length < CLIENT_SEARCH_MIN_DIGITS) {
      return []
    }

    return clientsRepo.listByPhonePart(db, digits).map((client) => ({
      value: client.phone,
      label: `${formatPersonName(client)} - ${formatPhone(client.phone)}`,
    }))
  }

  const handleCategoryChange = (nextCategoryId: string): void => {
    const currentMasterId = getValues('masterId')

    if (
      currentMasterId !== null &&
      !mastersRepo.listByCategory(db, nextCategoryId).some((master) => master.masterId === currentMasterId)
    ) {
      setValue('masterId', null)
    }
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

    confirmDiscard(() => {
      reset(DEFAULT_VALUES)
      onClose()
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
        <RequestFormFields
          control={control}
          categoryOptions={categoryOptions}
          masterOptions={masterOptions}
          allowMasterClear
          clientOptions={buildClientOptions(phone)}
          onClientSelect={applyClient}
          onCategoryChange={handleCategoryChange}
        />
      </form>
    </Drawer>
  )
}
