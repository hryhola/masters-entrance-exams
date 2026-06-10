import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { DatasetError, DatasetLoading } from '../content/DatasetState'
import type { ExamDataset, Question } from '../content/types'
import { useDataset } from '../content/useDataset'
import { PracticeQuestion } from '../features/practice/PracticeQuestion'
import { AttemptReviewItem } from '../features/progress/AttemptReview'
import { summarizeAttemptSections } from '../features/progress/analytics'
import {
  formatSessionTime,
  type PracticeExperience,
  type PracticeMode,
  type PracticeSession,
} from '../features/practice/session'
import { usePracticeSessions } from '../features/practice/usePracticeSessions'
import {
  examRegistry,
  getExamDefinition,
  type ExamDefinition,
} from '../exams/registry'
import './practice-pages.css'

const modeCopy: Record<
  Exclude<PracticeMode, 'daily'>,
  { title: string; description: string; icon: 'exams' | 'target' | 'clock' }
> = {
  full: {
    title: 'Повний тест',
    description: 'Усі питання у порядку офіційного набору.',
    icon: 'exams',
  },
  topic: {
    title: 'Окремий розділ',
    description: 'Сфокусуйтеся на одній тематичній області.',
    icon: 'target',
  },
  quick: {
    title: 'Швидка сесія',
    description: 'Коротка добірка для регулярної практики.',
    icon: 'clock',
  },
}

function calculateQuestionCount(
  dataset: ExamDataset,
  mode: PracticeMode,
  quickCount: number,
  sectionCode: string,
) {
  if (mode === 'quick') return quickCount
  if (mode === 'topic') {
    return (
      dataset.sections.find((section) => section.code === sectionCode)
        ?.questionCount ?? 0
    )
  }
  return dataset.questions.length
}

function calculateDurationSeconds(
  exam: ExamDefinition,
  mode: PracticeMode,
  questionCount: number,
) {
  if (mode === 'full') {
    return (exam.practice?.examDurationMinutes ?? 180) * 60
  }

  return questionCount * (exam.practice?.estimatedSecondsPerQuestion ?? 90)
}

