import { Card, Empty, Flex, Grid, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router'

import StatusTag from '../components/status-tag'
import { formatCalendarDate, todayCalendarDate } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import { isRequestOverdue } from '../data/model/request'
import type { Request } from '../data/model/types'
import { selectOverview } from '../data/overview'
import { useDb } from '../data/storage/use-db'
import { RequestCards } from '../features/request-cards'

type MetricCardProps = {
  title: string
  value: number
  to?: string
}

const MetricCard = ({ title, value, to }: MetricCardProps) => {
  const card = (
    <Card size="small" hoverable={to !== undefined} style={{ height: '100%' }}>
      <Typography.Text type="secondary">{title}</Typography.Text>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {value}
      </Typography.Title>
    </Card>
  )

  if (to === undefined) {
    return <div style={{ flex: '1 1 200px' }}>{card}</div>
  }

  return (
    <Link to={to} style={{ flex: '1 1 200px', color: 'inherit', textDecoration: 'none' }}>
      {card}
    </Link>
  )
}

const OverviewPage = () => {
  const db = useDb()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const today = todayCalendarDate()
  const { metrics, upcoming } = selectOverview(db, today)

  const clientsById = new Map(db.tables.clients.map((client) => [client.clientId, client] as const))
  const mastersById = new Map(db.tables.masters.map((master) => [master.masterId, master] as const))

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
      title: 'Статус',
      key: 'status',
      width: 130,
      render: (_, request) => <StatusTag status={request.status} />,
    },
    {
      title: 'Плановая дата',
      key: 'plannedDate',
      width: 150,
      render: (_, request) => (
        <Typography.Text type={isRequestOverdue(request, today) ? 'danger' : undefined}>
          {formatCalendarDate(request.plannedDate)}
        </Typography.Text>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Обзор
      </Typography.Title>
      <Flex wrap gap={16}>
        <MetricCard title="Новые" value={metrics.newCount} to="/requests?status=new" />
        <MetricCard title="Активные" value={metrics.activeCount} to="/requests?status=new,assigned,in_progress" />
        <MetricCard title="Просроченные" value={metrics.overdueCount} to="/requests?overdue=1" />
        <MetricCard title="Выполнены за месяц" value={metrics.doneThisMonthCount} />
      </Flex>
      <Typography.Text type="secondary">
        Новые - заявки в статусе «Новая». Активные - «Новая», «Назначена» и «В работе». Просроченные - активные заявки с
        плановой датой раньше сегодняшней. Выполненные за месяц - завершённые в текущем календарном месяце.
      </Typography.Text>
      <Card title="Ближайшие">
        {upcoming.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет незавершённых заявок с плановой датой" />
        ) : isMobile ? (
          <RequestCards
            requests={upcoming}
            clientsById={clientsById}
            mastersById={mastersById}
            today={today}
            listSearch=""
          />
        ) : (
          <Table<Request>
            rowKey="requestId"
            columns={columns}
            dataSource={upcoming}
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
          />
        )}
      </Card>
    </Flex>
  )
}

export default OverviewPage
