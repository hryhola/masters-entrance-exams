import type {
  ChoiceId,
  RawAssessmentItem,
  RawAssessmentTask,
  RawChoice,
  RawTaskDatasetDocument,
  StimulusType,
  TaskType,
} from './taskTypes'
import type { RawContentBlock } from './types'
import type { AutomatedValidationCheck, ContentOrigin } from './types'
import { DatasetValidationError } from './validateDataset'

const requiredAutomatedChecks: AutomatedValidationCheck[] = [
  'schema',
  'answer_integrity',
  'explanation_integrity',
  'duplicate_detection',
  'official_similarity',
]

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

function numberInRange(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  const parsed = number(value, path)
  return parsed >= minimum && parsed <= maximum
    ? parsed
    : fail(path, `число від ${minimum} до ${maximum}`)
}

function array(value: unknown, path: string): unknown[] {
  return Array.isArray(value) ? value : fail(path, 'масив')
}

function stringArray(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) =>
    string(item, `${path}[${index}]`),
  )
}

function isoDate(value: unknown, path: string): string {
  const parsed = string(value, path)
  return Number.isNaN(Date.parse(parsed))
    ? fail(path, 'дату й час у форматі ISO 8601')
    : parsed
}

function sha256(value: unknown, path: string): string {
  const parsed = string(value, path)
  return /^[a-f0-9]{64}$/.test(parsed)
    ? parsed
    : fail(path, 'SHA-256 у нижньому регістрі')
}

function validateGeneratedPublication(
  metadata: Record<string, unknown>,
  release: Record<string, unknown>,
): string {
  const generation = record(metadata.generation, 'dataset.generation')
  const batchId = string(generation.batch_id, 'dataset.generation.batch_id')
  string(generation.model, 'dataset.generation.model')
  const prompt = record(generation.prompt, 'dataset.generation.prompt')
  string(prompt.id, 'dataset.generation.prompt.id')
  string(prompt.version, 'dataset.generation.prompt.version')
  sha256(prompt.sha256, 'dataset.generation.prompt.sha256')
  isoDate(generation.generated_at, 'dataset.generation.generated_at')
  string(generation.generator_version, 'dataset.generation.generator_version')
  const parameters = record(
    generation.parameters,
    'dataset.generation.parameters',
  )
  string(parameters.topic, 'dataset.generation.parameters.topic')
  if (
    parameters.difficulty !== 'easy' &&
    parameters.difficulty !== 'medium' &&
    parameters.difficulty !== 'hard'
  ) {
    fail('dataset.generation.parameters.difficulty', 'easy, medium або hard')
  }
  string(parameters.task_type, 'dataset.generation.parameters.task_type')

  if (release.status !== 'ready_for_application') {
    fail(
      'release.status',
      'ready_for_application для згенерованого production dataset',
    )
  }
  const verification = record(release.verification, 'release.verification')
  if (verification.method !== 'automated_validation') {
    fail('release.verification.method', 'automated_validation')
  }
  if (verification.status !== 'passed') {
    fail('release.verification.status', 'passed')
  }
  string(
    verification.validator_version,
    'release.verification.validator_version',
  )
  isoDate(verification.validated_at, 'release.verification.validated_at')
  const checks = stringArray(verification.checks, 'release.verification.checks')
  const uniqueChecks = new Set(checks)
  for (const check of checks) {
    if (!requiredAutomatedChecks.includes(check as AutomatedValidationCheck)) {
      fail(
        'release.verification.checks',
        `підтримувані перевірки (${requiredAutomatedChecks.join(', ')})`,
      )
    }
  }
  for (const check of requiredAutomatedChecks) {
    if (!uniqueChecks.has(check)) {
      fail(
        'release.verification.checks',
        `усі обов'язкові перевірки (${requiredAutomatedChecks.join(', ')})`,
      )
    }
  }
  if (uniqueChecks.size !== checks.length) {
    fail('release.verification.checks', 'унікальні назви перевірок')
  }

  const similarity = record(
    verification.similarity,
    'release.verification.similarity',
  )
  const maximumScore = numberInRange(
    similarity.maximum_score,
    'release.verification.similarity.maximum_score',
    0,
    1,
  )
  const threshold = numberInRange(
    similarity.threshold,
    'release.verification.similarity.threshold',
    0,
    1,
  )
  if (maximumScore > threshold) {
    fail(
      'release.verification.similarity.maximum_score',
      'значення, що не перевищує threshold',
    )
  }

  return batchId
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
      if (
        block.role !== 'prompt' &&
        block.role !== 'option' &&
        block.role !== 'stimulus'
      ) {
        fail(`${path}.role`, 'prompt, option або stimulus')
      }
      stringArray(block.source_images, `${path}.source_images`)
      break
    default:
      fail(`${path}.type`, `підтримуваний тип, отримано "${type}"`)
  }

  return block as unknown as RawContentBlock
}

