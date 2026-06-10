import { createContext } from 'react'

import type { Question } from '../../content/types'
import type { PracticeAttempt, QuestionProgressMap } from '../progress/types'
import type {
  LocalProfile,
  LocalSettings,
  StorageIssue,
} from '../../storage/types'
import type {
  PracticeSession,
  PracticeSessionAction,
  PracticeSessionConfig,
} from './session'

export interface CreateSessionInput {
  config: PracticeSessionConfig
  questions: Question[]
  questionIds?: string[]
  questionReasons?: Record<string, string[]>
}

export interface PracticeSessionContextValue {
  sessions: Record<string, PracticeSession>
  attempts: PracticeAttempt[]
  questionProgress: QuestionProgressMap
  bookmarks: string[]
  profile: LocalProfile | null
  settings: LocalSettings
  storageIssue: StorageIssue | null
  createSession: (input: CreateSessionInput) => PracticeSession
  dispatchSession: (
    sessionId: string,
    action: PracticeSessionAction,
    questions?: Question[],
  ) => void
  clearAllData: () => void
  toggleBookmark: (datasetId: string, questionId: string) => void
  updateSettings: (settings: Partial<LocalSettings>) => void
  exportData: () => string
  importData: (raw: string) => { ok: boolean; message: string }
  dismissStorageIssue: () => void
}

export const PracticeSessionContext =
  createContext<PracticeSessionContextValue | null>(null)
