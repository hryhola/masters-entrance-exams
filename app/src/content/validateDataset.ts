import type {
  OptionId,
  RawContentBlock,
  RawDatasetDocument,
  RawQuestion,
} from './types'

export class DatasetValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatasetValidationError'
  }
}

function fail(path: string, expectation: string): never {
  throw new DatasetValidationError(`${path}: очікується ${expectation}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown, path: string): Record<string, unknown> {
  return isRecord(value) ? value : fail(path, 'об’єкт')
}

function string(value: unknown, path: string): string {
  return typeof value === 'string' && value.length > 0
    ? value
    : fail(path, 'непорожній рядок')
}

function number(value: unknown, path: string): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fail(path, 'число')
}

function array(value: unknown, path: string): unknown[] {
  return Array.isArray(value) ? value : fail(path, 'масив')
}

function optionId(value: unknown, path: string): OptionId {
  return value === 'a' || value === 'b' || value === 'c' || value === 'd'
    ? value
    : fail(path, 'ідентифікатор a, b, c або d')
}

function stringArray(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) =>
    string(item, `${path}[${index}]`),
  )
}

function validateBlock(value: unknown, path: string): RawContentBlock {
  const block = record(value, path)
  const type = string(block.type, `${path}.type`)

  switch (type) {
    case 'markdown':
      string(block.text, `${path}.text`)
      break
    case 'math':
      string(block.latex, `${path}.latex`)
      if (block.display !== 'inline' && block.display !== 'block') {
        fail(`${path}.display`, 'inline або block')
      }
      stringArray(block.source_images, `${path}.source_images`)
      break
    case 'code':
      string(block.text, `${path}.text`)
      if (
        block.language !== 'cpp' &&
        block.language !== 'sql' &&
        block.language !== 'text'
      ) {
        fail(`${path}.language`, 'cpp, sql або text')
      }
      stringArray(block.source_images, `${path}.source_images`)
      break
    case 'table': {
      const columns = stringArray(block.columns, `${path}.columns`)
      const rows = array(block.rows, `${path}.rows`)
      rows.forEach((row, rowIndex) => {
        const cells = stringArray(row, `${path}.rows[${rowIndex}]`)
        if (cells.length !== columns.length) {
          fail(`${path}.rows[${rowIndex}]`, `${columns.length} комірки`)
        }
      })
      stringArray(block.source_images, `${path}.source_images`)
      break
    }
    case 'image':
      string(block.path, `${path}.path`)
      string(block.alt, `${path}.alt`)
      if (block.role !== 'prompt' && block.role !== 'option') {
        fail(`${path}.role`, 'prompt або option')
      }
      stringArray(block.source_images, `${path}.source_images`)
      break
    default:
      fail(`${path}.type`, `підтримуваний тип, отримано "${type}"`)
  }

  return block as unknown as RawContentBlock
}

function validateContent(value: unknown, path: string): RawContentBlock[] {
  const blocks = array(value, path)
  if (blocks.length === 0) fail(path, 'непорожній масив блоків')
  return blocks.map((block, index) => validateBlock(block, `${path}[${index}]`))
}

function validateQuestion(value: unknown, index: number): RawQuestion {
  const path = `questions[${index}]`
  const question = record(value, path)
  string(question.id, `${path}.id`)
  number(question.number, `${path}.number`)
  if (question.type !== 'single_choice') {
    fail(`${path}.type`, 'single_choice')
  }
  validateContent(question.prompt, `${path}.prompt`)

  const options = array(question.options, `${path}.options`)
  if (options.length !== 4) fail(`${path}.options`, 'чотири варіанти')
  const optionIds = new Set<OptionId>()
  options.forEach((value, optionIndex) => {
    const option = record(value, `${path}.options[${optionIndex}]`)
    optionIds.add(optionId(option.id, `${path}.options[${optionIndex}].id`))
    validateContent(option.content, `${path}.options[${optionIndex}].content`)
  })
  if (optionIds.size !== 4) fail(`${path}.options`, 'унікальні a, b, c, d')

  const answer = record(question.answer, `${path}.answer`)
  optionId(answer.correct_option, `${path}.answer.correct_option`)

  const explanation = record(question.explanation, `${path}.explanation`)
  if (explanation.status !== 'completed') {
    fail(`${path}.explanation.status`, 'completed')
  }
  validateContent(explanation.summary, `${path}.explanation.summary`)
  const feedback = array(
    explanation.option_feedback,
    `${path}.explanation.option_feedback`,
  )
  if (feedback.length !== 4) {
    fail(`${path}.explanation.option_feedback`, 'чотири записи')
  }
  feedback.forEach((value, feedbackIndex) => {
    const item = record(
      value,
      `${path}.explanation.option_feedback[${feedbackIndex}]`,
    )
    optionId(
      item.option_id,
      `${path}.explanation.option_feedback[${feedbackIndex}].option_id`,
    )
    validateContent(
      item.blocks,
      `${path}.explanation.option_feedback[${feedbackIndex}].blocks`,
    )
  })
  const answerReview = record(
    explanation.answer_review,
    `${path}.explanation.answer_review`,
  )
  if (
    answerReview.status !== 'verified' &&
    answerReview.status !== 'verified_with_caveat' &&
    answerReview.status !== 'disputed'
  ) {
    fail(`${path}.explanation.answer_review.status`, 'відомий статус')
  }
  optionId(
    answerReview.official_option,
    `${path}.explanation.answer_review.official_option`,
  )
  string(answerReview.note, `${path}.explanation.answer_review.note`)

  const classification = record(
    question.classification,
    `${path}.classification`,
  )
  if (classification.status !== 'classified') {
    fail(`${path}.classification.status`, 'classified')
  }
  if (
    classification.alignment !== 'aligned' &&
    classification.alignment !== 'partial' &&
    classification.alignment !== 'legacy' &&
    classification.alignment !== 'unmapped'
  ) {
    fail(`${path}.classification.alignment`, 'відомий alignment')
  }
  string(
    classification.cognitive_level,
    `${path}.classification.cognitive_level`,
  )
  stringArray(classification.tags, `${path}.classification.tags`)

  const source = record(question.source, `${path}.source`)
  number(source.page_start, `${path}.source.page_start`)
  number(source.page_end, `${path}.source.page_end`)
  number(source.question_number, `${path}.source.question_number`)

  return question as unknown as RawQuestion
}

export function validateDatasetDocument(value: unknown): RawDatasetDocument {
  const document = record(value, 'dataset')
  if (document.schema_version !== 1) fail('schema_version', '1')

  const metadata = record(document.dataset, 'dataset')
  string(metadata.id, 'dataset.id')
  string(metadata.title, 'dataset.title')
  string(metadata.exam, 'dataset.exam')
  string(metadata.subject, 'dataset.subject')
  number(metadata.year, 'dataset.year')
  string(metadata.language, 'dataset.language')
  if (metadata.status !== 'ready') fail('dataset.status', 'ready')

  const questions = array(document.questions, 'questions')
  const expectedCount = number(
    metadata.question_count,
    'dataset.question_count',
  )
  if (questions.length !== expectedCount) {
    fail('questions', `${expectedCount} питань`)
  }

  const ids = new Set<string>()
  const numbers = new Set<number>()
  questions.forEach((question, index) => {
    const validated = validateQuestion(question, index)
    if (ids.has(validated.id)) fail(`questions[${index}].id`, 'унікальний id')
    if (numbers.has(validated.number)) {
      fail(`questions[${index}].number`, 'унікальний номер')
    }
    ids.add(validated.id)
    numbers.add(validated.number)
  })

  const release = record(document.release, 'release')
  if (release.status !== 'ready_for_application') {
    fail('release.status', 'ready_for_application')
  }
  string(release.version, 'release.version')

  return document as unknown as RawDatasetDocument
}
