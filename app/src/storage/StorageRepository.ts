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
  type StorageImportResult,
  type StorageLike,
  type StorageLoadResult,
  type StorageSaveResult,
} from './types'

const STORAGE_KEYS = {
  profile: 'masters-exams:v3:profile',
  sessions: 'masters-exams:v3:sessions',
  attempts: 'masters-exams:v3:attempts',
  questionProgress: 'masters-exams:v3:question-progress',
  bookmarks: 'masters-exams:v3:bookmarks',
  settings: 'masters-exams:v3:settings',
} as const

const PREVIOUS_STORAGE_KEYS = {
  profile: 'masters-exams:v2:profile',
  sessions: 'masters-exams:v2:sessions',
  attempts: 'masters-exams:v2:attempts',
  questionProgress: 'masters-exams:v2:question-progress',
  bookmarks: 'masters-exams:v2:bookmarks',
  settings: 'masters-exams:v2:settings',
} as const

const LEGACY_STORAGE_KEYS = {
  profile: 'masters-exams:v1:profile',
  sessions: 'masters-exams:v1:sessions',
  attempts: 'masters-exams:v1:attempts',
  questionProgress: 'masters-exams:v1:question-progress',
  settings: 'masters-exams:v1:settings',
} as const

const optionIds = new Set<OptionId>(['a', 'b', 'c', 'd'])
const defaultSettings: LocalSettings = {
  reducedMotion: false,
  targetExamDate: null,
  dailyQuestionCount: 10,
  theme: 'system',
}

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

function isQuestionReasons(value: unknown): value is Record<string, string[]> {
  return (
    isRecord(value) &&
    Object.values(value).every((reasons) => isStringArray(reasons))
  )
}

function isSessionConfig(value: unknown): value is PracticeSessionConfig {
  return (
    isRecord(value) &&
    typeof value.examId === 'string' &&
    typeof value.datasetId === 'string' &&
    (value.mode === 'full' ||
      value.mode === 'topic' ||
      value.mode === 'quick' ||
      value.mode === 'daily') &&
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
    isQuestionReasons(value.questionReasons) &&
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
    isQuestionReasons(value.questionReasons) &&
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
    typeof value.firstAttemptAt === 'number' &&
    (value.firstResult === 'correct' ||
      value.firstResult === 'incorrect' ||
      value.firstResult === 'unanswered') &&
    typeof value.answered === 'number' &&
    typeof value.correct === 'number' &&
    typeof value.incorrect === 'number' &&
    typeof value.skipped === 'number' &&
    (value.lastResult === 'correct' ||
      value.lastResult === 'incorrect' ||
      value.lastResult === 'unanswered') &&
    typeof value.lastAttemptAt === 'number' &&
    typeof value.correctStreak === 'number' &&
    (value.masteryLevel === 'learning' ||
      value.masteryLevel === 'reviewing' ||
      value.masteryLevel === 'mastered') &&
    typeof value.nextReviewAt === 'number'
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
  return (
    isRecord(value) &&
    typeof value.reducedMotion === 'boolean' &&
    (value.targetExamDate === null ||
      typeof value.targetExamDate === 'string') &&
    typeof value.dailyQuestionCount === 'number' &&
    value.dailyQuestionCount >= 1 &&
    value.dailyQuestionCount <= 50 &&
    (value.theme === 'system' ||
      value.theme === 'light' ||
      value.theme === 'dark')
  )
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
    questionReasons: isQuestionReasons(value.questionReasons)
      ? value.questionReasons
      : {},
    deadlineAt:
      typeof value.deadlineAt === 'number'
        ? value.deadlineAt
        : durationSeconds
          ? startedAt + durationSeconds * 1000
          : null,
  }

  return isPracticeSession(migrated) ? migrated : null
}

function migrateAttempt(value: unknown): PracticeAttempt | null {
  if (!isRecord(value)) return null

  const migrated = {
    ...value,
    questionReasons: isQuestionReasons(value.questionReasons)
      ? value.questionReasons
      : {},
  }

  return isPracticeAttempt(migrated) ? migrated : null
}

function migrateAttempts(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map(migrateAttempt)
    .filter((attempt): attempt is PracticeAttempt => attempt !== null)
}

function inferCorrectStreak(value: Record<string, unknown>) {
  if (value.lastResult !== 'correct') return 0
  const correct = typeof value.correct === 'number' ? value.correct : 1
  return Math.min(Math.max(correct, 1), 3)
}

function migrateProgressItem(value: unknown): QuestionProgress | null {
  if (!isRecord(value)) return null

  const correctStreak =
    typeof value.correctStreak === 'number'
      ? value.correctStreak
      : inferCorrectStreak(value)
  const lastAttemptAt =
    typeof value.lastAttemptAt === 'number' ? value.lastAttemptAt : 0
  const migrated = {
    ...value,
    firstAttemptAt:
      typeof value.firstAttemptAt === 'number'
        ? value.firstAttemptAt
        : lastAttemptAt,
    firstResult:
      value.firstResult === 'correct' ||
      value.firstResult === 'incorrect' ||
      value.firstResult === 'unanswered'
        ? value.firstResult
        : value.lastResult,
    correctStreak,
    masteryLevel:
      value.masteryLevel === 'learning' ||
      value.masteryLevel === 'reviewing' ||
      value.masteryLevel === 'mastered'
        ? value.masteryLevel
        : correctStreak >= 3
          ? 'mastered'
          : correctStreak > 0
            ? 'reviewing'
            : 'learning',
    nextReviewAt:
      typeof value.nextReviewAt === 'number'
        ? value.nextReviewAt
        : lastAttemptAt,
  }

  return isQuestionProgress(migrated) ? migrated : null
}

