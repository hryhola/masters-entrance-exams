#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = resolve(appRoot, '..')
const fixture = JSON.parse(
  readFileSync(
    resolve(projectRoot, 'data', 'fixtures', 'evi-schema-v2.json'),
    'utf8',
  ),
)

const markdown = (text) => ({ type: 'markdown', text })
const choice = (id, text) => ({
  id,
  label: id.toUpperCase(),
  content: [markdown(text)],
})
const item = ({
  id,
  number,
  prompt,
  correct,
  options,
  page,
  responseType = 'single_choice',
  blankId,
}) => ({
  id,
  number,
  display_label: String(number),
  prompt: [markdown(prompt)],
  stimulus_ids: [],
  response:
    responseType === 'cloze_choice'
      ? {
          type: responseType,
          blank_id: String(blankId ?? number),
          options,
        }
      : { type: responseType, options },
  answer: { correct_choice: correct, source: 'official_key' },
  explanation: { status: 'editorial_pending', summary: [] },
  source: { page_start: page, page_end: page },
})

const libraryStimuli = fixture.stimuli.filter((stimulus) =>
  stimulus.id.startsWith('yevi-en-2023-library-'),
)
const libraryTask = fixture.tasks.find(
  (task) => task.id === 'yevi-en-2023-task-1',
)

if (libraryStimuli.length !== 6 || !libraryTask) {
  throw new Error('The English Task 1 fixture is incomplete.')
}

const pearlOptions = {
  7: [
    choice('a', 'Pearls were used as currency in the earliest times.'),
    choice('b', 'Seamen caught tons of shells to find prized gems.'),
    choice('c', 'The value of a pearl could equal a country’s wealth.'),
    choice('d', 'Pearls were used as ingredients in cooking seafood.'),
  ],
  8: [
    choice('a', 'to boost her immunity'),
    choice('b', 'to preserve her beauty'),
    choice('c', 'to become famous'),
    choice('d', 'to impress her guest'),
  ],
  9: [
    choice('a', 'to prevent their defeat'),
    choice('b', 'to raise their fighting spirit'),
    choice('c', 'to show their military rank'),
    choice('d', 'to protect themselves from wounds'),
  ],
  10: [
    choice('a', 'They set legal limits on wearing pearls.'),
    choice('b', 'They offered commoners man-made pearls.'),
    choice('c', 'They stopped selling family pearls.'),
    choice('d', 'They charged very high prices for pearls.'),
  ],
  11: [
    choice('a', 'Jacques Cartier became famous due to his pearl necklaces.'),
    choice('b', 'Pearls stopped being a status symbol in the 20th century.'),
    choice('c', 'Pearl oyster hunting made American population richer.'),
    choice('d', 'Europeans introduced pearl fashion into Central America.'),
  ],
}

const ladyOptions = {
  12: ['clean', 'easy', 'clever', 'handy'],
  13: ['variation', 'option', 'selection', 'alteration'],
  14: ['cause', 'do', 'result', 'lead'],
  15: ['intentionally', 'deliberately', 'unbelievably', 'uncertainly'],
  16: ['possibility', 'chance', 'ability', 'case'],
  17: ['speak', 'tell', 'say', 'talk'],
  18: ['guided', 'moved', 'fetched', 'drew'],
  19: ['position', 'system', 'place', 'habitat'],
  20: ['said', 'named', 'called', 'known'],
  21: ['supports', 'proves', 'persuades', 'convinces'],
}

const task4Options = {
  22: ['the 1950th', '1950th', 'the 1950s', '1950s'],
  23: ['to use', 'use', 'using', 'have used'],
  24: ['complicate', 'complication', 'complicating', 'complicated'],
  25: ['is', 'are', 'were', 'has been'],
  26: ['them', 'themselves', 'theirs', 'their'],
  27: ['ever', 'just', 'yet', 'never'],
  28: ['to discover', 'discover', 'discovering', 'being discovered'],
  29: ['become', 'to become', 'had become', 'were becoming'],
  30: ['most amazing', 'the most amazing', 'more amazing', 'the more amazing'],
}

const correctAnswers = {
  7: 'c',
  8: 'd',
  9: 'd',
  10: 'a',
  11: 'b',
  12: 'd',
  13: 'b',
  14: 'a',
  15: 'c',
  16: 'c',
  17: 'b',
  18: 'a',
  19: 'd',
  20: 'd',
  21: 'b',
  22: 'c',
  23: 'b',
  24: 'd',
  25: 'a',
  26: 'b',
  27: 'd',
  28: 'c',
  29: 'a',
  30: 'b',
}

