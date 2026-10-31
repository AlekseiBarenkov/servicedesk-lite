import { zodResolver } from '@hookform/resolvers/zod'
import { App as AntApp, Button, Drawer, Space } from 'antd'
import { useForm } from 'react-hook-form'

import { formatPersonName } from '../data/model/person'
import type { Request } from '../data/model/types'
import { updateRequest } from '../data/operations/update-request'
import { requestInputSchema } from '../data/operations/request-input'
import type { RequestInputValues } from '../data/operations/request-input'
import { categoriesRepo, clientsRepo, mastersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { describeError } from '../data/validation/rules'
import { RequestFormFields } from './request-form-fields'
import { useConfirmDiscard } from './use-confirm-discard'

const DRAWER_SIZE = 'min(520px, 100vw)'

type EditRequestDrawerProps = {
  request: Request
  onClose: () => void
}

export const EditRequestDrawer = ({ request, onClose }: EditRequestDrawerProps) => {
  const db = useDb()
  const { message } = AntApp.useApp()
  const confirmDiscard = useConfirmDiscard()

  const client = clientsRepo.findById(db, request.clientId)
  const assignedMaster = request.masterId === null ? null : mastersRepo.findById(db, request.masterId)

  const {
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    watch,
  } = useForm<RequestInputValues>({
    defaultValues: {
      firstName: client?.firstName ?? '',
      lastName: client?.lastName ?? '',
      patronymic: client?.patronymic ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      address: request.address,
      categoryId: request.categoryId,
      description: request.description,
      priority: request.priority,
      masterId: request.masterId,
      plannedDate: request.plannedDate,
    },
    resolver: zodResolver(requestInputSchema),
  })

  const categoryId = watch('categoryId')

  const categoryOptions = categoriesRepo.list(db).map((category) => {
    const servesCategory = assignedMaster === null || assignedMaster.categoryIds.includes(category.categoryId)
    const hasMasters = mastersRepo.listByCategory(db, category.categoryId).length > 0

    return {
      value: category.categoryId,
      label: servesCategory ? category.name : `${category.name} - недоступна мастеру`,
      disabled: !servesCategory || !hasMasters,
    }
  })

  const masterOptions = mastersRepo.listByCategory(db, categoryId).map((master) => ({
    value: master.masterId,
    label: formatPersonName(master),
  }))

  const submit = handleSubmit(async (values) => {
    try {
      await updateRequest(request.requestId, values)
      message.success('Заявка сохранена')
      onClose()
    } catch (error) {
      message.error(describeError(error))
    }
  })

  const requestClose = (): void => {
    if (!isDirty) {
      onClose()
      return
    }

    confirmDiscard(onClose)
  }

  return (
    <Drawer
      title={`Заявка ${request.number}`}
      size={DRAWER_SIZE}
      open
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
            Сохранить
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
          allowMasterClear={false}
        />
      </form>
    </Drawer>
  )
}
