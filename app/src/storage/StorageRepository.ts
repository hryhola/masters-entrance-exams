import type { OptionId } from '../content/types'
import type {
  AttemptQuestionResult,
  PracticeAttempt,
  QuestionProgress,
  QuestionProgressMap,
} from '../features/progress/types'
import type {
  PracticeSession,
  PracticeSessionConfig,
} from '../features/practice/session'
import {
  STORAGE_VERSION,
  type LocalProfile,
  type LocalSettings,
  type PersistedAppState,
  type StorageEnvelope,
  type StorageIssue,
  type StorageLike,
  type StorageLoadResult,
  type StorageSaveResult,
} from './types'

const STORAGE_KEYS = {
  profile: 'masters-exams:v1:profile',
  sessions: 'masters-exams:v1:sessions',
  attempts: 'masters-exams:v1:attempts',
  questionProgress: 'masters-exams:v1:question-progress',
  settings: 'masters-exams:v1:settings',
} as const

const optionIds = new Set<OptionId>(['a', 'b', 'c', 'd'])
const defaultSettings: LocalSettings = { reducedMotion: false }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isOptionId(value: unknown): value is OptionId {
  return typeof value === 'string' && optionIds.has(value as OptionId)
}

function isAnswers(value: unknown): value is Record<string, OptionId> {
  return (
    isRecord(value) &&
    Object.values(value).every((optionId) => isOptionId(optionId))
  )
}

function isSessionConfig(value: unknown): value is PracticeSessionConfig {
  return (
    isRecord(value) &&
    typeof value.examId === 'string' &&
    typeof value.datasetId === 'string' &&
    (value.mode === 'full' ||
      value.mode === 'topic' ||
      value.mode === 'quick') &&
    (value.experience === 'learning' || value.experience === 'exam')
  )
}

function isPracticeSession(value: unknown): value is PracticeSession {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isSessionConfig(value.config) &&
    value.status === 'active' &&
    isStringArray(value.questionIds) &&
    value.questionIds.length > 0 &&
    typeof value.currentIndex === 'number' &&
    isAnswers(value.answers) &&
    isStringArray(value.flaggedQuestionIds) &&
    isStringArray(value.revealedQuestionIds) &&
    typeof value.startedAt === 'number' &&
    value.completedAt === null &&
    value.completionReason === null &&
    (typeof value.remainingSeconds === 'number' ||
      value.remainingSeconds === null) &&
    (typeof value.deadlineAt === 'number' || value.deadlineAt === null)
  )
}

function isQuestionResult(value: unknown): value is AttemptQuestionResult {
  return (
    isRecord(value) &&
    typeof value.questionId === 'string' &&
    typeof value.questionNumber === 'number' &&
    (value.selectedOption === null || isOptionId(value.selectedOption)) &&
    isOptionId(value.officialOption) &&
    (value.status === 'correct' ||
      value.status === 'incorrect' ||
      value.status === 'unanswered') &&
    (value.answerReviewStatus === 'verified' ||
      value.answerReviewStatus === 'verified_with_caveat' ||
      value.answerReviewStatus === 'disputed') &&
    typeof value.sectionTitle === 'string' &&
    typeof value.topicTitle === 'string'
  )
}

function isPracticeAttempt(value: unknown): value is PracticeAttempt {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.sessionId === 'string' &&
    isSessionConfig(value.config) &&
    isStringArray(value.questionIds) &&
    isAnswers(value.answers) &&
    isStringArray(value.flaggedQuestionIds) &&
    typeof value.startedAt === 'number' &&
    typeof value.completedAt === 'number' &&
    (value.completionReason === 'submitted' ||
      value.completionReason === 'timer') &&
    typeof value.elapsedSeconds === 'number' &&
    isRecord(value.score) &&
    typeof value.score.total === 'number' &&
    typeof value.score.answered === 'number' &&
    typeof value.score.correct === 'number' &&
    typeof value.score.incorrect === 'number' &&
    typeof value.score.unanswered === 'number' &&
    typeof value.score.percentage === 'number' &&
    Array.isArray(value.questionResults) &&
    value.questionResults.every(isQuestionResult)
  )
}

