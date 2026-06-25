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

function readGeneratedDatabaseSupplementDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-databases-20260624-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedComputerArchitectureDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-computer-architecture-20260617-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedNetworksDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-networks-20260617-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedOperatingSystemsDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-operating-systems-20260617-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedArtificialIntelligenceDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-artificial-intelligence-20260618-001.json',
      ),
      'utf8',
    ),
  ) as unknown
}

function readGeneratedAlgorithmsDataset() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        'data',
        'generated',
        'drafts',
        'generated-yefvv-it-algorithms-20260624-001.json',
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
      if (
        url ===
        '/content/datasets/generated-yefvv-it-computer-architecture-20260617-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedComputerArchitectureDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-networks-20260617-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedNetworksDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-operating-systems-20260617-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedOperatingSystemsDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-artificial-intelligence-20260618-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedArtificialIntelligenceDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-databases-20260624-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedDatabaseSupplementDataset(),
        })
      }
      if (
        url ===
        '/content/datasets/generated-yefvv-it-algorithms-20260624-001/dataset.json'
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => readGeneratedAlgorithmsDataset(),
        })
      }
      return Promise.resolve({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const dataset = await loadDataset('yefvv-it-2024-plus-generated')
    const algorithms = dataset.sections.find((section) => section.code === '1')
    const computerArchitecture = dataset.sections.find(
      (section) => section.code === '2',
    )
    const databases = dataset.sections.find((section) => section.code === '3')
    const cybersecurity = dataset.sections.find(
      (section) => section.code === '5',
    )
    const networks = dataset.sections.find((section) => section.code === '7')
    const operatingSystems = dataset.sections.find(
      (section) => section.code === '8',
    )
    const artificialIntelligence = dataset.sections.find(
      (section) => section.code === '10',
    )
    const generatedQuestions = dataset.questions.filter(
      (question) => question.origin === 'generated',
    )
    const generatedAlgorithmQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '1',
    )
    const generatedDatabaseQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '3',
    )
    const generatedComputerArchitectureQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '2',
    )
    const generatedNetworkQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '7',
    )
    const generatedOperatingSystemQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '8',
    )
    const generatedArtificialIntelligenceQuestions = generatedQuestions.filter(
      (question) => question.classification.topic?.sectionCode === '10',
    )

    expect(dataset.questions).toHaveLength(295)
    expect(algorithms?.questionCount).toBe(43)
    expect(computerArchitecture?.questionCount).toBe(34)
    expect(databases?.questionCount).toBe(57)
    expect(cybersecurity?.questionCount).toBe(22)
    expect(networks?.questionCount).toBe(28)
    expect(operatingSystems?.questionCount).toBe(32)
    expect(artificialIntelligence?.questionCount).toBe(32)
    expect(generatedQuestions).toHaveLength(155)
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
    expect(generatedAlgorithmQuestions).toHaveLength(30)
    expect(generatedAlgorithmQuestions[0]).toMatchObject({
      number: 266,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '1',
          section: 'Алгоритми та обчислювальна складність',
        }),
      },
    })
    expect(generatedDatabaseQuestions).toHaveLength(40)
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
    expect(generatedComputerArchitectureQuestions).toHaveLength(20)
    expect(generatedComputerArchitectureQuestions[0]).toMatchObject({
      number: 171,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '2',
          section: 'Архітектура комп’ютера',
        }),
      },
    })
    expect(generatedNetworkQuestions).toHaveLength(15)
    expect(generatedNetworkQuestions[0]).toMatchObject({
      number: 191,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '7',
          section: 'Комп’ютерні мережі та обмін даними',
        }),
      },
    })
    expect(generatedOperatingSystemQuestions).toHaveLength(20)
    expect(generatedOperatingSystemQuestions[0]).toMatchObject({
      number: 206,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '8',
          section: 'Операційні системи',
        }),
      },
    })
    expect(generatedArtificialIntelligenceQuestions).toHaveLength(20)
    expect(generatedArtificialIntelligenceQuestions[0]).toMatchObject({
      number: 226,
      displayLabel: 'Дод. 1',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          sectionCode: '10',
          section: 'Штучний інтелект',
        }),
      },
    })
  })
})
