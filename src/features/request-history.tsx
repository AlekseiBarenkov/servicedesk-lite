import { Flex, List, Typography } from 'antd'

import { HISTORY_EVENT_TYPE, REQUEST_STATUS_LABEL } from '../data/model/constants'
import { formatDateTime } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import type { HistoryEntry } from '../data/model/types'
import { historyRepo, mastersRepo, usersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'

type RequestHistoryProps = {
  requestId: string
}

const FIELD_LABEL: Record<string, string> = {
  firstName: 'Имя',
  lastName: 'Фамилия',
  patronymic: 'Отчество',
  phone: 'Телефон',
  email: 'Email',
  address: 'Адрес выезда',
  categoryId: 'Категория',
  description: 'Описание',
  priority: 'Приоритет',
  plannedDate: 'Плановая дата',
}

export const RequestHistory = ({ requestId }: RequestHistoryProps) => {
  const db = useDb()
  const entries = historyRepo.listByRequest(db, requestId)

  const getMasterName = (masterId: string): string => {
    const master = mastersRepo.findById(db, masterId)

    return master === null ? 'неизвестный мастер' : formatPersonName(master)
  }

  const getAuthorName = (userId: string): string => {
    const author = usersRepo.findById(db, userId)

    return author === null ? 'неизвестный автор' : formatPersonName(author)
  }

  const describeEntry = (entry: HistoryEntry): string => {
    if (entry.type === HISTORY_EVENT_TYPE.created) {
      return 'Заявка создана'
    }

    if (entry.type === HISTORY_EVENT_TYPE.masterAssigned) {
      return `Назначен мастер: ${getMasterName(entry.masterId)}`
    }

    if (entry.type === HISTORY_EVENT_TYPE.masterChanged) {
      return `Мастер заменён: ${getMasterName(entry.fromMasterId)} → ${getMasterName(entry.toMasterId)}`
    }

    if (entry.type === HISTORY_EVENT_TYPE.statusChanged) {
      return `Статус изменён: ${REQUEST_STATUS_LABEL[entry.from]} → ${REQUEST_STATUS_LABEL[entry.to]}`
    }

    return 'Изменены поля заявки'
  }

  if (entries.length === 0) {
    return <Typography.Text type="secondary">Событий пока нет</Typography.Text>
  }

  return (
    <List
      size="small"
      dataSource={entries}
      renderItem={(entry) => (
        <List.Item>
          <Flex vertical gap={4} style={{ width: '100%' }}>
            <Typography.Text>{describeEntry(entry)}</Typography.Text>
            <Typography.Text type="secondary">
              {formatDateTime(entry.createdAt)} · {getAuthorName(entry.userId)}
            </Typography.Text>
            {entry.type === HISTORY_EVENT_TYPE.fieldsChanged && (
              <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                {entry.changes.map((change) => (
                  <li key={change.field}>
                    {FIELD_LABEL[change.field] ?? change.field}: {change.from} → {change.to}
                  </li>
                ))}
              </ul>
            )}
          </Flex>
        </List.Item>
      )}
    />
  )
}
