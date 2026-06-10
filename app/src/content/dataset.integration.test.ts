import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { adaptDataset } from './adaptDataset'
import { validateDatasetDocument } from './validateDataset'

function readReleaseDataset() {
  const path = resolve(process.cwd(), '..', 'data', 'yefvv-it-2024.json')
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

describe('ЄФВВ 2024 release dataset', () => {
  it('validates and adapts all official questions', () => {
    const dataset = adaptDataset(validateDatasetDocument(readReleaseDataset()))
    const optionCount = dataset.questions.reduce(
      (total, question) => total + question.options.length,
      0,
    )

    expect(dataset.id).toBe('yefvv-it-2024')
    expect(dataset.version).toBe('1.0.0')
    expect(dataset.questions).toHaveLength(140)
    expect(optionCount).toBe(560)
    expect(dataset.sections).toHaveLength(10)
  })

  it('preserves every supported content block', () => {
    const dataset = adaptDataset(validateDatasetDocument(readReleaseDataset()))

    expect(dataset.contentStats).toEqual({
      markdown: 1377,
      math: 53,
      code: 26,
      table: 1,
      image: 9,
      unknown: 0,
    })
  })

  it('keeps disputed official keys explicit', () => {
    const dataset = adaptDataset(validateDatasetDocument(readReleaseDataset()))
    const disputed = dataset.questions
      .filter(
        (question) => question.explanation.answerReview.status === 'disputed',
      )
      .map((question) => question.number)

    expect(disputed).toEqual([82, 102])
    expect(dataset.answerReviewCounts).toEqual({
      verified: 97,
      verified_with_caveat: 41,
      disputed: 2,
    })
  })

  it('marks visual, mathematical, code and table questions as complex', () => {
    const dataset = adaptDataset(validateDatasetDocument(readReleaseDataset()))

    expect(dataset.questions[8].features.blockTypes).toContain('image')
    expect(dataset.questions[12].features.blockTypes).toContain('math')
    expect(dataset.questions[50].features.blockTypes).toContain('code')
    expect(dataset.questions[85].features.blockTypes).toContain('table')
  })
})
