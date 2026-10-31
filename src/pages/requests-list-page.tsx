import { useState } from 'react'

import { Button, Empty, Flex, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { Link, useNavigate } from 'react-router'

import PriorityTag from '../components/priority-tag'
import StatusTag from '../components/status-tag'
import { formatCalendarDate, isOverdue, todayCalendarDate } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import type { Request } from '../data/model/types'
import { useDb } from '../data/storage/use-db'
import { CreateRequestDrawer } from '../features/create-request-drawer'

const REQUEST_COLUMNS_WIDTH = 940

const RequestsListPage = () => {
  const db = useDb()
  const navigate = useNavigate()
  const [isCreateOpen, setCreateOpen] = useState(false)

  const clientsById = new Map(db.tables.clients.map((client) => [client.clientId, client] as const))
  const categoriesById = new Map(db.tables.categories.map((category) => [category.categoryId, category] as const))
  const mastersById = new Map(db.tables.masters.map((master) => [master.masterId, master] as const))
  const today = todayCalendarDate()
  const requests = [...db.tables.requests].sort((left, right) => right.createdAt - left.createdAt)

  const openCreateDrawer = (): void => {
    setCreateOpen(true)
  }

  const closeCreateDrawer = (): void => {
    setCreateOpen(false)
  }

  const handleCreated = (requestId: string): void => {
    setCreateOpen(false)
    navigate(`/requests/${requestId}`)
  }

  const columns: TableProps<Request>['columns'] = [
    {
      title: 'Номер',
      key: 'number',
      width: 120,
      render: (_, request) => <Link to={`/requests/${request.requestId}`}>{request.number}</Link>,
    },
    {
      title: 'Клиент',
      key: 'client',
      render: (_, request) => {
        const client = clientsById.get(request.clientId)

        return client === undefined ? '-' : formatPersonName(client)
      },
    },
    {
      title: 'Техника',
      key: 'category',
      render: (_, request) => categoriesById.get(request.categoryId)?.name ?? '-',
    },
    {
      title: 'Статус',
      key: 'status',
      width: 130,
      render: (_, request) => <StatusTag status={request.status} />,
    },
    {
      title: 'Приоритет',
      key: 'priority',
      width: 130,
      render: (_, request) => <PriorityTag priority={request.priority} />,
    },
    {
      title: 'Мастер',
      key: 'master',
      render: (_, request) => {
        if (request.masterId === null) {
          return '-'
        }

        const master = mastersById.get(request.masterId)

        return master === undefined ? '-' : formatPersonName(master)
      },
    },
    {
      title: 'Плановая дата',
      key: 'plannedDate',
      width: 150,
      render: (_, request) => (
        <Typography.Text type={isOverdue(request.plannedDate, today) ? 'danger' : undefined}>
          {formatCalendarDate(request.plannedDate)}
        </Typography.Text>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Заявки
        </Typography.Title>
        <Button type="primary" onClick={openCreateDrawer}>
          Создать заявку
        </Button>
      </Flex>
      <Table<Request>
        rowKey="requestId"
        columns={columns}
        dataSource={requests}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Всего заявок: ${total}`,
        }}
        scroll={{ x: REQUEST_COLUMNS_WIDTH }}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Заявок пока нет">
              <Button type="primary" onClick={openCreateDrawer}>
                Создать заявку
              </Button>
            </Empty>
          ),
        }}
      />
      <CreateRequestDrawer open={isCreateOpen} onClose={closeCreateDrawer} onCreated={handleCreated} />
    </Flex>
  )
}

export default RequestsListPage
