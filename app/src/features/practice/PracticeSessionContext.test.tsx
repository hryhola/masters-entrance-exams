import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { STORAGE_KEYS } from '../../storage/StorageRepository'
import { createTestQuestion } from '../../test/fixtures'
import { PracticeSessionProvider } from './PracticeSessionContext'
import { usePracticeSessions } from './usePracticeSessions'

const questions = [
  createTestQuestion(),
  createTestQuestion({ id: 'q2', number: 2, correctOption: 'c' }),
]

function SessionHarness() {
  const {
    sessions,
    attempts,
    createSession,
    dispatchSession,
    questionProgress,
  } = usePracticeSessions()
  const session = Object.values(sessions)[0]

  return (
    <div>
      <span data-testid="session-count">{Object.keys(sessions).length}</span>
      <span data-testid="attempt-count">{attempts.length}</span>
      <span data-testid="progress-count">
        {Object.keys(questionProgress).length}
      </span>
      <span data-testid="session-state">
        {session
          ? `${session.currentIndex}:${session.answers.q1 ?? '-'}:${
              session.flaggedQuestionIds.includes('q2') ? 'flagged' : 'plain'
            }`
          : 'none'}
      </span>
      <button
        onClick={() =>
          createSession({
            config: {
              examId: 'exam',
              datasetId: 'dataset',
              mode: 'full',
              experience: 'learning',
            },
            questions,
          })
        }
        type="button"
      >
        Створити
      </button>
      <button
        disabled={!session}
        onClick={() => {
          if (!session) return
          dispatchSession(
            session.id,
            { type: 'answer', questionId: 'q1', optionId: 'a' },
            questions,
          )
          dispatchSession(session.id, { type: 'next' }, questions)
          dispatchSession(
            session.id,
            { type: 'toggle_flag', questionId: 'q2' },
            questions,
          )
        }}
        type="button"
      >
        Змінити
      </button>
      <button
        disabled={!session}
        onClick={() => {
          if (!session) return
          dispatchSession(
            session.id,
            { type: 'finish', now: Date.now() },
            questions,
          )
        }}
        type="button"
      >
        Завершити
      </button>
    </div>
  )
}

function renderHarness() {
  return render(
    <PracticeSessionProvider>
      <SessionHarness />
    </PracticeSessionProvider>,
  )
}

describe('PracticeSessionProvider persistence', () => {
  it('restores the same unfinished session after remounting', async () => {
    const user = userEvent.setup()
    const firstRender = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Створити' }))
    await user.click(screen.getByRole('button', { name: 'Змінити' }))
    expect(screen.getByTestId('session-state')).toHaveTextContent('1:a:flagged')

    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEYS.sessions)
      expect(stored).toContain('"currentIndex":1')
      expect(stored).toContain('"q1":"a"')
    })

    firstRender.unmount()
    renderHarness()

    expect(screen.getByTestId('session-count')).toHaveTextContent('1')
    expect(screen.getByTestId('session-state')).toHaveTextContent('1:a:flagged')
  })

  it('persists an immutable attempt and removes the active session', async () => {
    const user = userEvent.setup()
    const firstRender = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Створити' }))
    await user.click(screen.getByRole('button', { name: 'Змінити' }))
    await user.click(screen.getByRole('button', { name: 'Завершити' }))

    expect(screen.getByTestId('session-count')).toHaveTextContent('0')
    expect(screen.getByTestId('attempt-count')).toHaveTextContent('1')
    expect(screen.getByTestId('progress-count')).toHaveTextContent('2')

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.attempts)).toContain(
        '"status":"incorrect"',
      )
    })

    firstRender.unmount()
    renderHarness()

    expect(screen.getByTestId('session-count')).toHaveTextContent('0')
    expect(screen.getByTestId('attempt-count')).toHaveTextContent('1')
    expect(screen.getByTestId('progress-count')).toHaveTextContent('2')
  })
})
