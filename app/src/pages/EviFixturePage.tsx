import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageIntro } from '../components/PageIntro'
import { DatasetError, DatasetLoading } from '../content/DatasetState'
import { TaskRenderer, type TaskAnswers } from '../content/TaskRenderer'
import { useTaskDataset } from '../content/useTaskDataset'
import './dataset-pages.css'

const fixtureDatasetId = 'evi-schema-v2-fixtures'

export function EviFixturePage() {
  const state = useTaskDataset(fixtureDatasetId)
  const [answers, setAnswers] = useState<TaskAnswers>({})
  const [revealAnswers, setRevealAnswers] = useState(false)

  const score = useMemo(() => {
    if (state.status !== 'ready') return 0
    return state.dataset.tasks
      .flatMap((task) => task.items)
      .filter((item) => answers[item.id] === item.correctChoice).length
  }, [answers, state])

  if (state.status === 'loading') return <DatasetLoading />
  if (state.status === 'error') return <DatasetError error={state.error} />

  const dataset = state.dataset
  const answeredCount = Object.keys(answers).length

  function reset() {
    setAnswers({})
    setRevealAnswers(false)
  }

  return (
    <div className="page-stack">
      <PageIntro
        action={
          <Link className="button button--secondary" to="/exams">
            До каталогу іспитів
          </Link>
        }
        description="Інтерактивна перевірка нової моделі до масової конвертації PDF. Ці завдання ще не входять до прогресу та повних сесій."
        eyebrow={`Schema v${dataset.schemaVersion} · ${dataset.version}`}
        title="Прототип завдань ЄВІ"
      />

      <section aria-label="Показники fixture" className="dataset-overview">
        <article>
          <span>Tasks</span>
          <strong>{dataset.tasks.length}</strong>
          <small>matching, cloze і група до діаграм</small>
        </article>
        <article>
          <span>Оцінюваних відповідей</span>
          <strong>{dataset.assessmentItemCount}</strong>
          <small>рахуються окремо від одиниць навігації</small>
        </article>
        <article>
          <span>Stimuli</span>
          <strong>{dataset.stimuli.length}</strong>
          <small>тексти та діаграми без дублювання</small>
        </article>
        <article>
          <span>Поточний результат</span>
          <strong>
            {revealAnswers ? `${score}/${dataset.assessmentItemCount}` : '—'}
          </strong>
          <small>fixture не записується в LocalStorage</small>
        </article>
      </section>

      <section className="fixture-toolbar">
        <div>
          <strong>
            Заповнено {answeredCount} із {dataset.assessmentItemCount}
          </strong>
          <span>
            Перевірка показує, що score рахується за AssessmentItem, а не за
            Task.
          </span>
        </div>
        <div className="button-row">
          <button
            className="button button--secondary"
            onClick={reset}
            type="button"
          >
            Очистити
          </button>
          <button
            className="button button--primary"
            onClick={() => setRevealAnswers(true)}
            type="button"
          >
            Перевірити відповіді
          </button>
        </div>
      </section>

      {dataset.tasks.map((task) => (
        <TaskRenderer
          answers={answers}
          key={task.id}
          onAnswer={(itemId, choiceId) => {
            setAnswers((current) => ({
              ...current,
              [itemId]: choiceId,
            }))
            setRevealAnswers(false)
          }}
          revealAnswers={revealAnswers}
          stimuli={dataset.stimuli}
          task={task}
        />
      ))}
    </div>
  )
}
