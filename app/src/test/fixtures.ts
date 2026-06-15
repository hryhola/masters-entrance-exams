import type { AnswerReviewStatus, OptionId, Question } from '../content/types'

export function createTestQuestion({
  id = 'q1',
  number = 1,
  correctOption = 'b',
  answerReviewStatus = 'verified',
}: {
  id?: string
  number?: number
  correctOption?: OptionId
  answerReviewStatus?: AnswerReviewStatus
} = {}): Question {
  return {
    id,
    number,
    type: 'single_choice',
    origin: 'official',
    prompt: [{ type: 'markdown', text: `Умова питання ${number}` }],
    options: [
      {
        id: 'a',
        label: 'A',
        content: [{ type: 'markdown', text: 'Варіант A' }],
      },
      {
        id: 'b',
        label: 'Б',
        content: [{ type: 'markdown', text: 'Варіант Б' }],
      },
      {
        id: 'c',
        label: 'В',
        content: [{ type: 'markdown', text: 'Варіант В' }],
      },
      {
        id: 'd',
        label: 'Г',
        content: [{ type: 'markdown', text: 'Варіант Г' }],
      },
    ],
    correctOption,
    explanation: {
      summary: [{ type: 'markdown', text: 'Загальне пояснення.' }],
      optionFeedback: [
        {
          optionId: 'a',
          verdict: correctOption === 'a' ? 'correct' : 'incorrect',
          blocks: [{ type: 'markdown', text: 'Коментар до варіанта A.' }],
        },
        {
          optionId: 'b',
          verdict: correctOption === 'b' ? 'correct' : 'incorrect',
          blocks: [{ type: 'markdown', text: 'Коментар до варіанта Б.' }],
        },
        {
          optionId: 'c',
          verdict: correctOption === 'c' ? 'correct' : 'incorrect',
          blocks: [{ type: 'markdown', text: 'Коментар до варіанта В.' }],
        },
        {
          optionId: 'd',
          verdict: correctOption === 'd' ? 'correct' : 'incorrect',
          blocks: [{ type: 'markdown', text: 'Коментар до варіанта Г.' }],
        },
      ],
      answerReview: {
        status: answerReviewStatus,
        officialOption: correctOption,
        note:
          answerReviewStatus === 'disputed'
            ? 'Офіційний ключ суперечить предметному аналізу.'
            : '',
      },
    },
    classification: {
      alignment: 'aligned',
      topic: {
        code: `1.${number}`,
        sectionCode: '1',
        section: 'Тестовий розділ',
        topic: `Тестова тема ${number}`,
        expectedCognitiveLevel: 'knowledge',
      },
      cognitiveLevel: 'knowledge',
      tags: ['test'],
      formatCompliance: 'compliant',
    },
    source: { pageStart: 1, pageEnd: 1, questionNumber: number },
    features: { blockTypes: ['markdown'], hasComplexContent: false },
  }
}
