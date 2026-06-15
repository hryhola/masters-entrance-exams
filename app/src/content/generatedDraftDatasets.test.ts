import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { adaptTaskDataset } from './adaptTaskDataset'
import { validateTaskDatasetDocument } from './validateTaskDataset'

const repositoryRoot = resolve(process.cwd(), '..')
const draftsDirectory = resolve(repositoryRoot, 'data', 'generated', 'drafts')
const draftFiles = readdirSync(draftsDirectory)
  .filter((file) => file.endsWith('.json'))
  .sort()

describe('generated draft datasets', () => {
  it('contains at least one generated draft', () => {
    expect(draftFiles.length).toBeGreaterThan(0)
  })

  it.each(draftFiles)('validates and adapts %s', (file) => {
    const raw = JSON.parse(
      readFileSync(resolve(draftsDirectory, file), 'utf8'),
    ) as unknown
    const document = validateTaskDatasetDocument(raw)
    const dataset = adaptTaskDataset(document)
    const generation = document.dataset.generation
    const verification = document.release.verification

    expect(dataset.origin).toBe('generated')
    expect(dataset.verification.method).toBe('agent_validation')
    expect(dataset.assessmentItemCount).toBeGreaterThan(0)
    expect(generation).toBeDefined()
    expect(verification).toBeDefined()
    expect(
      existsSync(resolve(repositoryRoot, generation!.research_report)),
    ).toBe(true)
    expect(existsSync(resolve(repositoryRoot, verification!.report))).toBe(true)
  })
})
