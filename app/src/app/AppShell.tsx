import { useEffect, type MouseEvent } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { BrandMark } from '../components/BrandMark'
import { Icon } from '../components/Icon'
import { PracticeSessionProvider } from '../features/practice/PracticeSessionContext'
import '../app.css'
import { getPageTitle, primaryNavigation } from './navigation'

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link'
}

export function AppShell() {
  const location = useLocation()

  function focusMainContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    document.getElementById('main-content')?.focus()
  }

  useEffect(() => {
    document.title = `${getPageTitle(location.pathname)} | Вступ 2026`
  }, [location.pathname])

  return (
    <PracticeSessionProvider>
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main-content"
          onClick={focusMainContent}
        >
          Перейти до основного вмісту
        </a>

        <header className="site-header">
          <div className="site-header__inner">
            <NavLink aria-label="Вступ 2026, головна" className="brand" to="/">
              <BrandMark />
              <span className="brand__text">
                <strong>Вступ 2026</strong>
                <small>Персональний тренажер</small>
              </span>
            </NavLink>

            <nav aria-label="Основна навігація" className="desktop-nav">
              {primaryNavigation.map((item) => (
                <NavLink
                  className={navClassName}
                  end={item.end}
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <NavLink
              aria-label="Налаштування"
              className="header-icon-button"
              to="/settings"
            >
              <Icon name="settings" />
            </NavLink>
          </div>
        </header>

        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        <nav aria-label="Мобільна навігація" className="mobile-nav">
          {primaryNavigation.map((item) => (
            <NavLink
              className={navClassName}
              end={item.end}
              key={item.to}
              to={item.to}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.shortLabel}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </PracticeSessionProvider>
  )
}
