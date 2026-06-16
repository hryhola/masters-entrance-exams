#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = resolve(appRoot, '..')
const outputRoot = join(appRoot, 'public', 'content')
const datasetId = 'yefvv-it-2024'
const datasetSource = join(projectRoot, 'data', `${datasetId}.json`)
const manifestSource = join(projectRoot, 'data', `${datasetId}.manifest.json`)
const eviFixtureSource = join(
  projectRoot,
  'data',
  'fixtures',
  'evi-schema-v2.json',
)
const eviEnglishDatasetId = 'evi-english-2023-source'
const eviEnglishSource = join(projectRoot, 'data', 'evi-english-2023.json')
const generatedDraftsRoot = join(projectRoot, 'data', 'generated', 'drafts')
const eviFixtureAssets = [
  'assets/evi-schema-v2/tznk-2024/firm-shares.png',
  'assets/evi-schema-v2/tznk-2024/company-a-profits.png',
]

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function ensureFile(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Required content file is missing: ${path}`)
  }
}

function copyVerified(source, destination, expectedHash) {
  ensureFile(source)
  const actualHash = sha256(source)
  if (actualHash !== expectedHash) {
    throw new Error(
      `Checksum mismatch for ${source}: expected ${expectedHash}, got ${actualHash}`,
    )
  }
  mkdirSync(dirname(destination), { recursive: true })
  copyFileSync(source, destination)
}

function discoverGeneratedDatasets() {
  if (!existsSync(generatedDraftsRoot)) return []

  return readdirSync(generatedDraftsRoot)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const source = join(generatedDraftsRoot, file)
      ensureFile(source)
      const document = JSON.parse(readFileSync(source, 'utf8'))
      if (
        document.schema_version !== 2 ||
        document.dataset?.origin !== 'generated' ||
        document.dataset?.status !== 'ready' ||
        document.release?.status !== 'ready_for_application' ||
        document.release?.verification?.method !== 'agent_validation' ||
        document.release?.verification?.status !== 'passed'
      ) {
        throw new Error(`Generated draft is not publishable: ${source}`)
      }
      if (document.dataset.id !== document.dataset.generation?.batch_id) {
        throw new Error(`Generated draft batch_id mismatch: ${source}`)
      }

      return {
        id: document.dataset.id,
        source,
        document,
      }
    })
}

ensureFile(datasetSource)
ensureFile(manifestSource)
ensureFile(eviFixtureSource)
ensureFile(eviEnglishSource)
eviFixtureAssets.forEach((path) => ensureFile(join(projectRoot, path)))

const dataset = JSON.parse(readFileSync(datasetSource, 'utf8'))
const manifest = JSON.parse(readFileSync(manifestSource, 'utf8'))
const eviFixture = JSON.parse(readFileSync(eviFixtureSource, 'utf8'))
const eviEnglish = JSON.parse(readFileSync(eviEnglishSource, 'utf8'))
const generatedDatasets = discoverGeneratedDatasets()
const optionCount = dataset.questions.reduce(
  (total, question) => total + question.options.length,
  0,
)

if (dataset.dataset.id !== datasetId) {
  throw new Error(`Unexpected dataset id: ${dataset.dataset.id}`)
}
if (dataset.questions.length !== 140 || optionCount !== 560) {
  throw new Error(
    `Unexpected dataset shape: ${dataset.questions.length} questions, ${optionCount} options`,
  )
}
if (sha256(datasetSource) !== manifest.outputs.json.sha256) {
  throw new Error('Dataset checksum does not match the release manifest.')
}
if (manifest.media.web_assets.length !== 9) {
  throw new Error(
    `Expected 9 web assets, got ${manifest.media.web_assets.length}`,
  )
}
if (
  eviFixture.schema_version !== 2 ||
  eviFixture.dataset.id !== 'evi-schema-v2-fixtures' ||
  eviFixture.tasks.length !== 15 ||
  eviFixture.dataset.assessment_item_count !== 39
) {
  throw new Error('Unexpected EVI schema v2 fixture shape.')
}
if (
  eviEnglish.schema_version !== 2 ||
  eviEnglish.dataset.id !== eviEnglishDatasetId ||
  eviEnglish.tasks.length !== 4 ||
  eviEnglish.dataset.assessment_item_count !== 30
) {
  throw new Error('Unexpected EVI English 2023 dataset shape.')
}

rmSync(outputRoot, { recursive: true, force: true })

const datasetOutputDirectory = join(outputRoot, 'datasets', datasetId)
mkdirSync(datasetOutputDirectory, { recursive: true })
copyFileSync(datasetSource, join(datasetOutputDirectory, 'dataset.json'))
copyFileSync(manifestSource, join(datasetOutputDirectory, 'manifest.json'))

for (const asset of manifest.media.web_assets) {
  copyVerified(
    join(projectRoot, asset.path),
    join(outputRoot, asset.path),
    asset.sha256,
  )
}

const fixtureOutputDirectory = join(outputRoot, 'fixtures')
mkdirSync(fixtureOutputDirectory, { recursive: true })
copyFileSync(
  eviFixtureSource,
  join(fixtureOutputDirectory, 'evi-schema-v2.json'),
)
const eviEnglishOutputDirectory = join(
  outputRoot,
  'datasets',
  eviEnglishDatasetId,
)
mkdirSync(eviEnglishOutputDirectory, { recursive: true })
copyFileSync(eviEnglishSource, join(eviEnglishOutputDirectory, 'dataset.json'))
for (const asset of eviFixtureAssets) {
  const destination = join(outputRoot, asset)
  mkdirSync(dirname(destination), { recursive: true })
  copyFileSync(join(projectRoot, asset), destination)
}
for (const generated of generatedDatasets) {
  const outputDirectory = join(outputRoot, 'datasets', generated.id)
  mkdirSync(outputDirectory, { recursive: true })
  copyFileSync(generated.source, join(outputDirectory, 'dataset.json'))
}

const catalog = {
  schema_version: 1,
  datasets: [
    {
      id: datasetId,
      title: dataset.dataset.title,
      exam: dataset.dataset.exam,
      subject: dataset.dataset.subject,
      year: dataset.dataset.year,
      version: dataset.release.version,
      question_count: dataset.questions.length,
      option_count: optionCount,
      web_asset_count: manifest.media.web_assets.length,
      path: `datasets/${datasetId}/dataset.json`,
    },
    {
      id: eviEnglishDatasetId,
      title: eviEnglish.dataset.title,
      exam: eviEnglish.dataset.exam,
      subject: eviEnglish.dataset.subject,
      year: eviEnglish.dataset.year,
      version: eviEnglish.release.version,
      question_count: eviEnglish.dataset.assessment_item_count,
      task_count: eviEnglish.dataset.task_count,
      path: `datasets/${eviEnglishDatasetId}/dataset.json`,
    },
    ...generatedDatasets.map(({ document, id }) => ({
      id,
      title: document.dataset.title,
      exam: document.dataset.exam,
      subject: document.dataset.subject,
      year: document.dataset.year,
      version: document.release.version,
      origin: 'generated',
      verification: document.release.verification.method,
      question_count: document.dataset.assessment_item_count,
      task_count: document.dataset.task_count,
      path: `datasets/${id}/dataset.json`,
    })),
    {
      id: 'yefvv-it-2024-plus-generated',
      title: 'ЄФВВ: Інформаційні технології',
      exam: dataset.dataset.exam,
      subject: dataset.dataset.subject,
      year: dataset.dataset.year,
      version: `${manifest.release.version}+generated`,
      origin: 'mixed',
      question_count:
        dataset.questions.length +
        generatedDatasets.reduce(
          (total, { document }) =>
            total + document.dataset.assessment_item_count,
          0,
        ),
      sources: [
        datasetId,
        ...generatedDatasets.map((generated) => generated.id),
      ],
    },
  ],
  fixtures: [
    {
      id: eviFixture.dataset.id,
      schema_version: eviFixture.schema_version,
      task_count: eviFixture.tasks.length,
      assessment_item_count: eviFixture.dataset.assessment_item_count,
      path: 'fixtures/evi-schema-v2.json',
      assets: eviFixtureAssets.map((path) => ({
        path,
        sha256: sha256(join(projectRoot, path)),
      })),
    },
  ],
}
writeFileSync(
  join(outputRoot, 'catalog.json'),
  `${JSON.stringify(catalog, null, 2)}\n`,
)

console.log(`Prepared dataset: ${datasetId}`)
console.log(`Questions: ${dataset.questions.length}`)
console.log(`Options: ${optionCount}`)
console.log(`Web assets: ${manifest.media.web_assets.length}`)
console.log(
  `EVI fixture: ${eviFixture.tasks.length} tasks, ${eviFixture.dataset.assessment_item_count} assessment items`,
)
console.log(
  `EVI English: ${eviEnglish.tasks.length} tasks, ${eviEnglish.dataset.assessment_item_count} assessment items`,
)
console.log(`Generated datasets: ${generatedDatasets.length}`)
console.log(`Output: ${outputRoot}`)
