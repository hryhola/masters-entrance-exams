import type {
  AnswerReviewStatus,
  ContentBlock,
  ContentBlockType,
  DatasetContentStats,
  DatasetSection,
  ExamDataset,
  Question,
  RawContentBlock,
  RawDatasetDocument,
} from './types'

const optionLabels: Record<string, string> = {
  a: 'A',
  b: 'Б',
  c: 'В',
  d: 'Г',
}

export function adaptBlock(block: RawContentBlock): ContentBlock {
  switch (block.type) {
    case 'markdown':
      return { type: 'markdown', text: block.text }
    case 'math':
      return {
        type: 'math',
        latex: block.latex,
        display: block.display,
        sourceImages: block.source_images,
      }
    case 'code':
      return {
        type: 'code',
        language: block.language,
        text: block.text,
        sourceImages: block.source_images,
      }
    case 'table':
      return {
        type: 'table',
        columns: block.columns,
        rows: block.rows,
        sourceImages: block.source_images,
      }
    case 'image':
      return {
        type: 'image',
        path: block.path,
        alt: block.alt,
        role: block.role,
        sourceImages: block.source_images,
      }
  }
}

export function adaptBlocks(blocks: RawContentBlock[]): ContentBlock[] {
  return blocks.map(adaptBlock)
}

function collectQuestionBlockTypes(question: Question): ContentBlockType[] {
  const blocks = [
    ...question.prompt,
    ...question.options.flatMap((option) => option.content),
  ]
  return [...new Set(blocks.map((block) => block.type))]
}

function adaptQuestion(
  raw: RawDatasetDocument['questions'][number],
  language: string,
): Question {
  const topic = raw.classification.primary_topic
    ? {
        code: raw.classification.primary_topic.code,
        sectionCode: raw.classification.primary_topic.section_code,
        section: raw.classification.primary_topic.section,
        topic: raw.classification.primary_topic.topic,
        expectedCognitiveLevel:
          raw.classification.primary_topic.expected_cognitive_level,
      }
    : null

  const question: Question = {
    id: raw.id,
    number: raw.number,
    language,
    type: raw.type,
    origin: 'official',
    prompt: adaptBlocks(raw.prompt),
    options: raw.options.map((option) => ({
      id: option.id,
      label: optionLabels[option.id] ?? option.id.toUpperCase(),
      content: adaptBlocks(option.content),
    })),
    correctOption: raw.answer.correct_option,
    explanation: {
      status: 'official',
      summary: adaptBlocks(raw.explanation.summary),
      optionFeedback: raw.explanation.option_feedback.map((feedback) => ({
        optionId: feedback.option_id,
        verdict: feedback.verdict,
        blocks: adaptBlocks(feedback.blocks),
      })),
      answerReview: {
        status: raw.explanation.answer_review.status,
        officialOption: raw.explanation.answer_review.official_option,
        note: raw.explanation.answer_review.note,
      },
    },
    classification: {
      alignment: raw.classification.alignment,
      topic,
      cognitiveLevel: raw.classification.cognitive_level,
      tags: raw.classification.tags,
      formatCompliance: raw.classification.format_compliance.status,
    },
    source: {
      pageStart: raw.source.page_start,
      pageEnd: raw.source.page_end,
      questionNumber: raw.source.question_number,
    },
    features: {
      blockTypes: [],
      hasComplexContent: false,
    },
  }

  question.features.blockTypes = collectQuestionBlockTypes(question)
  question.features.hasComplexContent = question.features.blockTypes.some(
    (type) => type !== 'markdown',
  )
  return question
}

function buildSections(questions: Question[]): DatasetSection[] {
  const sections = new Map<string, DatasetSection>()

  questions.forEach((question) => {
    const topic = question.classification.topic
    if (!topic) return
    const section = sections.get(topic.sectionCode)
    if (section) {
      section.questionCount += 1
    } else {
      sections.set(topic.sectionCode, {
        code: topic.sectionCode,
        title: topic.section,
        questionCount: 1,
      })
    }
  })

  return [...sections.values()].sort(
    (left, right) => Number(left.code) - Number(right.code),
  )
}

function countContent(questions: Question[]): DatasetContentStats {
  const stats: DatasetContentStats = {
    markdown: 0,
    math: 0,
    code: 0,
    table: 0,
    image: 0,
    unknown: 0,
  }

  questions.forEach((question) => {
    const blocks = [
      ...question.prompt,
      ...question.options.flatMap((option) => option.content),
      ...question.explanation.summary,
      ...question.explanation.optionFeedback.flatMap(
        (feedback) => feedback.blocks,
      ),
    ]
    blocks.forEach((block) => {
      stats[block.type] += 1
    })
  })
  return stats
}

function countAnswerReviews(
  questions: Question[],
): Record<AnswerReviewStatus, number> {
  return questions.reduce<Record<AnswerReviewStatus, number>>(
    (counts, question) => {
      counts[question.explanation.answerReview.status] += 1
      return counts
    },
    {
      verified: 0,
      verified_with_caveat: 0,
      disputed: 0,
    },
  )
}

export function adaptDataset(raw: RawDatasetDocument): ExamDataset {
  const questions = raw.questions.map((question) =>
    adaptQuestion(question, raw.dataset.language),
  )

  return {
    id: raw.dataset.id,
    title: raw.dataset.title,
    exam: raw.dataset.exam,
    subject: raw.dataset.subject,
    year: raw.dataset.year,
    language: raw.dataset.language,
    version: raw.release.version,
    status: raw.release.status,
    origin: 'official',
    questions,
    sections: buildSections(questions),
    contentStats: countContent(questions),
    answerReviewCounts: countAnswerReviews(questions),
  }
}