function validateContent(
  value: unknown,
  path: string,
  allowEmpty = false,
): RawContentBlock[] {
  const blocks = array(value, path)
  if (!allowEmpty && blocks.length === 0) {
    fail(path, 'непорожній масив блоків')
  }
  return blocks.map((block, index) => validateBlock(block, `${path}[${index}]`))
}

function validateChoices(value: unknown, path: string): RawChoice[] {
  const choices = array(value, path)
  if (choices.length < 2) fail(path, 'щонайменше два варіанти')

  const ids = new Set<ChoiceId>()
  return choices.map((value, index) => {
    const choice = record(value, `${path}[${index}]`)
    const id = string(choice.id, `${path}[${index}].id`)
    if (ids.has(id)) fail(`${path}[${index}].id`, 'унікальний id')
    ids.add(id)
    string(choice.label, `${path}[${index}].label`)
    validateContent(choice.content, `${path}[${index}].content`)
    return choice as unknown as RawChoice
  })
}

function validateResponse(
  value: unknown,
  path: string,
  choiceSetIds: Set<string>,
): { response: RawAssessmentItem['response']; choices: Set<ChoiceId> } {
  const response = record(value, path)

  if (response.type === 'matching_choice') {
    const choiceSetId = string(response.choice_set_id, `${path}.choice_set_id`)
    if (!choiceSetIds.has(choiceSetId)) {
      fail(`${path}.choice_set_id`, 'id наявного набору варіантів')
    }
    return {
      response: response as unknown as RawAssessmentItem['response'],
      choices: new Set(),
    }
  }

  if (response.type === 'single_choice') {
    const choices = validateChoices(response.options, `${path}.options`)
    return {
      response: response as unknown as RawAssessmentItem['response'],
      choices: new Set(choices.map((choice) => choice.id)),
    }
  }

  if (response.type === 'cloze_choice') {
    string(response.blank_id, `${path}.blank_id`)
    const choices = validateChoices(response.options, `${path}.options`)
    return {
      response: response as unknown as RawAssessmentItem['response'],
      choices: new Set(choices.map((choice) => choice.id)),
    }
  }

  return fail(`${path}.type`, 'single_choice, matching_choice або cloze_choice')
}

