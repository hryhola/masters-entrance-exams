export interface DatasetDefinition {
  id: string
  dataPath: string
  manifestPath: string
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
  'yefvv-it-2024': {
    id: 'yefvv-it-2024',
    dataPath: 'content/datasets/yefvv-it-2024/dataset.json',
    manifestPath: 'content/datasets/yefvv-it-2024/manifest.json',
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
    datasetId: 'yefvv-it-2024',
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
    status: 'planned',
  },
  {
    id: 'yevi-english',
    shortName: 'ЄВІ',
    title: 'Англійська мова',
    subject: 'Англійська мова',
    year: 2023,
    status: 'planned',
  },
]

export function getExamDefinition(examId: string | undefined) {
  return examRegistry.find((exam) => exam.id === examId)
}

export function getDatasetDefinition(datasetId: string | undefined) {
  return datasetId ? datasetRegistry[datasetId] : undefined
}
