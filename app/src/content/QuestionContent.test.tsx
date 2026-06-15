import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { adaptDataset } from './adaptDataset'
import { QuestionContent } from './QuestionContent'
import type { Question } from './types'
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

  it('labels generated questions and their automated verification', () => {
    const question: Question = {
      ...getQuestion(1),
      origin: 'generated',
      verification: {
        method: 'automated_validation',
        status: 'passed',
        validatorVersion: '1.0.0',
        validatedAt: '2026-06-15T10:01:00.000Z',
        checks: [
          'schema',
          'answer_integrity',
          'explanation_integrity',
          'duplicate_detection',
          'official_similarity',
        ],
        similarity: { maximumScore: 0.41, threshold: 0.72 },
      },
      source: {
        type: 'generated',
        batchId: 'generated-yefvv-it-os-medium-001',
      },
    }

    render(
      <MemoryRouter>
        <QuestionContent examId="yefvv-it" question={question} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Згенероване')).toBeInTheDocument()
    expect(screen.getByText('Автоматично перевірено')).toBeInTheDocument()
    expect(
      screen.getByText('Генерація generated-yefvv-it-os-medium-001'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Офіційна відповідь')).not.toBeInTheDocument()
  })
})
