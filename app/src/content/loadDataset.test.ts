import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearDatasetCache, loadDataset, resolvePublicUrl } from './loadDataset'
import { clearTaskDatasetCache } from './loadTaskDataset'

function readReleaseDataset() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'yefvv-it-2024.json'),
      'utf8',
    ),
  ) as unknown
}

function readTaskFixture() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'fixtures', 'evi-schema-v2.json'),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedCybersecurityDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-cybersecurity-20260615-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedDatabaseDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-databases-20260617-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

afterEach(() => {
  clearDatasetCache()
  clearTaskDatasetCache()
  vi.unstubAllGlobals()
})

describe('loadDataset', () => {
  it('loads, validates, adapts and caches a registered dataset', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => readReleaseDataset(),
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await loadDataset('yefvv-it-2024')
    const second = await loadDataset('yefvv-it-2024')

    expect(first).toBe(second)
    expect(first.questions).toHaveLength(140)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/content/datasets/yefvv-it-2024/dataset.json',
    )
  })

  it('builds URLs for a GitHub Pages base path', () => {
    expect(
      resolvePublicUrl(
        'content/datasets/yefvv-it-2024/dataset.json',
        '/masters-entrance-exams/',
      ),
    ).toBe(
      '/masters-entrance-exams/content/datasets/yefvv-it-2024/dataset.json',
    )
  })

  it('loads a registered schema v2 projection as a practice dataset', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => readTaskFixture(),
    })
    vi.stubGlobal('fetch', fetchMock)

    const dataset = await loadDataset('tznk-2024')

    expect(dataset.questions).toHaveLength(33)
    expect(dataset.sections.map((section) => section.questionCount)).toEqual([
      18, 15,
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      '/content/fixtures/evi-schema-v2.json',
    )
  })

  it('combines official ЄФВВ questions with published generated batches', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/content/datasets/yefvv-it-2024/dataset.json') {
        return Promise.resolve({
          ok: true,
          json: async () => readReleaseDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-cybersecurity-20260615-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedCybersecurityDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-databases-20260617-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedDatabaseDataset(),
        })
      }
      return Promise.resolve({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const dataset = await loadDataset('yefvv-it-2024-plus-generated')
    const databases = dataset.sections.find((section) => section.code === '3')
    const cybersecurity = dataset.sections.find(
      (section) => section.code === '5',
    )
    const generatedQuestions = dataset.questions.filter(
      (question) => question.origin === 'generated',
    )
    const generatedDatabaseQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '3',
    )

    expect(dataset.questions).toHaveLength(170)
    expect(databases?.questionCount).toBe(37)
    expect(cybersecurity?.questionCount).toBe(22)
    expect(generatedQuestions).toHaveLength(30)
    expect(generatedQuestions[0]).toMatchObject({
      number: 141,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '5',
          section: 'Кібербезпека та захист інформації',
        }),
      },
    })
    expect(generatedDatabaseQuestions).toHaveLength(20)
    expect(generatedDatabaseQuestions[0]).toMatchObject({
      number: 151,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '3',
          section: 'Бази та сховища даних',
        }),
      },
    })
  })
})
