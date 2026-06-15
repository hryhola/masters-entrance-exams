import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'
import { DatasetError, DatasetLoading } from '../content/DatasetState'
import { useDataset } from '../content/useDataset'
import { examRegistry, type ExamDefinition } from '../exams/registry'

function AvailableExamCard({ exam }: { exam: ExamDefinition }) {
  const state = useDataset(exam.datasetId)

  if (state.status === 'loading') {
    return (
      <article className="exam-card exam-card--available">
        <DatasetLoading />
      </article>
    )
  }
  if (state.status === 'error') {
    return (
      <article className="exam-card exam-card--future">
        <DatasetError error={state.error} />
      </article>
    )
  }

  const dataset = state.dataset
  return (
    <article className="exam-card exam-card--available">
      <div className="exam-card__topline">
        <span className="exam-code">{exam.shortName}</span>
        <span className="availability availability--ready">Доступно</span>
      </div>
      <div>
        <h2>{exam.title}</h2>
        <p>
          Офіційний тест {dataset.year} року, нормалізований для практики,
          перевірки відповідей і повторення.
        </p>
      </div>
      <dl className="exam-metrics">
        <div>
          <dt>Питань</dt>
          <dd>{dataset.questions.length}</dd>
        </div>
        <div>
          <dt>Розділів</dt>
          <dd>{dataset.sections.length}</dd>
        </div>
        <div>
          <dt>Формат</dt>
          <dd>1 відповідь</dd>
        </div>
      </dl>
      <Link className="button button--primary" to={`/exams/${exam.id}`}>
        Відкрити іспит
        <Icon name="arrow" size={18} />
      </Link>
    </article>
  )
}

export function ExamsPage() {
  const availableExams = examRegistry.filter(
    (exam) => exam.status === 'available',
  )
  const plannedExams = examRegistry.filter((exam) => exam.status === 'planned')

  return (
    <div className="page-stack">
      <PageIntro
        description="Оберіть іспит, а потім повний тест, окрему тему або коротку практичну сесію."
        eyebrow="Каталог"
        title="Іспити"
      />

      <section aria-label="Доступні іспити" className="exam-list">
        {availableExams.map((exam) => (
          <AvailableExamCard exam={exam} key={exam.id} />
        ))}

        {plannedExams.map((exam) => (
          <article className="exam-card exam-card--future" key={exam.id}>
            <div className="exam-card__topline">
              <span className="exam-code">{exam.shortName}</span>
              <span className="availability">Заплановано</span>
            </div>
            <div>
              <h2>{exam.title}</h2>
              <p>
                Матеріали будуть доступні після повної нормалізації та ручної
                валідації офіційного PDF.
              </p>
            </div>
            <Link className="button button--secondary" to="/dev/evi-fixtures">
              Переглянути прототип
              <Icon name="arrow" size={18} />
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
