import { Tag } from 'antd'

import { REQUEST_STATUS_LABEL } from '../data/model/constants'
import type { RequestStatus } from '../data/model/constants'

const STATUS_COLOR: Record<RequestStatus, string> = {
  new: '#0958d9',
  assigned: '#006d75',
  in_progress: '#ad4e00',
  done: '#237804',
  cancelled: 'default',
}

type StatusTagProps = {
  status: RequestStatus
}

const StatusTag = ({ status }: StatusTagProps) => <Tag color={STATUS_COLOR[status]}>{REQUEST_STATUS_LABEL[status]}</Tag>

export default StatusTag
