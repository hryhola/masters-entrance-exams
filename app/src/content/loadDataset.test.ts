import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearDatasetCache, loadDataset, resolvePublicUrl } from './loadDataset'

function readReleaseDataset() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'yefvv-it-2024.json'),
      'utf8',
    ),
  ) as unknown
}

afterEach(() => {
  clearDatasetCache()
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
})
