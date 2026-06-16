import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { ContentRenderer } from './ContentRenderer'
import { getQuestionOptionLabel } from './questionOptions'
import type { Question } from './types'

const alignmentLabels = {
  aligned: 'Відповідає програмі та структурі',
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
      <span
        className={
          question.origin === 'official'
            ? 'tag tag--official'
            : 'tag tag--generated'
        }
      >
        {question.origin === 'official' ? 'Офіційне' : 'Згенероване'}
      </span>
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
          <p className="eyebrow">
            Питання {question.displayLabel ?? question.number}
          </p>
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
      {question.explanation.status === 'editorial_pending' ? (
        <aside className="answer-warning" role="note">
          <strong>Офіційне пояснення відсутнє в джерелі.</strong>
          <span>
            Правильну відповідь перевірено за офіційним ключем. Редакційне
            пояснення ще готується.
          </span>
        </aside>
      ) : null}

      <section
        aria-label={`Умова питання ${question.number}`}
        lang={question.language}
      >
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
              {getQuestionOptionLabel(question, option.id)}
            </span>
            <ContentRenderer blocks={option.content} compact />
            {showExplanation && option.id === question.correctOption ? (
              <span className="question-option__status">
                {question.origin === 'official'
                  ? 'Офіційна відповідь'
                  : 'Правильна відповідь'}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      {showExplanation ? (
        <section className="question-explanation">
          <p className="eyebrow">Пояснення</p>
          {question.explanation.summary.length > 0 ? (
            <ContentRenderer blocks={question.explanation.summary} />
          ) : (
            <p>Редакційне пояснення ще не підготовлено.</p>
          )}
          <details>
            <summary>Коментарі до всіх варіантів</summary>
            <div className="feedback-list">
              {question.explanation.optionFeedback.map((feedback) => (
                <article key={feedback.optionId}>
                  <strong>
                    {getQuestionOptionLabel(question, feedback.optionId)}:{' '}
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
            {question.source.type === 'generated'
              ? `Генерація ${question.source.batchId}`
              : `PDF, ${
                  question.source.pageStart === question.source.pageEnd
                    ? `сторінка ${question.source.pageStart}`
                    : `сторінки ${question.source.pageStart}–${question.source.pageEnd}`
                }`}
          </strong>
        </div>
        {question.verification.method === 'agent_validation' ? (
          <div>
            <span>Перевірка</span>
            <strong>
              Агентська, workflow {question.verification.workflowVersion}
            </strong>
          </div>
        ) : null}
      </footer>
    </article>
  )
}
