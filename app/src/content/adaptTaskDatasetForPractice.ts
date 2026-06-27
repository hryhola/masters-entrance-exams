import type {
  AnswerReviewStatus,
  ContentBlock,
  ContentBlockType,
  DatasetContentStats,
  ExamDataset,
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

function resolvePracticePrompt(
  task: AssessmentTask,
  item: AssessmentItem,
  stimuliById: Map<string, Stimulus>,
): ContentBlock[] {
  const taskStimuli = resolveStimuli(task.stimulusIds, stimuliById)
  const itemStimuli = resolveStimuli(item.stimulusIds, stimuliById)

  if (task.type === 'matching') {
    return [...task.instruction, ...taskStimuli, ...item.prompt, ...itemStimuli]
  }

  return [...task.instruction, ...taskStimuli, ...itemStimuli, ...item.prompt]
}

function topicFor(task: AssessmentTask, sectionTitle: string) {
  if (task.sectionCode === 'english-reading') {
    return { code: 'english-reading', title: 'Reading' }
  }
  if (task.sectionCode === 'english-use-of-language') {
    return { code: 'english-use-of-language', title: 'Use of English' }
  }
  if (task.sectionCode === 'tznk-verbal') {
    return task.number <= 4
      ? { code: 'tznk-verbal-cloze', title: 'Мікротексти та лексика' }
      : { code: 'tznk-verbal-reading', title: 'Робота з текстами' }
  }

  if (task.sectionCode === 'tznk-logical') {
    return task.number <= 18
      ? { code: 'tznk-logical-reasoning', title: 'Логічні міркування' }
      : { code: 'tznk-logical-situations', title: 'Аналіз ситуацій' }
  }

  return { code: task.sectionCode, title: sectionTitle }
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
  dataset: TaskDataset,
): Question {
  const choices = resolveChoices(task, item)
  const correctOption = item.correctChoice
  const topic = topicFor(task, sectionTitle)
  const examTag = dataset.exam === 'ЄФВВ' ? 'yefvv' : 'evi'
  const question: Question = {
    id: item.id,
    number: position,
    displayLabel: item.displayLabel,
    language: task.language,
    type: 'single_choice',
    origin: dataset.origin,
    verification: dataset.verification,
    answerConstraint:
      task.type === 'matching' && task.choiceSets[0]
        ? {
            groupId: `${task.id}:${task.choiceSets[0].id}`,
            unique: task.choiceSets[0].unique,
          }
        : undefined,
    prompt: resolvePracticePrompt(task, item, stimuliById),
    options: choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      content: choice.content,
    })),
    correctOption,
    explanation: {
      status: item.explanation.status,
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
      tags: [examTag, task.type, `task-${task.number}`],
      formatCompliance: 'compliant',
    },
    source:
      item.source.type === 'generated'
        ? item.source
        : {
            type: 'official_pdf',
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
        dataset,
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
    origin: dataset.origin,
    verification: dataset.verification,
    generation: dataset.generation,
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
