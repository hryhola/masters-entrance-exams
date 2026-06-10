import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '../../content/types'
import { PracticeQuestion } from './PracticeQuestion'

const question: Question = {
  id: 'q1',
  number: 1,
  type: 'single_choice',
  origin: 'official',
  prompt: [{ type: 'markdown', text: 'Оберіть правильну відповідь.' }],
  options: [
    { id: 'a', content: [{ type: 'markdown', text: 'Перша' }] },
    { id: 'b', content: [{ type: 'markdown', text: 'Друга' }] },
    { id: 'c', content: [{ type: 'markdown', text: 'Третя' }] },
    { id: 'd', content: [{ type: 'markdown', text: 'Четверта' }] },
  ],
  correctOption: 'b',
  explanation: {
    summary: [{ type: 'markdown', text: 'Пояснення правильної відповіді.' }],
    optionFeedback: [
      {
        optionId: 'a',
        verdict: 'incorrect',
        blocks: [{ type: 'markdown', text: 'Перший варіант хибний.' }],
      },
    ],
    answerReview: {
      status: 'verified',
      officialOption: 'b',
      note: '',
    },
  },
  classification: {
    alignment: 'aligned',
    topic: null,
    cognitiveLevel: 'knowledge',
    tags: [],
    formatCompliance: 'compliant',
  },
  source: { pageStart: 1, pageEnd: 1, questionNumber: 1 },
  features: { blockTypes: ['markdown'], hasComplexContent: false },
}

describe('PracticeQuestion', () => {
  it('does not disclose the answer in exam mode', () => {
    render(
      <MemoryRouter>
        <PracticeQuestion
          experience="exam"
          onAnswer={vi.fn()}
          question={question}
          revealed={false}
          selectedOption="a"
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Правильно')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Пояснення правильної відповіді.'),
    ).not.toBeInTheDocument()
  })

  it('lets the user choose an answer and shows learning feedback', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    const { rerender } = render(
      <MemoryRouter>
        <PracticeQuestion
          experience="learning"
          onAnswer={onAnswer}
          question={question}
          revealed={false}
          selectedOption={undefined}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /Перша/ }))
    expect(onAnswer).toHaveBeenCalledWith('a')

    rerender(
      <MemoryRouter>
        <PracticeQuestion
          experience="learning"
          onAnswer={onAnswer}
          question={question}
          revealed
          selectedOption="a"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Пояснення правильної відповіді.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Офіційний варіант: Б')).toBeInTheDocument()
  })
})
