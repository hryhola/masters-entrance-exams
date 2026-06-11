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
  it('validates and adapts the three EVI schema v2 fixtures', () => {
    const dataset = adaptTaskDataset(validateTaskDatasetDocument(readFixture()))

    expect(dataset.schemaVersion).toBe(2)
    expect(dataset.tasks).toHaveLength(3)
    expect(dataset.assessmentItemCount).toBe(11)
    expect(dataset.stimuli).toHaveLength(8)
    expect(dataset.tasks.map((task) => task.type)).toEqual([
      'matching',
      'cloze',
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
        taskCount: 1,
        assessmentItemCount: 2,
      }),
      expect.objectContaining({
        code: 'tznk-logical',
        taskCount: 1,
        assessmentItemCount: 3,
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
})