function validateTask(
  value: unknown,
  index: number,
  sectionCodes: Set<string>,
  stimulusIds: Set<string>,
  itemIds: Set<string>,
  origin: ContentOrigin,
  generationBatchId?: string,
): RawAssessmentTask {
  const path = `tasks[${index}]`
  const task = record(value, path)
  string(task.id, `${path}.id`)
  number(task.number, `${path}.number`)

  const type = task.type as TaskType
  if (
    type !== 'single_choice' &&
    type !== 'matching' &&
    type !== 'cloze' &&
    type !== 'question_group'
  ) {
    fail(`${path}.type`, 'відомий тип task')
  }
  string(task.language, `${path}.language`)

  const sectionCode = string(task.section_code, `${path}.section_code`)
  if (!sectionCodes.has(sectionCode)) {
    fail(`${path}.section_code`, 'код наявної секції')
  }
  validateContent(task.instruction, `${path}.instruction`)

  const taskStimulusIds = stringArray(task.stimulus_ids, `${path}.stimulus_ids`)
  taskStimulusIds.forEach((stimulusId, stimulusIndex) => {
    if (!stimulusIds.has(stimulusId)) {
      fail(`${path}.stimulus_ids[${stimulusIndex}]`, 'id наявного stimulus')
    }
  })

  const choiceSets = array(task.choice_sets, `${path}.choice_sets`)
  if (type === 'matching' && choiceSets.length !== 1) {
    fail(`${path}.choice_sets`, 'один спільний набір для matching task')
  }
  if (type !== 'matching' && choiceSets.length !== 0) {
    fail(`${path}.choice_sets`, 'порожній масив для цього типу task')
  }
  const choiceSetIds = new Set<string>()
  const choiceIdsBySet = new Map<string, Set<ChoiceId>>()
  const uniqueAnswersBySet = new Map<string, Set<ChoiceId>>()
  choiceSets.forEach((value, choiceSetIndex) => {
    const choiceSetPath = `${path}.choice_sets[${choiceSetIndex}]`
    const choiceSet = record(value, choiceSetPath)
    const id = string(choiceSet.id, `${choiceSetPath}.id`)
    if (choiceSetIds.has(id)) fail(`${choiceSetPath}.id`, 'унікальний id')
    choiceSetIds.add(id)
    if (typeof choiceSet.unique !== 'boolean') {
      fail(`${choiceSetPath}.unique`, 'boolean')
    }
    const choices = validateChoices(
      choiceSet.choices,
      `${choiceSetPath}.choices`,
    )
    choiceIdsBySet.set(id, new Set(choices.map((choice) => choice.id)))
    if (choiceSet.unique) uniqueAnswersBySet.set(id, new Set())
  })

  const items = array(task.items, `${path}.items`)
  if (items.length === 0) fail(`${path}.items`, 'непорожній масив')
  items.forEach((value, itemIndex) => {
    const itemPath = `${path}.items[${itemIndex}]`
    const item = record(value, itemPath)
    const itemId = string(item.id, `${itemPath}.id`)
    if (itemIds.has(itemId)) fail(`${itemPath}.id`, 'глобально унікальний id')
    itemIds.add(itemId)
    number(item.number, `${itemPath}.number`)
    string(item.display_label, `${itemPath}.display_label`)
    validateContent(item.prompt, `${itemPath}.prompt`)

    const itemStimulusIds = stringArray(
      item.stimulus_ids,
      `${itemPath}.stimulus_ids`,
    )
    itemStimulusIds.forEach((stimulusId, stimulusIndex) => {
      if (!stimulusIds.has(stimulusId)) {
        fail(
          `${itemPath}.stimulus_ids[${stimulusIndex}]`,
          'id наявного stimulus',
        )
      }
    })

    const { response, choices } = validateResponse(
      item.response,
      `${itemPath}.response`,
      choiceSetIds,
    )
    if (type === 'matching' && response.type !== 'matching_choice') {
      fail(`${itemPath}.response.type`, 'matching_choice')
    }
    if (type === 'cloze' && response.type !== 'cloze_choice') {
      fail(`${itemPath}.response.type`, 'cloze_choice')
    }
    if (
      (type === 'single_choice' || type === 'question_group') &&
      response.type !== 'single_choice'
    ) {
      fail(`${itemPath}.response.type`, 'single_choice')
    }
    const answer = record(item.answer, `${itemPath}.answer`)
    const correctChoice = string(
      answer.correct_choice,
      `${itemPath}.answer.correct_choice`,
    )
    const expectedAnswerSource =
      origin === 'generated' ? 'generated_key' : 'official_key'
    if (answer.source !== expectedAnswerSource) {
      fail(`${itemPath}.answer.source`, expectedAnswerSource)
    }

    if (response.type === 'matching_choice') {
      const availableChoices = choiceIdsBySet.get(response.choice_set_id)
      if (!availableChoices?.has(correctChoice)) {
        fail(
          `${itemPath}.answer.correct_choice`,
          'id варіанта з указаного choice_set',
        )
      }
      const usedAnswers = uniqueAnswersBySet.get(response.choice_set_id)
      if (usedAnswers?.has(correctChoice)) {
        fail(
          `${itemPath}.answer.correct_choice`,
          'унікальну відповідь для choice_set',
        )
      }
      usedAnswers?.add(correctChoice)
    } else if (!choices.has(correctChoice)) {
      fail(
        `${itemPath}.answer.correct_choice`,
        'id одного з варіантів відповіді',
      )
    }

    const explanation = record(item.explanation, `${itemPath}.explanation`)
    if (
      explanation.status !== 'official' &&
      explanation.status !== 'editorial_pending' &&
      explanation.status !== 'generated'
    ) {
      fail(
        `${itemPath}.explanation.status`,
        'official, editorial_pending або generated',
      )
    }
    if (origin === 'generated' && explanation.status !== 'generated') {
      fail(`${itemPath}.explanation.status`, 'generated')
    }
    if (origin === 'official' && explanation.status === 'generated') {
      fail(`${itemPath}.explanation.status`, 'official або editorial_pending')
    }
    validateContent(
      explanation.summary,
      `${itemPath}.explanation.summary`,
      explanation.status === 'editorial_pending',
    )

    const source = record(item.source, `${itemPath}.source`)
    if (origin === 'generated') {
      const sourceBatchId = string(
        source.generation_batch_id,
        `${itemPath}.source.generation_batch_id`,
      )
      if (sourceBatchId !== generationBatchId) {
        fail(
          `${itemPath}.source.generation_batch_id`,
          'batch_id поточного dataset',
        )
      }
    } else {
      const pageStart = number(
        source.page_start,
        `${itemPath}.source.page_start`,
      )
      const pageEnd = number(source.page_end, `${itemPath}.source.page_end`)
      if (pageEnd < pageStart) {
        fail(`${itemPath}.source.page_end`, 'сторінку не раніше page_start')
      }
    }
  })

  return task as unknown as RawAssessmentTask
}

