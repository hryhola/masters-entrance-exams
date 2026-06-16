import {
  getDatasetDefinition,
  type CombinedDatasetDefinition,
} from '../exams/registry'
import { adaptDataset } from './adaptDataset'
import { adaptTaskDatasetForPractice } from './adaptTaskDatasetForPractice'
import { loadTaskDataset } from './loadTaskDataset'
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

function combineSections(datasets: ExamDataset[]) {
  const sections = new Map<string, ExamDataset['sections'][number]>()

  for (const dataset of datasets) {
    for (const section of dataset.sections) {
      const current = sections.get(section.code)
      if (current) {
        current.questionCount += section.questionCount
      } else {
        sections.set(section.code, { ...section })
      }
    }
  }

  return [...sections.values()].sort((left, right) => {
    const leftNumber = Number(left.code)
    const rightNumber = Number(right.code)
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber
    }
    return left.code.localeCompare(right.code, 'uk')
  })
}

function combineDatasets(
  definition: CombinedDatasetDefinition,
  datasets: ExamDataset[],
): ExamDataset {
  if (datasets.length === 0) {
    throw new DatasetLoadError(`Набір "${definition.id}" не має джерел.`)
  }

  let nextNumber = 1
  const questions = datasets.flatMap((dataset, datasetIndex) =>
    dataset.questions.map((question, questionIndex) => {
      const number = nextNumber
      nextNumber += 1

      return {
        ...question,
        number,
        displayLabel:
          datasetIndex === 0
            ? (question.displayLabel ?? String(number))
            : `Дод. ${questionIndex + 1}`,
      }
    }),
  )
  const contentStats = datasets.reduce<ExamDataset['contentStats']>(
    (summary, dataset) => ({
      markdown: summary.markdown + dataset.contentStats.markdown,
      math: summary.math + dataset.contentStats.math,
      code: summary.code + dataset.contentStats.code,
      table: summary.table + dataset.contentStats.table,
      image: summary.image + dataset.contentStats.image,
      unknown: summary.unknown + dataset.contentStats.unknown,
    }),
    { markdown: 0, math: 0, code: 0, table: 0, image: 0, unknown: 0 },
  )
  const answerReviewCounts = datasets.reduce<ExamDataset['answerReviewCounts']>(
    (summary, dataset) => ({
      verified: summary.verified + dataset.answerReviewCounts.verified,
      verified_with_caveat:
        summary.verified_with_caveat +
        dataset.answerReviewCounts.verified_with_caveat,
      disputed: summary.disputed + dataset.answerReviewCounts.disputed,
    }),
    { verified: 0, verified_with_caveat: 0, disputed: 0 },
  )
  const primary = datasets[0]

  return {
    id: definition.id,
    title: definition.title,
    exam: primary.exam,
    subject: definition.subject,
    year: primary.year,
    language: definition.language,
    version: datasets.map((dataset) => dataset.version).join('+'),
    status: 'ready_for_application',
    origin: primary.origin,
    verification: primary.verification,
    questions,
    sections: combineSections(datasets),
    contentStats,
    answerReviewCounts,
  }
}

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

  if (definition.kind === 'task_projection') {
    const taskDataset = await loadTaskDataset(definition.sourceDatasetId)
    return adaptTaskDatasetForPractice(taskDataset, definition)
  }

  if (definition.kind === 'combined') {
    const datasets = await Promise.all(
      definition.sourceDatasetIds.map((sourceDatasetId) =>
        loadDataset(sourceDatasetId),
      ),
    )
    return combineDatasets(definition, datasets)
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
