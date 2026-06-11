import { adaptBlocks } from './adaptDataset'
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
    source: {
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