function PracticeSetupForm({
  dataset,
  exam,
  onExamChange,
}: {
  dataset: ExamDataset
  exam: ExamDefinition
  onExamChange: (examId: string) => void
}) {
  const navigate = useNavigate()
  const { createSession } = usePracticeSessions()
  const [mode, setMode] = useState<Exclude<PracticeMode, 'daily'>>('quick')
  const [experience, setExperience] = useState<PracticeExperience>('learning')
  const [quickCount, setQuickCount] = useState(
    exam.practice?.quickQuestionCounts[1] ?? 10,
  )
  const [sectionCode, setSectionCode] = useState(
    dataset.sections[0]?.code ?? '',
  )
  const questionCount = calculateQuestionCount(
    dataset,
    mode,
    quickCount,
    sectionCode,
  )
  const durationSeconds = calculateDurationSeconds(exam, mode, questionCount)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!exam.datasetId) return

    const session = createSession({
      config: {
        examId: exam.id,
        datasetId: exam.datasetId,
        mode,
        experience,
        questionCount: mode === 'quick' ? quickCount : undefined,
        sectionCode: mode === 'topic' ? sectionCode : undefined,
        durationSeconds: experience === 'exam' ? durationSeconds : undefined,
      },
      questions: dataset.questions,
    })

    navigate(`/practice/${session.id}`)
  }

  return (
    <form className="practice-setup" onSubmit={submit}>
      <section className="setup-section">
        <div className="setup-section__heading">
          <span>1</span>
          <div>
            <h2>Іспит</h2>
            <p>Рушій працює з будь-яким зареєстрованим набором питань.</p>
          </div>
        </div>
        <label className="setup-select">
          <span>Доступний іспит</span>
          <select
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onExamChange(event.target.value)
            }
            value={exam.id}
          >
            {examRegistry
              .filter((item) => item.status === 'available')
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.shortName}: {item.title}
                </option>
              ))}
          </select>
        </label>
      </section>

      <section className="setup-section">
        <div className="setup-section__heading">
          <span>2</span>
          <div>
            <h2>Обсяг практики</h2>
            <p>Оберіть повний тест, розділ або коротку добірку.</p>
          </div>
        </div>
        <div className="setup-choice-grid setup-choice-grid--three">
          {(Object.keys(modeCopy) as Array<Exclude<PracticeMode, 'daily'>>).map(
            (item) => (
              <label
                className={
                  mode === item
                    ? 'setup-choice setup-choice--selected'
                    : 'setup-choice'
                }
                key={item}
              >
                <input
                  checked={mode === item}
                  name="practice-mode"
                  onChange={() => setMode(item)}
                  type="radio"
                  value={item}
                />
                <span className="icon-tile">
                  <Icon name={modeCopy[item].icon} />
                </span>
                <strong>{modeCopy[item].title}</strong>
                <small>{modeCopy[item].description}</small>
              </label>
            ),
          )}
        </div>

        {mode === 'topic' ? (
          <label className="setup-select setup-select--nested">
            <span>Розділ програми</span>
            <select
              onChange={(event) => setSectionCode(event.target.value)}
              value={sectionCode}
            >
              {dataset.sections.map((section) => (
                <option key={section.code} value={section.code}>
                  {section.code}. {section.title} ({section.questionCount})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {mode === 'quick' ? (
          <fieldset className="quick-count">
            <legend>Кількість питань</legend>
            <div>
              {(exam.practice?.quickQuestionCounts ?? [5, 10, 20]).map(
                (count) => (
                  <label key={count}>
                    <input
                      checked={quickCount === count}
                      name="quick-count"
                      onChange={() => setQuickCount(count)}
                      type="radio"
                      value={count}
                    />
                    <span>{count}</span>
                  </label>
                ),
              )}
            </div>
          </fieldset>
        ) : null}
      </section>

      <section className="setup-section">
        <div className="setup-section__heading">
          <span>3</span>
          <div>
            <h2>Поведінка сесії</h2>
            <p>Навчайтеся з підказками або перевірте себе без них.</p>
          </div>
        </div>
        <div className="setup-choice-grid">
          <label
            className={
              experience === 'learning'
                ? 'setup-choice setup-choice--selected'
                : 'setup-choice'
            }
          >
            <input
              checked={experience === 'learning'}
              name="experience"
              onChange={() => setExperience('learning')}
              type="radio"
              value="learning"
            />
            <span className="icon-tile">
              <Icon name="spark" />
            </span>
            <strong>Навчальний режим</strong>
            <small>
              Без таймера, з поясненням одразу після вибору відповіді.
            </small>
          </label>
          <label
            className={
              experience === 'exam'
                ? 'setup-choice setup-choice--selected'
                : 'setup-choice'
            }
          >
            <input
              checked={experience === 'exam'}
              name="experience"
              onChange={() => setExperience('exam')}
              type="radio"
              value="exam"
            />
            <span className="icon-tile icon-tile--accent">
              <Icon name="clock" />
            </span>
            <strong>Симуляція іспиту</strong>
            <small>
              З таймером, без правильних відповідей і пояснень до завершення.
            </small>
          </label>
        </div>
      </section>

      <footer className="setup-summary">
        <div>
          <span>Ваша сесія</span>
          <strong>
            {questionCount} питань
            {experience === 'exam'
              ? ` · ${Math.ceil(durationSeconds / 60)} хв`
              : ' · без таймера'}
          </strong>
          <small>
            {modeCopy[mode].title} ·{' '}
            {experience === 'learning'
              ? 'навчальний режим'
              : 'симуляція іспиту'}
          </small>
        </div>
        <button className="button button--primary" type="submit">
          Почати сесію
          <Icon name="arrow" size={18} />
        </button>
      </footer>
    </form>
  )
}

export function PracticeSetupPage() {
  const [searchParams] = useSearchParams()
  const requestedExam = getExamDefinition(searchParams.get('exam') ?? '')
  const fallbackExam = examRegistry.find((item) => item.status === 'available')
  const [examId, setExamId] = useState(
    requestedExam?.status === 'available'
      ? requestedExam.id
      : (fallbackExam?.id ?? ''),
  )
  const exam = getExamDefinition(examId)
  const state = useDataset(exam?.datasetId)

  if (!exam || exam.status !== 'available') {
    return <DatasetError error={new Error('Немає доступних іспитів.')} />
  }
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  return (
    <div className="page-stack">
      <PageIntro
        description="Виберіть обсяг і поведінку сесії. Порядок питань зафіксується після старту й не змінюватиметься під час проходження."
        eyebrow="Нова сесія"
        title="Налаштування практики"
      />
      <PracticeSetupForm
        dataset={state.dataset}
        exam={exam}
        key={exam.id}
        onExamChange={setExamId}
      />
    </div>
  )
}

function MissingSession() {
  return (
    <section className="empty-state">
      <span className="icon-tile icon-tile--large">
        <Icon name="practice" size={25} />
      </span>
      <p className="eyebrow">Сесія недоступна</p>
      <h1>Почніть нове тренування</h1>
      <p>
        Не вдалося знайти цю сесію або її результат у локальних даних браузера.
        Можливо, сховище було очищено.
      </p>
      <Link className="button button--primary" to="/practice/setup">
        До налаштувань
      </Link>
    </section>
  )
}

function getQuestionMap(questions: Question[]) {
  return new Map(questions.map((question) => [question.id, question]))
}

function SessionNavigator({
  session,
  questionsById,
  onGoTo,
}: {
  session: PracticeSession
  questionsById: Map<string, Question>
  onGoTo: (index: number) => void
}) {
  return (
    <aside className="session-navigator">
      <div className="session-navigator__heading">
        <div>
          <p className="eyebrow">Навігація</p>
          <h2>Питання</h2>
        </div>
        <strong>
          {Object.keys(session.answers).length}/{session.questionIds.length}
        </strong>
      </div>
      <div aria-label="Номери питань" className="question-number-grid">
        {session.questionIds.map((questionId, index) => {
          const answered = session.answers[questionId] !== undefined
          const flagged = session.flaggedQuestionIds.includes(questionId)
          const question = questionsById.get(questionId)
          const classNames = ['question-number']

          if (answered) classNames.push('question-number--answered')
          if (flagged) classNames.push('question-number--flagged')
          if (index === session.currentIndex) {
            classNames.push('question-number--current')
          }

          return (
            <button
              aria-current={index === session.currentIndex ? 'step' : undefined}
              aria-label={`Питання ${index + 1}${
                answered ? ', є відповідь' : ', без відповіді'
              }${flagged ? ', позначено' : ''}`}
              className={classNames.join(' ')}
              key={questionId}
              onClick={() => onGoTo(index)}
              title={`Офіційне питання ${question?.number ?? questionId}`}
              type="button"
            >
              {index + 1}
              {flagged ? <span aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>
      <div className="session-legend">
        <span>
          <i className="legend-dot legend-dot--answered" />Є відповідь
        </span>
        <span>
          <i className="legend-dot legend-dot--flagged" />
          Повернутися
        </span>
      </div>
    </aside>
  )
}

export function SessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { sessions, attempts, bookmarks, dispatchSession, toggleBookmark } =
    usePracticeSessions()
  const session = sessionId ? sessions[sessionId] : undefined
  const completedAttempt = sessionId
    ? attempts.find((attempt) => attempt.id === sessionId)
    : undefined
  const state = useDataset(session?.config.datasetId)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const questionAnchorRef = useRef<HTMLDivElement>(null)
  const sessionQuestions =
    state.status === 'ready' ? state.dataset.questions : undefined

  useEffect(() => {
    if (!session || session.status !== 'active') return

    function preventAccidentalClose(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', preventAccidentalClose)
    return () =>
      window.removeEventListener('beforeunload', preventAccidentalClose)
  }, [session])

  useEffect(() => {
    if (
      !sessionId ||
      !session ||
      session.status !== 'active' ||
      session.remainingSeconds === null
    ) {
      return
    }

    const timer = window.setInterval(() => {
      dispatchSession(
        sessionId,
        {
          type: 'tick',
          now: Date.now(),
        },
        sessionQuestions,
      )
    }, 1000)

    return () => window.clearInterval(timer)
  }, [dispatchSession, session, sessionId, sessionQuestions])

  useEffect(() => {
    if (session?.status !== 'active' || state.status !== 'ready') return

    questionAnchorRef.current?.focus({ preventScroll: true })
    questionAnchorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [session?.currentIndex, session?.status, state.status])

  if (!session && completedAttempt) {
    return <Navigate replace to={`/results/${completedAttempt.id}`} />
  }
  if (!session || !sessionId) return <MissingSession />
  if (session.status === 'completed') {
    return <Navigate replace to={`/results/${session.id}`} />
  }
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  const questions = state.dataset.questions
  const questionsById = getQuestionMap(questions)
  const questionId = session.questionIds[session.currentIndex]
  const question = questionsById.get(questionId)

  if (!question) {
    return (
      <DatasetError
        error={new Error('Питання активної сесії не знайдено в наборі.')}
      />
    )
  }

  const activeSession = session
  const selectedOption = activeSession.answers[questionId]
  const flagged = activeSession.flaggedQuestionIds.includes(questionId)
  const bookmarkKey = `${activeSession.config.datasetId}:${questionId}`
  const bookmarked = bookmarks.includes(bookmarkKey)
  const revealed = activeSession.revealedQuestionIds.includes(questionId)
  const recommendationReasons = activeSession.questionReasons[questionId] ?? []
  const answeredCount = Object.keys(activeSession.answers).length
  const progress = Math.round(
    ((session.currentIndex + 1) / session.questionIds.length) * 100,
  )

  function dispatch(action: Parameters<typeof dispatchSession>[1]) {
    dispatchSession(activeSession.id, action, questions)
  }

  function confirmFinish() {
    dispatch({ type: 'finish', now: Date.now() })
    setShowFinishDialog(false)
    navigate(`/results/${activeSession.id}`, { replace: true })
  }

  return (
    <div className="practice-session-page">
      <header className="session-toolbar">
        <div>
          <span>
            {session.config.experience === 'learning'
              ? 'Навчальний режим'
              : 'Симуляція іспиту'}
          </span>
          <strong>
            {session.currentIndex + 1} з {session.questionIds.length}
          </strong>
        </div>
        <div
          aria-label={`Прогрес сесії: ${progress} відсотків`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="session-progress"
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        {session.remainingSeconds !== null ? (
          <div
            aria-label={`Залишилося ${formatSessionTime(session.remainingSeconds)}`}
            className={
              session.remainingSeconds <= 300
                ? 'session-timer session-timer--urgent'
                : 'session-timer'
            }
          >
            <Icon name="clock" size={18} />
            <strong>{formatSessionTime(session.remainingSeconds)}</strong>
          </div>
        ) : (
          <span className="session-no-timer">Без таймера</span>
        )}
        <button
          className="button button--secondary session-finish-button"
          onClick={() => setShowFinishDialog(true)}
          type="button"
        >
          Завершити
        </button>
      </header>

      <div className="practice-session-layout">
        <section aria-label="Поточне питання" className="practice-session-main">
          <div className="session-question-actions">
            <span>
              Питання сесії {session.currentIndex + 1} · офіційне №
              {question.number}
            </span>
            <div>
              <button
                aria-pressed={bookmarked}
                className={
                  bookmarked
                    ? 'flag-button flag-button--bookmarked'
                    : 'flag-button'
                }
                onClick={() =>
                  toggleBookmark(activeSession.config.datasetId, question.id)
                }
                type="button"
              >
                <Icon name="bookmark" size={17} />
                {bookmarked ? 'У закладках' : 'До закладок'}
              </button>
              <button
                aria-pressed={flagged}
                className={
                  flagged ? 'flag-button flag-button--active' : 'flag-button'
                }
                onClick={() =>
                  dispatch({ type: 'toggle_flag', questionId: question.id })
                }
                type="button"
              >
                <Icon name="bookmark" size={17} />
                {flagged ? 'Позначено' : 'Повернутися пізніше'}
              </button>
            </div>
          </div>

          {recommendationReasons.length > 0 ? (
            <aside className="recommendation-reasons" role="note">
              <strong>Чому це питання сьогодні</strong>
              <span>{recommendationReasons.join(' · ')}</span>
            </aside>
          ) : null}

          <div
            className="practice-question-anchor"
            ref={questionAnchorRef}
            tabIndex={-1}
          >
            <PracticeQuestion
              experience={session.config.experience}
              onAnswer={(optionId) =>
                dispatch({
                  type: 'answer',
                  questionId: question.id,
                  optionId,
                })
              }
              question={question}
              revealed={revealed}
              selectedOption={selectedOption}
            />
          </div>

          <nav aria-label="Перехід між питаннями" className="session-controls">
            <button
              className="button button--secondary"
              disabled={session.currentIndex === 0}
              onClick={() => dispatch({ type: 'previous' })}
              type="button"
            >
              ← Попереднє
            </button>
            <span>
              {selectedOption ? 'Відповідь збережено' : 'Відповіді ще немає'}
            </span>
            {session.currentIndex < session.questionIds.length - 1 ? (
              <button
                className="button button--primary"
                onClick={() => dispatch({ type: 'next' })}
                type="button"
              >
                Наступне
                <Icon name="arrow" size={18} />
              </button>
            ) : (
              <button
                className="button button--primary"
                onClick={() => setShowFinishDialog(true)}
                type="button"
              >
                Перейти до завершення
              </button>
            )}
          </nav>
        </section>

        <SessionNavigator
          onGoTo={(index) => dispatch({ type: 'go_to', index })}
          questionsById={questionsById}
          session={session}
        />
      </div>

      {showFinishDialog ? (
        <div className="finish-dialog-backdrop">
          <section
            aria-labelledby="finish-dialog-title"
            aria-modal="true"
            className="finish-dialog"
            role="dialog"
          >
            <span className="icon-tile icon-tile--accent">
              <Icon name="check" />
            </span>
            <p className="eyebrow">Завершення сесії</p>
            <h2 id="finish-dialog-title">Перевірити відповіді?</h2>
            <p>
              Ви відповіли на {answeredCount} із {session.questionIds.length}{' '}
              питань. Без відповіді залишилося{' '}
              {session.questionIds.length - answeredCount}.
            </p>
            <div className="button-row">
              <button
                className="button button--secondary"
                onClick={() => setShowFinishDialog(false)}
                type="button"
              >
                Продовжити сесію
              </button>
              <button
                className="button button--primary"
                onClick={confirmFinish}
                type="button"
              >
                Завершити й побачити результат
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export function ResultsPage() {
  const { sessionId } = useParams()
  const { attempts } = usePracticeSessions()
  const attempt = sessionId
    ? attempts.find((item) => item.id === sessionId)
    : undefined
  const state = useDataset(attempt?.config.datasetId)

  if (!attempt) return <MissingSession />
  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  const score = attempt.score
  const questionsById = getQuestionMap(state.dataset.questions)
  const elapsedSeconds = attempt.elapsedSeconds
  const sectionSummaries = summarizeAttemptSections(attempt)
  const disputedCount = attempt.questionResults.filter(
    (result) => result.answerReviewStatus === 'disputed',
  ).length

  return (
    <div className="page-stack results-page">
      <PageIntro
        action={
          <Link
            className="button button--secondary"
            to={`/practice/setup?exam=${attempt.config.examId}`}
          >
            Нова сесія
          </Link>
        }
        description={
          attempt.completionReason === 'timer'
            ? 'Час завершився, тому сесію було надіслано автоматично.'
            : 'Збережений результат, тематичний зріз і детальний розбір відповідей.'
        }
        eyebrow="Результат сесії"
        title={`${score.percentage}% правильних відповідей`}
      />

      <section aria-label="Показники результату" className="result-metrics">
        <article className="result-metric result-metric--primary">
          <span>За офіційним ключем</span>
          <strong>
            {score.correct}/{score.total}
          </strong>
          <small>{score.percentage}% від усіх питань</small>
        </article>
        <article className="result-metric">
          <span>Неправильно</span>
          <strong>{score.incorrect}</strong>
          <small>із {score.answered} наданих відповідей</small>
        </article>
        <article className="result-metric">
          <span>Без відповіді</span>
          <strong>{score.unanswered}</strong>
          <small>можна врахувати у наступній сесії</small>
        </article>
        <article className="result-metric">
          <span>Час</span>
          <strong>{formatSessionTime(elapsedSeconds)}</strong>
          <small>
            {attempt.config.experience === 'exam'
              ? 'симуляція іспиту'
              : 'навчальний режим'}
          </small>
        </article>
      </section>

      {disputedCount > 0 ? (
        <aside className="result-caveat" role="note">
          <strong>Спірних офіційних ключів у спробі: {disputedCount}.</strong>
          <span>
            Загальний відсоток технічно розраховано за ключем джерела, але в
            розборі такі відповіді не подаються як безумовна предметна істина.
          </span>
        </aside>
      ) : null}

      <section className="result-sections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Тематичний зріз</p>
            <h2>Результат за розділами</h2>
          </div>
          <p>
            Точність рахується серед питань, на які було надано відповідь.
            Пропуски показано окремо.
          </p>
        </div>
        <div className="result-section-grid">
          {sectionSummaries.map((section) => (
            <article key={section.key}>
              <div>
                <span>{section.key === 'unmapped' ? '—' : section.key}</span>
                <strong>{section.title}</strong>
              </div>
              <b>{section.accuracy}%</b>
              <small>
                Правильно: {section.correct} · Помилок: {section.incorrect} ·
                Пропущено: {section.skipped}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="result-review">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Детальний розбір</p>
            <h2>Кожна відповідь і пояснення</h2>
          </div>
          <p>
            Помилкові відповіді відкрито автоматично. Інші питання можна
            розгорнути окремо.
          </p>
        </div>
        <div className="attempt-review-list">
          {attempt.questionResults.map((result, index) => {
            const question = questionsById.get(result.questionId)
            return question ? (
              <AttemptReviewItem
                key={result.questionId}
                position={index + 1}
                question={question}
                result={result}
              />
            ) : null
          })}
        </div>
      </section>
    </div>
  )
}
