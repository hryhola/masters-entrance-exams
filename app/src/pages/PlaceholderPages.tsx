import { Link, useParams } from 'react-router-dom'

import type { IconName } from '../app/navigation'
import { Icon } from '../components/Icon'
import { PageIntro } from '../components/PageIntro'

interface EmptyStateProps {
  icon: IconName
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <section className="empty-state">
      <span className="icon-tile icon-tile--large">
        <Icon name={icon} size={25} />
      </span>
      <p className="eyebrow">Етап 1</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionTo ? (
        <Link className="button button--primary" to={actionTo}>
          {actionLabel}
          <Icon name="arrow" size={18} />
        </Link>
      ) : null}
    </section>
  )
}

export function ExamDetailPage() {
  const { examId } = useParams()

  return (
    <div className="page-stack">
      <PageIntro
        description="Тут з'являться режими повного тесту, тематичного тренування та швидкої сесії."
        eyebrow="ЄФВВ 2024"
        title={
          examId === 'yefvv-it' ? 'Інформаційні технології' : 'Невідомий іспит'
        }
      />
      <EmptyState
        actionLabel="Налаштувати сесію"
        actionTo="/practice/setup"
        description="Контентний loader і рендеринг усіх 140 завдань належать до наступного етапу."
        icon="exams"
        title="Каркас іспиту готовий"
      />
    </div>
  )
}

export function PracticeSetupPage() {
  return (
    <div className="page-stack">
      <PageIntro
        description="Повний тест, окрема тема або швидка сесія з'являться після підключення контенту й тестового рушія."
        eyebrow="Нова сесія"
        title="Налаштування практики"
      />
      <EmptyState
        description="На Етапі 3 тут можна буде вибрати іспит, режим, кількість питань і таймер."
        icon="practice"
        title="Тестовий рушій ще попереду"
      />
    </div>
  )
}

export function SessionPage() {
  return (
    <EmptyState
      actionLabel="До налаштувань"
      actionTo="/practice/setup"
      description="Інтерфейс одного питання буде реалізовано разом із навігацією, таймером і станом сесії."
      icon="practice"
      title="Сесію ще не створено"
    />
  )
}

export function ResultsPage() {
  return (
    <EmptyState
      actionLabel="На головну"
      actionTo="/"
      description="Після першої завершеної сесії тут будуть бал, час, слабкі теми й детальний розбір."
      icon="check"
      title="Результатів поки немає"
    />
  )
}

export function ReviewPage() {
  return (
    <div className="page-stack">
      <PageIntro
        description="Питання з помилками, закладки та заплановані повторення зберігатимуться локально."
        eyebrow="Навчання"
        title="Повторення"
      />
      <EmptyState
        description="Цей розділ наповниться після перших відповідей."
        icon="bookmark"
        title="Список повторень порожній"
      />
    </div>
  )
}

export function ProgressPage() {
  return (
    <div className="page-stack">
      <PageIntro
        description="Тут з'являться точність, витрачений час і рівень засвоєння за кожною темою."
        eyebrow="Аналітика"
        title="Ваш прогрес"
      />
      <EmptyState
        actionLabel="Почати тренування"
        actionTo="/practice/setup"
        description="Статистика стане доступною після завершення першої сесії."
        icon="chart"
        title="Потрібна перша спроба"
      />
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="page-stack">
      <PageIntro
        description="Налаштування вигляду, навчального режиму та керування локальними даними."
        eyebrow="Система"
        title="Налаштування"
      />
      <EmptyState
        description="Версіоноване сховище localStorage буде додано на Етапі 4."
        icon="settings"
        title="Налаштування ще не потрібні"
      />
    </div>
  )
}
