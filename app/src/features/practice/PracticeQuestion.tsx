import { ContentRenderer } from '../../content/ContentRenderer'
import { QuestionBadges } from '../../content/QuestionContent'
import { getQuestionOptionLabel } from '../../content/questionOptions'
import type { OptionId, Question } from '../../content/types'
import type { PracticeExperience } from './session'

interface PracticeQuestionProps {
  experience: PracticeExperience
  question: Question
  selectedOption: OptionId | undefined
  disabledOptionIds?: OptionId[]
  revealed: boolean
  onAnswer: (optionId: OptionId) => void
}

function getOptionClassName(
  optionId: OptionId,
  selectedOption: OptionId | undefined,
  correctOption: OptionId,
  revealed: boolean,
) {
  const classNames = ['practice-option']

  if (selectedOption === optionId) classNames.push('practice-option--selected')
  if (revealed && correctOption === optionId) {
    classNames.push('practice-option--correct')
  }
  if (
    revealed &&
    selectedOption === optionId &&
    selectedOption !== correctOption
  ) {
    classNames.push('practice-option--incorrect')
  }

  return classNames.join(' ')
}

export function PracticeQuestion({
  experience,
  question,
  selectedOption,
  disabledOptionIds = [],
  revealed,
  onAnswer,
}: PracticeQuestionProps) {
  const selectedFeedback = question.explanation.optionFeedback.find(
    (feedback) => feedback.optionId === selectedOption,
  )

  return (
    <article className="practice-question" lang={question.language}>
      <header className="practice-question__header">
        <div>
          <p className="eyebrow">
            Офіційне питання {question.displayLabel ?? question.number}
          </p>
          <QuestionBadges question={question} />
        </div>
        <span className="practice-question__topic">
          {question.classification.topic?.section ?? 'Поза програмою'}
        </span>
      </header>

      <section aria-label={`Умова питання ${question.number}`}>
        <ContentRenderer blocks={question.prompt} />
      </section>

      <ol aria-label="Варіанти відповіді" className="practice-options">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.id
          const isCorrect = question.correctOption === option.id
          const isDisabled = disabledOptionIds.includes(option.id)

          return (
            <li key={option.id}>
              <button
                aria-pressed={isSelected}
                className={getOptionClassName(
                  option.id,
                  selectedOption,
                  question.correctOption,
                  revealed,
                )}
                disabled={isDisabled}
                onClick={() => onAnswer(option.id)}
                type="button"
              >
                <span className="practice-option__letter">
                  {getQuestionOptionLabel(question, option.id)}
                </span>
                <span className="practice-option__content">
                  <ContentRenderer blocks={option.content} compact />
                </span>
                {revealed && isCorrect ? (
                  <span className="practice-option__status">Правильно</span>
                ) : null}
                {revealed && isSelected && !isCorrect ? (
                  <span className="practice-option__status">
                    Ваша відповідь
                  </span>
                ) : null}
                {isDisabled ? (
                  <span className="practice-option__status">
                    Уже використано
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>

      {experience === 'learning' && !selectedOption ? (
        <p className="practice-question__hint">
          Оберіть відповідь, щоб одразу побачити пояснення.
        </p>
      ) : null}

      {revealed ? (
        <section aria-live="polite" className="practice-feedback">
          <div className="practice-feedback__result">
            <strong>
              {selectedOption === question.correctOption
                ? 'Правильна відповідь'
                : 'Варто розібрати'}
            </strong>
            <span>
              Офіційний варіант:{' '}
              {getQuestionOptionLabel(question, question.correctOption)}
            </span>
          </div>
          {question.explanation.answerReview.status === 'disputed' ? (
            <aside className="answer-warning" role="note">
              <strong>Офіційний ключ має предметну розбіжність.</strong>
              <span>{question.explanation.answerReview.note}</span>
            </aside>
          ) : null}
          {question.explanation.summary.length > 0 ? (
            <ContentRenderer blocks={question.explanation.summary} />
          ) : (
            <p>Редакційне пояснення ще не підготовлено.</p>
          )}
          {selectedFeedback ? (
            <details>
              <summary>
                Чому варіант{' '}
                {getQuestionOptionLabel(question, selectedFeedback.optionId)}{' '}
                {selectedFeedback.verdict === 'correct'
                  ? 'правильний'
                  : 'неправильний'}
              </summary>
              <ContentRenderer blocks={selectedFeedback.blocks} compact />
            </details>
          ) : null}
        </section>
      ) : null}
    </article>
  )
}
