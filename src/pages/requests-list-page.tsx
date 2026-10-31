import { useEffect, useState } from 'react'

import { SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Flex, Grid, Input, Pagination, Select, Switch, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import PriorityTag from '../components/priority-tag'
import StatusTag from '../components/status-tag'
import { PRIORITY, PRIORITY_VALUES, REQUEST_STATUS_LABEL, REQUEST_STATUS_VALUES } from '../data/model/constants'
import type { Priority, RequestStatus } from '../data/model/constants'
import { formatCalendarDate, todayCalendarDate } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import { isRequestOverdue } from '../data/model/request'
import type { Request } from '../data/model/types'
import { REQUEST_LIST_PAGE_SIZE, REQUEST_LIST_SORT, selectRequestList } from '../data/request-list'
import type { RequestListParams } from '../data/request-list'
import { readRequestListParams, writeRequestListParams } from '../data/request-list-url'
import { mastersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { CreateRequestDrawer } from '../features/create-request-drawer'
import { RequestCards } from '../features/request-cards'

const REQUEST_COLUMNS_WIDTH = 940
const SEARCH_DEBOUNCE_MS = 300

const STATUS_OPTIONS = REQUEST_STATUS_VALUES.map((status) => ({
  value: status,
  label: REQUEST_STATUS_LABEL[status],
}))

const PRIORITY_OPTIONS = PRIORITY_VALUES.map((priority) => ({
  value: priority,
  label: PRIORITY[priority],
}))

const SORT_OPTIONS = [
  { value: REQUEST_LIST_SORT.createdAtDesc, label: 'Сначала новые' },
  { value: REQUEST_LIST_SORT.createdAtAsc, label: 'Сначала старые' },
  { value: REQUEST_LIST_SORT.plannedDateAsc, label: 'Плановая дата: сначала ближние' },
  { value: REQUEST_LIST_SORT.plannedDateDesc, label: 'Плановая дата: сначала дальние' },
]

const RequestsListPage = () => {
  const db = useDb()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const isMobile = screens.md === false
  const params = readRequestListParams(searchParams)
  const [appliedQuery, setAppliedQuery] = useState(params.query)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedQuery(params.query)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [params.query])

  const today = todayCalendarDate()
  const selection = selectRequestList(db, { ...params, query: appliedQuery })
  const clientsById = new Map(db.tables.clients.map((client) => [client.clientId, client] as const))
  const categoriesById = new Map(db.tables.categories.map((category) => [category.categoryId, category] as const))
  const mastersById = new Map(db.tables.masters.map((master) => [master.masterId, master] as const))
  const masterOptions = mastersRepo.list(db).map((master) => ({
    value: master.masterId,
    label: formatPersonName(master),
  }))

  const hasActiveFilters =
    params.query.trim() !== '' ||
    params.statuses.length > 0 ||
    params.priorities.length > 0 ||
    params.masterIds.length > 0 ||
    params.overdueOnly

  const updateParams = (patch: Partial<RequestListParams>): void => {
    setSearchParams(
      (previous) => {
        const previousParams = readRequestListParams(previous)

        return writeRequestListParams({ ...previousParams, ...patch, page: patch.page ?? 1 })
      },
      { replace: true },
    )
  }

  const resetFilters = (): void => {
    setSearchParams(new URLSearchParams(), { replace: true })
    setAppliedQuery('')
  }

  const openCreateDrawer = (): void => {
    setCreateOpen(true)
  }

  const closeCreateDrawer = (): void => {
    setCreateOpen(false)
  }

  const handleCreated = (requestId: string): void => {
    setCreateOpen(false)
    navigate(`/requests/${requestId}`, { state: { listSearch: location.search } })
  }

  const columns: TableProps<Request>['columns'] = [
    {
      title: 'Номер',
      key: 'number',
      width: 120,
      render: (_, request) => (
        <Link to={`/requests/${request.requestId}`} state={{ listSearch: location.search }}>
          {request.number}
        </Link>
      ),
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
        <Typography.Text type={isRequestOverdue(request, today) ? 'danger' : undefined}>
          {formatCalendarDate(request.plannedDate)}
        </Typography.Text>
      ),
    },
  ]

  const emptyText =
    db.tables.requests.length === 0 ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Заявок пока нет">
        <Button type="primary" onClick={openCreateDrawer}>
          Создать заявку
        </Button>
      </Empty>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ничего не найдено">
        <Button onClick={resetFilters}>Сбросить фильтры</Button>
      </Empty>
    )

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
      <Flex wrap gap={12} align="center">
        <Input
          allowClear
          aria-label="Поиск по номеру, клиенту или телефону"
          value={params.query}
          prefix={<SearchOutlined />}
          placeholder="Номер, клиент или телефон"
          style={{ width: 280 }}
          onChange={(event) => {
            updateParams({ query: event.target.value })
          }}
        />
        <Select
          mode="multiple"
          allowClear
          aria-label="Фильтр по статусу"
          value={params.statuses}
          options={STATUS_OPTIONS}
          placeholder="Статус"
          maxTagCount="responsive"
          style={{ minWidth: 200 }}
          onChange={(value: RequestStatus[]) => {
            updateParams({ statuses: value })
          }}
        />
        <Select
          mode="multiple"
          allowClear
          aria-label="Фильтр по приоритету"
          value={params.priorities}
          options={PRIORITY_OPTIONS}
          placeholder="Приоритет"
          maxTagCount="responsive"
          style={{ minWidth: 200 }}
          onChange={(value: Priority[]) => {
            updateParams({ priorities: value })
          }}
        />
        <Select
          mode="multiple"
          allowClear
          aria-label="Фильтр по мастеру"
          value={params.masterIds}
          options={masterOptions}
          placeholder="Мастер"
          maxTagCount="responsive"
          style={{ minWidth: 220 }}
          onChange={(value: string[]) => {
            updateParams({ masterIds: value })
          }}
        />
        <Select
          aria-label="Сортировка"
          value={params.sort}
          options={SORT_OPTIONS}
          style={{ minWidth: 260 }}
          onChange={(value: (typeof SORT_OPTIONS)[number]['value']) => {
            updateParams({ sort: value })
          }}
        />
        <Flex align="center" gap={8}>
          <Switch
            id="overdue-filter"
            checked={params.overdueOnly}
            onChange={(value) => {
              updateParams({ overdueOnly: value })
            }}
          />
          <label htmlFor="overdue-filter">Только просроченные</label>
        </Flex>
        <Button disabled={!hasActiveFilters} onClick={resetFilters}>
          Сбросить фильтры
        </Button>
      </Flex>
      {isMobile ? (
        selection.items.length === 0 ? (
          emptyText
        ) : (
          <RequestCards
            requests={selection.items}
            clientsById={clientsById}
            mastersById={mastersById}
            today={today}
            listSearch={location.search}
          />
        )
      ) : (
        <Table<Request>
          rowKey="requestId"
          columns={columns}
          dataSource={selection.items}
          pagination={false}
          scroll={{ x: REQUEST_COLUMNS_WIDTH }}
          locale={{ emptyText }}
        />
      )}
      {selection.total > 0 && (
        <Pagination
          current={selection.page}
          total={selection.total}
          pageSize={REQUEST_LIST_PAGE_SIZE}
          showSizeChanger={false}
          showTotal={(total) => `Всего заявок: ${total}`}
          onChange={(value) => {
            updateParams({ page: value })
          }}
          style={{ alignSelf: 'flex-end' }}
        />
      )}
      <CreateRequestDrawer open={isCreateOpen} onClose={closeCreateDrawer} onCreated={handleCreated} />
    </Flex>
  )
}

export default RequestsListPage