export function validateTaskDatasetDocument(
  value: unknown,
): RawTaskDatasetDocument {
  const document = record(value, 'dataset')
  if (document.schema_version !== 2) fail('schema_version', '2')

  const metadata = record(document.dataset, 'dataset')
  string(metadata.id, 'dataset.id')
  string(metadata.title, 'dataset.title')
  string(metadata.exam, 'dataset.exam')
  string(metadata.subject, 'dataset.subject')
  number(metadata.year, 'dataset.year')
  stringArray(metadata.languages, 'dataset.languages')
  if (metadata.status !== 'fixture' && metadata.status !== 'ready') {
    fail('dataset.status', 'fixture або ready')
  }
  const origin = (metadata.origin ?? 'official') as ContentOrigin
  if (origin !== 'official' && origin !== 'generated') {
    fail('dataset.origin', 'official або generated')
  }

  const sections = array(document.sections, 'sections')
  const sectionCodes = new Set<string>()
  sections.forEach((value, index) => {
    const section = record(value, `sections[${index}]`)
    const code = string(section.code, `sections[${index}].code`)
    if (sectionCodes.has(code)) {
      fail(`sections[${index}].code`, 'унікальний код')
    }
    sectionCodes.add(code)
    string(section.title, `sections[${index}].title`)
  })

  const stimuli = array(document.stimuli, 'stimuli')
  const stimulusIds = new Set<string>()
  stimuli.forEach((value, index) => {
    const path = `stimuli[${index}]`
    const stimulus = record(value, path)
    const id = string(stimulus.id, `${path}.id`)
    if (stimulusIds.has(id)) fail(`${path}.id`, 'унікальний id')
    stimulusIds.add(id)

    const type = stimulus.type as StimulusType
    if (
      type !== 'text' &&
      type !== 'paired_text' &&
      type !== 'cloze_text' &&
      type !== 'scenario' &&
      type !== 'chart'
    ) {
      fail(`${path}.type`, 'відомий тип stimulus')
    }
    if (stimulus.title !== undefined) string(stimulus.title, `${path}.title`)
    string(stimulus.language, `${path}.language`)
    validateContent(stimulus.content, `${path}.content`)
  })

  const release = record(document.release, 'release')
  if (
    release.status !== 'fixture' &&
    release.status !== 'ready_for_application'
  ) {
    fail('release.status', 'fixture або ready_for_application')
  }
  string(release.version, 'release.version')

  let generationBatchId: string | undefined
  if (origin === 'generated') {
    generationBatchId = validateGeneratedPublication(metadata, release)
  } else {
    if (metadata.generation !== undefined) {
      fail('dataset.generation', 'відсутнє для official dataset')
    }
    if (release.verification !== undefined) {
      fail('release.verification', 'відсутнє для official dataset')
    }
  }

  const tasks = array(document.tasks, 'tasks')
  const taskIds = new Set<string>()
  const itemIds = new Set<string>()
  tasks.forEach((value, index) => {
    const task = validateTask(
      value,
      index,
      sectionCodes,
      stimulusIds,
      itemIds,
      origin,
      generationBatchId,
    )
    if (taskIds.has(task.id)) fail(`tasks[${index}].id`, 'унікальний id')
    taskIds.add(task.id)
  })

  const expectedTaskCount = number(metadata.task_count, 'dataset.task_count')
  const expectedItemCount = number(
    metadata.assessment_item_count,
    'dataset.assessment_item_count',
  )
  const expectedStimulusCount = number(
    metadata.stimulus_count,
    'dataset.stimulus_count',
  )
  if (tasks.length !== expectedTaskCount) {
    fail('tasks', `${expectedTaskCount} tasks`)
  }
  if (itemIds.size !== expectedItemCount) {
    fail('tasks', `${expectedItemCount} оцінюваних елементів`)
  }
  if (stimuli.length !== expectedStimulusCount) {
    fail('stimuli', `${expectedStimulusCount} stimuli`)
  }

  return document as unknown as RawTaskDatasetDocument
}
