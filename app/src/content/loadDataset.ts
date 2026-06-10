import { getDatasetDefinition } from '../exams/registry'
import { adaptDataset } from './adaptDataset'
import type { ExamDataset } from './types'
import {
  DatasetValidationError,
  validateDatasetDocument,
} from './validateDataset'

export class DatasetLoadError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'DatasetLoadError'
    this.cause = cause
  }
}

const cache = new Map<string, Promise<ExamDataset>>()

export function resolvePublicUrl(
  path: string,
  baseUrl = import.meta.env.BASE_URL,
) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalizedBase}${path.replace(/^\/+/, '')}`
}

export function resolveContentAsset(path: string) {
  return resolvePublicUrl(`content/${path}`)
}

async function fetchDataset(datasetId: string): Promise<ExamDataset> {
  const definition = getDatasetDefinition(datasetId)
  if (!definition) {
    throw new DatasetLoadError(`Набір "${datasetId}" не зареєстровано.`)
  }

  const url = resolvePublicUrl(definition.dataPath)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new DatasetLoadError(
        `Не вдалося завантажити набір "${datasetId}" (${response.status}).`,
      )
    }
    const raw = validateDatasetDocument(await response.json())
    if (raw.dataset.id !== datasetId) {
      throw new DatasetValidationError(
        `dataset.id: очікується "${datasetId}", отримано "${raw.dataset.id}"`,
      )
    }
    return adaptDataset(raw)
  } catch (error) {
    if (error instanceof DatasetLoadError) throw error
    throw new DatasetLoadError(
      `Набір "${datasetId}" недоступний або пошкоджений.`,
      error,
    )
  }
}

export function loadDataset(datasetId: string): Promise<ExamDataset> {
  const cached = cache.get(datasetId)
  if (cached) return cached

  const request = fetchDataset(datasetId)
  cache.set(datasetId, request)
  request.catch(() => cache.delete(datasetId))
  return request
}

export function clearDatasetCache() {
  cache.clear()
}
