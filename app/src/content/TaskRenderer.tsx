import { ContentRenderer } from './ContentRenderer'
import type {
  AssessmentItem,
  AssessmentTask,
  Choice,
  ChoiceId,
  Stimulus,
} from './taskTypes'
import './task-content.css'

export type TaskAnswers = Record<string, ChoiceId>

interface TaskRendererProps {
  task: AssessmentTask
  stimuli: Stimulus[]
  answers: TaskAnswers
  revealAnswers?: boolean
  onAnswer: (itemId: string, choiceId: ChoiceId) => void
}

function StimulusContent({ stimulus }: { stimulus: Stimulus }) {
  return (
    <section
      className={`task-stimulus task-stimulus--${stimulus.type}`}
      lang={stimulus.language}
    >
      {stimulus.title ? <h3>{stimulus.title}</h3> : null}
      <ContentRenderer blocks={stimulus.content} />
    </section>
  )
}

function getStimuli(ids: string[], stimuliById: Map<string, Stimulus>) {
  return ids.flatMap((id) => {
    const stimulus = stimuliById.get(id)
    return stimulus ? [stimulus] : []
  })
}

function ChoiceOptions({
  item,
  choices,
  selectedChoice,
  revealAnswers,
  onAnswer,
}: {
  item: AssessmentItem
  choices: Choice[]
  selectedChoice: ChoiceId | undefined
  revealAnswers: boolean
  onAnswer: (choiceId: ChoiceId) => void
}) {
  return (
    <ol
      aria-label={`Варіанти для ${item.displayLabel}`}
      className="task-options"
    >
      {choices.map((choice) => {
        const selected = selectedChoice === choice.id
        const correct = item.correctChoice === choice.id
        const classNames = ['task-option']
        if (selected) classNames.push('task-option--selected')
        if (revealAnswers && correct) classNames.push('task-option--correct')
        if (revealAnswers && selected && !correct) {
          classNames.push('task-option--incorrect')
        }

        return (
          <li key={choice.id}>
            <button
              aria-pressed={selected}
              className={classNames.join(' ')}
              onClick={() => onAnswer(choice.id)}
              type="button"
            >
              <span className="task-option__label">{choice.label}</span>
              <ContentRenderer blocks={choice.content} compact />
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function MatchingTask({
  task,
  stimuliById,
  answers,
  revealAnswers,
  onAnswer,
}: {
  task: AssessmentTask
  stimuliById: Map<string, Stimulus>
  answers: TaskAnswers
  revealAnswers: boolean
  onAnswer: TaskRendererProps['onAnswer']
}) {
  const choiceSet = task.choiceSets[0]
  if (!choiceSet) return null

  return (
    <div className="matching-task">
      <aside className="matching-choice-bank">
        <p className="eyebrow">Спільні варіанти</p>
        <ol>
          {choiceSet.choices.map((choice) => (
            <li key={choice.id}>
              <strong>{choice.label}</strong>
              <ContentRenderer blocks={choice.content} compact />
            </li>
          ))}
        </ol>
      </aside>

      <div className="matching-items">
        {task.items.map((item) => {
          const selectedByAnotherItem = new Set(
            Object.entries(answers)
              .filter(([itemId]) => itemId !== item.id)
              .map(([, choiceId]) => choiceId),
          )
          const selectedChoice = answers[item.id]
          const answerIsCorrect = selectedChoice === item.correctChoice

          return (
            <article className="matching-item" key={item.id}>
              <header>
                <span>{item.displayLabel}</span>
                <ContentRenderer blocks={item.prompt} compact />
              </header>
              {getStimuli(item.stimulusIds, stimuliById).map((stimulus) => (
                <StimulusContent key={stimulus.id} stimulus={stimulus} />
              ))}
              <label>
                <span>Відповідність</span>
                <select
                  aria-label={`Відповідь для ${item.displayLabel}`}
                  onChange={(event) => onAnswer(item.id, event.target.value)}
                  value={selectedChoice ?? ''}
                >
                  <option disabled value="">
                    Оберіть варіант
                  </option>
                  {choiceSet.choices.map((choice) => (
                    <option
                      disabled={
                        choiceSet.unique && selectedByAnotherItem.has(choice.id)
                      }
                      key={choice.id}
                      value={choice.id}
                    >
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>
              {revealAnswers ? (
                <p
                  className={
                    answerIsCorrect
                      ? 'task-answer-status task-answer-status--correct'
                      : 'task-answer-status task-answer-status--incorrect'
                  }
                >
                  {answerIsCorrect
                    ? 'Правильно'
                    : `Правильна відповідь: ${
                        choiceSet.choices.find(
                          (choice) => choice.id === item.correctChoice,
                        )?.label ?? item.correctChoice
                      }`}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ChoiceTask({
  task,
  stimuliById,
  answers,
  revealAnswers,
  onAnswer,
}: {
  task: AssessmentTask
  stimuliById: Map<string, Stimulus>
  answers: TaskAnswers
  revealAnswers: boolean
  onAnswer: TaskRendererProps['onAnswer']
}) {
  return (
    <div className="choice-task">
      {task.items.map((item) => {
        if (item.response.type === 'matching_choice') return null
        const selectedChoice = answers[item.id]
        const isCorrect = selectedChoice === item.correctChoice

        return (
          <article className="assessment-item" key={item.id}>
            <header className="assessment-item__header">
              <span>{item.displayLabel}</span>
              <ContentRenderer blocks={item.prompt} />
            </header>
            {getStimuli(item.stimulusIds, stimuliById).map((stimulus) => (
              <StimulusContent key={stimulus.id} stimulus={stimulus} />
            ))}
            <ChoiceOptions
              choices={item.response.options}
              item={item}
              onAnswer={(choiceId) => onAnswer(item.id, choiceId)}
              revealAnswers={revealAnswers}
              selectedChoice={selectedChoice}
            />
            {revealAnswers ? (
              <section
                className={
                  isCorrect
                    ? 'task-explanation task-explanation--correct'
                    : 'task-explanation task-explanation--incorrect'
                }
              >
                <strong>{isCorrect ? 'Правильно' : 'Варто переглянути'}</strong>
                {item.explanation.summary.length > 0 ? (
                  <ContentRenderer blocks={item.explanation.summary} compact />
                ) : (
                  <p>Редакційне пояснення ще не підготовлено.</p>
                )}
              </section>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export function TaskRenderer({
  task,
  stimuli,
  answers,
  revealAnswers = false,
  onAnswer,
}: TaskRendererProps) {
  const stimuliById = new Map(
    stimuli.map((stimulus) => [stimulus.id, stimulus]),
  )

  return (
    <article className="assessment-task" lang={task.language}>
      <header className="assessment-task__header">
        <div>
          <p className="eyebrow">Task {task.number}</p>
          <span className="tag">{task.type}</span>
          <span className="tag">
            {task.items.length}{' '}
            {task.items.length === 1 ? 'відповідь' : 'відповідей'}
          </span>
        </div>
        <ContentRenderer blocks={task.instruction} />
      </header>

      {getStimuli(task.stimulusIds, stimuliById).map((stimulus) => (
        <StimulusContent key={stimulus.id} stimulus={stimulus} />
      ))}

      {task.type === 'matching' ? (
        <MatchingTask
          answers={answers}
          onAnswer={onAnswer}
          revealAnswers={revealAnswers}
          stimuliById={stimuliById}
          task={task}
        />
      ) : (
        <ChoiceTask
          answers={answers}
          onAnswer={onAnswer}
          revealAnswers={revealAnswers}
          stimuliById={stimuliById}
          task={task}
        />
      )}
    </article>
  )
}
