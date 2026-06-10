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
const expectedQuestionCount = 140;
const expectedOptionCount = 560;
const classifiedPath = join(
  projectRoot,
  "data",
  "classified",
  `${sourceId}.json`,
);
const explainedJsonPath = join(
  projectRoot,
  "data",
  "explained",
  `${sourceId}.json`,
);
const explainedYamlPath = join(
  projectRoot,
  "data",
  "explained",
  `${sourceId}.yaml`,
);
const explanationReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-explanations.json`,
);
const validationReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-explanations-validation.json`,
);
const schemaPath = join(
  projectRoot,
  "schemas",
  "yefvv-it-question-dataset.schema.json",
);

const allowedReviewStatuses = new Set([
  "verified",
  "verified_with_caveat",
  "disputed",
]);
const allowedConfidences = new Set(["high", "medium", "low"]);
const allowedVerdicts = new Set([
  "correct",
  "incorrect",
  "official_key_disputed",
]);
const allowedSourceTypes = new Set([
  "official_answer",
  "program_topic",
  "external",
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
    maxBuffer: 40 * 1024 * 1024,
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

function snapshotPreExplanationContent(dataset) {
  return {
    dataset: {
      ...dataset.dataset,
      status: "classified",
    },
    extraction: dataset.extraction,
    questions: dataset.questions.map((question) => ({
      ...question,
      explanation: {
        status: "missing",
        blocks: [],
      },
    })),
    enrichment: dataset.enrichment,
    normalization: dataset.normalization,
    classification: dataset.classification,
  };
}

function validateMarkdownBlocks(blocks) {
  return (
    Array.isArray(blocks) &&
    blocks.length > 0 &&
    blocks.every(
      (block) =>
        exactKeys(block, ["type", "text"]) &&
        block.type === "markdown" &&
        isNonEmptyString(block.text) &&
        block.text !== "=",
    )
  );
}

function validateSource(source) {
  if (!isPlainObject(source) || !allowedSourceTypes.has(source.type)) {
    return false;
  }

  if (source.type === "external") {
    return (
      exactKeys(source, [
        "type",
        "id",
        "title",
        "url",
        "accessed_on",
      ]) &&
      isNonEmptyString(source.id) &&
      isNonEmptyString(source.title) &&
      /^https:\/\//u.test(source.url) &&
      /^\d{4}-\d{2}-\d{2}$/u.test(source.accessed_on)
    );
  }

  return (
    exactKeys(source, ["type", "reference", "title"]) &&
    isNonEmptyString(source.reference) &&
    isNonEmptyString(source.title)
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

let classified;
let explainedJson;
let explainedYaml;
let explanationReport;
let schema;

for (const [id, description, path, parser, assign] of [
  [
    "classified_json_syntax",
    "Classified source JSON parses successfully.",
    classifiedPath,
    parseJson,
    (value) => {
      classified = value;
    },
  ],
  [
    "explained_json_syntax",
    "Explained JSON parses successfully.",
    explainedJsonPath,
    parseJson,
    (value) => {
      explainedJson = value;
    },
  ],
  [
    "explained_yaml_syntax",
    "Explained YAML parses safely.",
    explainedYamlPath,
    parseYaml,
    (value) => {
      explainedYaml = value;
    },
  ],
  [
    "explanation_report_syntax",
    "Explanation report JSON parses successfully.",
    explanationReportPath,
    parseJson,
    (value) => {
      explanationReport = value;
    },
  ],
  [
    "schema_syntax",
    "Dataset JSON Schema parses successfully.",
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

if (explainedJson && explainedYaml) {
  recordCheck(
    "yaml_json_equivalence",
    "Explained YAML and JSON represent identical data.",
    JSON.stringify(explainedJson) === JSON.stringify(explainedYaml),
  );
}

if (schema) {
  recordCheck(
    "schema_contract",
    "Schema documents explained datasets and completed explanation objects.",
    schema.properties?.explanations?.$ref ===
      "#/$defs/explanationMetadata" &&
      schema.$defs?.questionExplanation !== undefined &&
      schema.$defs?.datasetMetadata?.properties?.status?.enum?.includes(
        "explained",
      ),
  );
}

if (classified && explainedJson) {
  recordCheck(
    "pre_explanation_content_preservation",
    "Prompts, options, answers, sources, reviews, and classifications are unchanged.",
    JSON.stringify(snapshotPreExplanationContent(classified)) ===
      JSON.stringify(snapshotPreExplanationContent(explainedJson)),
  );
}

if (explainedJson) {
  const questions = Array.isArray(explainedJson.questions)
    ? explainedJson.questions
    : [];
  const errors = [];
  let feedbackCount = 0;

  if (
    explainedJson.dataset?.status !== "explained" ||
    explainedJson.explanations?.status !== "completed" ||
    questions.length !== expectedQuestionCount
  ) {
    errors.push({
      path: "$",
      message: "Explained dataset metadata or question count is invalid.",
    });
  }

  for (const [index, question] of questions.entries()) {
    const path = `$.questions[${index}].explanation`;
    const explanation = question.explanation;

    if (
      !exactKeys(explanation, [
        "status",
        "summary",
        "option_feedback",
        "answer_review",
        "sources",
        "review",
      ])
    ) {
      errors.push({ path, message: "Unexpected explanation shape." });
      continue;
    }

    const feedback = explanation.option_feedback;
    feedbackCount += Array.isArray(feedback) ? feedback.length : 0;
    const expectedOptionIds = question.options.map((option) => option.id);
    const feedbackIds = Array.isArray(feedback)
      ? feedback.map((item) => item.option_id)
      : [];
    const reviewStatus = explanation.answer_review?.status;
    const officialOption = question.answer.correct_option;
    const expectedOfficialVerdict =
      reviewStatus === "disputed"
        ? "official_key_disputed"
        : "correct";

    const feedbackValid =
      Array.isArray(feedback) &&
      feedback.length === 4 &&
      JSON.stringify(feedbackIds) ===
        JSON.stringify(expectedOptionIds) &&
      feedback.every(
        (item) =>
          exactKeys(item, ["option_id", "verdict", "blocks"]) &&
          allowedVerdicts.has(item.verdict) &&
          validateMarkdownBlocks(item.blocks),
      ) &&
      feedback.find((item) => item.option_id === officialOption)
        ?.verdict === expectedOfficialVerdict &&
      feedback
        .filter((item) => item.option_id !== officialOption)
        .every((item) => item.verdict === "incorrect");

    const reviewValid =
      exactKeys(explanation.answer_review, [
        "status",
        "official_option",
        "note",
      ]) &&
      allowedReviewStatuses.has(reviewStatus) &&
      explanation.answer_review.official_option === officialOption &&
      isNonEmptyString(explanation.answer_review.note);
    const expectedConfidence =
      reviewStatus === "disputed"
        ? "low"
        : reviewStatus === "verified_with_caveat"
          ? "medium"
          : "high";
    const editorialReviewValid =
      exactKeys(explanation.review, [
        "status",
        "reviewed_on",
        "confidence",
      ]) &&
      explanation.review.status === "editorial_review_completed" &&
      explanation.review.reviewed_on === "2026-06-10" &&
      allowedConfidences.has(explanation.review.confidence) &&
      explanation.review.confidence === expectedConfidence;
    const sourcesValid =
      Array.isArray(explanation.sources) &&
      explanation.sources.length >= 1 &&
      explanation.sources.every(validateSource) &&
      explanation.sources.filter(
        (source) => source.type === "official_answer",
      ).length === 1 &&
      (question.classification.primary_topic === null ||
        explanation.sources.some(
          (source) =>
            source.type === "program_topic" &&
            source.reference ===
              question.classification.primary_topic.code,
        ));

    if (
      question.number !== index + 1 ||
      explanation.status !== "completed" ||
      !validateMarkdownBlocks(explanation.summary) ||
      !feedbackValid ||
      !reviewValid ||
      !editorialReviewValid ||
      !sourcesValid
    ) {
      errors.push({
        path,
        message: "Explanation content or review metadata is invalid.",
      });
    }
  }

  recordCheck(
    "explanation_completeness",
    "All 140 questions have reviewed summaries, four option feedback entries, and sources.",
    errors.length === 0 && feedbackCount === expectedOptionCount,
    {
      question_count: questions.length,
      feedback_count: feedbackCount,
      error_count: errors.length,
      errors,
    },
  );

  const reviewCounts = counts(
    questions.map(
      (question) => question.explanation?.answer_review?.status,
    ),
  );
  const disputedQuestions = questions
    .filter(
      (question) =>
        question.explanation?.answer_review?.status === "disputed",
    )
    .map((question) => question.number);
  const externalSourceQuestions = questions
    .filter((question) =>
      question.explanation?.sources?.some(
        (source) => source.type === "external",
      ),
    )
    .map((question) => question.number);

  recordCheck(
    "answer_review_inventory",
    "Answer-review statuses and disputed keys match the editorial decisions.",
    reviewCounts.verified === 97 &&
      reviewCounts.verified_with_caveat === 41 &&
      reviewCounts.disputed === 2 &&
      JSON.stringify(disputedQuestions) ===
        JSON.stringify([82, 102]) &&
      JSON.stringify(externalSourceQuestions) ===
        JSON.stringify([42, 54, 82, 102]),
    {
      answer_review_counts: reviewCounts,
      disputed_question_numbers: disputedQuestions,
      external_source_question_numbers: externalSourceQuestions,
    },
  );
}

if (explanationReport && explainedJson) {
  const questions = explainedJson.questions;
  const reviewCounts = counts(
    questions.map(
      (question) => question.explanation.answer_review.status,
    ),
  );
  const reportValid =
    explanationReport.status === "explanations_completed" &&
    explanationReport.statistics?.question_count ===
      expectedQuestionCount &&
    explanationReport.statistics?.completed_explanation_count ===
      expectedQuestionCount &&
    explanationReport.statistics?.option_feedback_count ===
      expectedOptionCount &&
    JSON.stringify(
      explanationReport.statistics?.answer_review_counts,
    ) === JSON.stringify(reviewCounts) &&
    explanationReport.section_batches?.length === 11 &&
    explanationReport.section_batches.every(
      (batch) => batch.completed === true,
    ) &&
    explanationReport.validation?.official_answers_unchanged === true &&
    explanationReport.validation?.classifications_unchanged === true;

  recordCheck(
    "explanation_report_consistency",
    "Explanation report matches the explained dataset.",
    reportValid,
    {
      report_answer_review_counts:
        explanationReport.statistics?.answer_review_counts ?? null,
      dataset_answer_review_counts: reviewCounts,
    },
  );
}

const passed = failures.length === 0;
const report = {
  schema_version: 1,
  source_id: sourceId,
  status: passed ? "validation_passed" : "validation_failed",
  inputs: {
    classified_json: relative(projectRoot, classifiedPath),
    explained_json: relative(projectRoot, explainedJsonPath),
    explained_yaml: relative(projectRoot, explainedYamlPath),
    explanation_report: relative(projectRoot, explanationReportPath),
    schema: relative(projectRoot, schemaPath),
    explained_json_sha256: existsSync(explainedJsonPath)
      ? sha256(explainedJsonPath)
      : null,
    explained_yaml_sha256: existsSync(explainedYamlPath)
      ? sha256(explainedYamlPath)
      : null,
    explanation_report_sha256: existsSync(explanationReportPath)
      ? sha256(explanationReportPath)
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
    question_count: explainedJson?.questions?.length ?? null,
    option_feedback_count:
      explainedJson?.questions?.reduce(
        (sum, question) =>
          sum +
          (question.explanation?.option_feedback?.length ?? 0),
        0,
      ) ?? null,
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
