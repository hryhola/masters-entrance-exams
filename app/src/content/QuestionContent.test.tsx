import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { adaptDataset } from './adaptDataset'
import { QuestionContent } from './QuestionContent'
import { validateDatasetDocument } from './validateDataset'

function getQuestion(number: number) {
  const raw = JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'yefvv-it-2024.json'),
      'utf8',
    ),
  ) as unknown
  return adaptDataset(validateDatasetDocument(raw)).questions[number - 1]
}

describe('QuestionContent', () => {
  it('warns about a disputed key without hiding the official answer', () => {
    render(
      <MemoryRouter>
        <QuestionContent examId="yefvv-it" question={getQuestion(82)} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('note')).toHaveTextContent(
      'Офіційний ключ має предметну розбіжність',
    )
    expect(screen.getByText('Офіційна відповідь')).toBeInTheDocument()
    expect(screen.getByText('Спірний ключ')).toBeInTheDocument()
  })
})
