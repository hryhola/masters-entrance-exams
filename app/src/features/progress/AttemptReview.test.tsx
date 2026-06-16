import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createTestQuestion } from '../../test/fixtures'
import { AttemptReviewItem } from './AttemptReview'

describe('AttemptReviewItem', () => {
  it('shows feedback for the option the user actually selected', () => {
    const question = createTestQuestion()

    render(
      <AttemptReviewItem
        position={1}
        question={question}
        result={{
          questionId: question.id,
          questionNumber: question.number,
          selectedOption: 'a',
          officialOption: 'b',
          status: 'incorrect',
          answerReviewStatus: 'verified',
          origin: 'official',
          sectionCode: '1',
          sectionTitle: 'Тестовий розділ',
          topicCode: '1.1',
          topicTitle: 'Тестова тема',
        }}
      />,
    )

    expect(screen.getByText('Коментар до варіанта A.')).toBeInTheDocument()
    expect(
      screen.queryByText('Коментар до варіанта Б.'),
    ).not.toBeInTheDocument()
  })

  it('describes a disputed answer as an official key, not an absolute truth', () => {
    const question = createTestQuestion({ answerReviewStatus: 'disputed' })

    render(
      <AttemptReviewItem
        position={1}
        question={question}
        result={{
          questionId: question.id,
          questionNumber: question.number,
          selectedOption: 'a',
          officialOption: 'b',
          status: 'incorrect',
          answerReviewStatus: 'disputed',
          origin: 'official',
          sectionCode: '1',
          sectionTitle: 'Тестовий розділ',
          topicCode: '1.1',
          topicTitle: 'Тестова тема',
        }}
      />,
    )

    expect(
      screen.getByText('Не збігається з офіційним ключем'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Офіційний ключ має предметну розбіжність.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Офіційний ключ, спірний')).toBeInTheDocument()
  })
})
