#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const releaseVersion = "1.0.0";
const assembledOn = "2026-06-10";
const expectedQuestionCount = 140;
const expectedOptionCount = 560;
const expectedWebAssetCount = 9;
const expectedSourceImageCount = 45;
const expectedSourcePdfChecksum =
  "9f07d30a5c71ac087c9e11b6b2e5794a3f5ccc15ead05f69474c2f59312bef81";
const expectedProgramPdfChecksum =
  "41cde7339e94ac7a1aae6ca5e7003fefe0148ae60923eb9b607bc34a2a16f8f4";

const inputPath = join(
  projectRoot,
  "data",
  "explained",
  `${sourceId}.json`,
);
const outputJsonPath = join(projectRoot, "data", `${sourceId}.json`);
const outputYamlPath = join(projectRoot, "data", `${sourceId}.yaml`);
const manifestPath = join(
  projectRoot,
  "data",
  `${sourceId}.manifest.json`,
);
const schemaPath = join(
  projectRoot,
  "schemas",
  "yefvv-it-question-dataset.schema.json",
);
const releaseValidationReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-release-validation.json`,
);
const sourcePdfPath = join(
  projectRoot,
  "raw",
  "ЄФВВ - ІНФОРМАЦІЙНІ ТЕХНОЛОГІЇ",
  "YEFVV_2024-Informatsijni-tehnologiyi-na_sajt__.pdf",
);
const programPdfPath = join(
  projectRoot,
  "raw",
  "ЄФВВ - ІНФОРМАЦІЙНІ ТЕХНОЛОГІЇ",
  "programa-jefvv-informtexnologiyi-2025.pdf",
);
const taxonomyPath = join(
  projectRoot,
  "data",
  "taxonomies",
  "yefvv-it-program-2025.yaml",
);
const webAssetsDirectory = join(
  projectRoot,
  "assets",
  "yefvv-it-2024",
);
const sourceImagesDirectory = join(
  projectRoot,
  "sources",
  "yefvv-it-2024",
  "embedded-images",
);

const provenanceStages = [
  {
    stage: 1,
    name: "source_fixation",
    artifact: "sources/yefvv-it-2024/source.json",
  },
  {
    stage: 2,
    name: "draft_extraction",
    artifact: "reports/yefvv-it-2024-draft-extraction.json",
  },
  {
    stage: 3,
    name: "complex_content_enrichment",
    artifact: "reports/yefvv-it-2024-complex-content.json",
  },
  {
    stage: 4,
    name: "normalization",
    artifact: "reports/yefvv-it-2024-normalization.json",
  },
  {
    stage: 5,
    name: "validation",
    artifact: "reports/yefvv-it-2024-validation.json",
  },
  {
    stage: 6,
    name: "program_alignment",
    artifact: "reports/yefvv-it-2024-program-2025-alignment.json",
  },
  {
    stage: 7,
    name: "explanations",
    artifact: "reports/yefvv-it-2024-explanations.json",
  },
  {
    stage: 8,
    name: "release_assembly",
    artifact: "data/yefvv-it-2024.manifest.json",
  },
];

const validationReports = [
  "reports/yefvv-it-2024-validation.json",
  "reports/yefvv-it-2024-classification-validation.json",
  "reports/yefvv-it-2024-explanations-validation.json",
];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function requireCommand(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    stdio: "ignore",
  });

  if (result.error?.code === "ENOENT") {
    fail(`Required command is unavailable: ${command}`);
  }
}

function toolVersion(command, versionArgument = "--version") {
  const result = spawnSync(command, [versionArgument], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error || result.status !== 0) {
    fail(`Could not determine version of ${command}`);
  }

  return `${result.stdout}${result.stderr}`.split("\n")[0].trim();
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function jsonToYaml(value) {
  const rubyProgram = [
    "require 'json'",
    "require 'yaml'",
    "data = JSON.parse(STDIN.read)",
    "STDOUT.write(YAML.dump(data))",
  ].join("; ");

  return execFileSync("ruby", ["-e", rubyProgram], {
    input: JSON.stringify(value),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listFilesRecursively(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? listFilesRecursively(path)
        : [path];
    })
    .sort();
}

function mediaReferences(dataset) {
  const references = new Map();

  function add(path, question, placement, role) {
    const items = references.get(path) ?? [];
    items.push({ question, placement, role });
    references.set(path, items);
  }

  for (const question of dataset.questions) {
    const groups = [
      ["prompt", question.prompt],
      ...question.options.map((option) => [
        `option_${option.id}`,
        option.content,
      ]),
    ];

    for (const [placement, blocks] of groups) {
      for (const block of blocks) {
        if (block.type === "image") {
          add(block.path, question.number, placement, "web_asset");
        }
        for (const sourceImage of block.source_images ?? []) {
          add(
            sourceImage,
            question.number,
            placement,
            "source_image",
          );
        }
      }
    }
  }

  return references;
}

function fileRecord(path, references = []) {
  const absolutePath = resolve(projectRoot, path);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    fail(`Required release file is missing: ${path}`);
  }

  return {
    path,
    bytes: statSync(absolutePath).size,
    sha256: sha256(absolutePath),
    referenced_by: references,
  };
}

function checkedArtifact(path) {
  const record = fileRecord(path);
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
  };
}

requireCommand("ruby");

for (const path of [
  inputPath,
  schemaPath,
  sourcePdfPath,
  programPdfPath,
  taxonomyPath,
]) {
  if (!existsSync(path)) {
    fail(`Required input is missing: ${relative(projectRoot, path)}`);
  }
}

if (sha256(sourcePdfPath) !== expectedSourcePdfChecksum) {
  fail("The official 2024 test PDF checksum has changed.");
}

if (sha256(programPdfPath) !== expectedProgramPdfChecksum) {
  fail("The official 2025 program PDF checksum has changed.");
}

for (const path of validationReports) {
  const report = JSON.parse(
    readFileSync(resolve(projectRoot, path), "utf8"),
  );
  if (report.summary?.passed !== true) {
    fail(`Prerequisite validation has not passed: ${path}`);
  }
}

const inputDataset = JSON.parse(readFileSync(inputPath, "utf8"));
const dataset = clone(inputDataset);
const optionCount = dataset.questions.reduce(
  (sum, question) => sum + question.options.length,
  0,
);

if (
  dataset.questions.length !== expectedQuestionCount ||
  optionCount !== expectedOptionCount
) {
  fail("Explained dataset has an unexpected question or option count.");
}

dataset.dataset.status = "ready";
dataset.release = {
  status: "ready_for_application",
  version: releaseVersion,
  assembled_on: assembledOn,
  canonical_file: `data/${sourceId}.yaml`,
  json_mirror: `data/${sourceId}.json`,
  manifest: `data/${sourceId}.manifest.json`,
  schema: "schemas/yefvv-it-question-dataset.schema.json",
  validation_report:
    `reports/${sourceId}-release-validation.json`,
  input: {
    file: `data/explained/${sourceId}.json`,
    sha256: sha256(inputPath),
  },
  assets: {
    web_directory: "assets/yefvv-it-2024",
    source_image_directory:
      "sources/yefvv-it-2024/embedded-images",
  },
  provenance: provenanceStages,
};

mkdirSync(dirname(outputJsonPath), { recursive: true });
const outputFiles = [
  [outputJsonPath, `${JSON.stringify(dataset, null, 2)}\n`],
  [outputYamlPath, jsonToYaml(dataset)],
];

for (const [path, content] of outputFiles) {
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, content, "utf8");
  renameSync(temporaryPath, path);
}

const references = mediaReferences(dataset);
const webAssetPaths = listFilesRecursively(webAssetsDirectory).map(
  (path) => relative(projectRoot, path),
);
const sourceImagePaths = listFilesRecursively(sourceImagesDirectory).map(
  (path) => relative(projectRoot, path),
);

if (
  webAssetPaths.length !== expectedWebAssetCount ||
  sourceImagePaths.length !== expectedSourceImageCount
) {
  fail("Release media inventory has an unexpected file count.");
}

if (
  [...references.keys()].some(
    (path) =>
      !webAssetPaths.includes(path) && !sourceImagePaths.includes(path),
  )
) {
  fail("A media reference points outside the release inventory.");
}

if (
  webAssetPaths.some((path) => !references.has(path)) ||
  sourceImagePaths.some((path) => !references.has(path))
) {
  fail("One or more release media files are not referenced by the dataset.");
}

const keyArtifacts = [
  "data/explained/yefvv-it-2024.json",
  "data/taxonomies/yefvv-it-program-2025.yaml",
  "schemas/yefvv-it-question-dataset.schema.json",
  "reports/yefvv-it-2024-validation.json",
  "reports/yefvv-it-2024-classification-validation.json",
  "reports/yefvv-it-2024-explanations-validation.json",
].map(checkedArtifact);

const manifest = {
  schema_version: 1,
  release: {
    id: sourceId,
    version: releaseVersion,
    status: "ready_for_application",
    assembled_on: assembledOn,
    canonical_file: relative(projectRoot, outputYamlPath),
  },
  outputs: {
    yaml: checkedArtifact(relative(projectRoot, outputYamlPath)),
    json: checkedArtifact(relative(projectRoot, outputJsonPath)),
  },
  official_sources: {
    test_pdf: checkedArtifact(relative(projectRoot, sourcePdfPath)),
    program_pdf: checkedArtifact(relative(projectRoot, programPdfPath)),
  },
  key_artifacts: keyArtifacts,
  media: {
    web_asset_count: webAssetPaths.length,
    source_image_count: sourceImagePaths.length,
    reference_count: [...references.values()].reduce(
      (sum, items) => sum + items.length,
      0,
    ),
    unique_reference_count: references.size,
    web_assets: webAssetPaths.map((path) =>
      fileRecord(path, references.get(path)),
    ),
    source_images: sourceImagePaths.map((path) =>
      fileRecord(path, references.get(path)),
    ),
  },
  dataset_summary: {
    question_count: dataset.questions.length,
    option_count: optionCount,
    classified_question_count: dataset.questions.filter(
      (question) =>
        question.classification.status === "classified",
    ).length,
    explained_question_count: dataset.questions.filter(
      (question) => question.explanation.status === "completed",
    ).length,
    disputed_answer_question_numbers: dataset.questions
      .filter(
        (question) =>
          question.explanation.answer_review.status === "disputed",
      )
      .map((question) => question.number),
  },
  tools: {
    node: process.version,
    ruby: toolVersion("ruby"),
  },
};

const temporaryManifestPath = `${manifestPath}.tmp`;
writeFileSync(
  temporaryManifestPath,
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
renameSync(temporaryManifestPath, manifestPath);

console.log(`Release version: ${releaseVersion}`);
console.log(`Questions: ${dataset.questions.length}`);
console.log(`Options: ${optionCount}`);
console.log(
  `Media: web=${webAssetPaths.length}, source=${sourceImagePaths.length}`,
);
console.log(`YAML: ${relative(projectRoot, outputYamlPath)}`);
console.log(`Manifest: ${relative(projectRoot, manifestPath)}`);
console.log(
  `Validation target: ${relative(projectRoot, releaseValidationReportPath)}`,
);
