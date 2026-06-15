import { useMemo, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { DatasetError, DatasetLoading } from '../content/DatasetState'
import { QuestionBadges, QuestionContent } from '../content/QuestionContent'
import type { ContentBlockType, Question } from '../content/types'
import { useDataset } from '../content/useDataset'
import {
  examRegistry,
  getDatasetDefinition,
  getExamDefinition,
} from '../exams/registry'
import './dataset-pages.css'

const yefvvFeaturedQuestionNumbers = [9, 13, 51, 71, 82, 86, 102, 140]

function getFeaturedQuestionNumbers(datasetId: string, questionCount: number) {
  if (datasetId === 'yefvv-it-2024') return yefvvFeaturedQuestionNumbers
  return [1, 5, 11, 19, 25, questionCount].filter(
    (number, index, values) =>
      number <= questionCount && values.indexOf(number) === index,
  )
}

function findQuestion(
  questions: Question[],
  questionNumber: string | undefined,
) {
  const number = Number(questionNumber)
  return Number.isInteger(number)
    ? questions.find((question) => question.number === number)
    : undefined
}

export function ExamDetailPage() {
  const { examId } = useParams()
  const exam = getExamDefinition(examId)
  const state = useDataset(exam?.datasetId)

  if (!exam || exam.status !== 'available') {
    return (
      <DatasetError
        error={new Error('Цей іспит не знайдено або його набір ще не готовий.')}
      />
    )
  }
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  const dataset = state.dataset
  const complexQuestionCount = dataset.questions.filter(
    (question) => question.features.hasComplexContent,
  ).length
  const featuredQuestionNumbers = getFeaturedQuestionNumbers(
    dataset.id,
    dataset.questions.length,
  )

  return (
    <div className="page-stack">
      <PageIntro
        action={
          <Link
            className="button button--secondary"
            to={`/dev/datasets/${dataset.id}`}
          >
            Перевірити всі питання
          </Link>
        }
        description={`Офіційний набір ${dataset.year} року, нормалізований для вебзастосунку та ручно перевірений за першоджерелом.`}
        eyebrow={`${dataset.exam} · версія ${dataset.version}`}
        title={dataset.subject}
      />

      <section aria-label="Показники набору" className="dataset-overview">
        <article>
          <span>Питань</span>
          <strong>{dataset.questions.length}</strong>
          <small>усі пройшли ручну валідацію</small>
        </article>
        <article>
          <span>Розділів</span>
          <strong>{dataset.sections.length}</strong>
          <small>за структурою офіційного тесту</small>
        </article>
        <article>
          <span>Складний контент</span>
          <strong>{complexQuestionCount}</strong>
          <small>формули, код, таблиці або схеми</small>
        </article>
        <article>
          <span>Спірні ключі</span>
          <strong>{dataset.answerReviewCounts.disputed}</strong>
          <small>позначені без зміни джерела</small>
        </article>
      </section>

      <section className="dataset-actions">
        <div>
          <p className="eyebrow">Практика доступна</p>
          <h2>Почніть повний тест або коротку сесію</h2>
          <p>
            Оберіть навчальний режим із миттєвими поясненнями або симуляцію
            іспиту з таймером і відкладеним результатом.
          </p>
        </div>
        <div className="button-row">
          <Link
            className="button button--primary"
            to={`/practice/setup?exam=${exam.id}`}
          >
            Почати тренування
            <Icon name="arrow" size={18} />
          </Link>
          <Link
            className="button button--secondary"
            to={`/dev/datasets/${dataset.id}`}
          >
            Каталог {dataset.questions.length} питань
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="sections-title"
        className="dataset-section-card"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Покриття</p>
            <h2 id="sections-title">Розділи програми</h2>
          </div>
          <p>
            Кількість показує фактичний розподіл одиниць оцінювання в офіційному
            тесті {dataset.year} року.
          </p>
        </div>
        <ol className="section-list">
          {dataset.sections.map((section) => (
            <li key={section.code}>
              <span className="section-list__code">{section.code}</span>
              <span>{section.title}</span>
              <strong>{section.questionCount}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Перевірка рендерера</p>
            <h2 id="featured-title">Різні типи контенту</h2>
          </div>
          <p>
            Добірка дає змогу швидко перевірити різні частини нормалізованого
            набору та роботу рендерера.
          </p>
        </div>
        <div className="question-link-grid">
          {featuredQuestionNumbers.map((number) => {
            const question = dataset.questions.find(
              (item) => item.number === number,
            )
            if (!question) return null
            return (
              <Link key={number} to={`/exams/${exam.id}/questions/${number}`}>
                <span>№ {question.displayLabel ?? number}</span>
                <strong>
                  {question.classification.topic?.section ?? 'Поза програмою'}
                </strong>
                <QuestionBadges question={question} />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function QuestionPage() {
  const { examId, questionNumber } = useParams()
  const exam = getExamDefinition(examId)
  const state = useDataset(exam?.datasetId)

  if (!exam || exam.status !== 'available') {
    return <DatasetError error={new Error('Іспит не знайдено.')} />
  }
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  const question = findQuestion(state.dataset.questions, questionNumber)
  if (!question) {
    return (
      <DatasetError
        error={new Error(`Питання №${questionNumber ?? '?'} не знайдено.`)}
      />
    )
  }

  const previous = question.number > 1 ? question.number - 1 : null
  const next =
    question.number < state.dataset.questions.length
      ? question.number + 1
      : null

  return (
    <div className="page-stack">
      <nav aria-label="Навігація питаннями" className="question-navigation">
        {previous ? (
          <Link to={`/exams/${exam.id}/questions/${previous}`}>
            ← Питання {previous}
          </Link>
        ) : (
          <span />
        )}
        <Link to={`/exams/${exam.id}`}>До огляду іспиту</Link>
        {next ? (
          <Link to={`/exams/${exam.id}/questions/${next}`}>
            Питання {next} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <QuestionContent examId={exam.id} question={question} />
    </div>
  )
}

type InspectorFilter =
  | 'all'
  | 'complex'
  | 'disputed'
  | Exclude<ContentBlockType, 'markdown' | 'unknown'>

function InspectorItem({
  examId,
  question,
}: {
  examId: string
  question: Question
}) {
  const [open, setOpen] = useState(false)

  return (
    <details
      className="question-inspector"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="question-inspector__number">{question.number}</span>
        <span className="question-inspector__title">
          <strong>
            {question.classification.topic?.topic ?? 'Не зіставлено'}
          </strong>
          <small>
            {question.classification.topic?.section ?? 'Поза програмою'}
          </small>
        </span>
        <QuestionBadges question={question} />
      </summary>
      {open ? (
        <div className="question-inspector__body">
          <QuestionContent examId={examId} question={question} />
        </div>
      ) : null}
    </details>
  )
}

export function DatasetInspectorPage() {
  const { datasetId } = useParams()
  const definition = getDatasetDefinition(datasetId)
  const exam = examRegistry.find((item) => item.datasetId === datasetId)
  const state = useDataset(definition?.id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InspectorFilter>('all')

  const questions = useMemo(() => {
    if (state.status !== 'ready') return []
    const normalizedSearch = search.trim().toLocaleLowerCase('uk')

    return state.dataset.questions.filter((question) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'complex' && question.features.hasComplexContent) ||
        (filter === 'disputed' &&
          question.explanation.answerReview.status === 'disputed') ||
        question.features.blockTypes.includes(filter as ContentBlockType)

      if (!matchesFilter) return false
      if (!normalizedSearch) return true
      return [
        question.number.toString(),
        question.classification.topic?.topic,
        question.classification.topic?.section,
        ...question.classification.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('uk')
        .includes(normalizedSearch)
    })
  }, [filter, search, state])

  if (!definition || !exam) {
    return <DatasetError error={new Error('Набір не зареєстровано.')} />
  }
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  return (
    <div className="page-stack">
      <PageIntro
        action={
          <Link className="button button--secondary" to={`/exams/${exam.id}`}>
            До сторінки іспиту
          </Link>
        }
        description="Службова сторінка для наскрізної перевірки умов, варіантів, медіа, пояснень і метаданих."
        eyebrow={`Developer view · ${state.dataset.version}`}
        title={`Усі ${state.dataset.questions.length} питань`}
      />

      <section aria-label="Фільтри питань" className="inspector-toolbar">
        <label>
          <span>Пошук</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Номер, тема або тег"
            type="search"
            value={search}
          />
        </label>
        <label>
          <span>Тип контенту</span>
          <select
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setFilter(event.target.value as InspectorFilter)
            }
            value={filter}
          >
            <option value="all">Усі питання</option>
            <option value="complex">Будь-який складний контент</option>
            <option value="image">Зображення</option>
            <option value="math">Формули</option>
            <option value="code">Код</option>
            <option value="table">Таблиці</option>
            <option value="disputed">Спірний ключ</option>
          </select>
        </label>
        <output>
          <strong>{questions.length}</strong>
          <span>знайдено</span>
        </output>
      </section>

      <section aria-label="Питання набору" className="inspector-list">
        {questions.map((question) => (
          <InspectorItem
            examId={exam.id}
            key={question.id}
            question={question}
          />
        ))}
      </section>
    </div>
  )
}
