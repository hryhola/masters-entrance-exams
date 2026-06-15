export type QuestionType = 'single_choice'
export type OptionId = string
export type ContentOrigin = 'official' | 'generated'
export type GeneratedDifficulty = 'easy' | 'medium' | 'hard'
export type AutomatedValidationCheck =
  | 'schema'
  | 'answer_integrity'
  | 'explanation_integrity'
  | 'duplicate_detection'
  | 'official_similarity'
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

export interface GenerationProvenance {
  batchId: string
  model: string
  prompt: {
    id: string
    version: string
    sha256: string
  }
  generatedAt: string
  generatorVersion: string
  parameters: {
    topic: string
    difficulty: GeneratedDifficulty
    taskType: string
  }
}

export type ContentVerification =
  | {
      method: 'official_source'
    }
  | {
      method: 'automated_validation'
      status: 'passed'
      validatorVersion: string
      validatedAt: string
      checks: AutomatedValidationCheck[]
      similarity: {
        maximumScore: number
        threshold: number
      }
    }

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
  origin: ContentOrigin
  verification: ContentVerification
  answerConstraint?: {
    groupId: string
    unique: boolean
  }
  prompt: ContentBlock[]
  options: QuestionOption[]
  correctOption: OptionId
  explanation: {
    status?: 'official' | 'editorial_pending' | 'generated'
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
  source:
    | {
        type: 'official_pdf'
        pageStart: number
        pageEnd: number
        questionNumber: number
      }
    | {
        type: 'generated'
        batchId: string
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
  origin: ContentOrigin
  verification: ContentVerification
  generation?: GenerationProvenance
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
    origin?: 'official'
  }
  questions: RawQuestion[]
  release: {
    status: 'ready_for_application'
    version: string
  }
}
