import { ContentRenderer } from '../../content/ContentRenderer'
import { QuestionBadges } from '../../content/QuestionContent'
import type { OptionId, Question } from '../../content/types'
import type { PracticeExperience } from './session'

const optionLabels: Record<OptionId, string> = {
  a: 'A',
  b: 'Б',
  c: 'В',
  d: 'Г',
}

interface PracticeQuestionProps {
  experience: PracticeExperience
  question: Question
  selectedOption: OptionId | undefined
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
  revealed,
  onAnswer,
}: PracticeQuestionProps) {
  const selectedFeedback = question.explanation.optionFeedback.find(
    (feedback) => feedback.optionId === selectedOption,
  )

  return (
    <article className="practice-question">
      <header className="practice-question__header">
        <div>
          <p className="eyebrow">Офіційне питання {question.number}</p>
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
                onClick={() => onAnswer(option.id)}
                type="button"
              >
                <span className="practice-option__letter">
                  {optionLabels[option.id]}
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
              Офіційний варіант: {optionLabels[question.correctOption]}
            </span>
          </div>
          {question.explanation.answerReview.status === 'disputed' ? (
            <aside className="answer-warning" role="note">
              <strong>Офіційний ключ має предметну розбіжність.</strong>
              <span>{question.explanation.answerReview.note}</span>
            </aside>
          ) : null}
          <ContentRenderer blocks={question.explanation.summary} />
          {selectedFeedback ? (
            <details>
              <summary>
                Чому варіант {optionLabels[selectedFeedback.optionId]}{' '}
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
