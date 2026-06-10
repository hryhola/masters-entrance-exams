import { Link } from 'react-router-dom'

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