function isQuestionProgress(value: unknown): value is QuestionProgress {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    typeof value.datasetId === 'string' &&
    typeof value.questionId === 'string' &&
    typeof value.questionNumber === 'number' &&
    typeof value.sectionTitle === 'string' &&
    typeof value.topicTitle === 'string' &&
    typeof value.attempts === 'number' &&
    typeof value.answered === 'number' &&
    typeof value.correct === 'number' &&
    typeof value.incorrect === 'number' &&
    typeof value.skipped === 'number' &&
    (value.lastResult === 'correct' ||
      value.lastResult === 'incorrect' ||
      value.lastResult === 'unanswered') &&
    typeof value.lastAttemptAt === 'number'
  )
}

function isProfile(value: unknown): value is LocalProfile {
  return (
    isRecord(value) &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number' &&
    typeof value.completedAttempts === 'number'
  )
}

function isNullableProfile(value: unknown): value is LocalProfile | null {
  return value === null || isProfile(value)
}

function isSettings(value: unknown): value is LocalSettings {
  return isRecord(value) && typeof value.reducedMotion === 'boolean'
}

function isSessions(value: unknown): value is Record<string, PracticeSession> {
  return (
    isRecord(value) &&
    Object.values(value).every((session) => isPracticeSession(session))
  )
}

function isAttempts(value: unknown): value is PracticeAttempt[] {
  return Array.isArray(value) && value.every(isPracticeAttempt)
}

function isProgress(value: unknown): value is QuestionProgressMap {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => isQuestionProgress(item))
  )
}

function migrateLegacySession(value: unknown): PracticeSession | null {
  if (!isRecord(value)) return null

  const durationSeconds =
    isRecord(value.config) && typeof value.config.durationSeconds === 'number'
      ? value.config.durationSeconds
      : null
  const startedAt = typeof value.startedAt === 'number' ? value.startedAt : 0
  const migrated = {
    ...value,
    deadlineAt:
      typeof value.deadlineAt === 'number'
        ? value.deadlineAt
        : durationSeconds
          ? startedAt + durationSeconds * 1000
          : null,
  }

  return isPracticeSession(migrated) ? migrated : null
}

function migrateSessions(value: unknown) {
  const source =
    isRecord(value) && Array.isArray(value.sessions) ? value.sessions : value

  if (Array.isArray(source)) {
    return Object.fromEntries(
      source
        .map(migrateLegacySession)
        .filter((session): session is PracticeSession => session !== null)
        .map((session) => [session.id, session]),
    )
  }

  if (isRecord(source)) {
    return Object.fromEntries(
      Object.values(source)
        .map(migrateLegacySession)
        .filter((session): session is PracticeSession => session !== null)
        .map((session) => [session.id, session]),
    )
  }

  return {}
}

function createEnvelope<T>(data: T): StorageEnvelope<T> {
  return { version: STORAGE_VERSION, updatedAt: Date.now(), data }
}

