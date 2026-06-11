import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearTaskDatasetCache, loadTaskDataset } from './loadTaskDataset'

function readFixture() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'fixtures', 'evi-schema-v2.json'),
      'utf8',
    ),
  ) as unknown
}

afterEach(() => {
  clearTaskDatasetCache()
  vi.unstubAllGlobals()
})

describe('loadTaskDataset', () => {
  it('loads, validates, adapts and caches a schema v2 dataset', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => readFixture(),
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await loadTaskDataset('evi-schema-v2-fixtures')
    const second = await loadTaskDataset('evi-schema-v2-fixtures')

    expect(first).toBe(second)
    expect(first.tasks).toHaveLength(3)
    expect(first.assessmentItemCount).toBe(11)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/content/fixtures/evi-schema-v2.json',
    )
  })
})
