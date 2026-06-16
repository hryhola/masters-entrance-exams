export interface QuestionDatasetDefinition {
  id: string
  kind: 'questions'
  dataPath: string
  manifestPath: string
}

export interface TaskProjectionDatasetDefinition {
  id: string
  kind: 'task_projection'
  sourceDatasetId: string
  title: string
  subject: string
  language: string
  sectionCodes: string[]
}

export interface CombinedDatasetDefinition {
  id: string
  kind: 'combined'
  title: string
  subject: string
  language: string
  sourceDatasetIds: string[]
}

export type DatasetDefinition =
  | QuestionDatasetDefinition
  | TaskProjectionDatasetDefinition
  | CombinedDatasetDefinition

export interface TaskDatasetDefinition {
  id: string
  dataPath: string
}

export interface ExamDefinition {
  id: string
  shortName: string
  title: string
  subject: string
  year: number
  status: 'available' | 'planned'
  datasetId?: string
  practice?: {
    examDurationMinutes: number
    estimatedSecondsPerQuestion: number
    quickQuestionCounts: number[]
  }
}

export const datasetRegistry: Record<string, DatasetDefinition> = {
  'yefvv-it-2024-plus-generated': {
    id: 'yefvv-it-2024-plus-generated',
    kind: 'combined',
    title: 'ЄФВВ: Інформаційні технології',
    subject: 'Інформаційні технології',
    language: 'uk',
    sourceDatasetIds: [
      'yefvv-it-2024',
      'generated-yefvv-it-cybersecurity-20260615-001',
    ],
  },
  'yefvv-it-2024': {
    id: 'yefvv-it-2024',
    kind: 'questions',
    dataPath: 'content/datasets/yefvv-it-2024/dataset.json',
    manifestPath: 'content/datasets/yefvv-it-2024/manifest.json',
  },
  'tznk-2024': {
    id: 'tznk-2024',
    kind: 'task_projection',
    sourceDatasetId: 'evi-schema-v2-fixtures',
    title: 'ЄВІ: ТЗНК 2024',
    subject: 'Тест загальної навчальної компетентності',
    language: 'uk',
    sectionCodes: ['tznk-verbal', 'tznk-logical'],
  },
  'evi-english-2023': {
    id: 'evi-english-2023',
    kind: 'task_projection',
    sourceDatasetId: 'evi-english-2023-source',
    title: 'ЄВІ: Англійська мова 2023',
    subject: 'Англійська мова',
    language: 'en',
    sectionCodes: ['english-reading', 'english-use-of-language'],
  },
  'generated-yefvv-it-cybersecurity-20260615-001': {
    id: 'generated-yefvv-it-cybersecurity-20260615-001',
    kind: 'task_projection',
    sourceDatasetId: 'generated-yefvv-it-cybersecurity-20260615-001',
    title: 'Додаткові питання ЄФВВ — Кібербезпека',
    subject: 'Інформаційні технології',
    language: 'uk',
    sectionCodes: ['5'],
  },
}

export const taskDatasetRegistry: Record<string, TaskDatasetDefinition> = {
  'evi-schema-v2-fixtures': {
    id: 'evi-schema-v2-fixtures',
    dataPath: 'content/fixtures/evi-schema-v2.json',
  },
  'evi-english-2023-source': {
    id: 'evi-english-2023-source',
    dataPath: 'content/datasets/evi-english-2023-source/dataset.json',
  },
  'generated-yefvv-it-cybersecurity-20260615-001': {
    id: 'generated-yefvv-it-cybersecurity-20260615-001',
    dataPath:
      'content/datasets/generated-yefvv-it-cybersecurity-20260615-001/dataset.json',
  },
}

export const examRegistry: ExamDefinition[] = [
  {
    id: 'yefvv-it',
    shortName: 'ЄФВВ',
    title: 'Інформаційні технології',
    subject: 'Інформаційні технології',
    year: 2024,
    status: 'available',
    datasetId: 'yefvv-it-2024-plus-generated',
    practice: {
      examDurationMinutes: 180,
      estimatedSecondsPerQuestion: 90,
      quickQuestionCounts: [5, 10, 20],
    },
  },
  {
    id: 'yevi-tzhnk',
    shortName: 'ЄВІ',
    title: 'ТЗНК',
    subject: 'Тест загальної навчальної компетентності',
    year: 2024,
    status: 'available',
    datasetId: 'tznk-2024',
    practice: {
      examDurationMinutes: 75,
      estimatedSecondsPerQuestion: 135,
      quickQuestionCounts: [5, 10, 20],
    },
  },
  {
    id: 'yevi-english',
    shortName: 'ЄВІ',
    title: 'Англійська мова',
    subject: 'Англійська мова',
    year: 2023,
    status: 'available',
    datasetId: 'evi-english-2023',
    practice: {
      examDurationMinutes: 45,
      estimatedSecondsPerQuestion: 90,
      quickQuestionCounts: [5, 10, 20],
    },
  },
]

export function getExamDefinition(examId: string | undefined) {
  return examRegistry.find((exam) => exam.id === examId)
}

export function getDatasetDefinition(datasetId: string | undefined) {
  return datasetId ? datasetRegistry[datasetId] : undefined
}

export function getTaskDatasetDefinition(datasetId: string | undefined) {
  return datasetId ? taskDatasetRegistry[datasetId] : undefined
}