function isQuotaError(error: unknown) {
  return (
    isRecord(error) &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

function createWriteIssue(error: unknown): StorageIssue {
  const quota = isQuotaError(error)

  return {
    code: quota ? 'quota' : 'write_failed',
    message: quota
      ? 'У браузері закінчилося місце для збереження прогресу.'
      : 'Не вдалося зберегти локальний прогрес.',
  }
}

function emptyState(): PersistedAppState {
  return {
    profile: null,
    sessions: {},
    attempts: [],
    questionProgress: {},
    settings: defaultSettings,
  }
}

export class StorageRepository {
  private readonly storage: StorageLike | null

  constructor(storage: StorageLike | null) {
    this.storage = storage
  }

  load(): StorageLoadResult {
    const state = emptyState()
    const issues: StorageIssue[] = []

    if (!this.storage) {
      return {
        state,
        issues: [
          {
            code: 'unavailable',
            message: 'Локальне сховище браузера недоступне.',
          },
        ],
      }
    }

    state.profile = this.read(
      STORAGE_KEYS.profile,
      null,
      isNullableProfile,
      (value) => (isProfile(value) ? value : null),
      issues,
    )
    state.sessions = this.read(
      STORAGE_KEYS.sessions,
      {},
      isSessions,
      migrateSessions,
      issues,
    )
    state.attempts = this.read(
      STORAGE_KEYS.attempts,
      [],
      isAttempts,
      (value) => (isAttempts(value) ? value : []),
      issues,
    )
    state.questionProgress = this.read(
      STORAGE_KEYS.questionProgress,
      {},
      isProgress,
      (value) => (isProgress(value) ? value : {}),
      issues,
    )
    state.settings = this.read(
      STORAGE_KEYS.settings,
      defaultSettings,
      isSettings,
      (value) => (isSettings(value) ? value : defaultSettings),
      issues,
    )

    const attemptIds = new Set(state.attempts.map((attempt) => attempt.id))
    state.sessions = Object.fromEntries(
      Object.entries(state.sessions).filter(
        ([sessionId]) => !attemptIds.has(sessionId),
      ),
    )

    return { state, issues }
  }

  save(state: PersistedAppState): StorageSaveResult {
    if (!this.storage) {
      return {
        ok: false,
        issue: {
          code: 'unavailable',
          message: 'Локальне сховище браузера недоступне.',
        },
      }
    }

    const entries: Array<[string, unknown]> = [
      [STORAGE_KEYS.attempts, state.attempts],
      [STORAGE_KEYS.questionProgress, state.questionProgress],
      [STORAGE_KEYS.sessions, state.sessions],
      [STORAGE_KEYS.profile, state.profile],
      [STORAGE_KEYS.settings, state.settings],
    ]

    try {
      for (const [key, data] of entries) {
        this.storage.setItem(key, JSON.stringify(createEnvelope(data)))
      }
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        issue: createWriteIssue(error),
      }
    }
  }

  clear(): StorageSaveResult {
    if (!this.storage) {
      return {
        ok: false,
        issue: {
          code: 'unavailable',
          message: 'Локальне сховище браузера недоступне.',
        },
      }
    }

    try {
      Object.values(STORAGE_KEYS).forEach((key) =>
        this.storage?.removeItem(key),
      )
      return { ok: true }
    } catch {
      return {
        ok: false,
        issue: {
          code: 'write_failed',
          message: 'Не вдалося очистити локальні дані.',
        },
      }
    }
  }

  private read<T>(
    key: string,
    fallback: T,
    validate: (value: unknown) => value is T,
    migrate: (value: unknown) => T,
    issues: StorageIssue[],
  ): T {
    const raw = this.storage?.getItem(key)
    if (!raw) return fallback

    try {
      const parsed: unknown = JSON.parse(raw)

      if (
        isRecord(parsed) &&
        parsed.version === STORAGE_VERSION &&
        validate(parsed.data)
      ) {
        return parsed.data
      }

      const legacyData =
        isRecord(parsed) && 'data' in parsed ? parsed.data : parsed
      const migrated = migrate(legacyData)

      if (validate(migrated)) {
        try {
          this.storage?.setItem(key, JSON.stringify(createEnvelope(migrated)))
        } catch (error) {
          issues.push({ ...createWriteIssue(error), key })
        }
        return migrated
      }

      throw new Error('invalid storage schema')
    } catch {
      issues.push({
        code: 'corrupted',
        key,
        message:
          'Частину локальних даних було пошкоджено. Застосунок відновив безпечний стан.',
      })

      try {
        this.storage?.removeItem(key)
      } catch {
        // Reading can continue with an in-memory fallback.
      }

      return fallback
    }
  }
}

export function createBrowserStorageRepository() {
  try {
    return new StorageRepository(
      typeof window === 'undefined' ? null : window.localStorage,
    )
  } catch {
    return new StorageRepository(null)
  }
}

export { STORAGE_KEYS }
