import { useState } from 'react'

import { ContentRenderer } from '../../content/ContentRenderer'
import { QuestionBadges } from '../../content/QuestionContent'
import type { OptionId, Question } from '../../content/types'
import type { AttemptQuestionResult } from './types'

const optionLabels: Record<OptionId, string> = {
  a: 'A',
  b: 'Б',
  c: 'В',
  d: 'Г',
}

function getStatusLabel(result: AttemptQuestionResult) {
  if (result.status === 'unanswered') return 'Без відповіді'
  if (result.answerReviewStatus === 'disputed') {
    return result.status === 'correct'
      ? 'Збігається з офіційним ключем'
      : 'Не збігається з офіційним ключем'
  }
  return result.status === 'correct' ? 'Правильно' : 'Неправильно'
}

function getOptionClassName(optionId: OptionId, result: AttemptQuestionResult) {
  const classNames = ['attempt-option']

  if (optionId === result.officialOption) {
    classNames.push('attempt-option--official')
  }
  if (optionId === result.selectedOption) {
    classNames.push('attempt-option--selected')
  }
  if (
    optionId === result.selectedOption &&
    result.status === 'incorrect' &&
    result.answerReviewStatus !== 'disputed'
  ) {
    classNames.push('attempt-option--incorrect')
  }

  return classNames.join(' ')
}

export function AttemptReviewItem({
  question,
  result,
  position,
}: {
  question: Question
  result: AttemptQuestionResult
  position: number
}) {
  const [open, setOpen] = useState(result.status === 'incorrect')
  const selectedFeedback = question.explanation.optionFeedback.find(
    (feedback) => feedback.optionId === result.selectedOption,
  )

  return (
    <details
      className={`attempt-review-item attempt-review-item--${result.status}`}
      id={`review-${question.id}`}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary>
        <span className="attempt-review-item__number">{position}</span>
        <span className="attempt-review-item__title">
          <strong>{getStatusLabel(result)}</strong>
          <small>
            Офіційне №{question.number} · {result.topicTitle}
          </small>
        </span>
        <span className="attempt-review-item__answer">
          {result.selectedOption
            ? `Ваша: ${optionLabels[result.selectedOption]}`
            : 'Пропущено'}
        </span>
      </summary>

      {open ? (
        <article className="attempt-review-item__body">
          <header>
            <QuestionBadges question={question} />
          </header>

          {result.answerReviewStatus === 'disputed' ? (
            <aside className="answer-warning" role="note">
              <strong>Офіційний ключ має предметну розбіжність.</strong>
              <span>{question.explanation.answerReview.note}</span>
            </aside>
          ) : null}

          <section aria-label={`Умова питання ${question.number}`}>
            <ContentRenderer blocks={question.prompt} />
          </section>

          <ol className="attempt-options">
            {question.options.map((option) => (
              <li
                className={getOptionClassName(option.id, result)}
                key={option.id}
              >
                <span className="attempt-option__letter">
                  {optionLabels[option.id]}
                </span>
                <ContentRenderer blocks={option.content} compact />
                <span className="attempt-option__labels">
                  {option.id === result.selectedOption ? (
                    <small>Ваша відповідь</small>
                  ) : null}
                  {option.id === result.officialOption ? (
                    <small>
                      {result.answerReviewStatus === 'disputed'
                        ? 'Офіційний ключ, спірний'
                        : 'Офіційний ключ'}
                    </small>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>

          <section className="attempt-explanation">
            <p className="eyebrow">Пояснення</p>
            <ContentRenderer blocks={question.explanation.summary} />
            {selectedFeedback ? (
              <div className="attempt-selected-feedback">
                <strong>
                  Коментар до вашого варіанта{' '}
                  {optionLabels[selectedFeedback.optionId]}
                </strong>
                <ContentRenderer blocks={selectedFeedback.blocks} compact />
              </div>
            ) : (
              <p className="attempt-selected-feedback">
                Відповідь не було вибрано. Зверніть увагу на пояснення
                офіційного ключа.
              </p>
            )}
          </section>
        </article>
      ) : null}
    </details>
  )
}
