import { useSyncExternalStore } from 'react'

import type { Db } from '../model/types'
import { getDbState, subscribeDb } from './store'
import type { DbStoreState } from './store'

export const useDbState = (): DbStoreState => useSyncExternalStore(subscribeDb, getDbState)

export const useDb = (): Db => {
  const state = useDbState()

  if (state.status !== 'ready') {
    throw new Error('База демо недоступна: экран восстановления должен стоять выше в дереве.')
  }

  return state.db
}
