import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { adaptTaskDataset } from './adaptTaskDataset'
import { TaskRenderer } from './TaskRenderer'
import { validateTaskDatasetDocument } from './validateTaskDataset'

function readDataset() {
  const raw = JSON.parse(
    readFileSync(
      resolve(process.cwd(), '..', 'data', 'fixtures', 'evi-schema-v2.json'),
      'utf8',
    ),
  ) as unknown
  return adaptTaskDataset(validateTaskDatasetDocument(raw))
}

describe('TaskRenderer', () => {
  it('renders matching and prevents reusing a unique choice', async () => {
    const user = userEvent.setup()
    const dataset = readDataset()
    const task = dataset.tasks[0]
    const onAnswer = vi.fn()

    const { rerender } = render(
      <TaskRenderer
        answers={{}}
        onAnswer={onAnswer}
        stimuli={dataset.stimuli}
        task={task}
      />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Відповідь для 1' }),
      'f',
    )
    expect(onAnswer).toHaveBeenCalledWith('yevi-en-2023-001', 'f')

    rerender(
      <TaskRenderer
        answers={{ 'yevi-en-2023-001': 'f' }}
        onAnswer={onAnswer}
        stimuli={dataset.stimuli}
        task={task}
      />,
    )

    expect(
      screen
        .getByRole('combobox', { name: 'Відповідь для 2' })
        .querySelector('option[value="f"]'),
    ).toBeDisabled()
  })

  it('renders cloze items as separate answers', async () => {
    const user = userEvent.setup()
    const dataset = readDataset()
    const task = dataset.tasks[1]
    const onAnswer = vi.fn()

    render(
      <TaskRenderer
        answers={{}}
        onAnswer={onAnswer}
        stimuli={dataset.stimuli}
        task={task}
      />,
    )

    await user.click(screen.getByRole('button', { name: /мінливим/ }))
    expect(onAnswer).toHaveBeenCalledWith('tznk-2024-002', 'b')
    expect(screen.getByText('Пропуск (3)')).toBeInTheDocument()
  })

  it('renders shared chart stimuli once for a question group', () => {
    const dataset = readDataset()
    const task = dataset.tasks[2]

    render(
      <TaskRenderer
        answers={{}}
        onAnswer={vi.fn()}
        stimuli={dataset.stimuli}
        task={task}
      />,
    )

    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(
      screen.getByText(/Який прибуток отримало підприємство С/),
    ).toBeInTheDocument()
  })
})
