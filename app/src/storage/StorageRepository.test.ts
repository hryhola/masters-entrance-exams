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
import { STORAGE_KEYS, StorageRepository } from './StorageRepository'
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
    id: 'session-1',
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
    sessions: { active },
    attempts: [attempt],
    questionProgress: updateQuestionProgress({}, attempt),
    settings: { reducedMotion: false },
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
    expect(envelope).toMatchObject({ version: 1, data: state.attempts })
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
    ).toBe(1)
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
