import { describe, expect, it } from 'vitest'

import { createTestQuestion } from '../../test/fixtures'
import type { QuestionProgress, QuestionProgressMap } from '../progress/types'
import { buildDailyPlan, calculateReviewSchedule } from './scheduler'

function progress(overrides: Partial<QuestionProgress> = {}): QuestionProgress {
  return {
    key: 'dataset:q1',
    datasetId: 'dataset',
    questionId: 'q1',
    questionNumber: 1,
    sectionCode: '1',
    sectionTitle: 'Розділ',
    topicCode: '1.1',
    topicTitle: 'Тема',
    attempts: 1,
    firstAttemptAt: 1_000,
    firstResult: 'incorrect',
    answered: 1,
    correct: 0,
    incorrect: 1,
    skipped: 0,
    lastResult: 'incorrect',
    lastAttemptAt: 1_000,
    correctStreak: 0,
    masteryLevel: 'learning',
    nextReviewAt: 1_000,
    ...overrides,
  }
}

describe('review scheduler', () => {
  it('uses the agreed review intervals', () => {
    const day = 24 * 60 * 60 * 1000
    let current: QuestionProgress | undefined
    const intervals: number[] = []

    for (let streak = 1; streak <= 6; streak += 1) {
      const schedule = calculateReviewSchedule(current, 'correct', 10_000)
      intervals.push(schedule.intervalDays)
      current = progress({
        correctStreak: schedule.correctStreak,
        masteryLevel: schedule.masteryLevel,
        nextReviewAt: schedule.nextReviewAt,
        lastResult: 'correct',
      })
    }

    expect(intervals).toEqual([1, 3, 7, 14, 21, 30])
    expect(calculateReviewSchedule(current, 'incorrect', 10_000)).toEqual({
      correctStreak: 0,
      masteryLevel: 'learning',
      nextReviewAt: 10_000,
      intervalDays: 0,
    })
    expect(
      calculateReviewSchedule(undefined, 'correct', 10_000).nextReviewAt,
    ).toBe(10_000 + day)
  })

  it('prioritizes errors, skips, due reviews, bookmarks and weak topics', () => {
    const questions = [
      createTestQuestion(),
      createTestQuestion({ id: 'q2', number: 2 }),
      createTestQuestion({ id: 'q3', number: 3 }),
      createTestQuestion({ id: 'q4', number: 4 }),
      createTestQuestion({ id: 'q5', number: 5 }),
      createTestQuestion({ id: 'q6', number: 6 }),
    ]
    const items: QuestionProgressMap = {
      'dataset:q1': progress(),
      'dataset:q2': progress({
        key: 'dataset:q2',
        questionId: 'q2',
        questionNumber: 2,
        firstResult: 'unanswered',
        lastResult: 'unanswered',
        answered: 0,
        incorrect: 0,
        skipped: 1,
      }),
      'dataset:q3': progress({
        key: 'dataset:q3',
        questionId: 'q3',
        questionNumber: 3,
        firstResult: 'correct',
        lastResult: 'correct',
        correct: 1,
        incorrect: 0,
        correctStreak: 1,
        masteryLevel: 'reviewing',
        nextReviewAt: 5_000,
      }),
      'dataset:q5': progress({
        key: 'dataset:q5',
        questionId: 'q5',
        questionNumber: 5,
        topicCode: '1.5',
        topicTitle: 'Тестова тема 5',
        attempts: 2,
        answered: 2,
        correct: 1,
        incorrect: 1,
        lastResult: 'correct',
        correctStreak: 1,
        masteryLevel: 'reviewing',
        nextReviewAt: 50_000,
      }),
    }

    const plan = buildDailyPlan({
      questions,
      datasetId: 'dataset',
      progress: items,
      bookmarks: ['dataset:q4'],
      now: 10_000,
      count: 6,
    })

    expect(plan.items.map((item) => item.questionId)).toEqual([
      'q1',
      'q2',
      'q3',
      'q4',
      'q5',
      'q6',
    ])
    expect(plan.items[0].reasons).toContain(
      'Остання відповідь була неправильною',
    )
    expect(plan.items[3].reasons).toContain('Додано до закладок')
    expect(plan.items[4].reasons).toContain('Слабка тема: точність 50%')
    expect(plan.items[5].reasons).toContain(
      'Нове питання для розширення покриття',
    )
  })
})
