import { Tag } from 'antd'

import { PRIORITY } from '../data/model/constants'
import type { Priority } from '../data/model/constants'

const PRIORITY_COLOR: Record<Priority, string> = {
  1: 'default',
  2: 'blue',
  3: 'orange',
  4: 'red',
  5: '#a8071a',
}

type PriorityTagProps = {
  priority: Priority
}

const PriorityTag = ({ priority }: PriorityTagProps) => <Tag color={PRIORITY_COLOR[priority]}>{PRIORITY[priority]}</Tag>

export default PriorityTag
