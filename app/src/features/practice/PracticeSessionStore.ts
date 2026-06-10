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
}

export interface PracticeSessionContextValue {
  sessions: Record<string, PracticeSession>
  attempts: PracticeAttempt[]
  questionProgress: QuestionProgressMap
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
  dismissStorageIssue: () => void
}

export const PracticeSessionContext =
  createContext<PracticeSessionContextValue | null>(null)
