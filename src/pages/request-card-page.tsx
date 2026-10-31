import { useState } from 'react'

import { Button, Card, Descriptions, Flex, Result, Space, Typography } from 'antd'
import { Link, useParams } from 'react-router'

import PriorityTag from '../components/priority-tag'
import StatusTag from '../components/status-tag'
import { REQUEST_STATUS } from '../data/model/constants'
import { formatCalendarDate, formatDateTime, isOverdue, todayCalendarDate } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import { categoriesRepo, clientsRepo, mastersRepo, requestsRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { EditRequestDrawer } from '../features/edit-request-drawer'
import { RequestComments } from '../features/request-comments'
import { RequestHistory } from '../features/request-history'
import { RequestStatusActions } from '../features/request-status-actions'
import { isFinalStatus } from '../data/operations/shared'

const RequestCardPage = () => {
  const { requestId } = useParams()
  const db = useDb()
  const [isEditOpen, setEditOpen] = useState(false)
  const request = requestId === undefined ? null : requestsRepo.findById(db, requestId)

  if (request === null) {
    return (
      <Result
        status="404"
        title="Заявка не найдена"
        subTitle="Возможно, ссылка устарела или в адресе опечатка."
        extra={
          <Link to="/requests">
            <Button type="primary">К заявкам</Button>
          </Link>
        }
      />
    )
  }

  const client = clientsRepo.findById(db, request.clientId)
  const category = categoriesRepo.findById(db, request.categoryId)
  const master = request.masterId === null ? null : mastersRepo.findById(db, request.masterId)
  const today = todayCalendarDate()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Flex vertical gap={12}>
          <Link to="/requests" style={{ alignSelf: 'flex-start' }}>
            К заявкам
          </Link>
          <Flex justify="space-between" align="center" wrap gap={12}>
            <Space wrap size={12} align="center">
              <Typography.Title level={4} style={{ margin: 0 }}>
                {request.number}
              </Typography.Title>
              <StatusTag status={request.status} />
              <PriorityTag priority={request.priority} />
            </Space>
            <Flex wrap gap={8}>
              {!isFinalStatus(request.status) && (
                <Button
                  onClick={() => {
                    setEditOpen(true)
                  }}
                >
                  Редактировать
                </Button>
              )}
              <RequestStatusActions request={request} />
            </Flex>
          </Flex>
        </Flex>
      </Card>
      <Card title="Описание неисправности">
        <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>
          {request.description}
        </Typography.Paragraph>
      </Card>
      <Card title="Клиент">
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: 'name', label: 'Имя', children: client === null ? '-' : formatPersonName(client) },
            { key: 'phone', label: 'Телефон', children: client === null ? '-' : client.phone },
            { key: 'email', label: 'Email', children: client?.email ?? '-' },
            { key: 'address', label: 'Адрес выезда', children: request.address },
          ]}
        />
      </Card>
      <Card title="Заявка">
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: 'category', label: 'Категория', children: category?.name ?? '-' },
            { key: 'master', label: 'Мастер', children: master === null ? '-' : formatPersonName(master) },
            {
              key: 'plannedDate',
              label: 'Плановая дата',
              children: (
                <Typography.Text type={isOverdue(request.plannedDate, today) ? 'danger' : undefined}>
                  {formatCalendarDate(request.plannedDate)}
                </Typography.Text>
              ),
            },
            { key: 'createdAt', label: 'Создана', children: formatDateTime(request.createdAt) },
            { key: 'updatedAt', label: 'Обновлена', children: formatDateTime(request.updatedAt) },
          ]}
        />
      </Card>
      {request.status === REQUEST_STATUS.done && request.resolution !== null && (
        <Card title="Результат">
          <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>
            {request.resolution}
          </Typography.Paragraph>
        </Card>
      )}
      {request.status === REQUEST_STATUS.cancelled && request.cancelReason !== null && (
        <Card title="Причина отмены">
          <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>
            {request.cancelReason}
          </Typography.Paragraph>
        </Card>
      )}
      <Card title="Комментарии">
        <RequestComments requestId={request.requestId} />
      </Card>
      <Card title="История">
        <RequestHistory requestId={request.requestId} />
      </Card>

      {isEditOpen && (
        <EditRequestDrawer
          request={request}
          onClose={() => {
            setEditOpen(false)
          }}
        />
      )}
    </Space>
  )
}

export default RequestCardPage
