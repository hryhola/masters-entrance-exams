import type { ContentOrigin, OptionId, Question } from '../../content/types'

export type PracticeMode = 'full' | 'topic' | 'quick' | 'daily'
export type PracticeExperience = 'learning' | 'exam'
export type PracticeContentOrigin = 'all' | ContentOrigin
export type SessionStatus = 'active' | 'completed'
export type SessionCompletionReason = 'submitted' | 'timer'

export interface PracticeSessionConfig {
  examId: string
  datasetId: string
  mode: PracticeMode
  experience: PracticeExperience
  contentOrigin?: PracticeContentOrigin
  questionCount?: number
  sectionCode?: string
  durationSeconds?: number
}

export interface PracticeSession {
  id: string
  config: PracticeSessionConfig
  status: SessionStatus
  questionIds: string[]
  questionReasons: Record<string, string[]>
  currentIndex: number
  answers: Record<string, OptionId>
  flaggedQuestionIds: string[]
  revealedQuestionIds: string[]
  startedAt: number
  completedAt: number | null
  completionReason: SessionCompletionReason | null
  remainingSeconds: number | null
  deadlineAt: number | null
}

export type PracticeSessionAction =
  | { type: 'answer'; questionId: string; optionId: OptionId }
  | { type: 'go_to'; index: number }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'toggle_flag'; questionId: string }
  | { type: 'tick'; elapsedSeconds?: number; now: number }
  | {
      type: 'finish'
      reason?: SessionCompletionReason
      now: number
    }

interface CreatePracticeSessionInput {
  id: string
  config: PracticeSessionConfig
  questions: Question[]
  questionIds?: string[]
  questionReasons?: Record<string, string[]>
  now: number
}

export interface SessionScore {
  total: number
  answered: number
  correct: number
  incorrect: number
  unanswered: number
  percentage: number
}

