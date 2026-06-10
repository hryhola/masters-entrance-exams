import type {
  AnswerReviewStatus,
  OptionId,
  Question,
} from '../../content/types'
import type {
  PracticeSession,
  PracticeSessionConfig,
  SessionCompletionReason,
  SessionScore,
} from '../practice/session'

export type QuestionResultStatus = 'correct' | 'incorrect' | 'unanswered'

export interface AttemptQuestionResult {
  questionId: string
  questionNumber: number
  selectedOption: OptionId | null
  officialOption: OptionId
  status: QuestionResultStatus
  answerReviewStatus: AnswerReviewStatus
  sectionCode: string | null
  sectionTitle: string
  topicCode: string | null
  topicTitle: string
}

export interface PracticeAttempt {
  id: string
  sessionId: string
  config: PracticeSessionConfig
  questionIds: string[]
  answers: Record<string, OptionId>
  flaggedQuestionIds: string[]
  startedAt: number
  completedAt: number
  completionReason: SessionCompletionReason
  elapsedSeconds: number
  score: SessionScore
  questionResults: AttemptQuestionResult[]
}

export interface QuestionProgress {
  key: string
  datasetId: string
  questionId: string
  questionNumber: number
  sectionCode: string | null
  sectionTitle: string
  topicCode: string | null
  topicTitle: string
  attempts: number
  answered: number
  correct: number
  incorrect: number
  skipped: number
  lastResult: QuestionResultStatus
  lastAttemptAt: number
}

export type QuestionProgressMap = Record<string, QuestionProgress>

export function createPracticeAttempt(
  session: PracticeSession,
  questions: Question[],
): PracticeAttempt {
  if (session.status !== 'completed' || session.completedAt === null) {
    throw new Error('Спробу можна створити лише із завершеної сесії.')
  }

  const questionsById = new Map(
    questions.map((question) => [question.id, question]),
  )
  const questionResults = session.questionIds.map((questionId) => {
    const question = questionsById.get(questionId)

    if (!question) {
      throw new Error(`Питання ${questionId} відсутнє в наборі.`)
    }

    const selectedOption = session.answers[questionId] ?? null
    const status: QuestionResultStatus =
      selectedOption === null
        ? 'unanswered'
        : selectedOption === question.correctOption
          ? 'correct'
          : 'incorrect'

    return {
      questionId,
      questionNumber: question.number,
      selectedOption,
      officialOption: question.correctOption,
      status,
      answerReviewStatus: question.explanation.answerReview.status,
      sectionCode: question.classification.topic?.sectionCode ?? null,
      sectionTitle: question.classification.topic?.section ?? 'Поза програмою',
      topicCode: question.classification.topic?.code ?? null,
      topicTitle: question.classification.topic?.topic ?? 'Тему не визначено',
    }
  })
  const correct = questionResults.filter(
    (result) => result.status === 'correct',
  ).length
  const answered = questionResults.filter(
    (result) => result.status !== 'unanswered',
  ).length
  const total = questionResults.length

  return {
    id: session.id,
    sessionId: session.id,
    config: session.config,
    questionIds: [...session.questionIds],
    answers: { ...session.answers },
    flaggedQuestionIds: [...session.flaggedQuestionIds],
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    completionReason: session.completionReason ?? 'submitted',
    elapsedSeconds: Math.max(
      0,
      Math.round((session.completedAt - session.startedAt) / 1000),
    ),
    score: {
      total,
      answered,
      correct,
      incorrect: answered - correct,
      unanswered: total - answered,
      percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
    },
    questionResults,
  }
}

export function updateQuestionProgress(
  current: QuestionProgressMap,
  attempt: PracticeAttempt,
): QuestionProgressMap {
  const next = { ...current }

  for (const result of attempt.questionResults) {
    const key = `${attempt.config.datasetId}:${result.questionId}`
    const previous = next[key]
    const answered = result.status !== 'unanswered'

    next[key] = {
      key,
      datasetId: attempt.config.datasetId,
      questionId: result.questionId,
      questionNumber: result.questionNumber,
      sectionCode: result.sectionCode,
      sectionTitle: result.sectionTitle,
      topicCode: result.topicCode,
      topicTitle: result.topicTitle,
      attempts: (previous?.attempts ?? 0) + 1,
      answered: (previous?.answered ?? 0) + (answered ? 1 : 0),
      correct: (previous?.correct ?? 0) + (result.status === 'correct' ? 1 : 0),
      incorrect:
        (previous?.incorrect ?? 0) + (result.status === 'incorrect' ? 1 : 0),
      skipped:
        (previous?.skipped ?? 0) + (result.status === 'unanswered' ? 1 : 0),
      lastResult: result.status,
      lastAttemptAt: attempt.completedAt,
    }
  }

  return next
}
