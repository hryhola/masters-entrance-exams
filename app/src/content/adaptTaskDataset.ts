import { adaptBlocks } from './adaptDataset'
import type { AgentValidationCheck } from './types'
import type {
  AssessmentItem,
  AssessmentTask,
  RawAssessmentItem,
  RawAssessmentTask,
  RawTaskDatasetDocument,
  TaskDataset,
} from './taskTypes'

function adaptItem(raw: RawAssessmentItem): AssessmentItem {
  const response =
    raw.response.type === 'matching_choice'
      ? {
          type: raw.response.type,
          choiceSetId: raw.response.choice_set_id,
        }
      : raw.response.type === 'cloze_choice'
        ? {
            type: raw.response.type,
            blankId: raw.response.blank_id,
            options: raw.response.options.map((option) => ({
              id: option.id,
              label: option.label,
              content: adaptBlocks(option.content),
            })),
          }
        : {
            type: raw.response.type,
            options: raw.response.options.map((option) => ({
              id: option.id,
              label: option.label,
              content: adaptBlocks(option.content),
            })),
          }

  return {
    id: raw.id,
    number: raw.number,
    displayLabel: raw.display_label,
    prompt: adaptBlocks(raw.prompt),
    stimulusIds: raw.stimulus_ids,
    response,
    correctChoice: raw.answer.correct_choice,
    explanation: {
      status: raw.explanation.status,
      summary: adaptBlocks(raw.explanation.summary),
    },
    source:
      'generation_batch_id' in raw.source
        ? {
            type: 'generated',
            batchId: raw.source.generation_batch_id,
          }
        : {
            type: 'official_pdf',
            pageStart: raw.source.page_start,
            pageEnd: raw.source.page_end,
          },
  }
}

function adaptTask(raw: RawAssessmentTask): AssessmentTask {
  return {
    id: raw.id,
    number: raw.number,
    type: raw.type,
    language: raw.language,
    sectionCode: raw.section_code,
    instruction: adaptBlocks(raw.instruction),
    stimulusIds: raw.stimulus_ids,
    choiceSets: raw.choice_sets.map((choiceSet) => ({
      id: choiceSet.id,
      unique: choiceSet.unique,
      choices: choiceSet.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        content: adaptBlocks(choice.content),
      })),
    })),
    items: raw.items.map(adaptItem),
  }
}

export function adaptTaskDataset(raw: RawTaskDatasetDocument): TaskDataset {
  const tasks = raw.tasks.map(adaptTask)
  const origin = raw.dataset.origin ?? 'official'
  const verification =
    origin === 'generated' && raw.release.verification
      ? {
          method: 'agent_validation' as const,
          status: 'passed' as const,
          workflowVersion: raw.release.verification.workflow_version,
          validatedAt: raw.release.verification.validated_at,
          report: raw.release.verification.report,
          checks: raw.release.verification.checks as AgentValidationCheck[],
          similarity: {
            maximumScore: raw.release.verification.similarity.maximum_score,
            threshold: raw.release.verification.similarity.threshold,
          },
        }
      : { method: 'official_source' as const }
  const generation = raw.dataset.generation
    ? {
        batchId: raw.dataset.generation.batch_id,
        agent: raw.dataset.generation.agent,
        model: raw.dataset.generation.model,
        instructions: {
          id: raw.dataset.generation.instructions.id,
          version: raw.dataset.generation.instructions.version,
          sha256: raw.dataset.generation.instructions.sha256,
        },
        generatedAt: raw.dataset.generation.generated_at,
        workflowVersion: raw.dataset.generation.workflow_version,
        researchReport: raw.dataset.generation.research_report,
        parameters: {
          topic: raw.dataset.generation.parameters.topic,
          difficulty: raw.dataset.generation.parameters.difficulty,
          taskType: raw.dataset.generation.parameters.task_type,
        },
      }
    : undefined

  return {
    schemaVersion: 2,
    id: raw.dataset.id,
    title: raw.dataset.title,
    exam: raw.dataset.exam,
    subject: raw.dataset.subject,
    year: raw.dataset.year,
    languages: raw.dataset.languages,
    version: raw.release.version,
    status:
      raw.release.status === 'ready_for_application'
        ? 'ready_for_application'
        : 'fixture',
    origin,
    verification,
    generation,
    sections: raw.sections.map((section) => {
      const sectionTasks = tasks.filter(
        (task) => task.sectionCode === section.code,
      )
      return {
        code: section.code,
        title: section.title,
        taskCount: sectionTasks.length,
        assessmentItemCount: sectionTasks.reduce(
          (count, task) => count + task.items.length,
          0,
        ),
      }
    }),
    stimuli: raw.stimuli.map((stimulus) => ({
      id: stimulus.id,
      type: stimulus.type,
      title: stimulus.title ?? null,
      language: stimulus.language,
      content: adaptBlocks(stimulus.content),
    })),
    tasks,
    assessmentItemCount: tasks.reduce(
      (count, task) => count + task.items.length,
      0,
    ),
  }
}
