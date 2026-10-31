import { Tag } from 'antd'

import { REQUEST_STATUS_LABEL } from '../data/model/constants'
import type { RequestStatus } from '../data/model/constants'

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

const StatusTag = ({ status }: StatusTagProps) => <Tag color={STATUS_COLOR[status]}>{REQUEST_STATUS_LABEL[status]}</Tag>

export default StatusTag
