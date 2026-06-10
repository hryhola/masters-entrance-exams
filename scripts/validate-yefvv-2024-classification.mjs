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

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const taxonomyId = "yefvv-it-program-2025";
const expectedQuestionCount = 140;
const expectedTopicCount = 127;
const expectedProgramChecksum =
  "41cde7339e94ac7a1aae6ca5e7003fefe0148ae60923eb9b607bc34a2a16f8f4";

const normalizedPath = join(
  projectRoot,
  "data",
  "normalized",
  `${sourceId}.json`,
);
const classifiedJsonPath = join(
  projectRoot,
  "data",
  "classified",
  `${sourceId}.json`,
);
const classifiedYamlPath = join(
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
const alignmentReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-program-2025-alignment.json`,
);
const validationReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-classification-validation.json`,
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
    maxBuffer: 30 * 1024 * 1024,
  });

  return JSON.parse(json);
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function exactKeys(value, expected) {
  return (
    isPlainObject(value) &&
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort())
  );
}

function counts(values) {
  const result = {};
  for (const value of values) {
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
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

function validateTopicReference(reference, topicByCode) {
  if (
    !exactKeys(reference, [
      "code",
      "section_code",
      "section",
      "topic",
      "expected_cognitive_level",
    ])
  ) {
    return false;
  }

  const topic = topicByCode.get(reference.code);
  return (
    topic !== undefined &&
    reference.section_code === topic.section_code &&
    reference.section === topic.section &&
    reference.topic === topic.title &&
    reference.expected_cognitive_level === topic.cognitive_level
  );
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

let normalized;
let classifiedJson;
let classifiedYaml;
let taxonomyJson;
let taxonomyYaml;
let alignmentReport;

for (const [id, description, path, parser, assign] of [
  [
    "normalized_json_syntax",
    "Normalized source JSON parses successfully.",
    normalizedPath,
    parseJson,
    (value) => {
      normalized = value;
    },
  ],
  [
    "classified_json_syntax",
    "Classified JSON parses successfully.",
    classifiedJsonPath,
    parseJson,
    (value) => {
      classifiedJson = value;
    },
  ],
  [
    "classified_yaml_syntax",
    "Classified YAML parses safely.",
    classifiedYamlPath,
    parseYaml,
    (value) => {
      classifiedYaml = value;
    },
  ],
  [
    "taxonomy_json_syntax",
    "Program taxonomy JSON parses successfully.",
    taxonomyJsonPath,
    parseJson,
    (value) => {
      taxonomyJson = value;
    },
  ],
  [
    "taxonomy_yaml_syntax",
    "Program taxonomy YAML parses safely.",
    taxonomyYamlPath,
    parseYaml,
    (value) => {
      taxonomyYaml = value;
    },
  ],
  [
    "alignment_report_syntax",
    "Alignment report JSON parses successfully.",
    alignmentReportPath,
    parseJson,
    (value) => {
      alignmentReport = value;
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

if (classifiedJson && classifiedYaml) {
  recordCheck(
    "classified_yaml_json_equivalence",
    "Classified YAML and JSON represent identical data.",
    JSON.stringify(classifiedJson) === JSON.stringify(classifiedYaml),
  );
}

if (taxonomyJson && taxonomyYaml) {
  recordCheck(
    "taxonomy_yaml_json_equivalence",
    "Taxonomy YAML and JSON represent identical data.",
    JSON.stringify(taxonomyJson) === JSON.stringify(taxonomyYaml),
  );
}

let topicByCode = new Map();

if (taxonomyJson) {
  const sections = Array.isArray(taxonomyJson.sections)
    ? taxonomyJson.sections
    : [];
  const topics = Array.isArray(taxonomyJson.topics)
    ? taxonomyJson.topics
    : [];
  topicByCode = new Map(topics.map((topic) => [topic.code, topic]));
  const cognitiveCounts = counts(
    topics.map((topic) => topic.cognitive_level),
  );
  const midpointSum = sections.reduce(
    (sum, section) => sum + (section.weight_midpoint ?? 0),
    0,
  );
  const programChecksum = existsSync(programSourcePath)
    ? sha256(programSourcePath)
    : null;
  const taxonomyValid =
    taxonomyJson.taxonomy?.id === taxonomyId &&
    sections.length === 10 &&
    topics.length === expectedTopicCount &&
    topicByCode.size === expectedTopicCount &&
    cognitiveCounts.A === 9 &&
    cognitiveCounts.B === 110 &&
    cognitiveCounts.C === 8 &&
    (cognitiveCounts.D ?? 0) === 0 &&
    midpointSum === 100 &&
    taxonomyJson.sections.find((section) => section.code === "6")
      ?.weight_summary?.min === 16 &&
    taxonomyJson.sections.find((section) => section.code === "6")
      ?.weight_detailed?.min === 15 &&
    programChecksum === expectedProgramChecksum &&
    taxonomyJson.taxonomy?.source?.checksum?.value ===
      expectedProgramChecksum;

  recordCheck(
    "taxonomy_integrity",
    "Taxonomy preserves all sections, 127 cognitive positions, weights, discrepancy, and source checksum.",
    taxonomyValid,
    {
      section_count: sections.length,
      topic_count: topics.length,
      cognitive_level_counts: cognitiveCounts,
      weight_midpoint_sum: midpointSum,
      program_sha256: programChecksum,
    },
  );
}

if (classifiedJson && topicByCode.size > 0) {
  const questions = Array.isArray(classifiedJson.questions)
    ? classifiedJson.questions
    : [];
  const errors = [];

  if (
    classifiedJson.dataset?.status !== "classified" ||
    classifiedJson.classification?.status !== "completed" ||
    classifiedJson.classification?.taxonomy_id !== taxonomyId ||
    questions.length !== expectedQuestionCount
  ) {
    errors.push({
      path: "$",
      message: "Classified dataset metadata or question count is invalid.",
    });
  }

  questions.forEach((question, index) => {
    const path = `$.questions[${index}].classification`;
    const classification = question.classification;

    if (
      !exactKeys(classification, [
        "status",
        "taxonomy_id",
        "alignment",
        "primary_topic",
        "secondary_topics",
        "cognitive_level",
        "tags",
        "format_compliance",
        "rationale",
        "review",
      ])
    ) {
      errors.push({ path, message: "Unexpected classification shape." });
      return;
    }

    const primaryValid =
      classification.primary_topic === null ||
      validateTopicReference(
        classification.primary_topic,
        topicByCode,
      );
    const secondaryValid =
      Array.isArray(classification.secondary_topics) &&
      classification.secondary_topics.every((topic) =>
        validateTopicReference(topic, topicByCode),
      );
    const tagsValid =
      Array.isArray(classification.tags) &&
      classification.tags.length > 0 &&
      classification.tags.every(isNonEmptyString) &&
      new Set(classification.tags).size === classification.tags.length;
    const violations =
      classification.format_compliance?.violations;
    const violationsValid =
      Array.isArray(violations) &&
      violations.every((item) => allowedViolations.has(item));
    const isLegacy = classification.alignment === "legacy";
    const formatValid =
      exactKeys(classification.format_compliance, [
        "status",
        "violations",
      ]) &&
      violationsValid &&
      (isLegacy
        ? classification.format_compliance.status === "non_compliant" &&
          violations.length > 0
        : classification.format_compliance.status === "compliant" &&
          violations.length === 0);
    const unmappedValid =
      (classification.alignment === "unmapped") ===
      (classification.primary_topic === null);

    if (
      question.number !== index + 1 ||
      classification.status !== "classified" ||
      classification.taxonomy_id !== taxonomyId ||
      !allowedAlignments.has(classification.alignment) ||
      !allowedCognitiveLevels.has(classification.cognitive_level) ||
      !primaryValid ||
      !secondaryValid ||
      !tagsValid ||
      !formatValid ||
      !unmappedValid ||
      !isNonEmptyString(classification.rationale) ||
      classification.review?.status !== "manually_reviewed" ||
      classification.review?.reviewed_on !== "2026-06-10"
    ) {
      errors.push({
        path,
        message: "Classification values or references are invalid.",
      });
    }
  });

  recordCheck(
    "classification_completeness",
    "All 140 questions have complete reviewed classifications with valid topic references.",
    errors.length === 0,
    { error_count: errors.length, errors },
  );

  const alignmentCounts = counts(
    questions.map(
      (question) => question.classification?.alignment,
    ),
  );
  const cognitiveCounts = counts(
    questions.map(
      (question) => question.classification?.cognitive_level,
    ),
  );
  const legacyQuestions = questions
    .filter(
      (question) =>
        question.classification?.alignment === "legacy",
    )
    .map((question) => question.number);
  const unmappedQuestions = questions
    .filter(
      (question) =>
        question.classification?.alignment === "unmapped",
    )
    .map((question) => question.number);

  recordCheck(
    "classification_inventory",
    "Alignment and cognitive-level inventories are complete and internally consistent.",
    Object.values(alignmentCounts).reduce(
      (sum, count) => sum + count,
      0,
    ) === expectedQuestionCount &&
      Object.values(cognitiveCounts).reduce(
        (sum, count) => sum + count,
        0,
      ) === expectedQuestionCount &&
      JSON.stringify(legacyQuestions) ===
        JSON.stringify([2, 51, 59, 91, 126]) &&
      JSON.stringify(unmappedQuestions) ===
        JSON.stringify([54, 88, 96]),
    {
      alignment_counts: alignmentCounts,
      cognitive_level_counts: cognitiveCounts,
      legacy_question_numbers: legacyQuestions,
      unmapped_question_numbers: unmappedQuestions,
    },
  );
}

if (normalized && classifiedJson) {
  const preserved =
    JSON.stringify(snapshotOfficialContent(normalized)) ===
    JSON.stringify(snapshotOfficialContent(classifiedJson));
  recordCheck(
    "official_content_preservation",
    "Classification does not change official prompts, options, answers, sources, or review data.",
    preserved,
  );
}

if (alignmentReport && classifiedJson && taxonomyJson) {
  const questions = classifiedJson.questions;
  const alignmentCounts = counts(
    questions.map(
      (question) => question.classification.alignment,
    ),
  );
  const cognitiveCounts = counts(
    questions.map(
      (question) => question.classification.cognitive_level,
    ),
  );
  const coveredTopicCodes = new Set(
    questions.flatMap((question) => {
      const classification = question.classification;
      return [
        ...(classification.primary_topic
          ? [classification.primary_topic.code]
          : []),
        ...classification.secondary_topics.map((topic) => topic.code),
      ];
    }),
  );
  const reportValid =
    alignmentReport.status === "classification_completed" &&
    alignmentReport.summary?.question_count === expectedQuestionCount &&
    alignmentReport.summary?.classified_question_count ===
      expectedQuestionCount &&
    alignmentReport.summary?.mapped_question_count ===
      questions.filter(
        (question) => question.classification.primary_topic !== null,
      ).length &&
    alignmentReport.summary?.covered_topic_count ===
      coveredTopicCodes.size &&
    alignmentReport.summary?.program_topic_count ===
      taxonomyJson.topics.length &&
    JSON.stringify(alignmentReport.summary?.alignment_counts) ===
      JSON.stringify(alignmentCounts) &&
    JSON.stringify(alignmentReport.summary?.cognitive_level_counts) ===
      JSON.stringify(cognitiveCounts) &&
    alignmentReport.summary?.official_content_preserved === true &&
    alignmentReport.section_coverage?.length === 10;

  recordCheck(
    "alignment_report_consistency",
    "Alignment report matches the classified dataset and taxonomy.",
    reportValid,
    {
      report_alignment_counts:
        alignmentReport.summary?.alignment_counts ?? null,
      dataset_alignment_counts: alignmentCounts,
      covered_topic_count: coveredTopicCodes.size,
    },
  );
}

const passed = failures.length === 0;
const report = {
  schema_version: 1,
  source_id: sourceId,
  taxonomy_id: taxonomyId,
  status: passed ? "validation_passed" : "validation_failed",
  inputs: {
    normalized_json: relative(projectRoot, normalizedPath),
    classified_json: relative(projectRoot, classifiedJsonPath),
    classified_yaml: relative(projectRoot, classifiedYamlPath),
    taxonomy_json: relative(projectRoot, taxonomyJsonPath),
    taxonomy_yaml: relative(projectRoot, taxonomyYamlPath),
    alignment_report: relative(projectRoot, alignmentReportPath),
    classified_json_sha256: existsSync(classifiedJsonPath)
      ? sha256(classifiedJsonPath)
      : null,
    classified_yaml_sha256: existsSync(classifiedYamlPath)
      ? sha256(classifiedYamlPath)
      : null,
    taxonomy_json_sha256: existsSync(taxonomyJsonPath)
      ? sha256(taxonomyJsonPath)
      : null,
    taxonomy_yaml_sha256: existsSync(taxonomyYamlPath)
      ? sha256(taxonomyYamlPath)
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
    question_count: classifiedJson?.questions?.length ?? null,
    topic_count: taxonomyJson?.topics?.length ?? null,
  },
  checks,
};

mkdirSync(dirname(validationReportPath), { recursive: true });
const temporaryPath = `${validationReportPath}.tmp`;
writeFileSync(
  temporaryPath,
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
renameSync(temporaryPath, validationReportPath);

console.log(`Validation checks: ${checks.length}`);
console.log(`Passed checks: ${report.summary.passed_check_count}`);
console.log(`Failed checks: ${report.summary.failed_check_count}`);
console.log(`Report: ${relative(projectRoot, validationReportPath)}`);

if (!passed) {
  process.exit(1);
}
