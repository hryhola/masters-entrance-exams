import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'

const futureExams = [
  {
    title: 'ЄВІ: ТЗНК',
    description: 'Логічне, аналітичне та критичне мислення.',
  },
  {
    title: 'ЄВІ: англійська мова',
    description: 'Читання, використання мови та словниковий запас.',
  },
]

export function ExamsPage() {
  return (
    <div className="page-stack">
      <PageIntro
        description="Оберіть іспит, а потім повний тест, окрему тему або коротку практичну сесію."
        eyebrow="Каталог"
        title="Іспити"
      />

      <section aria-label="Доступні іспити" className="exam-list">
        <article className="exam-card exam-card--available">
          <div className="exam-card__topline">
            <span className="exam-code">ЄФВВ</span>
            <span className="availability availability--ready">Доступно</span>
          </div>
          <div>
            <h2>Інформаційні технології</h2>
            <p>
              Офіційний тест 2024 року з поясненнями та зіставленням із чинною
              програмою.
            </p>
          </div>
          <dl className="exam-metrics">
            <div>
              <dt>Питань</dt>
              <dd>140</dd>
            </div>
            <div>
              <dt>Тем</dt>
              <dd>10</dd>
            </div>
            <div>
              <dt>Формат</dt>
              <dd>1 відповідь</dd>
            </div>
          </dl>
          <Link className="button button--primary" to="/exams/yefvv-it">
            Відкрити іспит
            <Icon name="arrow" size={18} />
          </Link>
        </article>

        {futureExams.map((exam) => (
          <article className="exam-card exam-card--future" key={exam.title}>
            <div className="exam-card__topline">
              <span className="exam-code">ЄВІ</span>
              <span className="availability">Заплановано</span>
            </div>
            <div>
              <h2>{exam.title.replace('ЄВІ: ', '')}</h2>
              <p>{exam.description}</p>
            </div>
            <div className="future-note">
              Матеріали будуть додані після нормалізації офіційних PDF.
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
