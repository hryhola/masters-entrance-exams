import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { adaptTaskDataset } from './adaptTaskDataset'
import { adaptTaskDatasetForPractice } from './adaptTaskDatasetForPractice'
import { validateTaskDatasetDocument } from './validateTaskDataset'

function readFixture() {
  return validateTaskDatasetDocument(
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), '..', 'data', 'fixtures', 'evi-schema-v2.json'),
        'utf8',
      ),
    ),
  )
}

function readGeneratedCybersecurityDataset() {
  return validateTaskDatasetDocument(
    JSON.parse(
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
    ),
  )
}

describe('adaptTaskDatasetForPractice', () => {
  it('projects only the 33 TZNK assessment items into practice questions', () => {
    const dataset = adaptTaskDatasetForPractice(
      adaptTaskDataset(readFixture()),
      {
        id: 'tznk-2024',
        title: 'ЄВІ: ТЗНК 2024',
        subject: 'Тест загальної навчальної компетентності',
        language: 'uk',
        sectionCodes: ['tznk-verbal', 'tznk-logical'],
      },
    )

    expect(dataset.id).toBe('tznk-2024')
    expect(dataset.questions).toHaveLength(33)
    expect(dataset.sections).toEqual([
      expect.objectContaining({
        code: 'tznk-verbal',
        questionCount: 18,
      }),
      expect.objectContaining({
        code: 'tznk-logical',
        questionCount: 15,
      }),
    ])
    expect(dataset.questions[0]).toMatchObject({
      id: 'tznk-2024-001',
      number: 1,
      displayLabel: '1.(1)',
      correctOption: 'c',
    })
    expect(dataset.questions[10]).toMatchObject({
      id: 'tznk-2024-011',
      number: 11,
      displayLabel: '5',
    })
    expect(dataset.questions[30].features.blockTypes).toContain('image')
    expect(
      dataset.questions.some((question) => question.id.startsWith('yevi-en')),
    ).toBe(false)
  })

  it('projects generated ЄФВВ questions into the official program section', () => {
    const dataset = adaptTaskDatasetForPractice(
      adaptTaskDataset(readGeneratedCybersecurityDataset()),
      {
        id: 'generated-yefvv-it-cybersecurity-20260615-001',
        title: 'Додаткові питання ЄФВВ — Кібербезпека',
        subject: 'Інформаційні технології',
        language: 'uk',
        sectionCodes: ['5'],
      },
    )

    expect(dataset.questions).toHaveLength(10)
    expect(dataset.sections).toEqual([
      expect.objectContaining({
        code: '5',
        title: 'Кібербезпека та захист інформації',
        questionCount: 10,
      }),
    ])
    expect(dataset.questions[0]).toMatchObject({
      origin: 'generated',
      verification: { method: 'agent_validation' },
      classification: {
        topic: expect.objectContaining({
          code: '5',
          sectionCode: '5',
          section: 'Кібербезпека та захист інформації',
        }),
      },
    })
  })
})
