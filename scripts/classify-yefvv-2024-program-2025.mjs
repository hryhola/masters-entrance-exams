#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  programSections,
  programTopics,
  questionClassifications,
} from "./yefvv-it-program-2025-data.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const taxonomyId = "yefvv-it-program-2025";
const completedOn = "2026-06-10";
const expectedQuestionCount = 140;
const expectedTopicCount = 127;
const expectedProgramChecksum =
  "41cde7339e94ac7a1aae6ca5e7003fefe0148ae60923eb9b607bc34a2a16f8f4";

const inputPath = join(
  projectRoot,
  "data",
  "normalized",
  `${sourceId}.json`,
);
const outputJsonPath = join(
  projectRoot,
  "data",
  "classified",
  `${sourceId}.json`,
);
const outputYamlPath = join(
  projectRoot,
  "data",
  "classified",
  `${sourceId}.yaml`,
);
const taxonomyJsonPath = join(
  projectRoot,
  "data",
  "taxonomies",
  `${taxonomyId}.json`,
);
const taxonomyYamlPath = join(
  projectRoot,
  "data",
  "taxonomies",
  `${taxonomyId}.yaml`,
);
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-program-2025-alignment.json`,
);
const programSourcePath = join(
  projectRoot,
  "raw",
  "ЄФВВ - ІНФОРМАЦІЙНІ ТЕХНОЛОГІЇ",
  "programa-jefvv-informtexnologiyi-2025.pdf",
);

const allowedAlignments = new Set([
  "aligned",
  "partial",
  "legacy",
  "unmapped",
]);
const allowedCognitiveLevels = new Set(["A", "B", "C", "D"]);
const allowedViolations = new Set([
  "concrete_programming_language",
  "pseudocode",
  "program_fragment",
]);

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    maxBuffer: 30 * 1024 * 1024,
  });
}

function counts(values) {
  const result = {};
  for (const value of values) {
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function topicReference(topic, sectionByCode) {
  if (!topic) {
    return null;
  }

  return {
    code: topic.code,
    section_code: topic.section_code,
    section: sectionByCode.get(topic.section_code).title,
    topic: topic.title,
    expected_cognitive_level: topic.cognitive_level,
  };
}

function snapshotOfficialContent(dataset) {
  return {
    dataset: {
      ...dataset.dataset,
      status: "normalized",
    },
    extraction: dataset.extraction,
    questions: dataset.questions.map((question) => ({
      ...question,
      classification: { status: "pending" },
    })),
    enrichment: dataset.enrichment,
    normalization: dataset.normalization,
  };
}

requireCommand("ruby");

if (!existsSync(inputPath)) {
  fail(
    "Normalized dataset is missing. Run scripts/normalize-yefvv-2024.mjs first.",
  );
}

if (!existsSync(programSourcePath)) {
  fail("The official 2025 program PDF is missing.");
}

if (sha256(programSourcePath) !== expectedProgramChecksum) {
  fail("The official 2025 program PDF checksum has changed.");
}

if (programSections.length !== 10) {
  fail(`Expected 10 program sections, found ${programSections.length}.`);
}

if (programTopics.length !== expectedTopicCount) {
  fail(
    `Expected ${expectedTopicCount} program topics, found ${programTopics.length}.`,
  );
}

if (questionClassifications.length !== expectedQuestionCount) {
  fail(
    `Expected ${expectedQuestionCount} classifications, found ${questionClassifications.length}.`,
  );
}

const sectionByCode = new Map(
  programSections.map((section) => [section.code, section]),
);
const topicByCode = new Map(
  programTopics.map((topic) => [topic.code, topic]),
);
const classificationByNumber = new Map(
  questionClassifications.map((entry) => [entry.number, entry]),
);

if (
  sectionByCode.size !== programSections.length ||
  topicByCode.size !== programTopics.length ||
  classificationByNumber.size !== questionClassifications.length
) {
  fail("Program sections, topics, or question classifications contain duplicates.");
}

for (const topic of programTopics) {
  if (
    !sectionByCode.has(topic.section_code) ||
    !allowedCognitiveLevels.has(topic.cognitive_level) ||
    !Number.isInteger(topic.source_page)
  ) {
    fail(`Invalid program topic ${topic.code}.`);
  }
}

for (let number = 1; number <= expectedQuestionCount; number += 1) {
  const entry = classificationByNumber.get(number);
  if (!entry) {
    fail(`Question ${number} is missing a classification.`);
  }
  if (
    !allowedAlignments.has(entry.alignment) ||
    !allowedCognitiveLevels.has(entry.cognitive_level) ||
    entry.tags.length === 0 ||
    !entry.rationale
  ) {
    fail(`Question ${number} has incomplete classification metadata.`);
  }
  if (
    entry.primary_topic_code !== null &&
    !topicByCode.has(entry.primary_topic_code)
  ) {
    fail(
      `Question ${number} references unknown topic ${entry.primary_topic_code}.`,
    );
  }
  if (
    entry.secondary_topic_codes.some((code) => !topicByCode.has(code))
  ) {
    fail(`Question ${number} references an unknown secondary topic.`);
  }
  if (entry.violations.some((item) => !allowedViolations.has(item))) {
    fail(`Question ${number} has an unknown format violation.`);
  }
  if (entry.alignment === "legacy" && entry.violations.length === 0) {
    fail(`Legacy question ${number} must identify a format violation.`);
  }
  if (entry.alignment !== "legacy" && entry.violations.length > 0) {
    fail(`Only legacy questions may have format violations.`);
  }
  if (
    entry.alignment === "unmapped" !==
    (entry.primary_topic_code === null)
  ) {
    fail(
      `Question ${number} must use a null topic exactly when it is unmapped.`,
    );
  }
}

const inputDataset = JSON.parse(readFileSync(inputPath, "utf8"));
const dataset = clone(inputDataset);

if (
  !Array.isArray(dataset.questions) ||
  dataset.questions.length !== expectedQuestionCount
) {
  fail(`Expected ${expectedQuestionCount} normalized questions.`);
}

for (const question of dataset.questions) {
  const entry = classificationByNumber.get(question.number);
  const primaryTopic = entry.primary_topic_code
    ? topicByCode.get(entry.primary_topic_code)
    : null;

  question.classification = {
    status: "classified",
    taxonomy_id: taxonomyId,
    alignment: entry.alignment,
    primary_topic: topicReference(primaryTopic, sectionByCode),
    secondary_topics: entry.secondary_topic_codes.map((code) =>
      topicReference(topicByCode.get(code), sectionByCode),
    ),
    cognitive_level: entry.cognitive_level,
    tags: entry.tags,
    format_compliance: {
      status:
        entry.violations.length === 0 ? "compliant" : "non_compliant",
      violations: entry.violations,
    },
    rationale: entry.rationale,
    review: {
      status: "manually_reviewed",
      reviewed_on: completedOn,
    },
  };
}

dataset.dataset.status = "classified";
dataset.classification = {
  status: "completed",
  method: "manual_question_by_question_alignment",
  taxonomy_id: taxonomyId,
  taxonomy_file: `data/taxonomies/${taxonomyId}.yaml`,
  input: `data/normalized/${sourceId}.json`,
  report: `reports/${sourceId}-program-2025-alignment.json`,
  completed_on: completedOn,
};

const officialContentPreserved =
  JSON.stringify(snapshotOfficialContent(dataset)) ===
  JSON.stringify(snapshotOfficialContent(inputDataset));

if (!officialContentPreserved) {
  fail("Official question content changed during classification.");
}

const taxonomy = {
  schema_version: 1,
  taxonomy: {
    id: taxonomyId,
    title:
      "Програма предметного тесту з інформаційних технологій ЄФВВ",
    approved_on: "2025-12-02",
    order: "МОН України № 1578",
    intended_exam_year: 2026,
    language: "uk",
    source: {
      file: relative(projectRoot, programSourcePath),
      page_count: 12,
      checksum: {
        algorithm: "sha256",
        value: expectedProgramChecksum,
      },
    },
  },
  restrictions: {
    prohibited_in_test_items: [
      "concrete_programming_language",
      "pseudocode",
      "program_fragment",
    ],
    sql_exception:
      "SQL query construction is explicitly required by topics 3.5 and 3.6 and is not treated as a prohibited programming-language fragment.",
  },
  sections: programSections.map((section) => ({
    ...section,
    weight_midpoint:
      (section.weight_summary.min + section.weight_summary.max) / 2,
    topic_count: programTopics.filter(
      (topic) => topic.section_code === section.code,
    ).length,
  })),
  topics: programTopics.map((topic) => ({
    ...topic,
    section: sectionByCode.get(topic.section_code).title,
    source_file: relative(projectRoot, programSourcePath),
  })),
};

const alignmentCounts = counts(
  dataset.questions.map(
    (question) => question.classification.alignment,
  ),
);
const cognitiveLevelCounts = counts(
  dataset.questions.map(
    (question) => question.classification.cognitive_level,
  ),
);
const formatViolationQuestions = dataset.questions
  .filter(
    (question) =>
      question.classification.format_compliance.status ===
      "non_compliant",
  )
  .map((question) => ({
    question: question.number,
    violations:
      question.classification.format_compliance.violations,
  }));
const mappedQuestions = dataset.questions.filter(
  (question) => question.classification.primary_topic !== null,
);
const coveredTopicCodes = [
  ...new Set(
    mappedQuestions.flatMap((question) => [
      question.classification.primary_topic.code,
      ...question.classification.secondary_topics.map(
        (topic) => topic.code,
      ),
    ]),
  ),
].sort((left, right) =>
  left.localeCompare(right, "en", { numeric: true }),
);

const sectionCoverage = programSections.map((section) => {
  const questions = mappedQuestions.filter(
    (question) =>
      question.classification.primary_topic.section_code ===
      section.code,
  );
  const share = (questions.length / expectedQuestionCount) * 100;
  const midpoint =
    (section.weight_summary.min + section.weight_summary.max) / 2;

  return {
    section_code: section.code,
    section: section.title,
    official_weight: section.weight_summary,
    official_weight_midpoint: midpoint,
    question_count: questions.length,
    question_share_percent: round(share),
    difference_from_midpoint_percentage_points: round(
      share - midpoint,
    ),
    question_numbers: questions.map((question) => question.number),
    alignment_counts: counts(
      questions.map(
        (question) => question.classification.alignment,
      ),
    ),
  };
});

const report = {
  schema_version: 1,
  source_id: sourceId,
  taxonomy_id: taxonomyId,
  status: "classification_completed",
  completed_on: completedOn,
  inputs: {
    normalized_dataset: relative(projectRoot, inputPath),
    normalized_dataset_sha256: sha256(inputPath),
    program: relative(projectRoot, programSourcePath),
    program_sha256: expectedProgramChecksum,
  },
  tools: {
    node: process.version,
    ruby: toolVersion("ruby"),
  },
  method: {
    classification:
      "Manual semantic alignment of every question with the official 2025 program taxonomy.",
    alignment_statuses: {
      aligned: "Directly covered by an official program topic.",
      partial:
        "Related to a program topic but narrower, more specific, or not explicitly listed.",
      legacy:
        "Related content presented using a format explicitly prohibited by the 2025 program.",
      unmapped: "No defensible topic match in the 2025 program.",
    },
    cognitive_levels: {
      A: "Knowledge and recall.",
      B: "Understanding, comparison, and recognition.",
      C: "Application to a concrete situation or calculation.",
      D: "Analysis, synthesis, or evaluation.",
    },
  },
  summary: {
    question_count: dataset.questions.length,
    classified_question_count: dataset.questions.filter(
      (question) =>
        question.classification.status === "classified",
    ).length,
    mapped_question_count: mappedQuestions.length,
    covered_topic_count: coveredTopicCodes.length,
    program_topic_count: programTopics.length,
    alignment_counts: alignmentCounts,
    cognitive_level_counts: cognitiveLevelCounts,
    format_non_compliant_count: formatViolationQuestions.length,
    official_content_preserved: officialContentPreserved,
  },
  section_coverage: sectionCoverage,
  topic_coverage: {
    covered_topic_codes: coveredTopicCodes,
    uncovered_topic_codes: programTopics
      .map((topic) => topic.code)
      .filter((code) => !coveredTopicCodes.includes(code)),
  },
  review_queues: {
    partial_question_numbers: dataset.questions
      .filter(
        (question) =>
          question.classification.alignment === "partial",
      )
      .map((question) => question.number),
    legacy_questions: formatViolationQuestions,
    unmapped_question_numbers: dataset.questions
      .filter(
        (question) =>
          question.classification.alignment === "unmapped",
      )
      .map((question) => question.number),
  },
  outputs: {
    classified_yaml: relative(projectRoot, outputYamlPath),
    classified_json: relative(projectRoot, outputJsonPath),
    taxonomy_yaml: relative(projectRoot, taxonomyYamlPath),
    taxonomy_json: relative(projectRoot, taxonomyJsonPath),
    report: relative(projectRoot, reportPath),
  },
};

const files = [
  [outputJsonPath, `${JSON.stringify(dataset, null, 2)}\n`],
  [outputYamlPath, jsonToYaml(dataset)],
  [taxonomyJsonPath, `${JSON.stringify(taxonomy, null, 2)}\n`],
  [taxonomyYamlPath, jsonToYaml(taxonomy)],
  [reportPath, `${JSON.stringify(report, null, 2)}\n`],
];

for (const [path] of files) {
  mkdirSync(dirname(path), { recursive: true });
}

for (const [path, content] of files) {
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, content, "utf8");
  renameSync(temporaryPath, path);
}

console.log(`Classified questions: ${dataset.questions.length}`);
console.log(`Mapped questions: ${mappedQuestions.length}`);
console.log(`Covered program topics: ${coveredTopicCodes.length}`);
console.log(
  `Alignment: ${Object.entries(alignmentCounts)
    .map(([status, count]) => `${status}=${count}`)
    .join(", ")}`,
);
console.log(`YAML: ${relative(projectRoot, outputYamlPath)}`);
console.log(`Taxonomy: ${relative(projectRoot, taxonomyYamlPath)}`);
console.log(`Report: ${relative(projectRoot, reportPath)}`);
