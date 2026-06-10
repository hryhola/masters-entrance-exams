import { useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { useDataset } from '../content/useDataset'
import {
  collectLatestReviewQuestions,
  summarizeLearning,
  summarizeAttempts,
  summarizePeriods,
  summarizeTopicsFromAttempts,
} from '../features/progress/analytics'
import { formatSessionTime } from '../features/practice/session'
import { usePracticeSessions } from '../features/practice/usePracticeSessions'
import { examRegistry, getExamDefinition } from '../exams/registry'
import './progress-pages.css'

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function EmptyProgress({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="empty-state">
      <span className="icon-tile icon-tile--large">
        <Icon name="chart" size={25} />
      </span>
      <p className="eyebrow">Локальний профіль</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button button--primary" to="/practice/setup">
        Почати тренування
        <Icon name="arrow" size={18} />
      </Link>
    </section>
  )
}

export function ProgressPage() {
  const [now] = useState(Date.now)
  const { attempts, questionProgress, sessions } = usePracticeSessions()
  const summary = useMemo(() => summarizeAttempts(attempts), [attempts])
  const learning = useMemo(
    () => summarizeLearning(questionProgress, now),
    [now, questionProgress],
  )
  const periods = useMemo(
    () => summarizePeriods(attempts, now),
    [attempts, now],
  )
  const topics = useMemo(
    () => summarizeTopicsFromAttempts(attempts),
    [attempts],
  )
  const weakTopics = topics.filter((topic) => topic.answered >= 2)
  const completedAttempts = useMemo(
    () =>
      [...attempts].sort((left, right) => right.completedAt - left.completedAt),
    [attempts],
  )
  const activeSessions = Object.values(sessions).sort(
    (left, right) => right.startedAt - left.startedAt,
  )

  if (attempts.length === 0 && activeSessions.length === 0) {
    return (
      <div className="page-stack">
        <PageIntro
          description="Точність, витрачений час, історія спроб і слабкі теми зберігаються лише у вашому браузері."
          eyebrow="Аналітика"
          title="Ваш прогрес"
        />
        <EmptyProgress
          description="Завершіть першу сесію, щоб побачити статистику за темами."
          title="Потрібна перша спроба"
        />
      </div>
    )
  }

  return (
    <div className="page-stack progress-page">
      <PageIntro
        action={
          <Link className="button button--primary" to="/practice/setup">
            Нова сесія
            <Icon name="arrow" size={18} />
          </Link>
        }
        description="Статистика формується з локальної історії завершених спроб і не передається на сервер."
        eyebrow="Аналітика"
        title="Ваш прогрес"
      />

      {activeSessions.length > 0 ? (
        <section className="resume-sessions">
          <div>
            <p className="eyebrow">Незавершена практика</p>
            <h2>Продовжити з того самого місця</h2>
          </div>
          <div className="resume-session-list">
            {activeSessions.map((session) => {
              const exam = getExamDefinition(session.config.examId)
              return (
                <article key={session.id}>
                  <div>
                    <strong>{exam?.title ?? session.config.examId}</strong>
                    <span>
                      Питання {session.currentIndex + 1} з{' '}
                      {session.questionIds.length} · відповідей{' '}
                      {Object.keys(session.answers).length}
                    </span>
                  </div>
                  <Link
                    className="button button--secondary"
                    to={`/practice/${session.id}`}
                  >
                    Продовжити
                  </Link>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section aria-label="Загальна статистика" className="progress-metrics">
        <article className="progress-metric progress-metric--primary">
          <span>Точність</span>
          <strong>{summary.accuracy}%</strong>
          <small>серед {summary.answered} наданих відповідей</small>
        </article>
        <article className="progress-metric">
          <span>Завершено сесій</span>
          <strong>{summary.attemptCount}</strong>
          <small>Питань у спробах: {summary.questionCount}</small>
        </article>
        <article className="progress-metric">
          <span>Правильно</span>
          <strong>{summary.correct}</strong>
          <small>Помилок: {summary.incorrect}</small>
        </article>
        <article className="progress-metric">
          <span>Час практики</span>
          <strong>{formatSessionTime(summary.elapsedSeconds)}</strong>
          <small>Пропущено: {summary.skipped}</small>
        </article>
      </section>

      <section className="learning-overview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Засвоєння</p>
            <h2>Стан навчального циклу</h2>
          </div>
          <p>
            Перша відповідь зберігається окремо, а кожне повторення змінює
            streak і дату наступного перегляду.
          </p>
        </div>
        <div className="learning-metrics">
          <article>
            <span>Вивчаються</span>
            <strong>{learning.learning}</strong>
            <small>після помилки або пропуску</small>
          </article>
          <article>
            <span>На повторенні</span>
            <strong>{learning.reviewing}</strong>
            <small>1-2 правильні поспіль</small>
          </article>
          <article>
            <span>Засвоєно</span>
            <strong>{learning.mastered}</strong>
            <small>щонайменше 3 правильні поспіль</small>
          </article>
          <article>
            <span>Потрібно сьогодні</span>
            <strong>{learning.dueNow}</strong>
            <small>прострочені або негайні повторення</small>
          </article>
        </div>
        <p className="learning-first-attempt">
          Перша спроба: правильно {learning.firstAttemptCorrect} із{' '}
          {learning.coveredQuestions}. Повторних відповідей:{' '}
          {learning.repeatedAttempts}.
        </p>
      </section>

      <section className="period-progress">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Динаміка</p>
            <h2>Практика за періодами</h2>
          </div>
          <p>Точність і фактичний час із незмінної історії спроб.</p>
        </div>
        <div className="period-progress-grid">
          {periods.map((period) => (
            <article key={period.key}>
              <span>{period.label}</span>
              <strong>{period.accuracy}%</strong>
              <small>
                {period.attemptCount} сесій ·{' '}
                {formatSessionTime(period.elapsedSeconds)}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-progress">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Слабкі теми</p>
            <h2>Точність за темами</h2>
          </div>
          <p>
            Список починається з тем із найнижчою точністю, щоб показати
            пріоритет для наступної практики. Час сесії розподіляється між її
            питаннями порівну, тому час за темою є орієнтовним.
          </p>
        </div>
        <div className="topic-progress-list">
          {weakTopics.length === 0 ? (
            <p className="inline-empty">
              Для визначення слабкої теми потрібно щонайменше дві надані
              відповіді в ній.
            </p>
          ) : null}
          {weakTopics.map((topic) => (
            <article key={topic.key}>
              <div className="topic-progress__copy">
                <span>{topic.sectionTitle}</span>
                <strong>{topic.title}</strong>
                <small>
                  Правильно: {topic.correct} · Помилок: {topic.incorrect} · Час:{' '}
                  {formatSessionTime(topic.elapsedSeconds)}
                </small>
              </div>
              <div
                aria-label={`Точність ${topic.accuracy} відсотків`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={topic.accuracy}
                className="topic-progress__bar"
                role="progressbar"
              >
                <span style={{ width: `${topic.accuracy}%` }} />
              </div>
              <b>{topic.accuracy}%</b>
            </article>
          ))}
        </div>
      </section>

      <section className="attempt-history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Історія</p>
            <h2>Завершені спроби</h2>
          </div>
          <p>Кожен результат є незмінним snapshot конкретного проходження.</p>
        </div>
        <div className="attempt-history-list">
          {completedAttempts.map((attempt) => {
            const exam = getExamDefinition(attempt.config.examId)
            return (
              <article key={attempt.id}>
                <div className="attempt-history__score">
                  <strong>{attempt.score.percentage}%</strong>
                  <span>
                    {attempt.score.correct}/{attempt.score.total}
                  </span>
                </div>
                <div>
                  <strong>{exam?.title ?? attempt.config.examId}</strong>
                  <span>
                    {dateFormatter.format(attempt.completedAt)} ·{' '}
                    {formatSessionTime(attempt.elapsedSeconds)}
                  </span>
                </div>
                <Link
                  className="button button--secondary"
                  to={`/results/${attempt.id}`}
                >
                  Відкрити результат
                </Link>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function ReviewPage() {
  const { attempts, bookmarks, toggleBookmark } = usePracticeSessions()
  const exam = examRegistry.find((item) => item.status === 'available')
  const datasetState = useDataset(exam?.datasetId)
  const questions = useMemo(
    () => collectLatestReviewQuestions(attempts),
    [attempts],
  )
  const bookmarkedQuestions = useMemo(() => {
    if (datasetState.status !== 'ready' || !exam?.datasetId) return []
    const bookmarkSet = new Set(bookmarks)

    return datasetState.dataset.questions.filter((question) =>
      bookmarkSet.has(`${exam.datasetId}:${question.id}`),
    )
  }, [bookmarks, datasetState, exam?.datasetId])

  return (
    <div className="page-stack review-page">
      <PageIntro
        action={
          attempts.length > 0 ? (
            <Link className="button button--secondary" to="/progress">
              До всієї статистики
            </Link>
          ) : null
        }
        description="Останні неправильні й пропущені відповіді з локальної історії спроб."
        eyebrow="Навчання на помилках"
        title="Повторення"
      />

      {bookmarkedQuestions.length > 0 && exam?.datasetId ? (
        <section className="bookmarks-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Закладки</p>
              <h2>Збережені питання</h2>
            </div>
            <p>Ці питання мають пріоритет у персональному плані.</p>
          </div>
          <div className="bookmark-list">
            {bookmarkedQuestions.map((question) => (
              <article key={question.id}>
                <span>{question.number}</span>
                <div>
                  <small>
                    {question.classification.topic?.section ??
                      'Тему не визначено'}
                  </small>
                  <strong>
                    {question.classification.topic?.topic ??
                      `Питання ${question.number}`}
                  </strong>
                </div>
                <Link
                  className="text-link"
                  to={`/exams/${exam.id}/questions/${question.number}`}
                >
                  Відкрити
                </Link>
                <button
                  className="bookmark-remove"
                  onClick={() => toggleBookmark(exam.datasetId!, question.id)}
                  type="button"
                >
                  Прибрати
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {questions.length === 0 ? (
        <EmptyProgress
          description={
            attempts.length === 0
              ? 'Завершіть першу сесію, щоб сформувати список повторення.'
              : 'В останніх спробах немає неправильних або пропущених відповідей.'
          }
          title={
            attempts.length === 0
              ? 'Список ще порожній'
              : 'Усе опрацьовано правильно'
          }
        />
      ) : (
        <section className="review-question-list">
          {questions.map((item) => (
            <article
              className={`review-question review-question--${item.result.status}`}
              key={`${item.datasetId}:${item.result.questionId}`}
            >
              <span className="review-question__number">
                {item.result.questionNumber}
              </span>
              <div>
                <span>{item.result.sectionTitle}</span>
                <strong>{item.result.topicTitle}</strong>
                <small>
                  {item.result.status === 'unanswered'
                    ? 'Без відповіді'
                    : item.result.answerReviewStatus === 'disputed'
                      ? 'Не збігається зі спірним офіційним ключем'
                      : 'Неправильна відповідь'}
                  {' · '}
                  {dateFormatter.format(item.completedAt)}
                </small>
              </div>
              <div className="review-question__actions">
                <Link
                  className="button button--secondary"
                  to={`/results/${item.attemptId}`}
                >
                  Розбір
                </Link>
                <Link
                  className="text-link"
                  to={`/exams/${item.examId}/questions/${item.result.questionNumber}`}
                >
                  Питання
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export function SettingsPage() {
  const {
    attempts,
    sessions,
    questionProgress,
    profile,
    settings,
    clearAllData,
    exportData,
    importData,
    updateSettings,
    storageIssue,
  } = usePracticeSessions()
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingImport, setPendingImport] = useState<{
    name: string
    raw: string
  } | null>(null)
  const [transferMessage, setTransferMessage] = useState<string | null>(null)

  function downloadExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `vstup-2026-progress-${new Date()
      .toISOString()
      .slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setTransferMessage('Файл резервної копії створено.')
  }

  async function selectImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setPendingImport({ name: file.name, raw: await file.text() })
    setTransferMessage(null)
  }

  return (
    <div className="page-stack settings-page">
      <PageIntro
        description="Усі сесії, результати й прогрес зберігаються локально в цьому браузері."
        eyebrow="Система"
        title="Локальні дані"
      />

      <section className="learning-settings">
        <div>
          <p className="eyebrow">Навчальний ритм</p>
          <h2>Ціль і щоденна сесія</h2>
          <p>
            Дата використовується лише для локального відліку. Розмір визначає,
            скільки питань потрапляє до персонального плану.
          </p>
        </div>
        <div className="learning-settings__fields">
          <label>
            <span>Дата іспиту</span>
            <input
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) =>
                updateSettings({
                  targetExamDate: event.target.value || null,
                })
              }
              type="date"
              value={settings.targetExamDate ?? ''}
            />
          </label>
          <label>
            <span>Питань на день</span>
            <select
              onChange={(event) =>
                updateSettings({
                  dailyQuestionCount: Number(event.target.value),
                })
              }
              value={settings.dailyQuestionCount}
            >
              <option value={5}>5 питань</option>
              <option value={10}>10 питань</option>
              <option value={20}>20 питань</option>
            </select>
          </label>
        </div>
      </section>

      <section className="storage-overview">
        <div>
          <span className="icon-tile icon-tile--large">
            <Icon name="settings" size={25} />
          </span>
          <div>
            <p className="eyebrow">Стан сховища</p>
            <h2>
              {storageIssue
                ? 'Збереження потребує уваги'
                : 'Локальне збереження працює'}
            </h2>
            <p>
              Дані не синхронізуються між пристроями та не надсилаються на
              сервер.
            </p>
          </div>
        </div>
        <dl>
          <div>
            <dt>Активні сесії</dt>
            <dd>{Object.keys(sessions).length}</dd>
          </div>
          <div>
            <dt>Завершені спроби</dt>
            <dd>{attempts.length}</dd>
          </div>
          <div>
            <dt>Питання з історією</dt>
            <dd>{Object.keys(questionProgress).length}</dd>
          </div>
          <div>
            <dt>Профіль створено</dt>
            <dd>
              {profile ? dateFormatter.format(profile.createdAt) : 'Ще ні'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="data-transfer">
        <div>
          <p className="eyebrow">Резервна копія</p>
          <h2>Експорт та імпорт прогресу</h2>
          <p>
            Експорт містить сесії, незмінну історію, засвоєння, закладки й
            налаштування. Імпорт повністю замінює поточні локальні дані.
          </p>
        </div>
        <div className="data-transfer__actions">
          <button
            className="button button--secondary"
            onClick={downloadExport}
            type="button"
          >
            Експортувати JSON
          </button>
          <label className="button button--secondary">
            Вибрати файл
            <input
              accept="application/json,.json"
              onChange={selectImport}
              type="file"
            />
          </label>
        </div>
        {pendingImport ? (
          <div className="import-confirm">
            <strong>Замінити дані файлом «{pendingImport.name}»?</strong>
            <span>Поточний локальний прогрес буде перезаписано.</span>
            <div className="button-row">
              <button
                className="button button--secondary"
                onClick={() => setPendingImport(null)}
                type="button"
              >
                Скасувати
              </button>
              <button
                className="button button--primary"
                onClick={() => {
                  const result = importData(pendingImport.raw)
                  setTransferMessage(result.message)
                  setPendingImport(null)
                }}
                type="button"
              >
                Імпортувати й замінити
              </button>
            </div>
          </div>
        ) : null}
        {transferMessage ? (
          <p className="transfer-message" role="status">
            {transferMessage}
          </p>
        ) : null}
      </section>

      <section className="danger-zone">
        <div>
          <p className="eyebrow">Керування даними</p>
          <h2>Очистити локальний прогрес</h2>
          <p>
            Буде видалено активні сесії, історію спроб і всю статистику цього
            браузера.
          </p>
        </div>
        {confirmClear ? (
          <div className="danger-zone__confirm">
            <strong>Цю дію неможливо скасувати.</strong>
            <div className="button-row">
              <button
                className="button button--secondary"
                onClick={() => setConfirmClear(false)}
                type="button"
              >
                Скасувати
              </button>
              <button
                className="button button--danger"
                onClick={() => {
                  clearAllData()
                  setConfirmClear(false)
                }}
                type="button"
              >
                Видалити всі дані
              </button>
            </div>
          </div>
        ) : (
          <button
            className="button button--secondary"
            onClick={() => setConfirmClear(true)}
            type="button"
          >
            Очистити дані
          </button>
        )}
      </section>
    </div>
  )
}
