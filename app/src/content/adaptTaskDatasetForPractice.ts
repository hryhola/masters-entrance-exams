import type {
  AnswerReviewStatus,
  ContentBlock,
  ContentBlockType,
  DatasetContentStats,
  ExamDataset,
  OptionId,
  Question,
} from './types'
import type {
  AssessmentItem,
  AssessmentTask,
  Choice,
  Stimulus,
  TaskDataset,
} from './taskTypes'

export interface TaskDatasetPracticeProjection {
  id: string
  title: string
  subject: string
  language: string
  sectionCodes: string[]
}

const optionIds = new Set<OptionId>(['a', 'b', 'c', 'd'])

function asOptionId(value: string, context: string): OptionId {
  if (!optionIds.has(value as OptionId)) {
    throw new Error(`${context}: непідтримуваний варіант відповіді "${value}".`)
  }
  return value as OptionId
}

function stimulusHeading(stimulus: Stimulus): ContentBlock[] {
  return stimulus.title
    ? [{ type: 'markdown', text: `### ${stimulus.title}` }]
    : []
}

function resolveStimuli(
  ids: string[],
  stimuliById: Map<string, Stimulus>,
): ContentBlock[] {
  return ids.flatMap((id) => {
    const stimulus = stimuliById.get(id)
    if (!stimulus) {
      throw new Error(`Стимул "${id}" не знайдено.`)
    }
    return [...stimulusHeading(stimulus), ...stimulus.content]
  })
}

function resolveChoices(task: AssessmentTask, item: AssessmentItem): Choice[] {
  if (item.response.type !== 'matching_choice') return item.response.options

  const choiceSetId = item.response.choiceSetId
  const choiceSet = task.choiceSets.find(
    (candidate) => candidate.id === choiceSetId,
  )
  if (!choiceSet) {
    throw new Error(`${item.id}: набір варіантів "${choiceSetId}" не знайдено.`)
  }
  return choiceSet.choices
}

function topicFor(task: AssessmentTask) {
  if (task.sectionCode === 'tznk-verbal') {
    return task.number <= 4
      ? { code: 'tznk-verbal-cloze', title: 'Мікротексти та лексика' }
      : { code: 'tznk-verbal-reading', title: 'Робота з текстами' }
  }

  return task.number <= 18
    ? { code: 'tznk-logical-reasoning', title: 'Логічні міркування' }
    : { code: 'tznk-logical-situations', title: 'Аналіз ситуацій' }
}

function collectBlockTypes(question: Question): ContentBlockType[] {
  return [
    ...new Set(
      [
        ...question.prompt,
        ...question.options.flatMap((option) => option.content),
        ...question.explanation.summary,
      ].map((block) => block.type),
    ),
  ]
}

function adaptItem(
  task: AssessmentTask,
  item: AssessmentItem,
  position: number,
  stimuliById: Map<string, Stimulus>,
  sectionTitle: string,
): Question {
  const choices = resolveChoices(task, item)
  const correctOption = asOptionId(item.correctChoice, item.id)
  const topic = topicFor(task)
  const question: Question = {
    id: item.id,
    number: position,
    displayLabel: item.displayLabel,
    type: 'single_choice',
    origin: 'official',
    prompt: [
      ...task.instruction,
      ...resolveStimuli(task.stimulusIds, stimuliById),
      ...resolveStimuli(item.stimulusIds, stimuliById),
      ...item.prompt,
    ],
    options: choices.map((choice) => ({
      id: asOptionId(choice.id, item.id),
      content: choice.content,
    })),
    correctOption,
    explanation: {
      summary: item.explanation.summary,
      optionFeedback: [],
      answerReview: {
        status: 'verified',
        officialOption: correctOption,
        note: '',
      },
    },
    classification: {
      alignment: 'aligned',
      topic: {
        code: topic.code,
        sectionCode: task.sectionCode,
        section: sectionTitle,
        topic: topic.title,
        expectedCognitiveLevel: 'application',
      },
      cognitiveLevel: 'application',
      tags: ['tznk', task.type, `task-${task.number}`],
      formatCompliance: 'compliant',
    },
    source: {
      pageStart: item.source.pageStart,
      pageEnd: item.source.pageEnd,
      questionNumber: item.number,
    },
    features: {
      blockTypes: [],
      hasComplexContent: false,
    },
  }

  question.features.blockTypes = collectBlockTypes(question)
  question.features.hasComplexContent = question.features.blockTypes.some(
    (type) => type !== 'markdown',
  )
  return question
}

function countContent(questions: Question[]): DatasetContentStats {
  const stats: DatasetContentStats = {
    markdown: 0,
    math: 0,
    code: 0,
    table: 0,
    image: 0,
    unknown: 0,
  }

  for (const question of questions) {
    for (const block of [
      ...question.prompt,
      ...question.options.flatMap((option) => option.content),
      ...question.explanation.summary,
    ]) {
      stats[block.type] += 1
    }
  }
  return stats
}

export function adaptTaskDatasetForPractice(
  dataset: TaskDataset,
  projection: TaskDatasetPracticeProjection,
): ExamDataset {
  const sectionCodeSet = new Set(projection.sectionCodes)
  const sectionsByCode = new Map(
    dataset.sections.map((section) => [section.code, section]),
  )
  const stimuliById = new Map(
    dataset.stimuli.map((stimulus) => [stimulus.id, stimulus]),
  )
  const tasks = dataset.tasks.filter((task) =>
    sectionCodeSet.has(task.sectionCode),
  )
  const questions = tasks.flatMap((task) => {
    const section = sectionsByCode.get(task.sectionCode)
    if (!section) {
      throw new Error(`Розділ "${task.sectionCode}" не знайдено.`)
    }
    return task.items.map((item) =>
      adaptItem(
        task,
        item,
        tasks
          .flatMap((candidate) => candidate.items)
          .findIndex((candidate) => candidate.id === item.id) + 1,
        stimuliById,
        section.title,
      ),
    )
  })
  const answerReviewCounts: Record<AnswerReviewStatus, number> = {
    verified: questions.length,
    verified_with_caveat: 0,
    disputed: 0,
  }

  return {
    id: projection.id,
    title: projection.title,
    exam: dataset.exam,
    subject: projection.subject,
    year: dataset.year,
    language: projection.language,
    version: dataset.version,
    status: 'ready_for_application',
    origin: 'official',
    questions,
    sections: projection.sectionCodes.map((code) => {
      const section = sectionsByCode.get(code)
      if (!section) throw new Error(`Розділ "${code}" не знайдено.`)
      return {
        code,
        title: section.title,
        questionCount: questions.filter(
          (question) =>
            question.classification.topic?.sectionCode === section.code,
        ).length,
      }
    }),
    contentStats: countContent(questions),
    answerReviewCounts,
  }
}
