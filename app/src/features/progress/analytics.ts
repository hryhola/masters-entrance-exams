import type {
  AttemptQuestionResult,
  PracticeAttempt,
  QuestionProgress,
  QuestionProgressMap,
} from './types'

export interface ProgressSummary {
  attemptCount: number
  questionCount: number
  answered: number
  correct: number
  incorrect: number
  skipped: number
  accuracy: number
  elapsedSeconds: number
}

export interface TopicSummary {
  key: string
  title: string
  sectionTitle: string
  attempts: number
  answered: number
  correct: number
  incorrect: number
  skipped: number
  accuracy: number
  elapsedSeconds: number
}

export interface LearningSummary {
  coveredQuestions: number
  firstAttemptCorrect: number
  repeatedAttempts: number
  learning: number
  reviewing: number
  mastered: number
  dueNow: number
}

export interface PeriodSummary extends ProgressSummary {
  key: 'week' | 'month' | 'all'
  label: string
}

export interface SectionSummary {
  key: string
  title: string
  total: number
  answered: number
  correct: number
  incorrect: number
  skipped: number
  accuracy: number
}

export function summarizeAttemptSections(
  attempt: PracticeAttempt,
): SectionSummary[] {
  const sections = new Map<
    string,
    Omit<SectionSummary, 'accuracy'> & { accuracy?: number }
  >()

  for (const result of attempt.questionResults) {
    const key = result.sectionCode ?? 'unmapped'
    const current = sections.get(key) ?? {
      key,
      title: result.sectionTitle,
      total: 0,
      answered: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
    }

    current.total += 1
    if (result.status !== 'unanswered') current.answered += 1
    if (result.status === 'correct') current.correct += 1
    if (result.status === 'incorrect') current.incorrect += 1
    if (result.status === 'unanswered') current.skipped += 1
    sections.set(key, current)
  }

  return [...sections.values()]
    .map((section) => ({
      ...section,
      accuracy:
        section.answered === 0
          ? 0
          : Math.round((section.correct / section.answered) * 100),
    }))
    .sort((left, right) => left.key.localeCompare(right.key, 'uk'))
}

export function summarizeAttempts(
  attempts: PracticeAttempt[],
): ProgressSummary {
  const totals = attempts.reduce(
    (summary, attempt) => ({
      attemptCount: summary.attemptCount + 1,
      questionCount: summary.questionCount + attempt.score.total,
      answered: summary.answered + attempt.score.answered,
      correct: summary.correct + attempt.score.correct,
      incorrect: summary.incorrect + attempt.score.incorrect,
      skipped: summary.skipped + attempt.score.unanswered,
      elapsedSeconds: summary.elapsedSeconds + attempt.elapsedSeconds,
    }),
    {
      attemptCount: 0,
      questionCount: 0,
      answered: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
      elapsedSeconds: 0,
    },
  )

  return {
    ...totals,
    accuracy:
      totals.answered === 0
        ? 0
        : Math.round((totals.correct / totals.answered) * 100),
  }
}

export function summarizeTopics(progress: QuestionProgressMap): TopicSummary[] {
  const groups = new Map<
    string,
    Omit<TopicSummary, 'accuracy'> & { accuracy?: number }
  >()

  for (const item of Object.values(progress)) {
    const key = item.topicCode ?? `section:${item.sectionCode ?? 'unmapped'}`
    const current = groups.get(key) ?? {
      key,
      title: item.topicTitle,
      sectionTitle: item.sectionTitle,
      attempts: 0,
      answered: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
      elapsedSeconds: 0,
    }

    current.attempts += item.attempts
    current.answered += item.answered
    current.correct += item.correct
    current.incorrect += item.incorrect
    current.skipped += item.skipped
    groups.set(key, current)
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      accuracy:
        group.answered === 0
          ? 0
          : Math.round((group.correct / group.answered) * 100),
      elapsedSeconds: 0,
    }))
    .sort(
      (left, right) =>
        left.accuracy - right.accuracy || right.attempts - left.attempts,
    )
}

