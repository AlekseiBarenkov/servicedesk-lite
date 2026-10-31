import { Tag } from 'antd'

import { PRIORITY } from '../data/model/constants'
import type { Priority } from '../data/model/constants'

const PRIORITY_COLOR: Record<Priority, string> = {
  1: 'default',
  2: '#0958d9',
  3: '#ad4e00',
  4: '#cf1322',
  5: '#820014',
}

type PriorityTagProps = {
  priority: Priority
}

const PriorityTag = ({ priority }: PriorityTagProps) => <Tag color={PRIORITY_COLOR[priority]}>{PRIORITY[priority]}</Tag>

export default PriorityTag
