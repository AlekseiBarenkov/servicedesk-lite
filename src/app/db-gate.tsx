import type { ReactNode } from 'react'

import { App as AntApp, Button, Result, Spin } from 'antd'

import { resetDb } from '../data/storage/store'
import { useDbState } from '../data/storage/use-db'
import { describeError } from '../data/validation/rules'

type DbGateProps = {
  children: ReactNode
}

const DbGate = ({ children }: DbGateProps) => {
  const state = useDbState()
  const { message } = AntApp.useApp()

  const handleReset = async (): Promise<void> => {
    try {
      await resetDb()
      message.success('Данные демо сброшены')
    } catch (error) {
      message.error(describeError(error))
    }
  }

  if (state.status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <Result
        status="warning"
        title="Не удалось открыть данные демо"
        subTitle={state.details}
        extra={[
          <Button
            key="reset"
            type="primary"
            danger
            onClick={() => {
              void handleReset()
            }}
          >
            Сбросить демо
          </Button>,
          <Button
            key="reload"
            onClick={() => {
              window.location.reload()
            }}
          >
            Перезагрузить страницу
          </Button>,
        ]}
      />
    )
  }

  return <>{children}</>
}

export default DbGate
