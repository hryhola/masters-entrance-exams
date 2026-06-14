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

describe('validateTaskDatasetDocument', () => {
  it('validates and adapts the EVI schema v2 fixtures', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))

    expect(dataset.schemaVersion).toBe(2)
    expect(dataset.tasks).toHaveLength(14)
    expect(dataset.assessmentItemCount).toBe(36)
    expect(dataset.stimuli).toHaveLength(19)
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
        taskCount: 8,
        assessmentItemCount: 12,
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
})
