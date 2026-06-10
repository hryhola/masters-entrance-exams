import type { Question } from '../../content/types'
import type {
  MasteryLevel,
  QuestionProgress,
  QuestionProgressMap,
  QuestionResultStatus,
} from '../progress/types'

const DAY_MS = 24 * 60 * 60 * 1000

export interface ReviewSchedule {
  correctStreak: number
  masteryLevel: MasteryLevel
  nextReviewAt: number
  intervalDays: number
}

export interface DailyPlanItem {
  questionId: string
  questionNumber: number
  priority: number
  reasons: string[]
}

export interface DailyPlan {
  generatedAt: number
  items: DailyPlanItem[]
}

function getIntervalDays(correctStreak: number) {
  if (correctStreak <= 0) return 0
  if (correctStreak === 1) return 1
  if (correctStreak === 2) return 3
  if (correctStreak === 3) return 7
  if (correctStreak === 4) return 14
  if (correctStreak === 5) return 21
  return 30
}

function getMasteryLevel(correctStreak: number): MasteryLevel {
  if (correctStreak === 0) return 'learning'
  if (correctStreak < 3) return 'reviewing'
  return 'mastered'
}

export function calculateReviewSchedule(
  previous: QuestionProgress | undefined,
  result: QuestionResultStatus,
  completedAt: number,
): ReviewSchedule {
  const correctStreak =
    result === 'correct' ? (previous?.correctStreak ?? 0) + 1 : 0
  const intervalDays = getIntervalDays(correctStreak)

  return {
    correctStreak,
    masteryLevel: getMasteryLevel(correctStreak),
    nextReviewAt: completedAt + intervalDays * DAY_MS,
    intervalDays,
  }
}

function getTopicAccuracy(progress: QuestionProgressMap) {
  const topics = new Map<string, { answered: number; correct: number }>()

  for (const item of Object.values(progress)) {
    const key = item.topicCode ?? `section:${item.sectionCode ?? 'unmapped'}`
    const current = topics.get(key) ?? { answered: 0, correct: 0 }
    current.answered += item.answered
    current.correct += item.correct
    topics.set(key, current)
  }

  return new Map(
    [...topics].map(([key, value]) => [
      key,
      {
        ...value,
        accuracy:
          value.answered === 0
            ? 0
            : Math.round((value.correct / value.answered) * 100),
      },
    ]),
  )
}

export function buildDailyPlan({
  questions,
  datasetId,
  progress,
  bookmarks,
  now,
  count,
}: {
  questions: Question[]
  datasetId: string
  progress: QuestionProgressMap
  bookmarks: string[]
  now: number
  count: number
}): DailyPlan {
  const bookmarkSet = new Set(bookmarks)
  const topicAccuracy = getTopicAccuracy(progress)
  const candidates = questions.map((question) => {
    const item = progress[`${datasetId}:${question.id}`]
    const bookmarkKey = `${datasetId}:${question.id}`
    const topicKey =
      question.classification.topic?.code ??
      `section:${question.classification.topic?.sectionCode ?? 'unmapped'}`
    const topic = topicAccuracy.get(topicKey)
    const reasons: string[] = []
    let priority = 50

    if (item?.lastResult === 'incorrect') {
      priority = 0
      reasons.push('Остання відповідь була неправильною')
    } else if (item?.lastResult === 'unanswered') {
      priority = 1
      reasons.push('Питання було пропущено')
    } else if (item && item.nextReviewAt <= now) {
      priority = 2
      reasons.push('Настав час інтервального повторення')
    }

    if (bookmarkSet.has(bookmarkKey)) {
      priority = Math.min(priority, 3)
      reasons.push('Додано до закладок')
    }

    if (topic && topic.answered >= 2 && topic.accuracy < 70) {
      priority = Math.min(priority, 4)
      reasons.push(`Слабка тема: точність ${topic.accuracy}%`)
    }

    if (!item) {
      priority = Math.min(priority, 10)
      reasons.push('Нове питання для розширення покриття')
    }

    if (reasons.length === 0) {
      reasons.push('Закріплення вже знайомого матеріалу')
    }

    return {
      questionId: question.id,
      questionNumber: question.number,
      priority,
      reasons,
      lastAttemptAt: item?.lastAttemptAt ?? 0,
    }
  })

  return {
    generatedAt: now,
    items: candidates
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          left.lastAttemptAt - right.lastAttemptAt ||
          left.questionNumber - right.questionNumber,
      )
      .slice(0, Math.min(count, questions.length))
      .map((item) => ({
        questionId: item.questionId,
        questionNumber: item.questionNumber,
        priority: item.priority,
        reasons: item.reasons,
      })),
  }
}
