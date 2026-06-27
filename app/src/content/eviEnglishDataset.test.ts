import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { adaptTaskDataset } from './adaptTaskDataset'
import { adaptTaskDatasetForPractice } from './adaptTaskDatasetForPractice'
import { validateTaskDatasetDocument } from './validateTaskDataset'

function readDataset() {
  return validateTaskDatasetDocument(
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), '..', 'data', 'evi-english-2023.json'),
        'utf8',
      ),
    ),
  )
}

describe('EVI English 2023 dataset', () => {
  it('contains every official assessment item and answer key', () => {
    const taskDataset = adaptTaskDataset(readDataset())
    const dataset = adaptTaskDatasetForPractice(taskDataset, {
      id: 'evi-english-2023',
      title: 'ЄВІ: Англійська мова 2023',
      subject: 'Англійська мова',
      language: 'en',
      sectionCodes: ['english-reading', 'english-use-of-language'],
    })

    expect(taskDataset.tasks).toHaveLength(4)
    expect(dataset.questions).toHaveLength(30)
    expect(dataset.sections.map((section) => section.questionCount)).toEqual([
      11, 19,
    ])
    expect(dataset.questions[0]).toMatchObject({
      id: 'yevi-en-2023-001',
      correctOption: 'f',
      answerConstraint: {
        groupId: 'yevi-en-2023-task-1:library-features',
        unique: true,
      },
    })
    expect(dataset.questions[0].options).toHaveLength(8)
    expect(
      dataset.questions[0].prompt.flatMap((block) =>
        block.type === 'markdown' ? [block.text] : [],
      ),
    ).toEqual([
      expect.stringContaining('Match choices'),
      'Biblioburro',
      expect.stringContaining('mobile library in rural Colombia'),
    ])
    expect(dataset.questions[11]).toMatchObject({
      id: 'yevi-en-2023-12',
      correctOption: 'd',
    })
    expect(dataset.questions[29]).toMatchObject({
      id: 'yevi-en-2023-30',
      correctOption: 'b',
    })
    expect(
      dataset.questions.map((question) => question.correctOption).join(''),
    ).toBe('fdehaccddabdbaccbaddbcb dabdcab'.replaceAll(' ', ''))
    expect(
      dataset.questions.every(
        (question) =>
          question.language === 'en' &&
          question.explanation.status === 'editorial_pending',
      ),
    ).toBe(true)
  })
})
