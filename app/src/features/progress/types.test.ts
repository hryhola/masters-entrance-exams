import { describe, expect, it } from 'vitest'

import { createTestQuestion } from '../../test/fixtures'
import {
  createPracticeSession,
  practiceSessionReducer,
} from '../practice/session'
import { createPracticeAttempt, updateQuestionProgress } from './types'

function createCompletedSession() {
  const questions = [
    createTestQuestion(),
    createTestQuestion({
      id: 'q2',
      number: 2,
      correctOption: 'c',
      origin: 'generated',
    }),
  ]
  const active = createPracticeSession({
    id: 'attempt-1',
    config: {
      examId: 'exam',
      datasetId: 'dataset',
      mode: 'full',
      experience: 'learning',
    },
    questions,
    now: 1_000,
  })
  const answered = practiceSessionReducer(active, {
    type: 'answer',
    questionId: 'q1',
    optionId: 'a',
  })
  const completed = practiceSessionReducer(answered, {
    type: 'finish',
    now: 11_000,
  })

  return { completed, questions }
}

describe('progress snapshots', () => {
  it('creates an immutable result from the official dataset answers', () => {
    const { completed, questions } = createCompletedSession()
    const attempt = createPracticeAttempt(completed, questions)

    expect(attempt).toMatchObject({
      id: 'attempt-1',
      elapsedSeconds: 10,
      score: {
        total: 2,
        answered: 1,
        correct: 0,
        incorrect: 1,
        unanswered: 1,
        percentage: 0,
      },
    })
    expect(attempt.questionResults.map((result) => result.status)).toEqual([
      'incorrect',
      'unanswered',
    ])
    expect(attempt.questionResults.map((result) => result.origin)).toEqual([
      'official',
      'generated',
    ])

    completed.answers.q1 = 'b'
    questions[0].correctOption = 'a'

    expect(attempt.answers.q1).toBe('a')
    expect(attempt.questionResults[0].officialOption).toBe('b')
  })

  it('accumulates question progress across completed attempts', () => {
    const { completed, questions } = createCompletedSession()
    const firstAttempt = createPracticeAttempt(completed, questions)
    const firstProgress = updateQuestionProgress({}, firstAttempt)
    const secondProgress = updateQuestionProgress(firstProgress, firstAttempt)

    expect(secondProgress['dataset:q1']).toMatchObject({
      attempts: 2,
      answered: 2,
      correct: 0,
      incorrect: 2,
      skipped: 0,
      lastResult: 'incorrect',
    })
    expect(secondProgress['dataset:q2']).toMatchObject({
      origin: 'generated',
      attempts: 2,
      answered: 0,
      skipped: 2,
      lastResult: 'unanswered',
    })
  })
})