function migrateProgress(value: unknown): QuestionProgressMap {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.values(value)
      .map(migrateProgressItem)
      .filter((item): item is QuestionProgress => item !== null)
      .map((item) => [item.key, item]),
  )
}

function migrateSettings(value: unknown): LocalSettings {
  if (!isRecord(value)) return defaultSettings

  const migrated = {
    reducedMotion:
      typeof value.reducedMotion === 'boolean' ? value.reducedMotion : false,
    targetExamDate:
      value.targetExamDate === null || typeof value.targetExamDate === 'string'
        ? value.targetExamDate
        : null,
    dailyQuestionCount:
      typeof value.dailyQuestionCount === 'number'
        ? value.dailyQuestionCount
        : 10,
    theme:
      value.theme === 'light' || value.theme === 'dark'
        ? value.theme
        : 'system',
  }

  return isSettings(migrated) ? migrated : defaultSettings
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
    bookmarks: [],
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
      [PREVIOUS_STORAGE_KEYS.profile, LEGACY_STORAGE_KEYS.profile],
      null,
      isNullableProfile,
      (value) => (isProfile(value) ? value : null),
      issues,
    )
    state.sessions = this.read(
      STORAGE_KEYS.sessions,
      [PREVIOUS_STORAGE_KEYS.sessions, LEGACY_STORAGE_KEYS.sessions],
      {},
      isSessions,
      migrateSessions,
      issues,
    )
    state.attempts = this.read(
      STORAGE_KEYS.attempts,
      [PREVIOUS_STORAGE_KEYS.attempts, LEGACY_STORAGE_KEYS.attempts],
      [],
      isAttempts,
      migrateAttempts,
      issues,
    )
    state.questionProgress = this.read(
      STORAGE_KEYS.questionProgress,
      [
        PREVIOUS_STORAGE_KEYS.questionProgress,
        LEGACY_STORAGE_KEYS.questionProgress,
      ],
      {},
      isProgress,
      migrateProgress,
      issues,
    )
    state.bookmarks = this.read(
      STORAGE_KEYS.bookmarks,
      [PREVIOUS_STORAGE_KEYS.bookmarks],
      [],
      isStringArray,
      (value) => (isStringArray(value) ? value : []),
      issues,
    )
    state.settings = this.read(
      STORAGE_KEYS.settings,
      [PREVIOUS_STORAGE_KEYS.settings, LEGACY_STORAGE_KEYS.settings],
      defaultSettings,
      isSettings,
      migrateSettings,
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
      [STORAGE_KEYS.bookmarks, state.bookmarks],
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
      Object.values(LEGACY_STORAGE_KEYS).forEach((key) =>
        this.storage?.removeItem(key),
      )
      Object.values(PREVIOUS_STORAGE_KEYS).forEach((key) =>
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
    fallbackKeys: readonly string[],
    fallback: T,
    validate: (value: unknown) => value is T,
    migrate: (value: unknown) => T,
    issues: StorageIssue[],
  ): T {
    const currentRaw = this.storage?.getItem(key)
    const fallbackRaw = fallbackKeys
      .map((fallbackKey) => this.storage?.getItem(fallbackKey))
      .find((value) => value !== null && value !== undefined)
    const raw = currentRaw ?? fallbackRaw
    if (!raw) return fallback

    try {
      const parsed: unknown = JSON.parse(raw)

      if (
        isRecord(parsed) &&
        currentRaw !== null &&
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

  export(state: PersistedAppState) {
    return JSON.stringify(createEnvelope(state), null, 2)
  }

  import(raw: string): StorageImportResult {
    try {
      const parsed: unknown = JSON.parse(raw)
      const source = isRecord(parsed) && 'data' in parsed ? parsed.data : parsed

      if (!isRecord(source)) throw new Error('invalid import')
      if (
        !Array.isArray(source.attempts) ||
        !isRecord(source.sessions) ||
        !isRecord(source.questionProgress) ||
        !isRecord(source.settings)
      ) {
        throw new Error('incomplete import')
      }

      const state: PersistedAppState = {
        profile: isProfile(source.profile) ? source.profile : null,
        sessions: migrateSessions(source.sessions),
        attempts: migrateAttempts(source.attempts),
        questionProgress: migrateProgress(source.questionProgress),
        bookmarks: isStringArray(source.bookmarks) ? source.bookmarks : [],
        settings: migrateSettings(source.settings),
      }
      const attemptIds = new Set(state.attempts.map((attempt) => attempt.id))
      state.sessions = Object.fromEntries(
        Object.entries(state.sessions).filter(
          ([sessionId]) => !attemptIds.has(sessionId),
        ),
      )
      const result = this.save(state)

      return result.ok ? { ok: true, state } : result
    } catch {
      return {
        ok: false,
        issue: {
          code: 'corrupted',
          message: 'Файл прогресу має некоректний або пошкоджений формат.',
        },
      }
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

export { LEGACY_STORAGE_KEYS, PREVIOUS_STORAGE_KEYS, STORAGE_KEYS }
