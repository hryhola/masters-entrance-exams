import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { adaptTaskDataset } from './adaptTaskDataset'
import { validateTaskDatasetDocument } from './validateTaskDataset'

function readFixture() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'fixtures', 'evi-schema-v2.json'),
      'utf8',
    ),
  ) as Record<string, unknown>
}

function generatedFixture() {
  const fixture = readFixture()
  const metadata = fixture.dataset as Record<string, unknown>
  const release = fixture.release as Record<string, unknown>
  const batchId = 'generated-yefvv-it-os-medium-001'

  metadata.origin = 'generated'
  metadata.status = 'ready'
  metadata.generation = {
    batch_id: batchId,
    model: 'generation-model',
    prompt: {
      id: 'yefvv-it-single-choice',
      version: '1.0.0',
      sha256: 'a'.repeat(64),
    },
    generated_at: '2026-06-15T10:00:00.000Z',
    generator_version: '1.0.0',
    parameters: {
      topic: 'Операційні системи',
      difficulty: 'medium',
      task_type: 'mixed',
    },
  }
  release.status = 'ready_for_application'
  release.verification = {
    method: 'automated_validation',
    status: 'passed',
    validator_version: '1.0.0',
    validated_at: '2026-06-15T10:01:00.000Z',
    checks: [
      'schema',
      'answer_integrity',
      'explanation_integrity',
      'duplicate_detection',
      'official_similarity',
    ],
    similarity: {
      maximum_score: 0.41,
      threshold: 0.72,
    },
  }

  const tasks = fixture.tasks as Array<Record<string, unknown>>
  tasks.forEach((task) => {
    const items = task.items as Array<Record<string, unknown>>
    items.forEach((item) => {
      const answer = item.answer as Record<string, unknown>
      const explanation = item.explanation as Record<string, unknown>
      answer.source = 'generated_key'
      explanation.status = 'generated'
      if ((explanation.summary as unknown[]).length === 0) {
        explanation.summary = [
          {
            type: 'markdown',
            text: 'Автоматично перевірене пояснення.',
          },
        ]
      }
      item.source = { generation_batch_id: batchId }
    })
  })

  return fixture
}

