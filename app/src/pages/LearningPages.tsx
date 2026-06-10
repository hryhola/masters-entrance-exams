import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { DatasetError, DatasetLoading } from '../content/DatasetState'
import { useDataset } from '../content/useDataset'
import { buildDailyPlan } from '../features/learning/scheduler'
import { usePracticeSessions } from '../features/practice/usePracticeSessions'
import { examRegistry } from '../exams/registry'
import './learning-pages.css'

export function DailyPracticePage() {
  const navigate = useNavigate()
  const [generatedAt] = useState(Date.now)
  const { bookmarks, createSession, questionProgress, settings } =
    usePracticeSessions()
  const exam = examRegistry.find((item) => item.status === 'available')
  const state = useDataset(exam?.datasetId)
  const plan = useMemo(
    () =>
      state.status === 'ready' && exam?.datasetId
        ? buildDailyPlan({
            questions: state.dataset.questions,
            datasetId: exam.datasetId,
            progress: questionProgress,
            bookmarks,
            now: generatedAt,
            count: settings.dailyQuestionCount,
          })
        : null,
    [
      bookmarks,
      exam?.datasetId,
      generatedAt,
      questionProgress,
      settings.dailyQuestionCount,
      state,
    ],
  )

  if (!exam?.datasetId) {
    return <DatasetError error={new Error('Немає доступного іспиту.')} />
  }
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />
  if (!plan) return <DatasetLoading />

  const activeExam = exam
  const datasetId = exam.datasetId
  const dataset = state.dataset
  const dailyPlan = plan

  function startDailySession() {
    const questionReasons = Object.fromEntries(
      dailyPlan.items.map((item) => [item.questionId, item.reasons]),
    )
    const session = createSession({
      config: {
        examId: activeExam.id,
        datasetId,
        mode: 'daily',
        experience: 'learning',
        questionCount: dailyPlan.items.length,
      },
      questions: dataset.questions,
      questionIds: dailyPlan.items.map((item) => item.questionId),
      questionReasons,
    })

    navigate(`/practice/${session.id}`)
  }

  return (
    <div className="page-stack daily-page">
      <PageIntro
        action={
          <button
            className="button button--primary"
            onClick={startDailySession}
            type="button"
          >
            Почати щоденну сесію
            <Icon name="arrow" size={18} />
          </button>
        }
        description="Добірка поєднує помилки, пропуски, питання на повторення, закладки, слабкі теми та новий матеріал."
        eyebrow="Персональний план"
        title="Що вчити сьогодні"
      />

      <section className="daily-summary">
        <div>
          <span className="icon-tile icon-tile--accent">
            <Icon name="spark" />
          </span>
          <div>
            <p className="eyebrow">Сесія готова</p>
            <h2>{dailyPlan.items.length} рекомендованих питань</h2>
            <p>
              Порядок зафіксується після старту. Для кожного питання в сесії
              залишиться пояснення, чому воно потрапило до плану.
            </p>
          </div>
        </div>
        <Link className="text-link" to="/settings">
          Змінити розмір щоденної сесії
          <Icon name="arrow" size={17} />
        </Link>
      </section>

      <section className="daily-plan">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Пріоритети</p>
            <h2>Питання на сьогодні</h2>
          </div>
          <p>
            Помилки та прострочені повторення мають вищий пріоритет, а вільні
            місця заповнюються новими питаннями.
          </p>
        </div>
        <ol className="daily-plan-list">
          {dailyPlan.items.map((item, index) => {
            const question = dataset.questions.find(
              (candidate) => candidate.id === item.questionId,
            )

            return (
              <li key={item.questionId}>
                <span>{index + 1}</span>
                <div>
                  <small>
                    Офіційне №{item.questionNumber} ·{' '}
                    {question?.classification.topic?.section ??
                      'Тему не визначено'}
                  </small>
                  <strong>
                    {question?.classification.topic?.topic ??
                      `Питання ${item.questionNumber}`}
                  </strong>
                  <ul>
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  aria-label={`Переглянути питання ${item.questionNumber}`}
                  className="text-link"
                  to={`/exams/${activeExam.id}/questions/${item.questionNumber}`}
                >
                  Переглянути
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <button
        className="button button--primary daily-start-button"
        onClick={startDailySession}
        type="button"
      >
        Почати щоденну сесію
        <Icon name="arrow" size={18} />
      </button>
    </div>
  )
}
