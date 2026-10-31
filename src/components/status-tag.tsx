import { Tag } from 'antd'

import type { RequestStatus } from '../data/model/constants'

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Новая',
  assigned: 'Назначена',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

const STATUS_COLOR: Record<RequestStatus, string> = {
  new: 'blue',
  assigned: 'cyan',
  in_progress: 'orange',
  done: 'green',
  cancelled: 'default',
}

type StatusTagProps = {
  status: RequestStatus
}

const StatusTag = ({ status }: StatusTagProps) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>

export default StatusTag
