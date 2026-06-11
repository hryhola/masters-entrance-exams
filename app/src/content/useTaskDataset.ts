import { useEffect, useState } from 'react'

import { loadTaskDataset } from './loadTaskDataset'
import type { TaskDataset } from './taskTypes'

type TaskDatasetState =
  | { status: 'loading'; dataset: null; error: null }
  | { status: 'ready'; dataset: TaskDataset; error: null }
  | { status: 'error'; dataset: null; error: Error }

interface StoredTaskDatasetState {
  datasetId: string
  result: Exclude<TaskDatasetState, { status: 'loading' }>
}

export function useTaskDataset(
  datasetId: string | undefined,
): TaskDatasetState {
  const [storedState, setStoredState] = useState<StoredTaskDatasetState | null>(
    null,
  )

  useEffect(() => {
    let active = true
    if (!datasetId) return

    loadTaskDataset(datasetId)
      .then((dataset) => {
        if (active) {
          setStoredState({
            datasetId,
            result: { status: 'ready', dataset, error: null },
          })
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        setStoredState({
          datasetId,
          result: {
            status: 'error',
            dataset: null,
            error: error instanceof Error ? error : new Error(String(error)),
          },
        })
      })

    return () => {
      active = false
    }
  }, [datasetId])

  if (!datasetId) {
    return {
      status: 'error',
      dataset: null,
      error: new Error('Не вказано набір даних v2.'),
    }
  }
  if (!storedState || storedState.datasetId !== datasetId) {
    return { status: 'loading', dataset: null, error: null }
  }
  return storedState.result
}
