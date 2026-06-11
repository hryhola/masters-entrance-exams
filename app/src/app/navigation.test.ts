import { describe, expect, it } from 'vitest'

import { getPageTitle, primaryNavigation } from './navigation'

describe('primaryNavigation', () => {
  it('keeps the four main destinations unique', () => {
    const destinations = primaryNavigation.map((item) => item.to)

    expect(new Set(destinations).size).toBe(destinations.length)
    expect(destinations).toEqual([
      '/',
      '/exams',
      '/practice/setup',
      '/progress',
    ])
  })
})

describe('getPageTitle', () => {
  it.each([
    ['/', 'Головна'],
    ['/exams', 'Іспити'],
    ['/exams/yefvv-it', 'Іспит'],
    ['/practice/setup', 'Практика'],
    ['/results/demo', 'Результат'],
    ['/dev/datasets/yefvv-it-2024', 'Перевірка контенту'],
    ['/dev/evi-fixtures', 'Прототип ЄВІ'],
    ['/unknown', 'Сторінку не знайдено'],
  ])('maps %s to %s', (pathname, title) => {
    expect(getPageTitle(pathname)).toBe(title)
  })
})
