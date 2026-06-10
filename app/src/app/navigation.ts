export type IconName =
  | 'arrow'
  | 'bookmark'
  | 'chart'
  | 'check'
  | 'clock'
  | 'exams'
  | 'home'
  | 'practice'
  | 'settings'
  | 'spark'
  | 'target'

export interface NavigationItem {
  label: string
  shortLabel: string
  to: string
  icon: IconName
  end?: boolean
}

export const primaryNavigation: NavigationItem[] = [
  {
    label: 'Головна',
    shortLabel: 'Головна',
    to: '/',
    icon: 'home',
    end: true,
  },
  {
    label: 'Іспити',
    shortLabel: 'Іспити',
    to: '/exams',
    icon: 'exams',
  },
  {
    label: 'Практика',
    shortLabel: 'Практика',
    to: '/practice/setup',
    icon: 'practice',
  },
  {
    label: 'Прогрес',
    shortLabel: 'Прогрес',
    to: '/progress',
    icon: 'chart',
  },
]

export function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Головна'
  if (pathname.startsWith('/exams/')) return 'Іспит'
  if (pathname === '/exams') return 'Іспити'
  if (pathname.startsWith('/dev/datasets/')) return 'Перевірка контенту'
  if (pathname.startsWith('/practice/')) return 'Практика'
  if (pathname.startsWith('/results/')) return 'Результат'
  if (pathname === '/review') return 'Повторення'
  if (pathname === '/progress') return 'Прогрес'
  if (pathname === '/settings') return 'Налаштування'
  return 'Сторінку не знайдено'
}
