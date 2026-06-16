import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { useDataset } from '../content/useDataset'
import { buildDailyPlan } from '../features/learning/scheduler'
import { summarizeLearning } from '../features/progress/analytics'
import { usePracticeSessions } from '../features/practice/usePracticeSessions'
import { examRegistry } from '../exams/registry'

export function DashboardPage() {
  const [now] = useState(Date.now)
  const { attempts, bookmarks, questionProgress, sessions, settings } =
    usePracticeSessions()
  const exam = examRegistry.find((item) => item.status === 'available')
  const datasetState = useDataset(exam?.datasetId)
  const learning = useMemo(
    () => summarizeLearning(questionProgress, now),
    [now, questionProgress],
  )
  const dailyPlan = useMemo(
    () =>
      datasetState.status === 'ready' && exam?.datasetId
        ? buildDailyPlan({
            questions: datasetState.dataset.questions,
            datasetId: exam.datasetId,
            progress: questionProgress,
            bookmarks,
            now,
            count: settings.dailyQuestionCount,
          })
        : null,
    [
      bookmarks,
      datasetState,
      exam?.datasetId,
      now,
      questionProgress,
      settings.dailyQuestionCount,
    ],
  )
  const activeSession = Object.values(sessions).sort(
    (left, right) => right.startedAt - left.startedAt,
  )[0]
  const hasHistory = attempts.length > 0
  const masteryPercentage =
    datasetState.status === 'ready'
      ? Math.round(
          (learning.mastered / datasetState.dataset.questions.length) * 100,
        )
      : 0
  const yefvvQuestionCount =
    datasetState.status === 'ready'
      ? datasetState.dataset.questions.length
      : 140
  const yefvvGeneratedCount =
    datasetState.status === 'ready'
      ? datasetState.dataset.questions.filter(
          (question) => question.origin === 'generated',
        ).length
      : 0
  const daysUntilExam = settings.targetExamDate
    ? Math.ceil(
        (new Date(`${settings.targetExamDate}T23:59:59`).getTime() - now) /
          (24 * 60 * 60 * 1000),
      )
    : null
  const todayItems = dailyPlan
    ? dailyPlan.items.slice(0, 3).map((item) => {
        const question =
          datasetState.status === 'ready'
            ? datasetState.dataset.questions.find(
                (candidate) => candidate.id === item.questionId,
              )
            : undefined
        return `${question?.classification.topic?.topic ?? `Питання ${item.questionNumber}`}: ${item.reasons[0]}`
      })
    : [
        'Пройти коротку діагностику',
        'Визначити перші слабкі теми',
        'Сформувати ритм повторень',
      ]
  const primaryAction = activeSession
    ? {
        to: `/practice/${activeSession.id}`,
        label: 'Продовжити сесію',
      }
    : {
        to: hasHistory ? '/practice/daily' : '/practice/setup',
        label: hasHistory ? 'План на сьогодні' : 'Почати тренування',
      }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-panel__content">
          <p className="eyebrow">Магістратура 2026</p>
          <h1>Підготовка, що показує наступний крок</h1>
          <p className="hero-panel__lead">
            Практикуйтеся на офіційних завданнях, розбирайте помилки та
            поступово закривайте слабкі теми.
          </p>
          <div className="button-row">
            <Link className="button button--primary" to={primaryAction.to}>
              {primaryAction.label}
              <Icon name="arrow" size={18} />
            </Link>
            <Link className="button button--secondary" to="/exams">
              Переглянути іспити
            </Link>
          </div>
        </div>

        <div aria-label="Стан підготовки" className="hero-summary">
          <div className="hero-summary__heading">
            <span className="status-dot" />
            <span>{hasHistory ? 'Локальний прогрес' : 'Стартова позиція'}</span>
          </div>
          <strong>{masteryPercentage}%</strong>
          <p>
            {hasHistory
              ? `Засвоєно ${learning.mastered} із ${yefvvQuestionCount} питань. На повторення сьогодні: ${learning.dueNow}.`
              : 'Почніть першу сесію, щоб побачити персональний прогрес.'}
          </p>
          <div
            aria-label={`Прогрес підготовки: ${masteryPercentage} відсотків`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={masteryPercentage}
            className="progress-bar"
            role="progressbar"
          >
            <span style={{ width: `${masteryPercentage}%` }} />
          </div>
          <div className="hero-summary__stats">
            <div>
              <span>Опрацьовано</span>
              <strong>{learning.coveredQuestions}</strong>
            </div>
            <div>
              <span>
                {daysUntilExam === null ? 'Активні сесії' : 'До іспиту'}
              </span>
              <strong>
                {daysUntilExam === null
                  ? Object.keys(sessions).length
                  : Math.max(daysUntilExam, 0)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="today-heading" className="dashboard-grid">
        <article className="panel panel--today">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">План на сьогодні</p>
              <h2 id="today-heading">
                {hasHistory
                  ? 'Персональна добірка готова'
                  : 'Почнімо з діагностики'}
              </h2>
            </div>
            <span className="icon-tile icon-tile--accent">
              <Icon name="target" />
            </span>
          </div>
          <ul className="check-list">
            {todayItems.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            className="text-link"
            to={hasHistory ? '/practice/daily' : '/practice/setup'}
          >
            {hasHistory
              ? 'Відкрити план на сьогодні'
              : 'Налаштувати першу сесію'}
            <Icon name="arrow" size={17} />
          </Link>
        </article>

        <article className="panel panel--exam">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Готові матеріали</p>
              <h2>ЄФВВ: інформаційні технології</h2>
            </div>
            <span className="icon-tile">
              <Icon name="exams" />
            </span>
          </div>
          <p className="panel-copy">
            Офіційний тест 2024 року, класифікований за програмою 2025 року,
            доповнений поясненнями
            {yefvvGeneratedCount > 0
              ? ` та ${yefvvGeneratedCount} перевіреними generated питаннями.`
              : '.'}
          </p>
          <div className="tag-row">
            <span className="tag">{yefvvQuestionCount} питань</span>
            <span className="tag">10 розділів</span>
            <span className="tag tag--ready">Готово</span>
          </div>
          <Link className="text-link" to="/exams/yefvv-it">
            Перейти до іспиту
            <Icon name="arrow" size={17} />
          </Link>
        </article>
      </section>

      <section aria-labelledby="features-heading" className="feature-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Як це допоможе</p>
            <h2 id="features-heading">Не просто правильна літера</h2>
          </div>
          <p>
            Сайт накопичує локальну історію відповідей і перетворює її на
            конкретні пріоритети для повторення.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="icon-tile">
              <Icon name="spark" />
            </span>
            <h3>Пояснення помилок</h3>
            <p>Окремий коментар до кожного варіанта відповіді.</p>
          </article>
          <article className="feature-card">
            <span className="icon-tile icon-tile--blue">
              <Icon name="chart" />
            </span>
            <h3>Слабкі теми</h3>
            <p>Прогрес за розділами, а не лише загальний відсоток.</p>
          </article>
          <article className="feature-card">
            <span className="icon-tile icon-tile--accent">
              <Icon name="clock" />
            </span>
            <h3>Розумні повторення</h3>
            <p>Питання повертаються тоді, коли їх корисно повторити.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
