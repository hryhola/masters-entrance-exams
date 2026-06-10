#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
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

ensureFile(datasetSource)
ensureFile(manifestSource)

const dataset = JSON.parse(readFileSync(datasetSource, 'utf8'))
const manifest = JSON.parse(readFileSync(manifestSource, 'utf8'))
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
console.log(`Output: ${outputRoot}`)
