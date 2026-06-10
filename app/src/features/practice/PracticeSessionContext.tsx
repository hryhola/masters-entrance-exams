import { useCallback, useMemo, useReducer, type ReactNode } from 'react'

import {
  PracticeSessionContext,
  type CreateSessionInput,
} from './PracticeSessionStore'
import {
  createPracticeSession,
  practiceSessionReducer,
  type PracticeSession,
  type PracticeSessionAction,
} from './session'

interface PracticeSessionState {
  sessions: Record<string, PracticeSession>
}

type StoreAction =
  | { type: 'create'; session: PracticeSession }
  | {
      type: 'dispatch'
      sessionId: string
      action: PracticeSessionAction
    }

function storeReducer(
  state: PracticeSessionState,
  action: StoreAction,
): PracticeSessionState {
  if (action.type === 'create') {
    return {
      sessions: {
        ...state.sessions,
        [action.session.id]: action.session,
      },
    }
  }

  const session = state.sessions[action.sessionId]
  if (!session) return state

  return {
    sessions: {
      ...state.sessions,
      [action.sessionId]: practiceSessionReducer(session, action.action),
    },
  }
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function PracticeSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, { sessions: {} })

  const createSession = useCallback(
    ({ config, questions }: CreateSessionInput) => {
      const session = createPracticeSession({
        id: createSessionId(),
        config,
        questions,
        now: Date.now(),
      })
      dispatch({ type: 'create', session })
      return session
    },
    [],
  )

  const dispatchSession = useCallback(
    (sessionId: string, action: PracticeSessionAction) => {
      dispatch({ type: 'dispatch', sessionId, action })
    },
    [],
  )

  const value = useMemo(
    () => ({
      sessions: state.sessions,
      createSession,
      dispatchSession,
    }),
    [createSession, dispatchSession, state.sessions],
  )

  return (
    <PracticeSessionContext.Provider value={value}>
      {children}
    </PracticeSessionContext.Provider>
  )
}
