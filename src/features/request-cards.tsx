import { Card, Flex, Typography } from 'antd'
import { Link } from 'react-router'

import PriorityTag from '../components/priority-tag'
import StatusTag from '../components/status-tag'
import { formatCalendarDate } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import { isRequestOverdue } from '../data/model/request'
import type { Client, Master, Request } from '../data/model/types'

type RequestCardsProps = {
  requests: Request[]
  clientsById: Map<string, Client>
  mastersById: Map<string, Master>
  today: string
  listSearch: string
}

export const RequestCards = ({ requests, clientsById, mastersById, today, listSearch }: RequestCardsProps) => (
  <Flex vertical gap={12}>
    {requests.map((request) => {
      const client = clientsById.get(request.clientId)
      const master = request.masterId === null ? undefined : mastersById.get(request.masterId)

      return (
        <Link
          key={request.requestId}
          to={`/requests/${request.requestId}`}
          state={{ listSearch }}
          style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
        >
          <Card size="small" hoverable>
            <Flex vertical gap={8}>
              <Flex justify="space-between" align="center" gap={8}>
                <Typography.Text strong>{request.number}</Typography.Text>
                <StatusTag status={request.status} />
              </Flex>
              <Flex vertical gap={2}>
                <Typography.Text>{client === undefined ? '-' : formatPersonName(client)}</Typography.Text>
                <Typography.Text type="secondary">
                  Мастер: {master === undefined ? '-' : formatPersonName(master)}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between" align="center" gap={8}>
                <PriorityTag priority={request.priority} />
                <Typography.Text type={isRequestOverdue(request, today) ? 'danger' : undefined}>
                  {formatCalendarDate(request.plannedDate)}
                </Typography.Text>
              </Flex>
            </Flex>
          </Card>
        </Link>
      )
    })}
  </Flex>
)
