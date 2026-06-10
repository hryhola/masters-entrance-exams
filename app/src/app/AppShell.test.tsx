import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('moves keyboard focus to main content without changing the route', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />} path="/">
            <Route index element={<h1>Тестова сторінка</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('link', { name: 'Перейти до основного вмісту' }),
    )

    expect(screen.getByRole('main')).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: 'Тестова сторінка' }),
    ).toBeInTheDocument()
  })
})
