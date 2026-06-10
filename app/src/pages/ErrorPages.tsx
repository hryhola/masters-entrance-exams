import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { Icon } from '../components/Icon'

export function NotFoundPage() {
  return (
    <section className="error-page">
      <p className="error-code">404</p>
      <h1>Такої сторінки немає</h1>
      <p>
        Можливо, посилання застаріло або сторінку ще не додано до застосунку.
      </p>
      <Link className="button button--primary" to="/">
        Повернутися на головну
        <Icon name="arrow" size={18} />
      </Link>
    </section>
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.statusText}`
    : 'Сталася непередбачена помилка.'

  return (
    <section className="error-page">
      <p className="error-code">Помилка</p>
      <h1>Не вдалося відкрити сторінку</h1>
      <p>{message}</p>
      <Link className="button button--primary" to="/">
        Повернутися на головну
      </Link>
    </section>
  )
}