const dataset = {
  schema_version: 2,
  dataset: {
    id: 'evi-english-2023-source',
    title: 'ЄВІ: Англійська мова 2023',
    exam: 'ЄВІ',
    subject: 'Англійська мова',
    year: 2023,
    languages: ['en', 'uk'],
    status: 'ready',
    task_count: 4,
    assessment_item_count: 30,
    stimulus_count: 10,
  },
  sections: [
    { code: 'english-reading', title: 'Reading' },
    { code: 'english-use-of-language', title: 'Use of English' },
  ],
  stimuli: [
    ...libraryStimuli,
    {
      id: 'yevi-en-2023-pearls',
      type: 'text',
      title: 'A Brief History of Pearls',
      language: 'en',
      content: [
        markdown(
          `Many thousands of years ago, long before written history, human beings probably discovered the first pearl while searching the seashore for food. Throughout history, the pearl, with its warm inner glow and shimmering, has been one of the most highly prized and desired gems. Countless references to the pearl can be found in the religions and mythology of cultures from the earliest times. Legend has it that the ancient Egyptian Queen Cleopatra dissolved a single pearl in a glass of wine and drank it, simply to prove to Mark Antony, the Roman General visiting her palace, that she could swallow the wealth of an entire nation in just one meal.

In ancient Rome, pearls were considered a symbol of wealth and social standing. The Greeks valued the pearl for both its extraordinary beauty and association with love and marriage. During the Dark Ages, while ladies from wealthy families adored delicate pearl necklaces, gallant knights often wore pearls into battle. They believed the magic of these glossy gems would keep them unharmed. The Renaissance saw the royal courts of Europe full of pearls. Because pearls were so highly regarded, a number of European countries actually passed laws forbidding anyone but the nobility to decorate themselves with pearls.

During the European expansion into the New World, the discovery of pearls in Central American waters added to the wealth of Europe. Unfortunately, wish for the sea-grown gems resulted in the reduction of virtually all the American pearl oyster populations by the 17th century. Until the early 1900s, natural pearls were accessible only to the rich and famous. In 1916, famed French jeweller Jacques Cartier bought his landmark store on New York’s famous Fifth Avenue by trading two pearl necklaces for the valuable property. But today, with the development of pearl cultivating industry, pearls are available and affordable to all.`,
        ),
      ],
    },
    {
      id: 'yevi-en-2023-lady-tarzan',
      type: 'cloze_text',
      title: 'Lady Tarzan',
      language: 'en',
      content: [
        markdown(
          `A girl from India knows how to speak to elephants, a skill that comes in **(12) ______** more often than you would think. Here is a language you never got the **(13) ______** to learn in school!

Several years ago, a herd of 11 elephants from nearby forests entered a residential area in the city of Rourkela. Before the wild animals could **(14) ______** chaos on the town and its residents, authorities got hold of teenage girl Nirmala Toppo, because **(15) ______**, she seems to have the **(16) ______** to communicate with elephants.

Nirmala rushed from her village to a football field in the city where the elephants were temporarily being held.

“First I pray and then talk to the herd,” the teen told the BBC. “They understand what I say. I **(17) ______** them this is not your home. You should return where you belong.”

The elephants started walking with her. In fact, she walked with them for miles, speaking to them the whole way as she **(18) ______** them back to the forest.

Elephants in the area’s nearby forests frequently invade villages and towns, destroying homes and hurting people. The more their **(19) ______** is encroached by humans for activities like mining and cutting down trees, the more likely they are to wander out of the forest.

Nirmala, who is **(20) ______** as “Lady Tarzan”, speaks to the animals in her local tribal dialect of Mundaari. She explains that because tribal people and the elephants (among other wild animals) have cohabited in the same area for ages, the elephants understand their language.

Not only does this story show a brave young girl using her skills to help both humans and animals, it **(21) ______** that it is possible for two very different species to share a bond and communicate with each other.`,
        ),
      ],
    },
    {
      id: 'yevi-en-2023-brainy-octopuses',
      type: 'cloze_text',
      title: 'Brainy Octopuses',
      language: 'en',
      content: [
        markdown(
          `In **(22) ______**, the US Air Force sponsored scientists to study the way octopuses **(23) ______** their brains. Some octopuses in laboratories seem to play with objects as if they were toys — a sure sign of intelligence. Others could pick up **(24) ______** skills like opening jars.

Perhaps the most striking thing about octopuses **(25) ______** their ability to change their colour and body pattern. They do this to camouflage **(26) ______** and also to communicate with others. They can completely change their appearance in less than a second — a striped octopus can suddenly become spotted.`,
        ),
      ],
    },
    {
      id: 'yevi-en-2023-exciting-trip',
      type: 'cloze_text',
      title: 'An Exciting Trip',
      language: 'en',
      content: [
        markdown(
          `Being from a small town, I had **(27) ______** been exposed to a large city such as New York, so my trip there was like **(28) ______** an entirely new way of life. In the morning of the flight I felt excited as we arrived at the airport and made our way to the gate. I watched through the window the airport with the runway **(29) ______** smaller as the plane gained altitude. I felt thrilled as I realised that I would soon be in one of **(30) ______** cities of the United States.`,
        ),
      ],
    },
  ],
  tasks: [
    libraryTask,
    {
      id: 'yevi-en-2023-task-2',
      number: 2,
      type: 'question_group',
      language: 'en',
      section_code: 'english-reading',
      instruction: [
        markdown(
          'Read the text below. For questions 7–11 choose the correct answer (A, B, C or D).',
        ),
      ],
      stimulus_ids: ['yevi-en-2023-pearls'],
      choice_sets: [],
      items: [
        item({
          id: 'yevi-en-2023-007',
          number: 7,
          prompt: 'What is mentioned about pearls in paragraph 1?',
          correct: correctAnswers[7],
          options: pearlOptions[7],
          page: 3,
        }),
        item({
          id: 'yevi-en-2023-008',
          number: 8,
          prompt:
            'Why did Cleopatra drink a glass of wine with a pearl dissolved in it?',
          correct: correctAnswers[8],
          options: pearlOptions[8],
          page: 3,
        }),
        item({
          id: 'yevi-en-2023-009',
          number: 9,
          prompt: 'Why did medieval warriors bring pearls to battlefields?',
          correct: correctAnswers[9],
          options: pearlOptions[9],
          page: 3,
        }),
        item({
          id: 'yevi-en-2023-010',
          number: 10,
          prompt:
            'How did Renaissance aristocrats ensure that pearls could be worn only by them?',
          correct: correctAnswers[10],
          options: pearlOptions[10],
          page: 3,
        }),
        item({
          id: 'yevi-en-2023-011',
          number: 11,
          prompt: 'Which statement is TRUE, according to paragraph 3?',
          correct: correctAnswers[11],
          options: pearlOptions[11],
          page: 3,
        }),
      ],
    },
    {
      id: 'yevi-en-2023-task-3',
      number: 3,
      type: 'cloze',
      language: 'en',
      section_code: 'english-use-of-language',
      instruction: [
        markdown(
          'Read the text below. For questions 12–21 choose the correct answer (A, B, C or D).',
        ),
      ],
      stimulus_ids: ['yevi-en-2023-lady-tarzan'],
      choice_sets: [],
      items: Object.entries(ladyOptions).map(([number, values]) =>
        item({
          id: `yevi-en-2023-${number}`,
          number: Number(number),
          prompt: `Gap (${number})`,
          correct: correctAnswers[number],
          options: values.map((value, index) =>
            choice(String.fromCharCode(97 + index), value),
          ),
          page: 4,
          responseType: 'cloze_choice',
          blankId: number,
        }),
      ),
    },
    {
      id: 'yevi-en-2023-task-4',
      number: 4,
      type: 'cloze',
      language: 'en',
      section_code: 'english-use-of-language',
      instruction: [
        markdown(
          'Read the texts below. For questions 22–30 choose the correct answer (A, B, C or D).',
        ),
      ],
      stimulus_ids: [
        'yevi-en-2023-brainy-octopuses',
        'yevi-en-2023-exciting-trip',
      ],
      choice_sets: [],
      items: Object.entries(task4Options).map(([number, values]) =>
        item({
          id: `yevi-en-2023-${number}`,
          number: Number(number),
          prompt: `Gap (${number})`,
          correct: correctAnswers[number],
          options: values.map((value, index) =>
            choice(String.fromCharCode(97 + index), value),
          ),
          page: 5,
          responseType: 'cloze_choice',
          blankId: number,
        }),
      ),
    },
  ],
  release: {
    status: 'ready_for_application',
    version: '1.0.0',
  },
}

const outputPath = resolve(projectRoot, 'data', 'evi-english-2023.json')
writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`)
console.log(`Generated ${outputPath}`)
