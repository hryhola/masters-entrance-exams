import { describe, expect, it } from 'vitest'

import type { Question } from '../../content/types'
import {
  createPracticeSession,
  practiceSessionReducer,
  scorePracticeSession,
  selectSessionQuestionIds,
  type PracticeSessionConfig,
} from './session'

function question(id: string, sectionCode = '1'): Question {
  return {
    id,
    number: Number(id.replace(/\D/g, '')),
    type: 'single_choice',
    origin: 'official',
    prompt: [],
    options: [
      { id: 'a', content: [] },
      { id: 'b', content: [] },
      { id: 'c', content: [] },
      { id: 'd', content: [] },
    ],
    correctOption: 'b',
    explanation: {
      summary: [],
      optionFeedback: [],
      answerReview: {
        status: 'verified',
        officialOption: 'b',
        note: '',
      },
    },
    classification: {
      alignment: 'aligned',
      topic: {
        code: `${sectionCode}.1`,
        sectionCode,
        section: `Розділ ${sectionCode}`,
        topic: 'Тема',
        expectedCognitiveLevel: 'knowledge',
      },
      cognitiveLevel: 'knowledge',
      tags: [],
      formatCompliance: 'compliant',
    },
    source: { pageStart: 1, pageEnd: 1, questionNumber: 1 },
    features: { blockTypes: ['markdown'], hasComplexContent: false },
  }
}

const questions = Array.from({ length: 20 }, (_, index) =>
  question(`q${index + 1}`, index < 7 ? '1' : '2'),
)

function config(
  overrides: Partial<PracticeSessionConfig> = {},
): PracticeSessionConfig {
  return {
    examId: 'generic-exam',
    datasetId: 'generic-dataset',
    mode: 'quick',
    experience: 'learning',
    questionCount: 5,
    ...overrides,
  }
}

describe('selectSessionQuestionIds', () => {
  it('keeps every full-test question once and in source order', () => {
    const ids = selectSessionQuestionIds(
      questions,
      config({ mode: 'full' }),
      'seed',
    )

    expect(ids).toEqual(questions.map((item) => item.id))
    expect(new Set(ids).size).toBe(questions.length)
  })

  it('builds a deterministic quick session with the requested size', () => {
    const first = selectSessionQuestionIds(questions, config(), 'same-seed')
    const second = selectSessionQuestionIds(questions, config(), 'same-seed')

    expect(first).toEqual(second)
    expect(first).toHaveLength(5)
    expect(new Set(first).size).toBe(5)
  })

  it('filters a thematic session by section', () => {
    const ids = selectSessionQuestionIds(
      questions,
      config({ mode: 'topic', sectionCode: '1' }),
      'seed',
    )

    expect(ids).toHaveLength(7)
    expect(ids).toEqual(questions.slice(0, 7).map((item) => item.id))
  })
})

describe('practiceSessionReducer', () => {
  it('keeps answers and flags while navigating', () => {
    const session = createPracticeSession({
      id: 'session',
      config: config(),
      questions,
      now: 100,
    })
    const questionId = session.questionIds[0]
    const answered = practiceSessionReducer(session, {
      type: 'answer',
      questionId,
      optionId: 'c',
    })
    const flagged = practiceSessionReducer(answered, {
      type: 'toggle_flag',
      questionId,
    })
    const moved = practiceSessionReducer(flagged, { type: 'next' })
    const returned = practiceSessionReducer(moved, { type: 'previous' })

    expect(returned.answers[questionId]).toBe('c')
    expect(returned.flaggedQuestionIds).toContain(questionId)
    expect(returned.currentIndex).toBe(0)
  })

  it('reveals feedback only in learning mode', () => {
    const learning = createPracticeSession({
      id: 'learning',
      config: config({ experience: 'learning' }),
      questions,
      now: 100,
    })
    const exam = createPracticeSession({
      id: 'exam',
      config: config({
        experience: 'exam',
        durationSeconds: 60,
      }),
      questions,
      now: 100,
    })

    expect(
      practiceSessionReducer(learning, {
        type: 'answer',
        questionId: learning.questionIds[0],
        optionId: 'a',
      }).revealedQuestionIds,
    ).toContain(learning.questionIds[0])
    expect(
      practiceSessionReducer(exam, {
        type: 'answer',
        questionId: exam.questionIds[0],
        optionId: 'a',
      }).revealedQuestionIds,
    ).toEqual([])
  })

  it('finishes an exam when the timer reaches zero', () => {
    const session = createPracticeSession({
      id: 'timed',
      config: config({
        experience: 'exam',
        durationSeconds: 2,
      }),
      questions,
      now: 100,
    })
    const finished = practiceSessionReducer(session, {
      type: 'tick',
      elapsedSeconds: 2,
      now: 102,
    })

    expect(finished.status).toBe('completed')
    expect(finished.completionReason).toBe('timer')
    expect(finished.remainingSeconds).toBe(0)
  })
})

describe('scorePracticeSession', () => {
  it('counts correct, incorrect and unanswered questions', () => {
    const session = createPracticeSession({
      id: 'score',
      config: config(),
      questions,
      now: 100,
    })
    const answeredCorrectly = practiceSessionReducer(session, {
      type: 'answer',
      questionId: session.questionIds[0],
      optionId: 'b',
    })
    const answeredIncorrectly = practiceSessionReducer(answeredCorrectly, {
      type: 'answer',
      questionId: session.questionIds[1],
      optionId: 'a',
    })
    const score = scorePracticeSession(answeredIncorrectly, questions)

    expect(score).toEqual({
      total: 5,
      answered: 2,
      correct: 1,
      incorrect: 1,
      unanswered: 3,
      percentage: 20,
    })
  })
})