function hashSeed(seed: string) {
  let hash = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function createRandom(seed: string) {
  let value = hashSeed(seed) || 1

  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function deterministicShuffle<T>(items: T[], seed: string) {
  const shuffled = [...items]
  const random = createRandom(seed)

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }

  return shuffled
}

export function matchesContentOrigin(
  question: Question,
  contentOrigin: PracticeContentOrigin = 'all',
) {
  return contentOrigin === 'all' || question.origin === contentOrigin
}

export function filterQuestionsByContentOrigin(
  questions: Question[],
  contentOrigin: PracticeContentOrigin = 'all',
) {
  return contentOrigin === 'all'
    ? questions
    : questions.filter((question) =>
        matchesContentOrigin(question, contentOrigin),
      )
}

export function selectSessionQuestionIds(
  questions: Question[],
  config: PracticeSessionConfig,
  seed: string,
  requestedQuestionIds?: string[],
) {
  if (config.mode === 'daily') {
    if (!requestedQuestionIds?.length) {
      throw new Error('Щоденна сесія повинна містити рекомендовані питання.')
    }

    const availableIds = new Set(questions.map((question) => question.id))
    if (
      requestedQuestionIds.some((questionId) => !availableIds.has(questionId))
    ) {
      throw new Error('Щоденна сесія містить недоступне питання.')
    }

    return [...requestedQuestionIds]
  }

  const availableQuestions = filterQuestionsByContentOrigin(
    questions,
    config.contentOrigin,
  )

  if (config.mode === 'topic') {
    if (!config.sectionCode) {
      throw new Error('Для тематичної сесії потрібно вибрати розділ.')
    }

    const questionIds = availableQuestions
      .filter(
        (question) =>
          question.classification.topic?.sectionCode === config.sectionCode,
      )
      .map((question) => question.id)

    if (questionIds.length === 0) {
      throw new Error('У вибраному розділі немає доступних питань.')
    }

    return questionIds
  }

  if (config.mode === 'quick') {
    const count = config.questionCount ?? 10
    if (count < 1 || count > availableQuestions.length) {
      throw new Error('Некоректна кількість питань для швидкої сесії.')
    }

    return deterministicShuffle(
      availableQuestions.map((question) => question.id),
      seed,
    ).slice(0, count)
  }

  return availableQuestions.map((question) => question.id)
}

export function createPracticeSession({
  id,
  config,
  questions,
  questionIds: requestedQuestionIds,
  questionReasons = {},
  now,
}: CreatePracticeSessionInput): PracticeSession {
  const questionIds = selectSessionQuestionIds(
    questions,
    config,
    id,
    requestedQuestionIds,
  )

  if (questionIds.length === 0) {
    throw new Error('Сесія повинна містити хоча б одне питання.')
  }
  if (new Set(questionIds).size !== questionIds.length) {
    throw new Error('Сесія не може містити дублікати питань.')
  }

  return {
    id,
    config,
    status: 'active',
    questionIds,
    questionReasons: Object.fromEntries(
      questionIds.map((questionId) => [
        questionId,
        [...(questionReasons[questionId] ?? [])],
      ]),
    ),
    currentIndex: 0,
    answers: {},
    flaggedQuestionIds: [],
    revealedQuestionIds: [],
    startedAt: now,
    completedAt: null,
    completionReason: null,
    remainingSeconds:
      config.experience === 'exam' ? (config.durationSeconds ?? null) : null,
    deadlineAt:
      config.experience === 'exam' && config.durationSeconds
        ? now + config.durationSeconds * 1000
        : null,
  }
}

function finishSession(
  session: PracticeSession,
  reason: SessionCompletionReason,
  now: number,
): PracticeSession {
  return {
    ...session,
    status: 'completed',
    completedAt: now,
    completionReason: reason,
    remainingSeconds:
      reason === 'timer' && session.remainingSeconds !== null
        ? 0
        : session.remainingSeconds,
  }
}

export function practiceSessionReducer(
  session: PracticeSession,
  action: PracticeSessionAction,
  questions: Question[] = [],
): PracticeSession {
  if (session.status === 'completed') return session

  switch (action.type) {
    case 'answer': {
      if (!session.questionIds.includes(action.questionId)) return session
      const question = questions.find(
        (candidate) => candidate.id === action.questionId,
      )
      const constrainedQuestionIds =
        question?.answerConstraint?.unique === true
          ? new Set(
              questions
                .filter(
                  (candidate) =>
                    candidate.answerConstraint?.groupId ===
                    question.answerConstraint?.groupId,
                )
                .map((candidate) => candidate.id),
            )
          : null
      const answers = Object.fromEntries(
        Object.entries(session.answers).filter(
          ([questionId, optionId]) =>
            !(
              questionId !== action.questionId &&
              constrainedQuestionIds?.has(questionId) &&
              optionId === action.optionId
            ),
        ),
      )

      return {
        ...session,
        answers: {
          ...answers,
          [action.questionId]: action.optionId,
        },
        revealedQuestionIds:
          session.config.experience === 'learning' &&
          !session.revealedQuestionIds.includes(action.questionId)
            ? [...session.revealedQuestionIds, action.questionId]
            : session.revealedQuestionIds,
      }
    }
    case 'go_to':
      if (!Number.isInteger(action.index)) return session
      return {
        ...session,
        currentIndex: Math.min(
          Math.max(action.index, 0),
          session.questionIds.length - 1,
        ),
      }
    case 'next':
      return {
        ...session,
        currentIndex: Math.min(
          session.currentIndex + 1,
          session.questionIds.length - 1,
        ),
      }
    case 'previous':
      return {
        ...session,
        currentIndex: Math.max(session.currentIndex - 1, 0),
      }
    case 'toggle_flag':
      if (!session.questionIds.includes(action.questionId)) return session
      return {
        ...session,
        flaggedQuestionIds: session.flaggedQuestionIds.includes(
          action.questionId,
        )
          ? session.flaggedQuestionIds.filter(
              (questionId) => questionId !== action.questionId,
            )
          : [...session.flaggedQuestionIds, action.questionId],
      }
    case 'tick': {
      if (session.remainingSeconds === null) return session

      const remainingSeconds =
        action.elapsedSeconds !== undefined
          ? Math.max(session.remainingSeconds - action.elapsedSeconds, 0)
          : session.deadlineAt !== null
            ? Math.max(Math.ceil((session.deadlineAt - action.now) / 1000), 0)
            : Math.max(session.remainingSeconds - 1, 0)

      return remainingSeconds === 0
        ? finishSession({ ...session, remainingSeconds }, 'timer', action.now)
        : { ...session, remainingSeconds }
    }
    case 'finish':
      return finishSession(session, action.reason ?? 'submitted', action.now)
  }
}

export function scorePracticeSession(
  session: PracticeSession,
  questions: Question[],
): SessionScore {
  const questionsById = new Map(
    questions.map((question) => [question.id, question]),
  )
  const answered = session.questionIds.filter(
    (questionId) => session.answers[questionId] !== undefined,
  ).length
  const correct = session.questionIds.filter((questionId) => {
    const question = questionsById.get(questionId)
    return question && session.answers[questionId] === question.correctOption
  }).length
  const total = session.questionIds.length

  return {
    total,
    answered,
    correct,
    incorrect: answered - correct,
    unanswered: total - answered,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
  }
}

export function formatSessionTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`
}
