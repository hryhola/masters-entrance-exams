import type { OptionId, Question } from './types'

const fallbackLabels: Record<string, string> = {
  a: 'A',
  b: 'Б',
  c: 'В',
  d: 'Г',
}

export function getQuestionOptionLabel(question: Question, optionId: OptionId) {
  return (
    question.options.find((option) => option.id === optionId)?.label ??
    fallbackLabels[optionId] ??
    optionId.toUpperCase()
  )
}
