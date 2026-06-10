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
const expectedQuestionCount = 140;
const expectedOptionCount = 560;
const expectedWebAssetCount = 9;
const expectedSourceImageCount = 45;
const expectedSourcePdfChecksum =
  "9f07d30a5c71ac087c9e11b6b2e5794a3f5ccc15ead05f69474c2f59312bef81";
const expectedProgramPdfChecksum =
  "41cde7339e94ac7a1aae6ca5e7003fefe0148ae60923eb9b607bc34a2a16f8f4";

const explainedPath = join(
  projectRoot,
  "data",
  "explained",
  `${sourceId}.json`,
);
const finalJsonPath = join(projectRoot, "data", `${sourceId}.json`);
const finalYamlPath = join(projectRoot, "data", `${sourceId}.yaml`);
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
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-release-validation.json`,
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

function requireCommand(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    stdio: "ignore",
  });

  if (result.error?.code === "ENOENT") {
    throw new Error(`Required command is unavailable: ${command}`);
  }
}

function toolVersion(command, versionArgument = "--version") {
  const result = spawnSync(command, [versionArgument], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Could not determine version of ${command}`);
  }

  return `${result.stdout}${result.stderr}`.split("\n")[0].trim();
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseYaml(path) {
  const rubyProgram = [
    "require 'json'",
    "require 'yaml'",
    "data = YAML.safe_load(STDIN.read, permitted_classes: [], aliases: false)",
    "STDOUT.write(JSON.generate(data))",
  ].join("; ");

  const json = execFileSync("ruby", ["-e", rubyProgram], {
    input: readFileSync(path, "utf8"),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });

  return JSON.parse(json);
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

function snapshotPreRelease(dataset) {
  const snapshot = JSON.parse(JSON.stringify(dataset));
  snapshot.dataset.status = "explained";
  delete snapshot.release;
  return snapshot;
}

function mediaReferences(dataset) {
  const references = new Map();

  function add(path, question, placement, role) {
    const items = references.get(path) ?? [];
    items.push({ question, placement, role });
    references.set(path, items);
  }

  for (const question of dataset.questions ?? []) {
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

function counts(values) {
  const result = {};
  for (const value of values) {
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

requireCommand("ruby");

const checks = [];
const failures = [];

function recordCheck(id, description, passed, details = {}) {
  const check = { id, description, passed, details };
  checks.push(check);
  if (!passed) {
    failures.push(check);
  }
}

let explained;
let finalJson;
let finalYaml;
let manifest;
let schema;

for (const [id, description, path, parser, assign] of [
  [
    "explained_json_syntax",
    "Explained input JSON parses successfully.",
    explainedPath,
    parseJson,
    (value) => {
      explained = value;
    },
  ],
  [
    "final_json_syntax",
    "Final JSON parses successfully.",
    finalJsonPath,
    parseJson,
    (value) => {
      finalJson = value;
    },
  ],
  [
    "final_yaml_syntax",
    "Final YAML parses safely.",
    finalYamlPath,
    parseYaml,
    (value) => {
      finalYaml = value;
    },
  ],
  [
    "manifest_syntax",
    "Release manifest parses successfully.",
    manifestPath,
    parseJson,
    (value) => {
      manifest = value;
    },
  ],
  [
    "schema_syntax",
    "Dataset schema parses successfully.",
    schemaPath,
    parseJson,
    (value) => {
      schema = value;
    },
  ],
]) {
  try {
    assign(parser(path));
    recordCheck(id, description, true);
  } catch (error) {
    recordCheck(id, description, false, { error: error.message });
  }
}

if (finalJson && finalYaml) {
  recordCheck(
    "yaml_json_equivalence",
    "Final YAML and JSON represent identical data.",
    JSON.stringify(finalJson) === JSON.stringify(finalYaml),
  );
}

if (explained && finalJson) {
  recordCheck(
    "release_content_preservation",
    "Final assembly changes only release status and release metadata.",
    JSON.stringify(snapshotPreRelease(finalJson)) ===
      JSON.stringify(explained),
  );
}

if (finalJson) {
  const questions = Array.isArray(finalJson.questions)
    ? finalJson.questions
    : [];
  const optionCount = questions.reduce(
    (sum, question) => sum + question.options.length,
    0,
  );
  const alignmentCounts = counts(
    questions.map(
      (question) => question.classification?.alignment,
    ),
  );
  const answerReviewCounts = counts(
    questions.map(
      (question) => question.explanation?.answer_review?.status,
    ),
  );
  const releaseValid =
    finalJson.dataset?.status === "ready" &&
    finalJson.release?.status === "ready_for_application" &&
    finalJson.release?.version === "1.0.0" &&
    finalJson.release?.assembled_on === "2026-06-10" &&
    finalJson.release?.canonical_file === "data/yefvv-it-2024.yaml" &&
    finalJson.release?.json_mirror === "data/yefvv-it-2024.json" &&
    finalJson.release?.manifest ===
      "data/yefvv-it-2024.manifest.json" &&
    finalJson.release?.schema ===
      "schemas/yefvv-it-question-dataset.schema.json" &&
    finalJson.release?.provenance?.length === 8;

  recordCheck(
    "release_metadata",
    "Release metadata identifies version 1.0.0, canonical files, schema, and eight provenance stages.",
    releaseValid,
  );

  recordCheck(
    "application_readiness",
    "Final dataset contains all questions, options, classifications, explanations, and explicit disputed keys.",
    questions.length === expectedQuestionCount &&
      optionCount === expectedOptionCount &&
      questions.every(
        (question) =>
          question.classification?.status === "classified" &&
          question.explanation?.status === "completed" &&
          question.explanation?.option_feedback?.length === 4,
      ) &&
      alignmentCounts.aligned === 104 &&
      alignmentCounts.partial === 28 &&
      alignmentCounts.legacy === 5 &&
      alignmentCounts.unmapped === 3 &&
      answerReviewCounts.verified === 97 &&
      answerReviewCounts.verified_with_caveat === 41 &&
      answerReviewCounts.disputed === 2,
    {
      question_count: questions.length,
      option_count: optionCount,
      alignment_counts: alignmentCounts,
      answer_review_counts: answerReviewCounts,
    },
  );
}

if (schema) {
  recordCheck(
    "schema_release_contract",
    "Schema documents ready datasets and release metadata.",
    schema.$defs?.datasetMetadata?.properties?.status?.enum?.includes(
      "ready",
    ) &&
      schema.properties?.release?.$ref === "#/$defs/releaseMetadata" &&
      schema.$defs?.releaseMetadata !== undefined,
  );
}

if (finalJson && manifest) {
  const references = mediaReferences(finalJson);
  const webAssetPaths = listFilesRecursively(webAssetsDirectory).map(
    (path) => relative(projectRoot, path),
  );
  const sourceImagePaths = listFilesRecursively(
    sourceImagesDirectory,
  ).map((path) => relative(projectRoot, path));
  const manifestFiles = [
    ...(manifest.media?.web_assets ?? []),
    ...(manifest.media?.source_images ?? []),
  ];
  const manifestByPath = new Map(
    manifestFiles.map((record) => [record.path, record]),
  );
  const allPaths = [...webAssetPaths, ...sourceImagePaths];
  const mediaErrors = [];

  for (const path of allPaths) {
    const absolutePath = resolve(projectRoot, path);
    const record = manifestByPath.get(path);
    if (
      !record ||
      record.bytes !== statSync(absolutePath).size ||
      record.sha256 !== sha256(absolutePath) ||
      JSON.stringify(record.referenced_by) !==
        JSON.stringify(references.get(path))
    ) {
      mediaErrors.push(path);
    }
  }

  recordCheck(
    "media_inventory",
    "Manifest covers every referenced web asset and source image with size, checksum, and usage.",
    webAssetPaths.length === expectedWebAssetCount &&
      sourceImagePaths.length === expectedSourceImageCount &&
      references.size ===
        expectedWebAssetCount + expectedSourceImageCount &&
      manifest.media?.web_asset_count === expectedWebAssetCount &&
      manifest.media?.source_image_count ===
        expectedSourceImageCount &&
      manifestFiles.length === references.size &&
      mediaErrors.length === 0,
    {
      web_asset_count: webAssetPaths.length,
      source_image_count: sourceImagePaths.length,
      unique_reference_count: references.size,
      errors: mediaErrors,
    },
  );

  const manifestOutputValid =
    manifest.outputs?.yaml?.path === "data/yefvv-it-2024.yaml" &&
    manifest.outputs?.yaml?.sha256 === sha256(finalYamlPath) &&
    manifest.outputs?.yaml?.bytes === statSync(finalYamlPath).size &&
    manifest.outputs?.json?.path === "data/yefvv-it-2024.json" &&
    manifest.outputs?.json?.sha256 === sha256(finalJsonPath) &&
    manifest.outputs?.json?.bytes === statSync(finalJsonPath).size;

  recordCheck(
    "output_checksums",
    "Manifest checksums and byte sizes match the final YAML and JSON.",
    manifestOutputValid,
    {
      yaml_sha256: sha256(finalYamlPath),
      json_sha256: sha256(finalJsonPath),
    },
  );

  const sourceChecksumsValid =
    manifest.official_sources?.test_pdf?.sha256 ===
      expectedSourcePdfChecksum &&
    manifest.official_sources?.program_pdf?.sha256 ===
      expectedProgramPdfChecksum &&
    manifest.official_sources?.test_pdf?.sha256 ===
      sha256(
        resolve(
          projectRoot,
          manifest.official_sources.test_pdf.path,
        ),
      ) &&
    manifest.official_sources?.program_pdf?.sha256 ===
      sha256(
        resolve(
          projectRoot,
          manifest.official_sources.program_pdf.path,
        ),
      );

  recordCheck(
    "official_source_checksums",
    "Official test and program PDFs match their pinned SHA-256 values.",
    sourceChecksumsValid,
  );

  const artifactErrors = [];
  for (const artifact of manifest.key_artifacts ?? []) {
    const path = resolve(projectRoot, artifact.path);
    if (
      !existsSync(path) ||
      artifact.bytes !== statSync(path).size ||
      artifact.sha256 !== sha256(path)
    ) {
      artifactErrors.push(artifact.path);
    }
  }
  recordCheck(
    "key_artifact_checksums",
    "Manifest checksums match the explained input, taxonomy, schema, and prerequisite validation reports.",
    manifest.key_artifacts?.length === 6 &&
      artifactErrors.length === 0,
    { errors: artifactErrors },
  );
}

const prerequisiteReports = [
  "reports/yefvv-it-2024-validation.json",
  "reports/yefvv-it-2024-classification-validation.json",
  "reports/yefvv-it-2024-explanations-validation.json",
];
const prerequisiteStatus = prerequisiteReports.map((path) => {
  const report = parseJson(resolve(projectRoot, path));
  return {
    path,
    passed: report.summary?.passed === true,
    check_count: report.summary?.check_count ?? null,
  };
});
recordCheck(
  "prerequisite_validations",
  "Normalization, classification, and explanation validations all pass.",
  prerequisiteStatus.every((item) => item.passed),
  { reports: prerequisiteStatus },
);

const passed = failures.length === 0;
const report = {
  schema_version: 1,
  source_id: sourceId,
  release_version: finalJson?.release?.version ?? null,
  status: passed ? "release_validated" : "release_validation_failed",
  inputs: {
    final_yaml: relative(projectRoot, finalYamlPath),
    final_json: relative(projectRoot, finalJsonPath),
    manifest: relative(projectRoot, manifestPath),
    schema: relative(projectRoot, schemaPath),
    final_yaml_sha256: existsSync(finalYamlPath)
      ? sha256(finalYamlPath)
      : null,
    final_json_sha256: existsSync(finalJsonPath)
      ? sha256(finalJsonPath)
      : null,
    manifest_sha256: existsSync(manifestPath)
      ? sha256(manifestPath)
      : null,
  },
  tools: {
    node: process.version,
    ruby: toolVersion("ruby"),
  },
  summary: {
    passed,
    check_count: checks.length,
    passed_check_count: checks.filter((check) => check.passed).length,
    failed_check_count: failures.length,
    question_count: finalJson?.questions?.length ?? null,
    option_count:
      finalJson?.questions?.reduce(
        (sum, question) => sum + question.options.length,
        0,
      ) ?? null,
    web_asset_count: manifest?.media?.web_asset_count ?? null,
    source_image_count: manifest?.media?.source_image_count ?? null,
  },
  checks,
};

mkdirSync(dirname(reportPath), { recursive: true });
const temporaryPath = `${reportPath}.tmp`;
writeFileSync(
  temporaryPath,
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
renameSync(temporaryPath, reportPath);

console.log(`Release validation checks: ${checks.length}`);
console.log(`Passed checks: ${report.summary.passed_check_count}`);
console.log(`Failed checks: ${report.summary.failed_check_count}`);
console.log(`Final YAML SHA-256: ${report.inputs.final_yaml_sha256}`);
console.log(`Report: ${relative(projectRoot, reportPath)}`);

if (!passed) {
  process.exit(1);
}
