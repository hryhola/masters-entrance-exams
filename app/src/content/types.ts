export type QuestionType = 'single_choice'
export type OptionId = string
export type ContentBlockType =
  | 'markdown'
  | 'math'
  | 'code'
  | 'table'
  | 'image'
  | 'unknown'

export interface MarkdownBlock {
  type: 'markdown'
  text: string
}

export interface MathBlock {
  type: 'math'
  latex: string
  display: 'inline' | 'block'
  sourceImages: string[]
}

export interface CodeBlock {
  type: 'code'
  language: 'cpp' | 'sql' | 'text'
  text: string
  sourceImages: string[]
}

export interface TableBlock {
  type: 'table'
  columns: string[]
  rows: string[][]
  sourceImages: string[]
}

export interface ImageBlock {
  type: 'image'
  path: string
  alt: string
  role: 'prompt' | 'option' | 'stimulus'
  sourceImages: string[]
}

export interface UnknownBlock {
  type: 'unknown'
  rawType: string
}

export type ContentBlock =
  | MarkdownBlock
  | MathBlock
  | CodeBlock
  | TableBlock
  | ImageBlock
  | UnknownBlock

export interface QuestionOption {
  id: OptionId
  label: string
  content: ContentBlock[]
}

export interface OptionFeedback {
  optionId: OptionId
  verdict: 'correct' | 'incorrect'
  blocks: ContentBlock[]
}

export type AnswerReviewStatus =
  | 'verified'
  | 'verified_with_caveat'
  | 'disputed'

export type ProgramAlignment = 'aligned' | 'partial' | 'legacy' | 'unmapped'

export interface QuestionTopic {
  code: string
  sectionCode: string
  section: string
  topic: string
  expectedCognitiveLevel: string
}

export interface Question {
  id: string
  number: number
  displayLabel?: string
  language?: string
  type: QuestionType
  origin: 'official'
  answerConstraint?: {
    groupId: string
    unique: boolean
  }
  prompt: ContentBlock[]
  options: QuestionOption[]
  correctOption: OptionId
  explanation: {
    status?: 'official' | 'editorial_pending'
    summary: ContentBlock[]
    optionFeedback: OptionFeedback[]
    answerReview: {
      status: AnswerReviewStatus
      officialOption: OptionId
      note: string
    }
  }
  classification: {
    alignment: ProgramAlignment
    topic: QuestionTopic | null
    cognitiveLevel: string
    tags: string[]
    formatCompliance: 'compliant' | 'non_compliant'
  }
  source: {
    pageStart: number
    pageEnd: number
    questionNumber: number
  }
  features: {
    blockTypes: ContentBlockType[]
    hasComplexContent: boolean
  }
}

export interface DatasetSection {
  code: string
  title: string
  questionCount: number
}

export interface DatasetContentStats {
  markdown: number
  math: number
  code: number
  table: number
  image: number
  unknown: number
}

export interface ExamDataset {
  id: string
  title: string
  exam: string
  subject: string
  year: number
  language: string
  version: string
  status: 'ready_for_application'
  origin: 'official'
  questions: Question[]
  sections: DatasetSection[]
  contentStats: DatasetContentStats
  answerReviewCounts: Record<AnswerReviewStatus, number>
}

export interface RawMarkdownBlock {
  type: 'markdown'
  text: string
}

export interface RawMathBlock {
  type: 'math'
  latex: string
  display: 'inline' | 'block'
  source_images: string[]
}

export interface RawCodeBlock {
  type: 'code'
  language: 'cpp' | 'sql' | 'text'
  text: string
  source_images: string[]
}

export interface RawTableBlock {
  type: 'table'
  columns: string[]
  rows: string[][]
  source_images: string[]
}

export interface RawImageBlock {
  type: 'image'
  path: string
  alt: string
  role: 'prompt' | 'option' | 'stimulus'
  source_images: string[]
}

export type RawContentBlock =
  | RawMarkdownBlock
  | RawMathBlock
  | RawCodeBlock
  | RawTableBlock
  | RawImageBlock

export interface RawQuestion {
  id: string
  number: number
  type: QuestionType
  prompt: RawContentBlock[]
  options: Array<{
    id: OptionId
    content: RawContentBlock[]
  }>
  answer: {
    correct_option: OptionId
    source: 'official_marker'
  }
  explanation: {
    status: 'completed'
    summary: RawContentBlock[]
    option_feedback: Array<{
      option_id: OptionId
      verdict: 'correct' | 'incorrect'
      blocks: RawContentBlock[]
    }>
    answer_review: {
      status: AnswerReviewStatus
      official_option: OptionId
      note: string
    }
  }
  classification: {
    status: 'classified'
    alignment: ProgramAlignment
    primary_topic?: {
      code: string
      section_code: string
      section: string
      topic: string
      expected_cognitive_level: string
    }
    cognitive_level: string
    tags: string[]
    format_compliance: {
      status: 'compliant' | 'non_compliant'
    }
  }
  source: {
    page_start: number
    page_end: number
    question_number: number
  }
}

export interface RawDatasetDocument {
  schema_version: 1
  dataset: {
    id: string
    title: string
    exam: string
    subject: string
    year: number
    language: string
    status: 'ready'
    question_count: number
  }
  questions: RawQuestion[]
  release: {
    status: 'ready_for_application'
    version: string
  }
}