describe('validateTaskDatasetDocument', () => {
  it('validates and adapts the EVI schema v2 fixtures', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))

    expect(dataset.schemaVersion).toBe(2)
    expect(dataset.tasks).toHaveLength(15)
    expect(dataset.assessmentItemCount).toBe(39)
    expect(dataset.stimuli).toHaveLength(20)
    expect(dataset.tasks.map((task) => task.type)).toEqual([
      'matching',
      'cloze',
      'cloze',
      'cloze',
      'cloze',
      'question_group',
      'single_choice',
      'single_choice',
      'single_choice',
      'single_choice',
      'single_choice',
      'single_choice',
      'question_group',
      'question_group',
      'question_group',
    ])
    expect(dataset.sections).toEqual([
      expect.objectContaining({
        code: 'english-reading',
        taskCount: 1,
        assessmentItemCount: 6,
      }),
      expect.objectContaining({
        code: 'tznk-verbal',
        taskCount: 5,
        assessmentItemCount: 18,
      }),
      expect.objectContaining({
        code: 'tznk-logical',
        taskCount: 9,
        assessmentItemCount: 15,
      }),
    ])
  })

  it('rejects a reference to a missing stimulus', () => {
    const fixture = readFixture()
    const tasks = fixture.tasks as Array<Record<string, unknown>>
    tasks[0].stimulus_ids = ['missing-stimulus']

    expect(() => validateTaskDatasetDocument(fixture)).toThrow(
      'tasks[0].stimulus_ids[0]: очікується id наявного stimulus',
    )
  })

  it('accepts a generated dataset after every automated quality gate passes', () => {
    const dataset = adaptTaskDataset(
      validateTaskDatasetDocument(generatedFixture()),
    )

    expect(dataset.origin).toBe('generated')
    expect(dataset.generation).toEqual(
      expect.objectContaining({
        batchId: 'generated-yefvv-it-os-medium-001',
        model: 'generation-model',
      }),
    )
    expect(dataset.verification).toEqual(
      expect.objectContaining({
        method: 'automated_validation',
        status: 'passed',
      }),
    )
    expect(
      dataset.tasks
        .flatMap((task) => task.items)
        .every(
          (item) =>
            item.source.type === 'generated' &&
            item.explanation.status === 'generated',
        ),
    ).toBe(true)
  })

  it('rejects a generated dataset with an incomplete automated report', () => {
    const fixture = generatedFixture()
    const release = fixture.release as Record<string, unknown>
    const verification = release.verification as Record<string, unknown>
    verification.checks = [
      'schema',
      'answer_integrity',
      'explanation_integrity',
      'duplicate_detection',
    ]

    expect(() => validateTaskDatasetDocument(fixture)).toThrow(
      "release.verification.checks: очікується усі обов'язкові перевірки",
    )
  })

  it('rejects generated content that exceeds the official similarity threshold', () => {
    const fixture = generatedFixture()
    const release = fixture.release as Record<string, unknown>
    const verification = release.verification as Record<string, unknown>
    const similarity = verification.similarity as Record<string, unknown>
    similarity.maximum_score = 0.8

    expect(() => validateTaskDatasetDocument(fixture)).toThrow(
      'release.verification.similarity.maximum_score: очікується значення, що не перевищує threshold',
    )
  })

  it('rejects an official answer source inside generated content', () => {
    const fixture = generatedFixture()
    const tasks = fixture.tasks as Array<Record<string, unknown>>
    const items = tasks[0].items as Array<Record<string, unknown>>
    items[0].answer = {
      correct_choice: 'f',
      source: 'official_key',
    }

    expect(() => validateTaskDatasetDocument(fixture)).toThrow(
      'tasks[0].items[0].answer.source: очікується generated_key',
    )
  })

  it('rejects duplicate official answers in a unique matching set', () => {
    const fixture = readFixture()
    const tasks = fixture.tasks as Array<Record<string, unknown>>
    const items = tasks[0].items as Array<Record<string, unknown>>
    items[1].answer = {
      correct_choice: 'f',
      source: 'official_key',
    }

    expect(() => validateTaskDatasetDocument(fixture)).toThrow(
      'tasks[0].items[1].answer.correct_choice: очікується унікальну відповідь для choice_set',
    )
  })

  it('rejects a response that does not match its task type', () => {
    const fixture = readFixture()
    const tasks = fixture.tasks as Array<Record<string, unknown>>
    const items = tasks[1].items as Array<Record<string, unknown>>
    items[0].response = {
      type: 'single_choice',
      options: [
        {
          id: 'a',
          label: 'А',
          content: [{ type: 'markdown', text: 'Перший' }],
        },
        {
          id: 'b',
          label: 'Б',
          content: [{ type: 'markdown', text: 'Другий' }],
        },
      ],
    }

    expect(() => validateTaskDatasetDocument(fixture)).toThrow(
      'tasks[1].items[0].response.type: очікується cloze_choice',
    )
  })

  it('contains all ten official cloze keys for tasks 1–4', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const clozeItems = dataset.tasks
      .filter((task) => task.type === 'cloze')
      .flatMap((task) => task.items)

    expect(clozeItems.map((item) => item.id)).toEqual([
      'tznk-2024-001',
      'tznk-2024-002',
      'tznk-2024-003',
      'tznk-2024-004',
      'tznk-2024-005',
      'tznk-2024-006',
      'tznk-2024-007',
      'tznk-2024-008',
      'tznk-2024-009',
      'tznk-2024-010',
    ])
    expect(clozeItems.map((item) => item.correctChoice)).toEqual([
      'c',
      'b',
      'c',
      'a',
      'a',
      'd',
      'c',
      'a',
      'c',
      'b',
    ])
    expect(
      clozeItems.every(
        (item) =>
          item.explanation.status === 'official' &&
          item.explanation.summary.length > 0,
      ),
    ).toBe(true)
  })

  it('contains all official keys and explanations for tasks 5–12', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const task = dataset.tasks.find(
      (candidate) => candidate.id === 'tznk-2024-task-5-12',
    )

    expect(task?.items.map((item) => item.id)).toEqual([
      'tznk-2024-011',
      'tznk-2024-012',
      'tznk-2024-013',
      'tznk-2024-014',
      'tznk-2024-015',
      'tznk-2024-016',
      'tznk-2024-017',
      'tznk-2024-018',
    ])
    expect(task?.items.map((item) => item.correctChoice)).toEqual([
      'b',
      'b',
      'd',
      'c',
      'b',
      'd',
      'd',
      'b',
    ])
    expect(
      task?.items.every(
        (item) =>
          item.explanation.status === 'official' &&
          item.explanation.summary.length > 0,
      ),
    ).toBe(true)
  })

  it('contains all official keys and explanations for tasks 13–18', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const items = dataset.tasks
      .filter((task) => task.number >= 13 && task.number <= 18)
      .flatMap((task) => task.items)

    expect(items.map((item) => item.id)).toEqual([
      'tznk-2024-019',
      'tznk-2024-020',
      'tznk-2024-021',
      'tznk-2024-022',
      'tznk-2024-023',
      'tznk-2024-024',
    ])
    expect(items.map((item) => item.correctChoice)).toEqual([
      'b',
      'b',
      'c',
      'c',
      'a',
      'a',
    ])
    expect(
      items.every(
        (item) =>
          item.explanation.status === 'official' &&
          item.explanation.summary.length > 0,
      ),
    ).toBe(true)
  })

  it('contains all official keys and explanations for tasks 19–21', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const task = dataset.tasks.find(
      (candidate) => candidate.id === 'tznk-2024-task-19-21',
    )

    expect(task?.items.map((item) => item.id)).toEqual([
      'tznk-2024-025',
      'tznk-2024-026',
      'tznk-2024-027',
    ])
    expect(task?.items.map((item) => item.correctChoice)).toEqual([
      'b',
      'd',
      'c',
    ])
    expect(
      task?.items.every(
        (item) =>
          item.explanation.status === 'official' &&
          item.explanation.summary.length > 0,
      ),
    ).toBe(true)
  })

  it('contains all official keys and explanations for tasks 22–24', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const task = dataset.tasks.find(
      (candidate) => candidate.id === 'tznk-2024-task-22-24',
    )

    expect(task?.items.map((item) => item.id)).toEqual([
      'tznk-2024-028',
      'tznk-2024-029',
      'tznk-2024-030',
    ])
    expect(task?.items.map((item) => item.correctChoice)).toEqual([
      'a',
      'c',
      'd',
    ])
    expect(
      task?.items.every(
        (item) =>
          item.explanation.status === 'official' &&
          item.explanation.summary.length > 0,
      ),
    ).toBe(true)
  })

  it('keeps assessment item ids sequential for the chart situation', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const task = dataset.tasks.find(
      (candidate) => candidate.id === 'tznk-2024-task-25-27',
    )

    expect(task?.items.map((item) => item.id)).toEqual([
      'tznk-2024-031',
      'tznk-2024-032',
      'tznk-2024-033',
    ])
  })

  it('keeps TZNK source pages aligned with the physical PDF pages', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const items = dataset.tasks
      .filter((task) => task.sectionCode.startsWith('tznk-'))
      .flatMap((task) => task.items)

    expect(
      items.map((item) =>
        item.source.type === 'official_pdf' ? item.source.pageStart : null,
      ),
    ).toEqual([
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9, 9,
      10, 10, 10, 11, 11, 11, 12, 12, 12,
    ])

    const probabilityItem = items.find((item) => item.id === 'tznk-2024-028')
    const probabilityOptions =
      probabilityItem?.response.type === 'single_choice'
        ? probabilityItem.response.options
        : []

    expect(
      probabilityOptions.flatMap((option) =>
        option.content.flatMap((block) =>
          block.type === 'math' ? block.sourceImages : [],
        ),
      ),
    ).toEqual(Array(4).fill('TZNK_maket_sajt_2024_03_29_merged.pdf#page=11'))
  })

  it('preserves the Latin company identifiers from situation 3', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))
    const stimulus = dataset.stimuli.find(
      (candidate) => candidate.id === 'tznk-2024-situation-3',
    )
    const task = dataset.tasks.find(
      (candidate) => candidate.id === 'tznk-2024-task-25-27',
    )
    const renderedText = [
      ...(stimulus?.content ?? []),
      ...(task?.items.flatMap((item) => [
        ...item.prompt,
        ...item.explanation.summary,
      ]) ?? []),
    ]
      .flatMap((block) => {
        if (block.type === 'markdown') return [block.text]
        if (block.type === 'image') return [block.alt]
        if (block.type === 'table')
          return [...block.columns, ...block.rows.flat()]
        return []
      })
      .join(' ')

    expect(renderedText).toContain('підприємства A, B і C')
    expect(renderedText).toContain('підприємств B і C')
    expect(renderedText).not.toMatch(/підприємств[а]? [АВС]/)
  })
})
