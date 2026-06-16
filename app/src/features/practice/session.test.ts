import { describe, expect, it } from 'vitest'

import type { ContentOrigin, Question } from '../../content/types'
import {
  createPracticeSession,
  practiceSessionReducer,
  scorePracticeSession,
  selectSessionQuestionIds,
  type PracticeSessionConfig,
} from './session'

function question(
  id: string,
  sectionCode = '1',
  origin: ContentOrigin = 'official',
): Question {
  return {
    id,
    number: Number(id.replace(/\D/g, '')),
    type: 'single_choice',
    origin,
    verification:
      origin === 'official'
        ? { method: 'official_source' }
        : {
            method: 'agent_validation',
            status: 'passed',
            workflowVersion: 'test',
            validatedAt: '2026-01-01T00:00:00.000Z',
            report: 'test',
            checks: ['schema', 'answer_integrity', 'exam_style'],
            similarity: {
              maximumScore: 0,
              threshold: 0.82,
            },
          },
    prompt: [],
    options: [
      { id: 'a', label: 'A', content: [] },
      { id: 'b', label: 'B', content: [] },
      { id: 'c', label: 'C', content: [] },
      { id: 'd', label: 'D', content: [] },
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
    source:
      origin === 'official'
        ? {
            type: 'official_pdf',
            pageStart: 1,
            pageEnd: 1,
            questionNumber: 1,
          }
        : {
            type: 'generated',
            batchId: 'test-generated',
          },
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

  it('filters a thematic session by selected content origin', () => {
    const mixedQuestions = [
      question('q1', '1'),
      question('q2', '1', 'generated'),
      question('q3', '2', 'generated'),
    ]
    const ids = selectSessionQuestionIds(
      mixedQuestions,
      config({
        mode: 'topic',
        sectionCode: '1',
        contentOrigin: 'generated',
      }),
      'seed',
    )

    expect(ids).toEqual(['q2'])
  })

  it('builds quick sessions only from the selected content origin', () => {
    const mixedQuestions = [
      question('q1', '1'),
      question('q2', '1', 'generated'),
      question('q3', '2', 'generated'),
    ]
    const ids = selectSessionQuestionIds(
      mixedQuestions,
      config({ contentOrigin: 'generated', questionCount: 2 }),
      'seed',
    )

    expect(ids).toHaveLength(2)
    expect(ids.every((id) => id !== 'q1')).toBe(true)
  })

  it('keeps the exact order and reasons of a daily plan', () => {
    const session = createPracticeSession({
      id: 'daily',
      config: config({ mode: 'daily', questionCount: 2 }),
      questions,
      questionIds: ['q3', 'q1'],
      questionReasons: {
        q3: ['Настав час повторення'],
        q1: ['Остання відповідь була неправильною'],
      },
      now: 100,
    })

    expect(session.questionIds).toEqual(['q3', 'q1'])
    expect(session.questionReasons.q3).toEqual(['Настав час повторення'])
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

  it('keeps a matching choice unique inside its answer group', () => {
    const matchingQuestions = ['q1', 'q2'].map((id) => ({
      ...question(id),
      answerConstraint: {
        groupId: 'task-1:shared-options',
        unique: true,
      },
    }))
    const session = createPracticeSession({
      id: 'matching',
      config: config({ mode: 'full' }),
      questions: matchingQuestions,
      now: 100,
    })
    const first = practiceSessionReducer(
      session,
      {
        type: 'answer',
        questionId: 'q1',
        optionId: 'h',
      },
      matchingQuestions,
    )
    const second = practiceSessionReducer(
      first,
      {
        type: 'answer',
        questionId: 'q2',
        optionId: 'h',
      },
      matchingQuestions,
    )

    expect(second.answers).toEqual({ q2: 'h' })
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
