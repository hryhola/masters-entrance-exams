import type {
  ContentBlock,
  ContentOrigin,
  ContentVerification,
  GenerationProvenance,
  RawContentBlock,
} from './types'

export type ChoiceId = string
export type TaskType = 'single_choice' | 'matching' | 'cloze' | 'question_group'
export type StimulusType =
  | 'text'
  | 'paired_text'
  | 'cloze_text'
  | 'scenario'
  | 'chart'

export interface Choice {
  id: ChoiceId
  label: string
  content: ContentBlock[]
}

export interface ChoiceSet {
  id: string
  unique: boolean
  choices: Choice[]
}

export interface Stimulus {
  id: string
  type: StimulusType
  title: string | null
  language: string
  content: ContentBlock[]
}

export type AssessmentResponse =
  | {
      type: 'single_choice'
      options: Choice[]
    }
  | {
      type: 'matching_choice'
      choiceSetId: string
    }
  | {
      type: 'cloze_choice'
      blankId: string
      options: Choice[]
    }

export interface AssessmentItem {
  id: string
  number: number
  displayLabel: string
  prompt: ContentBlock[]
  stimulusIds: string[]
  response: AssessmentResponse
  correctChoice: ChoiceId
  explanation: {
    status: 'official' | 'editorial_pending' | 'generated'
    summary: ContentBlock[]
  }
  source:
    | {
        type: 'official_pdf'
        pageStart: number
        pageEnd: number
      }
    | {
        type: 'generated'
        batchId: string
      }
}

export interface AssessmentTask {
  id: string
  number: number
  type: TaskType
  language: string
  sectionCode: string
  instruction: ContentBlock[]
  stimulusIds: string[]
  choiceSets: ChoiceSet[]
  items: AssessmentItem[]
}

export interface TaskDatasetSection {
  code: string
  title: string
  taskCount: number
  assessmentItemCount: number
}

export interface TaskDataset {
  schemaVersion: 2
  id: string
  title: string
  exam: string
  subject: string
  year: number
  languages: string[]
  version: string
  status: 'fixture' | 'ready_for_application'
  origin: ContentOrigin
  verification: ContentVerification
  generation?: GenerationProvenance
  sections: TaskDatasetSection[]
  stimuli: Stimulus[]
  tasks: AssessmentTask[]
  assessmentItemCount: number
}

export interface RawChoice {
  id: ChoiceId
  label: string
  content: RawContentBlock[]
}

export interface RawChoiceSet {
  id: string
  unique: boolean
  choices: RawChoice[]
}

export interface RawStimulus {
  id: string
  type: StimulusType
  title?: string
  language: string
  content: RawContentBlock[]
}

export type RawAssessmentResponse =
  | {
      type: 'single_choice'
      options: RawChoice[]
    }
  | {
      type: 'matching_choice'
      choice_set_id: string
    }
  | {
      type: 'cloze_choice'
      blank_id: string
      options: RawChoice[]
    }

export interface RawAssessmentItem {
  id: string
  number: number
  display_label: string
  prompt: RawContentBlock[]
  stimulus_ids: string[]
  response: RawAssessmentResponse
  answer: {
    correct_choice: ChoiceId
    source: 'official_key' | 'generated_key'
  }
  explanation: {
    status: 'official' | 'editorial_pending' | 'generated'
    summary: RawContentBlock[]
  }
  source:
    | {
        page_start: number
        page_end: number
      }
    | {
        generation_batch_id: string
      }
}

export interface RawAssessmentTask {
  id: string
  number: number
  type: TaskType
  language: string
  section_code: string
  instruction: RawContentBlock[]
  stimulus_ids: string[]
  choice_sets: RawChoiceSet[]
  items: RawAssessmentItem[]
}

export interface RawTaskDatasetDocument {
  schema_version: 2
  dataset: {
    id: string
    title: string
    exam: string
    subject: string
    year: number
    languages: string[]
    status: 'fixture' | 'ready'
    origin?: ContentOrigin
    generation?: {
      batch_id: string
      model: string
      prompt: {
        id: string
        version: string
        sha256: string
      }
      generated_at: string
      generator_version: string
      parameters: {
        topic: string
        difficulty: 'easy' | 'medium' | 'hard'
        task_type: string
      }
    }
    task_count: number
    assessment_item_count: number
    stimulus_count: number
  }
  sections: Array<{
    code: string
    title: string
  }>
  stimuli: RawStimulus[]
  tasks: RawAssessmentTask[]
  release: {
    status: 'fixture' | 'ready_for_application'
    version: string
    verification?: {
      method: 'automated_validation'
      status: 'passed'
      validator_version: string
      validated_at: string
      checks: string[]
      similarity: {
        maximum_score: number
        threshold: number
      }
    }
  }
}
