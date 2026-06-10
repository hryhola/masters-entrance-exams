import { useContext } from 'react'

import { PracticeSessionContext } from './PracticeSessionStore'

export function usePracticeSessions() {
  const context = useContext(PracticeSessionContext)

  if (!context) {
    throw new Error(
      'usePracticeSessions має використовуватися в PracticeSessionProvider.',
    )
  }

  return context
}
