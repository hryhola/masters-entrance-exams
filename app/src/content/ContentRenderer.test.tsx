import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContentRenderer } from './ContentRenderer'

describe('ContentRenderer', () => {
  it('renders markdown and inline math as one content sequence', () => {
    const { container } = render(
      <ContentRenderer
        blocks={[
          { type: 'markdown', text: 'Границя' },
          {
            type: 'math',
            latex: '\\frac{1}{n}',
            display: 'inline',
            sourceImages: [],
          },
          { type: 'markdown', text: 'дорівнює нулю.' },
        ]}
      />,
    )

    expect(screen.getByText('Границя')).toBeInTheDocument()
    expect(container.querySelector('.katex')).toBeInTheDocument()
    expect(container.querySelector('.content-sequence--inline')).toBeTruthy()
  })

  it('renders code, table and image blocks accessibly', () => {
    render(
      <ContentRenderer
        blocks={[
          {
            type: 'code',
            language: 'sql',
            text: 'SELECT 1;',
            sourceImages: [],
          },
          {
            type: 'table',
            columns: ['ID', 'Рейтинг'],
            rows: [['1', '90']],
            sourceImages: [],
          },
          {
            type: 'image',
            path: 'assets/yefvv-it-2024/q140/prompt.png',
            alt: 'Граф для обходу DFS',
            role: 'prompt',
            sourceImages: [],
          },
        ]}
      />,
    )

    expect(screen.getByText('SELECT 1;')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Граф для обходу DFS' }),
    ).toHaveAttribute('src', '/content/assets/yefvv-it-2024/q140/prompt.png')
  })

  it('shows a diagnostic placeholder for an unknown future block', () => {
    render(<ContentRenderer blocks={[{ type: 'unknown', rawType: 'audio' }]} />)

    expect(screen.getByText(/Непідтримуваний тип контенту/)).toBeInTheDocument()
  })
})
