import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'

import type { Question } from '../../content/types'
import {
  createPracticeAttempt,
  updateQuestionProgress,
  type PracticeAttempt,
  type QuestionProgressMap,
} from '../progress/types'
import { createBrowserStorageRepository } from '../../storage/StorageRepository'
import type {
  LocalProfile,
  LocalSettings,
  PersistedAppState,
  StorageIssue,
} from '../../storage/types'
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
  attempts: PracticeAttempt[]
  questionProgress: QuestionProgressMap
  bookmarks: string[]
  profile: LocalProfile | null
  settings: LocalSettings
  storageIssue: StorageIssue | null
  persistenceRevision: number
  persistedState: PersistedAppState
}

type StoreAction =
  | { type: 'create'; session: PracticeSession }
  | {
      type: 'dispatch'
      sessionId: string
      action: PracticeSessionAction
      questions?: Question[]
    }
  | { type: 'storage_result'; issue: StorageIssue | null }
  | { type: 'clear' }
  | { type: 'toggle_bookmark'; key: string }
  | { type: 'update_settings'; settings: Partial<LocalSettings> }
  | { type: 'replace'; state: PersistedAppState }
  | { type: 'dismiss_storage_issue' }

function toPersistedState(state: PracticeSessionState): PersistedAppState {
  return {
    profile: state.profile,
    sessions: state.sessions,
    attempts: state.attempts,
    questionProgress: state.questionProgress,
    bookmarks: state.bookmarks,
    settings: state.settings,
  }
}

function createInitialState(
  repository: ReturnType<typeof createBrowserStorageRepository>,
): PracticeSessionState {
  const loaded = repository.load()

  return {
    ...loaded.state,
    storageIssue: loaded.issues[0] ?? null,
    persistenceRevision: 0,
    persistedState: loaded.state,
  }
}

function withPersistence(
  state: PracticeSessionState,
  updates: Partial<PracticeSessionState>,
): PracticeSessionState {
  const next = {
    ...state,
    ...updates,
    persistenceRevision: state.persistenceRevision + 1,
  }

  return {
    ...next,
    persistedState: toPersistedState(next),
  }
}