export function summarizeLearning(
  progress: QuestionProgressMap,
  now: number,
): LearningSummary {
  return Object.values(progress).reduce(
    (summary, item) => ({
      coveredQuestions: summary.coveredQuestions + 1,
      firstAttemptCorrect:
        summary.firstAttemptCorrect + (item.firstResult === 'correct' ? 1 : 0),
      repeatedAttempts:
        summary.repeatedAttempts + Math.max(item.attempts - 1, 0),
      learning: summary.learning + (item.masteryLevel === 'learning' ? 1 : 0),
      reviewing:
        summary.reviewing + (item.masteryLevel === 'reviewing' ? 1 : 0),
      mastered: summary.mastered + (item.masteryLevel === 'mastered' ? 1 : 0),
      dueNow: summary.dueNow + (item.nextReviewAt <= now ? 1 : 0),
    }),
    {
      coveredQuestions: 0,
      firstAttemptCorrect: 0,
      repeatedAttempts: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
      dueNow: 0,
    },
  )
}

export function summarizePeriods(
  attempts: PracticeAttempt[],
  now: number,
): PeriodSummary[] {
  const day = 24 * 60 * 60 * 1000
  const periods = [
    { key: 'week' as const, label: '7 днів', since: now - 7 * day },
    { key: 'month' as const, label: '30 днів', since: now - 30 * day },
    { key: 'all' as const, label: 'Увесь час', since: 0 },
  ]

  return periods.map((period) => ({
    key: period.key,
    label: period.label,
    ...summarizeAttempts(
      attempts.filter((attempt) => attempt.completedAt >= period.since),
    ),
  }))
}

export function summarizeTopicsFromAttempts(
  attempts: PracticeAttempt[],
): TopicSummary[] {
  const groups = new Map<
    string,
    Omit<TopicSummary, 'accuracy'> & { accuracy?: number }
  >()

  for (const attempt of attempts) {
    const secondsPerQuestion =
      attempt.score.total === 0
        ? 0
        : attempt.elapsedSeconds / attempt.score.total

    for (const result of attempt.questionResults) {
      const key =
        result.topicCode ?? `section:${result.sectionCode ?? 'unmapped'}`
      const current = groups.get(key) ?? {
        key,
        title: result.topicTitle,
        sectionTitle: result.sectionTitle,
        attempts: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        elapsedSeconds: 0,
      }

      current.attempts += 1
      current.answered += result.status === 'unanswered' ? 0 : 1
      current.correct += result.status === 'correct' ? 1 : 0
      current.incorrect += result.status === 'incorrect' ? 1 : 0
      current.skipped += result.status === 'unanswered' ? 1 : 0
      current.elapsedSeconds += secondsPerQuestion
      groups.set(key, current)
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      elapsedSeconds: Math.round(group.elapsedSeconds),
      accuracy:
        group.answered === 0
          ? 0
          : Math.round((group.correct / group.answered) * 100),
    }))
    .sort(
      (left, right) =>
        left.accuracy - right.accuracy || left.attempts - right.attempts,
    )
}

export interface ReviewQuestion {
  attemptId: string
  completedAt: number
  datasetId: string
  examId: string
  result: AttemptQuestionResult
}

export function collectLatestReviewQuestions(
  attempts: PracticeAttempt[],
): ReviewQuestion[] {
  const latestByQuestion = new Map<string, ReviewQuestion>()

  for (const attempt of attempts) {
    for (const result of attempt.questionResults) {
      if (result.status === 'correct') continue

      const key = `${attempt.config.datasetId}:${result.questionId}`
      const current = latestByQuestion.get(key)

      if (!current || attempt.completedAt > current.completedAt) {
        latestByQuestion.set(key, {
          attemptId: attempt.id,
          completedAt: attempt.completedAt,
          datasetId: attempt.config.datasetId,
          examId: attempt.config.examId,
          result,
        })
      }
    }
  }

  return [...latestByQuestion.values()].sort(
    (left, right) => right.completedAt - left.completedAt,
  )
}

export function getQuestionAccuracy(progress: QuestionProgress) {
  return progress.answered === 0
    ? 0
    : Math.round((progress.correct / progress.answered) * 100)
}
