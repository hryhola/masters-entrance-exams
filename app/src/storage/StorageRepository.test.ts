import { describe, expect, it } from 'vitest'

import {
  createPracticeAttempt,
  updateQuestionProgress,
} from '../features/progress/types'
import {
  createPracticeSession,
  practiceSessionReducer,
} from '../features/practice/session'
import { createTestQuestion } from '../test/fixtures'
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  StorageRepository,
} from './StorageRepository'
import type { PersistedAppState, StorageLike } from './types'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()
  writeError: Error | null = null

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.writeError) throw this.writeError
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

function createState(): PersistedAppState {
  const questions = [createTestQuestion()]
  const active = createPracticeSession({
    id: 'active-session',
    config: {
      examId: 'exam',
      datasetId: 'dataset',
      mode: 'full',
      experience: 'learning',
    },
    questions,
    now: 1_000,
  })
  const attemptSession = createPracticeSession({
    id: 'attempt-1',
    config: active.config,
    questions,
    now: 1_000,
  })
  const answered = practiceSessionReducer(attemptSession, {
    type: 'answer',
    questionId: 'q1',
    optionId: 'b',
  })
  const completed = practiceSessionReducer(answered, {
    type: 'finish',
    now: 5_000,
  })
  const attempt = createPracticeAttempt(completed, questions)

  return {
    profile: {
      createdAt: attempt.completedAt,
      updatedAt: attempt.completedAt,
      completedAttempts: 1,
    },
    sessions: { 'active-session': active },
    attempts: [attempt],
    questionProgress: updateQuestionProgress({}, attempt),
    bookmarks: [],
    settings: {
      reducedMotion: false,
      targetExamDate: null,
      dailyQuestionCount: 10,
    },
  }
}

describe('StorageRepository', () => {
  it('round-trips versioned application state', () => {
    const storage = new MemoryStorage()
    const repository = new StorageRepository(storage)
    const state = createState()

    expect(repository.save(state)).toEqual({ ok: true })
    expect(repository.load()).toEqual({ state, issues: [] })

    const envelope = JSON.parse(storage.getItem(STORAGE_KEYS.attempts) ?? '')
    expect(envelope).toMatchObject({ version: 2, data: state.attempts })
  })

  it('migrates a legacy session collection and restores its deadline', () => {
    const storage = new MemoryStorage()
    const session = createPracticeSession({
      id: 'legacy-session',
      config: {
        examId: 'exam',
        datasetId: 'dataset',
        mode: 'quick',
        experience: 'exam',
        questionCount: 1,
        durationSeconds: 120,
      },
      questions: [createTestQuestion()],
      now: 10_000,
    })
    const legacySession: Record<string, unknown> = { ...session }
    delete legacySession.deadlineAt

    storage.setItem(
      STORAGE_KEYS.sessions,
      JSON.stringify({
        version: 0,
        data: { sessions: [legacySession] },
      }),
    )

    const result = new StorageRepository(storage).load()

    expect(result.issues).toEqual([])
    expect(result.state.sessions['legacy-session'].deadlineAt).toBe(130_000)
    expect(
      JSON.parse(storage.getItem(STORAGE_KEYS.sessions) ?? '').version,
    ).toBe(2)
  })

  it('migrates v1 keys to v2 learning models', () => {
    const storage = new MemoryStorage()
    const state = createState()
    const legacySession = structuredClone(
      state.sessions['active-session'],
    ) as unknown as Record<string, unknown>
    const legacyAttempt = structuredClone(
      state.attempts[0],
    ) as unknown as Record<string, unknown>
    const legacyProgress = structuredClone(
      state.questionProgress['dataset:q1'],
    ) as unknown as Record<string, unknown>
    delete legacySession.questionReasons
    delete legacyAttempt.questionReasons
    delete legacyProgress.firstAttemptAt
    delete legacyProgress.firstResult
    delete legacyProgress.correctStreak
    delete legacyProgress.masteryLevel
    delete legacyProgress.nextReviewAt

    storage.setItem(
      LEGACY_STORAGE_KEYS.sessions,
      JSON.stringify({ version: 1, data: { active: legacySession } }),
    )
    storage.setItem(
      LEGACY_STORAGE_KEYS.attempts,
      JSON.stringify({ version: 1, data: [legacyAttempt] }),
    )
    storage.setItem(
      LEGACY_STORAGE_KEYS.questionProgress,
      JSON.stringify({
        version: 1,
        data: { 'dataset:q1': legacyProgress },
      }),
    )
    storage.setItem(
      LEGACY_STORAGE_KEYS.settings,
      JSON.stringify({ version: 1, data: { reducedMotion: false } }),
    )

    const result = new StorageRepository(storage).load()

    expect(result.issues).toEqual([])
    expect(result.state.sessions['active-session'].questionReasons).toEqual({})
    expect(result.state.attempts[0].questionReasons).toEqual({})
    expect(result.state.questionProgress['dataset:q1']).toMatchObject({
      firstResult: 'correct',
      correctStreak: 1,
      masteryLevel: 'reviewing',
    })
    expect(result.state.settings).toEqual({
      reducedMotion: false,
      targetExamDate: null,
      dailyQuestionCount: 10,
    })
    expect(storage.getItem(STORAGE_KEYS.questionProgress)).not.toBeNull()
  })

  it('exports and imports a complete profile into clean storage', () => {
    const sourceRepository = new StorageRepository(new MemoryStorage())
    const targetRepository = new StorageRepository(new MemoryStorage())
    const state = {
      ...createState(),
      bookmarks: ['dataset:q1'],
      settings: {
        reducedMotion: false,
        targetExamDate: '2026-07-25',
        dailyQuestionCount: 5,
      },
    }

    const result = targetRepository.import(sourceRepository.export(state))

    expect(result).toMatchObject({ ok: true, state })
    expect(targetRepository.load().state).toEqual(state)
  })

  it('rejects incomplete import files without changing storage', () => {
    const storage = new MemoryStorage()
    const repository = new StorageRepository(storage)

    expect(repository.import(JSON.stringify({ hello: 'world' }))).toMatchObject(
      {
        ok: false,
        issue: { code: 'corrupted' },
      },
    )
    expect(storage.values.size).toBe(0)
  })

  it('removes corrupted data and returns a safe fallback', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEYS.attempts, '{broken json')

    const result = new StorageRepository(storage).load()

    expect(result.state.attempts).toEqual([])
    expect(result.issues[0]).toMatchObject({
      code: 'corrupted',
      key: STORAGE_KEYS.attempts,
    })
    expect(storage.getItem(STORAGE_KEYS.attempts)).toBeNull()
  })

  it('reports quota errors without throwing', () => {
    const storage = new MemoryStorage()
    const quotaError = new Error('full')
    quotaError.name = 'QuotaExceededError'
    storage.writeError = quotaError

    expect(new StorageRepository(storage).save(createState())).toMatchObject({
      ok: false,
      issue: { code: 'quota' },
    })
  })
})