function storeReducer(
  state: PracticeSessionState,
  action: StoreAction,
): PracticeSessionState {
  if (action.type === 'create') {
    return withPersistence(state, {
      sessions: {
        ...state.sessions,
        [action.session.id]: action.session,
      },
    })
  }

  if (action.type === 'storage_result') {
    if (
      action.issue?.code === state.storageIssue?.code &&
      action.issue?.message === state.storageIssue?.message
    ) {
      return state
    }
    return { ...state, storageIssue: action.issue }
  }

  if (action.type === 'dismiss_storage_issue') {
    return { ...state, storageIssue: null }
  }

  if (action.type === 'clear') {
    return withPersistence(state, {
      sessions: {},
      attempts: [],
      questionProgress: {},
      bookmarks: [],
      profile: null,
      settings: {
        reducedMotion: false,
        targetExamDate: null,
        dailyQuestionCount: 10,
        theme: 'system',
      },
      storageIssue: null,
    })
  }

  if (action.type === 'toggle_bookmark') {
    return withPersistence(state, {
      bookmarks: state.bookmarks.includes(action.key)
        ? state.bookmarks.filter((key) => key !== action.key)
        : [...state.bookmarks, action.key],
    })
  }

  if (action.type === 'update_settings') {
    return withPersistence(state, {
      settings: { ...state.settings, ...action.settings },
    })
  }

  if (action.type === 'replace') {
    return {
      ...state,
      ...action.state,
      storageIssue: null,
      persistenceRevision: state.persistenceRevision + 1,
      persistedState: action.state,
    }
  }

  const session = state.sessions[action.sessionId]
  if (!session) return state

  const nextSession = practiceSessionReducer(
    session,
    action.action,
    action.questions,
  )
  if (nextSession === session) return state

  if (nextSession.status === 'completed') {
    if (!action.questions) {
      return {
        ...state,
        storageIssue: {
          code: 'write_failed',
          message: 'Не вдалося зафіксувати результат без набору питань.',
        },
      }
    }

    const attempt = createPracticeAttempt(nextSession, action.questions)
    const attempts = state.attempts.some((item) => item.id === attempt.id)
      ? state.attempts
      : [attempt, ...state.attempts]
    const sessions = { ...state.sessions }
    delete sessions[action.sessionId]

    return withPersistence(state, {
      sessions,
      attempts,
      questionProgress: updateQuestionProgress(state.questionProgress, attempt),
      profile: {
        createdAt: state.profile?.createdAt ?? attempt.completedAt,
        updatedAt: attempt.completedAt,
        completedAttempts: attempts.length,
      },
    })
  }

  const updates = {
    sessions: {
      ...state.sessions,
      [action.sessionId]: nextSession,
    },
  }

  return action.action.type === 'tick'
    ? { ...state, ...updates }
    : withPersistence(state, updates)
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function PracticeSessionProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(createBrowserStorageRepository)
  const [state, dispatch] = useReducer(
    storeReducer,
    repository,
    createInitialState,
  )

  useEffect(() => {
    if (state.persistenceRevision === 0) return

    const result = repository.save(state.persistedState)
    dispatch({
      type: 'storage_result',
      issue: result.ok ? null : (result.issue ?? null),
    })
  }, [repository, state.persistedState, state.persistenceRevision])

  const createSession = useCallback(
    ({
      config,
      questions,
      questionIds,
      questionReasons,
    }: CreateSessionInput) => {
      const session = createPracticeSession({
        id: createSessionId(),
        config,
        questions,
        questionIds,
        questionReasons,
        now: Date.now(),
      })
      dispatch({ type: 'create', session })
      return session
    },
    [],
  )

  const dispatchSession = useCallback(
    (
      sessionId: string,
      action: PracticeSessionAction,
      questions?: Question[],
    ) => {
      dispatch({ type: 'dispatch', sessionId, action, questions })
    },
    [],
  )

  const clearAllData = useCallback(() => {
    const result = repository.clear()

    if (result.ok) {
      dispatch({ type: 'clear' })
      return
    }

    dispatch({
      type: 'storage_result',
      issue: result.issue ?? {
        code: 'write_failed',
        message: 'Не вдалося очистити локальні дані.',
      },
    })
  }, [repository])

  const dismissStorageIssue = useCallback(() => {
    dispatch({ type: 'dismiss_storage_issue' })
  }, [])

  const toggleBookmark = useCallback(
    (datasetId: string, questionId: string) => {
      dispatch({ type: 'toggle_bookmark', key: `${datasetId}:${questionId}` })
    },
    [],
  )

  const updateSettings = useCallback((settings: Partial<LocalSettings>) => {
    dispatch({ type: 'update_settings', settings })
  }, [])

  const exportData = useCallback(
    () => repository.export(toPersistedState(state)),
    [repository, state],
  )

  const importData = useCallback(
    (raw: string) => {
      const result = repository.import(raw)

      if (result.ok && result.state) {
        dispatch({ type: 'replace', state: result.state })
        return { ok: true, message: 'Прогрес успішно імпортовано.' }
      }

      const issue = result.issue ?? {
        code: 'write_failed' as const,
        message: 'Не вдалося імпортувати прогрес.',
      }
      dispatch({ type: 'storage_result', issue })
      return { ok: false, message: issue.message }
    },
    [repository],
  )

  const value = useMemo(
    () => ({
      sessions: state.sessions,
      attempts: state.attempts,
      questionProgress: state.questionProgress,
      bookmarks: state.bookmarks,
      profile: state.profile,
      settings: state.settings,
      storageIssue: state.storageIssue,
      createSession,
      dispatchSession,
      clearAllData,
      toggleBookmark,
      updateSettings,
      exportData,
      importData,
      dismissStorageIssue,
    }),
    [
      clearAllData,
      createSession,
      dismissStorageIssue,
      dispatchSession,
      exportData,
      importData,
      toggleBookmark,
      updateSettings,
      state.attempts,
      state.bookmarks,
      state.profile,
      state.questionProgress,
      state.sessions,
      state.settings,
      state.storageIssue,
    ],
  )

  return (
    <PracticeSessionContext.Provider value={value}>
      {children}
    </PracticeSessionContext.Provider>
  )
}
