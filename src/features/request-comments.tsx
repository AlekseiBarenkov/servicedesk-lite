import { useState } from 'react'

import { App as AntApp, Button, Flex, Input, List, Typography } from 'antd'

import { formatDateTime } from '../data/model/dates'
import { formatPersonName } from '../data/model/person'
import { addComment } from '../data/operations/add-comment'
import { commentsRepo, usersRepo } from '../data/repositories'
import { useDb } from '../data/storage/use-db'
import { describeError } from '../data/validation/rules'

type RequestCommentsProps = {
  requestId: string
}

export const RequestComments = ({ requestId }: RequestCommentsProps) => {
  const db = useDb()
  const { message } = AntApp.useApp()
  const [text, setText] = useState('')
  const [isPending, setPending] = useState(false)

  const comments = commentsRepo.listByRequest(db, requestId)

  const handleAdd = async (): Promise<void> => {
    setPending(true)

    try {
      await addComment(requestId, text)
      setText('')
      message.success('Комментарий добавлен')
    } catch (error) {
      message.error(describeError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <Flex vertical gap={12}>
      {comments.length === 0 ? (
        <Typography.Text type="secondary">Комментариев пока нет</Typography.Text>
      ) : (
        <List
          size="small"
          dataSource={comments}
          renderItem={(comment) => {
            const author = usersRepo.findById(db, comment.userId)

            return (
              <List.Item>
                <Flex vertical gap={4} style={{ width: '100%' }}>
                  <Typography.Text type="secondary">
                    {formatDateTime(comment.createdAt)} ·{' '}
                    {author === null ? 'Неизвестный автор' : formatPersonName(author)}
                  </Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>
                    {comment.text}
                  </Typography.Paragraph>
                </Flex>
              </List.Item>
            )
          }}
        />
      )}
      <Flex vertical gap={8}>
        <Input.TextArea
          value={text}
          rows={2}
          placeholder="Добавить комментарий"
          onChange={(event) => {
            setText(event.target.value)
          }}
        />
        <Flex justify="flex-end">
          <Button
            type="primary"
            loading={isPending}
            disabled={text.trim() === ''}
            onClick={() => {
              void handleAdd()
            }}
          >
            Добавить
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
