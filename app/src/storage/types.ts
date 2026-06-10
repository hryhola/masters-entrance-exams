import type {
  PracticeAttempt,
  QuestionProgressMap,
} from '../features/progress/types'
import type { PracticeSession } from '../features/practice/session'

export const STORAGE_VERSION = 1

export interface StorageEnvelope<T> {
  version: typeof STORAGE_VERSION
  updatedAt: number
  data: T
}

export interface LocalProfile {
  createdAt: number
  updatedAt: number
  completedAttempts: number
}

export interface LocalSettings {
  reducedMotion: boolean
}

export interface PersistedAppState {
  profile: LocalProfile | null
  sessions: Record<string, PracticeSession>
  attempts: PracticeAttempt[]
  questionProgress: QuestionProgressMap
  settings: LocalSettings
}

export type StorageIssueCode =
  | 'unavailable'
  | 'corrupted'
  | 'quota'
  | 'write_failed'

export interface StorageIssue {
  code: StorageIssueCode
  message: string
  key?: string
}

export interface StorageLoadResult {
  state: PersistedAppState
  issues: StorageIssue[]
}

export interface StorageSaveResult {
  ok: boolean
  issue?: StorageIssue
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
