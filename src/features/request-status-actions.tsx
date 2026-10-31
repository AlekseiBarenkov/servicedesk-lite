import { useState } from 'react'

import { App as AntApp, Button, Dropdown, Flex, Input, Modal } from 'antd'

import { REQUEST_STATUS } from '../data/model/constants'
import { formatPersonName } from '../data/model/person'
import type { Request } from '../data/model/types'
import { changeStatus } from '../data/operations/change-status'
import { mastersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { describeError } from '../data/validation/rules'

type RequestStatusActionsProps = {
  request: Request
}

export const RequestStatusActions = ({ request }: RequestStatusActionsProps) => {
  const db = useDb()
  const { message } = AntApp.useApp()

  const [isResolveOpen, setResolveOpen] = useState(false)
  const [resolution, setResolution] = useState('')
  const [isCancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isPending, setPending] = useState(false)

  const masterOptions = mastersRepo.listByCategory(db, request.categoryId).map((master) => ({
    value: master.masterId,
    label: formatPersonName(master),
  }))

  const canAssign = request.status === REQUEST_STATUS.new
  const canStart = request.status === REQUEST_STATUS.assigned
  const canResolve = request.status === REQUEST_STATUS.inProgress
  const canCancel =
    request.status === REQUEST_STATUS.new ||
    request.status === REQUEST_STATUS.assigned ||
    request.status === REQUEST_STATUS.inProgress

  const runAction = async (action: () => Promise<void>, successText: string): Promise<void> => {
    setPending(true)

    try {
      await action()
      message.success(successText)
    } catch (error) {
      message.error(describeError(error))
    } finally {
      setPending(false)
    }
  }

  const openResolve = (): void => {
    setResolution('')
    setResolveOpen(true)
  }

  const openCancel = (): void => {
    setCancelReason('')
    setCancelOpen(true)
  }

  const handleStart = (): void => {
    void runAction(async () => {
      await changeStatus(request.requestId, { status: REQUEST_STATUS.inProgress })
    }, 'Заявка взята в работу')
  }

  const handleAssign = (masterId: string): void => {
    void runAction(async () => {
      await changeStatus(request.requestId, { status: REQUEST_STATUS.assigned, masterId })
    }, 'Мастер назначен')
  }

  const handleResolve = (): void => {
    void runAction(async () => {
      await changeStatus(request.requestId, { status: REQUEST_STATUS.done, resolution })
      setResolveOpen(false)
    }, 'Заявка выполнена')
  }

  const handleCancelRequest = (): void => {
    void runAction(async () => {
      await changeStatus(request.requestId, { status: REQUEST_STATUS.cancelled, cancelReason })
      setCancelOpen(false)
    }, 'Заявка отменена')
  }
  return (
    <>
      <Flex wrap gap={8}>
        {canAssign && masterOptions.length > 0 && (
          <Dropdown
            trigger={['click']}
            menu={{
              items: masterOptions.map((option) => ({ key: option.value, label: option.label })),
              onClick: ({ key }) => {
                handleAssign(key)
              },
            }}
          >
            <Button loading={isPending}>Назначить мастера</Button>
          </Dropdown>
        )}
        {canStart && (
          <Button type="primary" loading={isPending} onClick={handleStart}>
            В работу
          </Button>
        )}
        {canResolve && (
          <Button type="primary" onClick={openResolve}>
            Выполнить
          </Button>
        )}
        {canCancel && (
          <Button danger onClick={openCancel}>
            Отменить
          </Button>
        )}
      </Flex>
      <Modal
        title="Завершить заявку"
        centered
        open={isResolveOpen}
        okText="Выполнить"
        cancelText="Отмена"
        okButtonProps={{ disabled: resolution.trim() === '', loading: isPending }}
        onOk={handleResolve}
        onCancel={() => {
          if (!isPending) {
            setResolveOpen(false)
          }
        }}
      >
        <Input.TextArea
          value={resolution}
          rows={3}
          placeholder="Что сделано"
          onChange={(event) => {
            setResolution(event.target.value)
          }}
        />
      </Modal>
      <Modal
        title="Отменить заявку"
        centered
        open={isCancelOpen}
        okText="Отменить"
        cancelText="Не отменять"
        okButtonProps={{ danger: true, disabled: cancelReason.trim() === '', loading: isPending }}
        onOk={handleCancelRequest}
        onCancel={() => {
          if (!isPending) {
            setCancelOpen(false)
          }
        }}
      >
        <Input.TextArea
          value={cancelReason}
          rows={3}
          placeholder="Причина отмены"
          onChange={(event) => {
            setCancelReason(event.target.value)
          }}
        />
      </Modal>
    </>
  )
}
