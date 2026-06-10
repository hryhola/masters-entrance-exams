import { useEffect, useState } from 'react'

import { loadDataset } from './loadDataset'
import type { ExamDataset } from './types'

type DatasetState =
  | { status: 'loading'; dataset: null; error: null }
  | { status: 'ready'; dataset: ExamDataset; error: null }
  | { status: 'error'; dataset: null; error: Error }

interface StoredDatasetState {
  datasetId: string
  result: Exclude<DatasetState, { status: 'loading' }>
}

export function useDataset(datasetId: string | undefined): DatasetState {
  const [storedState, setStoredState] = useState<StoredDatasetState | null>(
    null,
  )

  useEffect(() => {
    let active = true
    if (!datasetId) return

    loadDataset(datasetId)
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
      error: new Error('Для цього іспиту не вказано набір даних.'),
    }
  }
  if (!storedState || storedState.datasetId !== datasetId) {
    return { status: 'loading', dataset: null, error: null }
  }
  return storedState.result
}
