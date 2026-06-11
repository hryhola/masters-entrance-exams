import { getTaskDatasetDefinition } from '../exams/registry'
import { adaptTaskDataset } from './adaptTaskDataset'
import { DatasetLoadError, resolvePublicUrl } from './loadDataset'
import type { TaskDataset } from './taskTypes'
import { validateTaskDatasetDocument } from './validateTaskDataset'

const cache = new Map<string, Promise<TaskDataset>>()

async function fetchTaskDataset(datasetId: string): Promise<TaskDataset> {
  const definition = getTaskDatasetDefinition(datasetId)
  if (!definition) {
    throw new DatasetLoadError(`Набір v2 "${datasetId}" не зареєстровано.`)
  }

  try {
    const response = await fetch(resolvePublicUrl(definition.dataPath))
    if (!response.ok) {
      throw new DatasetLoadError(
        `Не вдалося завантажити набір v2 "${datasetId}" (${response.status}).`,
      )
    }

    const raw = validateTaskDatasetDocument(await response.json())
    if (raw.dataset.id !== datasetId) {
      throw new DatasetLoadError(
        `dataset.id: очікується "${datasetId}", отримано "${raw.dataset.id}"`,
      )
    }
    return adaptTaskDataset(raw)
  } catch (error) {
    if (error instanceof DatasetLoadError) throw error
    throw new DatasetLoadError(
      `Набір v2 "${datasetId}" недоступний або пошкоджений.`,
      error,
    )
  }
}

export function loadTaskDataset(datasetId: string): Promise<TaskDataset> {
  const cached = cache.get(datasetId)
  if (cached) return cached

  const request = fetchTaskDataset(datasetId)
  cache.set(datasetId, request)
  request.catch(() => cache.delete(datasetId))
  return request
}

export function clearTaskDatasetCache() {
  cache.clear()
}
