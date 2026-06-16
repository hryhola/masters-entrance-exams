import { describe, expect, it } from 'vitest'

import type { PracticeAttempt, QuestionProgressMap } from './types'
import {
  collectLatestReviewQuestions,
  summarizeAttempts,
  summarizeAttemptsByOrigin,
  summarizeTopics,
} from './analytics'

const attempt: PracticeAttempt = {
  id: 'attempt-1',
  sessionId: 'attempt-1',
  config: {
    examId: 'exam',
    datasetId: 'dataset',
    mode: 'quick',
    experience: 'learning',
  },
  questionIds: ['q1', 'q2'],
  questionReasons: {},
  answers: { q1: 'b' },
  flaggedQuestionIds: [],
  startedAt: 1_000,
  completedAt: 61_000,
  completionReason: 'submitted',
  elapsedSeconds: 60,
  score: {
    total: 2,
    answered: 1,
    correct: 1,
    incorrect: 0,
    unanswered: 1,
    percentage: 50,
  },
  questionResults: [
    {
      questionId: 'q1',
      questionNumber: 1,
      selectedOption: 'b',
      officialOption: 'b',
      status: 'correct',
      answerReviewStatus: 'verified',
      origin: 'official',
      sectionCode: '1',
      sectionTitle: 'Розділ',
      topicCode: '1.1',
      topicTitle: 'Тема 1',
    },
    {
      questionId: 'q2',
      questionNumber: 2,
      selectedOption: null,
      officialOption: 'c',
      status: 'unanswered',
      answerReviewStatus: 'disputed',
      origin: 'generated',
      sectionCode: '1',
      sectionTitle: 'Розділ',
      topicCode: '1.2',
      topicTitle: 'Тема 2',
    },
  ],
}

describe('progress analytics', () => {
  it('summarizes completed attempts', () => {
    expect(summarizeAttempts([attempt])).toEqual({
      attemptCount: 1,
      questionCount: 2,
      answered: 1,
      correct: 1,
      incorrect: 0,
      skipped: 1,
      accuracy: 100,
      elapsedSeconds: 60,
    })
  })

  it('summarizes completed attempts by content origin', () => {
    expect(summarizeAttemptsByOrigin([attempt])).toEqual([
      {
        key: 'official',
        title: 'Офіційні',
        attemptCount: 1,
        questionCount: 1,
        answered: 1,
        correct: 1,
        incorrect: 0,
        skipped: 0,
        accuracy: 100,
        elapsedSeconds: 30,
      },
      {
        key: 'generated',
        title: 'Згенеровані',
        attemptCount: 1,
        questionCount: 1,
        answered: 0,
        correct: 0,
        incorrect: 0,
        skipped: 1,
        accuracy: 0,
        elapsedSeconds: 30,
      },
    ])
  })

  it('sorts topics from lowest accuracy', () => {
    const progress: QuestionProgressMap = {
      'dataset:q1': {
        key: 'dataset:q1',
        datasetId: 'dataset',
        questionId: 'q1',
        questionNumber: 1,
        origin: 'official',
        sectionCode: '1',
        sectionTitle: 'Розділ',
        topicCode: '1.1',
        topicTitle: 'Сильна тема',
        attempts: 2,
        firstAttemptAt: 1,
        firstResult: 'correct',
        answered: 2,
        correct: 2,
        incorrect: 0,
        skipped: 0,
        lastResult: 'correct',
        lastAttemptAt: 10,
        correctStreak: 2,
        masteryLevel: 'reviewing',
        nextReviewAt: 20,
      },
      'dataset:q2': {
        key: 'dataset:q2',
        datasetId: 'dataset',
        questionId: 'q2',
        questionNumber: 2,
        origin: 'generated',
        sectionCode: '1',
        sectionTitle: 'Розділ',
        topicCode: '1.2',
        topicTitle: 'Слабка тема',
        attempts: 2,
        firstAttemptAt: 1,
        firstResult: 'incorrect',
        answered: 2,
        correct: 1,
        incorrect: 1,
        skipped: 0,
        lastResult: 'incorrect',
        lastAttemptAt: 10,
        correctStreak: 0,
        masteryLevel: 'learning',
        nextReviewAt: 10,
      },
    }

    expect(summarizeTopics(progress).map((topic) => topic.title)).toEqual([
      'Слабка тема',
      'Сильна тема',
    ])
  })

  it('keeps only the latest non-correct result for review', () => {
    const older = {
      ...attempt,
      id: 'older',
      completedAt: 10,
      questionResults: [
        { ...attempt.questionResults[1], status: 'incorrect' as const },
      ],
    }

    const review = collectLatestReviewQuestions([older, attempt])

    expect(review).toHaveLength(1)
    expect(review[0]).toMatchObject({
      attemptId: 'attempt-1',
      result: { questionId: 'q2', status: 'unanswered' },
    })
  })
})
