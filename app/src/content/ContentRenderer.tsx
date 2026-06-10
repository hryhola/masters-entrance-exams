import katex from 'katex'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { resolveContentAsset } from './loadDataset'
import type {
  CodeBlock,
  ContentBlock,
  ImageBlock,
  MathBlock,
  TableBlock,
} from './types'
import 'katex/dist/katex.min.css'
import './content.css'

interface ContentRendererProps {
  blocks: ContentBlock[]
  compact?: boolean
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="content-block content-block--markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

function MathContent({ block }: { block: MathBlock }) {
  const html = katex.renderToString(block.latex, {
    displayMode: block.display === 'block',
    output: 'htmlAndMathml',
    strict: 'warn',
    throwOnError: false,
  })

  return (
    <div
      className={`content-block content-block--math content-block--math-${block.display}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function CodeContent({ block }: { block: CodeBlock }) {
  return (
    <figure className="content-block content-block--code">
      <figcaption>{block.language}</figcaption>
      <pre>
        <code>{block.text}</code>
      </pre>
    </figure>
  )
}

function TableContent({ block }: { block: TableBlock }) {
  return (
    <div className="content-block content-block--table" role="region">
      <table>
        <thead>
          <tr>
            {block.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={row.join(`-${rowIndex}-`)}>
              {row.map((cell, cellIndex) => (
                <td key={`${cellIndex}-${cell}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ImageContent({
  block,
  compact,
}: {
  block: ImageBlock
  compact: boolean
}) {
  return (
    <figure
      className={`content-block content-block--image ${
        compact ? 'content-block--image-compact' : ''
      }`}
    >
      <img
        alt={block.alt}
        loading="lazy"
        src={resolveContentAsset(block.path)}
      />
      <figcaption>{block.alt}</figcaption>
    </figure>
  )
}

function renderBlock(block: ContentBlock, index: number, compact: boolean) {
  switch (block.type) {
    case 'markdown':
      return <MarkdownContent key={index} text={block.text} />
    case 'math':
      return <MathContent block={block} key={index} />
    case 'code':
      return <CodeContent block={block} key={index} />
    case 'table':
      return <TableContent block={block} key={index} />
    case 'image':
      return <ImageContent block={block} compact={compact} key={index} />
    case 'unknown':
      return (
        <div className="content-block content-block--unknown" key={index}>
          Непідтримуваний тип контенту: <code>{block.rawType}</code>
        </div>
      )
  }
}

export function ContentRenderer({
  blocks,
  compact = false,
}: ContentRendererProps) {
  const hasInlineMath = blocks.some(
    (block) => block.type === 'math' && block.display === 'inline',
  )

  return (
    <div
      className={`content-sequence ${
        hasInlineMath ? 'content-sequence--inline' : ''
      } ${compact ? 'content-sequence--compact' : ''}`}
    >
      {blocks.map((block, index) => renderBlock(block, index, compact))}
    </div>
  )
}
