import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { ContentRenderer } from './ContentRenderer'
import type { Question } from './types'

const optionLabels = {
  a: 'A',
  b: 'Б',
  c: 'В',
  d: 'Г',
}

const alignmentLabels = {
  aligned: 'Відповідає програмі 2025',
  partial: 'Часткова відповідність',
  legacy: 'Застарілий формат',
  unmapped: 'Поза програмою',
}

interface QuestionContentProps {
  examId: string
  question: Question
  showExplanation?: boolean
}

export function QuestionBadges({ question }: { question: Question }) {
  return (
    <div className="question-badges">
      <span className="tag tag--official">Офіційне</span>
      <span
        className={`tag tag--alignment-${question.classification.alignment}`}
      >
        {alignmentLabels[question.classification.alignment]}
      </span>
      {question.explanation.answerReview.status === 'disputed' ? (
        <span className="tag tag--disputed">Спірний ключ</span>
      ) : null}
      {question.features.blockTypes
        .filter((type) => type !== 'markdown')
        .map((type) => (
          <span className="tag" key={type}>
            {type}
          </span>
        ))}
    </div>
  )
}

export function QuestionContent({
  examId,
  question,
  showExplanation = true,
}: QuestionContentProps) {
  return (
    <article className="question-view">
      <header className="question-view__header">
        <div>
          <p className="eyebrow">Питання {question.number}</p>
          <QuestionBadges question={question} />
        </div>
        <Link
          className="source-link"
          to={`/exams/${examId}/questions/${question.number}`}
        >
          Постійне посилання
          <Icon name="arrow" size={16} />
        </Link>
      </header>

      {question.explanation.answerReview.status === 'disputed' ? (
        <aside className="answer-warning" role="note">
          <strong>Офіційний ключ має предметну розбіжність.</strong>
          <span>{question.explanation.answerReview.note}</span>
        </aside>
      ) : null}

      <section aria-label={`Умова питання ${question.number}`}>
        <ContentRenderer blocks={question.prompt} />
      </section>

      <ol aria-label="Варіанти відповіді" className="question-options">
        {question.options.map((option) => (
          <li
            className={
              showExplanation && option.id === question.correctOption
                ? 'question-option question-option--correct'
                : 'question-option'
            }
            key={option.id}
          >
            <span className="question-option__letter">
              {optionLabels[option.id]}
            </span>
            <ContentRenderer blocks={option.content} compact />
            {showExplanation && option.id === question.correctOption ? (
              <span className="question-option__status">
                Офіційна відповідь
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      {showExplanation ? (
        <section className="question-explanation">
          <p className="eyebrow">Пояснення</p>
          <ContentRenderer blocks={question.explanation.summary} />
          <details>
            <summary>Коментарі до всіх варіантів</summary>
            <div className="feedback-list">
              {question.explanation.optionFeedback.map((feedback) => (
                <article key={feedback.optionId}>
                  <strong>
                    {optionLabels[feedback.optionId]}:{' '}
                    {feedback.verdict === 'correct'
                      ? 'правильний варіант'
                      : 'неправильний варіант'}
                  </strong>
                  <ContentRenderer blocks={feedback.blocks} compact />
                </article>
              ))}
            </div>
          </details>
        </section>
      ) : null}

      <footer className="question-meta">
        <div>
          <span>Тема</span>
          <strong>
            {question.classification.topic?.topic ?? 'Не зіставлено'}
          </strong>
        </div>
        <div>
          <span>Розділ</span>
          <strong>
            {question.classification.topic?.section ?? 'Поза програмою'}
          </strong>
        </div>
        <div>
          <span>Джерело</span>
          <strong>
            PDF,{' '}
            {question.source.pageStart === question.source.pageEnd
              ? `сторінка ${question.source.pageStart}`
              : `сторінки ${question.source.pageStart}–${question.source.pageEnd}`}
          </strong>
        </div>
      </footer>
    </article>
  )
}
