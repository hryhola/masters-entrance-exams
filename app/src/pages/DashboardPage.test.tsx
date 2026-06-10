import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PracticeSessionProvider } from '../features/practice/PracticeSessionContext'
import { DashboardPage } from './DashboardPage'

describe('DashboardPage', () => {
  it('offers a clear starting action and preparation status', () => {
    render(
      <MemoryRouter>
        <PracticeSessionProvider>
          <DashboardPage />
        </PracticeSessionProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Підготовка, що показує наступний крок',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Почати тренування/ }),
    ).toHaveAttribute('href', '/practice/setup')
    expect(
      screen.getByRole('progressbar', {
        name: 'Прогрес підготовки: 0 відсотків',
      }),
    ).toHaveAttribute('aria-valuenow', '0')
  })
})
