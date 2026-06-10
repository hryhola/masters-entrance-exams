import { Link } from 'react-router-dom'

import { Icon } from '../components/Icon'

const todayItems = [
  'Пройти коротку діагностику',
  'Визначити перші слабкі теми',
  'Сформувати ритм повторень',
]

export function DashboardPage() {
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
            <Link className="button button--primary" to="/practice/setup">
              Почати тренування
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
            <span>Стартова позиція</span>
          </div>
          <strong>0%</strong>
          <p>Почніть першу сесію, щоб побачити персональний прогрес.</p>
          <div
            aria-label="Прогрес підготовки: 0 відсотків"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={0}
            className="progress-bar"
            role="progressbar"
          >
            <span style={{ width: '0%' }} />
          </div>
          <div className="hero-summary__stats">
            <div>
              <span>Питань готово</span>
              <strong>140</strong>
            </div>
            <div>
              <span>Активний іспит</span>
              <strong>1</strong>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="today-heading" className="dashboard-grid">
        <article className="panel panel--today">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">План на сьогодні</p>
              <h2 id="today-heading">Почнімо з діагностики</h2>
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
          <Link className="text-link" to="/practice/setup">
            Налаштувати першу сесію
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
            Офіційний тест 2024 року, класифікований за програмою 2025 року та
            доповнений поясненнями.
          </p>
          <div className="tag-row">
            <span className="tag">140 питань</span>
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
            Сайт буде накопичувати історію відповідей і перетворювати її на
            конкретний навчальний план.
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
