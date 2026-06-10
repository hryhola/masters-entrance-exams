import { createContext } from 'react'

import type { Question } from '../../content/types'
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
  createSession: (input: CreateSessionInput) => PracticeSession
  dispatchSession: (sessionId: string, action: PracticeSessionAction) => void
}

export const PracticeSessionContext =
  createContext<PracticeSessionContextValue | null>(null)
