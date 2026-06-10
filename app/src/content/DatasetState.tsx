import { Icon } from '../components/Icon'

export function DatasetLoading() {
  return (
    <section aria-live="polite" className="dataset-state">
      <span className="dataset-spinner" />
      <p className="eyebrow">Контент</p>
      <h1>Завантажуємо набір питань</h1>
      <p>Перевіряємо структуру даних перед відображенням.</p>
    </section>
  )
}

export function DatasetError({ error }: { error: Error }) {
  return (
    <section className="dataset-state dataset-state--error" role="alert">
      <span className="icon-tile icon-tile--large">
        <Icon name="exams" size={25} />
      </span>
      <p className="eyebrow">Помилка контенту</p>
      <h1>Не вдалося відкрити набір</h1>
      <p>{error.message}</p>
      <button
        className="button button--primary"
        onClick={() => location.reload()}
      >
        Спробувати ще раз
      </button>
    </section>
  )
}
