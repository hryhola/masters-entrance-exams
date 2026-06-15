import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  DatasetValidationError,
  validateDatasetDocument,
} from './validateDataset'

function readReleaseDataset() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'yefvv-it-2024.json'),
      'utf8',
    ),
  ) as Record<string, unknown>
}

describe('validateDatasetDocument', () => {
  it('rejects an unsupported content block with an addressable path', () => {
    const document = readReleaseDataset()
    const questions = document.questions as Array<Record<string, unknown>>
    const firstQuestion = questions[0]
    firstQuestion.prompt = [{ type: 'video', path: 'demo.mp4' }]

    expect(() => validateDatasetDocument(document)).toThrowError(
      new DatasetValidationError(
        'questions[0].prompt[0].type: очікується підтримуваний тип, отримано "video"',
      ),
    )
  })

  it('rejects a missing answer option', () => {
    const document = readReleaseDataset()
    const questions = document.questions as Array<Record<string, unknown>>
    const firstQuestion = questions[0]
    firstQuestion.options = (
      firstQuestion.options as Array<Record<string, unknown>>
    ).slice(0, 3)

    expect(() => validateDatasetDocument(document)).toThrow(
      'questions[0].options: очікується чотири варіанти',
    )
  })

  it('keeps generated content on the multi-exam schema v2', () => {
    const document = readReleaseDataset()
    const metadata = document.dataset as Record<string, unknown>
    metadata.origin = 'generated'

    expect(() => validateDatasetDocument(document)).toThrow(
      'dataset.origin: очікується official; generated content uses schema_version 2',
    )
  })
})
