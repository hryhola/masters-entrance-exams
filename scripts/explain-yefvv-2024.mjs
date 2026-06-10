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

import { questionExplanations } from "./yefvv-it-2024-explanation-data.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const completedOn = "2026-06-10";
const expectedQuestionCount = 140;
const expectedOptionCount = 560;
const allowedAnswerReviewStatuses = new Set([
  "verified",
  "verified_with_caveat",
  "disputed",
]);

const inputPath = join(
  projectRoot,
  "data",
  "classified",
  `${sourceId}.json`,
);
const outputJsonPath = join(
  projectRoot,
  "data",
  "explained",
  `${sourceId}.json`,
);
const outputYamlPath = join(
  projectRoot,
  "data",
  "explained",
  `${sourceId}.yaml`,
);
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-explanations.json`,
);

const externalSourcesByQuestion = new Map([
  [
    42,
    [
      {
        type: "external",
        id: "uk-law-operative-search",
        title: "Закон України «Про оперативно-розшукову діяльність»",
        url: "https://zakon.rada.gov.ua/go/2135-12",
        accessed_on: completedOn,
      },
    ],
  ],
  [
    54,
    [
      {
        type: "external",
        id: "uk-law-state-secret",
        title: "Закон України «Про державну таємницю»",
        url: "https://zakon.rada.gov.ua/go/3855-12",
        accessed_on: completedOn,
      },
    ],
  ],
  [
    82,
    [
      {
        type: "external",
        id: "mit-np-completeness",
        title: "MIT 6.006: NP-completeness",
        url: "https://courses.csail.mit.edu/6.006/fall10/lectures/lecture24.pdf",
        accessed_on: completedOn,
      },
      {
        type: "external",
        id: "stanford-knapsack-dynamic-programming",
        title: "Stanford CS161: Dynamic programming and knapsack",
        url: "https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture13.pdf",
        accessed_on: completedOn,
      },
    ],
  ],
  [
    102,
    [
      {
        type: "external",
        id: "postgresql-primary-key",
        title: "PostgreSQL documentation: Primary Keys",
        url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS",
        accessed_on: completedOn,
      },
    ],
  ],
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
    maxBuffer: 40 * 1024 * 1024,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function markdown(text) {
  return { type: "markdown", text };
}

function counts(values) {
  const result = {};
  for (const value of values) {
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

function wordCount(text) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
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

requireCommand("ruby");

if (!existsSync(inputPath)) {
  fail(
    "Classified dataset is missing. Run scripts/classify-yefvv-2024-program-2025.mjs first.",
  );
}

if (questionExplanations.length !== expectedQuestionCount) {
  fail(
    `Expected ${expectedQuestionCount} explanations, found ${questionExplanations.length}.`,
  );
}

const explanationByNumber = new Map(
  questionExplanations.map((entry) => [entry.number, entry]),
);

if (explanationByNumber.size !== expectedQuestionCount) {
  fail("Explanation data contains duplicate question numbers.");
}

const inputDataset = JSON.parse(readFileSync(inputPath, "utf8"));
const dataset = clone(inputDataset);

if (
  !Array.isArray(dataset.questions) ||
  dataset.questions.length !== expectedQuestionCount
) {
  fail(`Expected ${expectedQuestionCount} classified questions.`);
}

for (const question of dataset.questions) {
  const entry = explanationByNumber.get(question.number);
  if (!entry) {
    fail(`Question ${question.number} is missing an explanation.`);
  }
  if (!allowedAnswerReviewStatuses.has(entry.answer_review_status)) {
    fail(
      `Question ${question.number} has unknown answer review status.`,
    );
  }
  if (
    !entry.summary ||
    Object.values(entry.option_notes).some((note) => !note) ||
    (entry.answer_review_status !== "verified" &&
      !entry.answer_review_note)
  ) {
    fail(`Question ${question.number} has incomplete explanation data.`);
  }

  const correctOption = question.answer.correct_option;
  const correctNote = entry.option_notes[correctOption];
  if (
    entry.answer_review_status === "disputed"
      ? correctNote === "="
      : correctNote !== "="
  ) {
    fail(
      `Question ${question.number} explanation does not match the official answer key.`,
    );
  }

  const sources = [
    {
      type: "official_answer",
      reference: `${sourceId}#question-${question.number}`,
      title: `Офіційний маркер відповіді, питання ${question.number}`,
    },
  ];

  if (question.classification.primary_topic) {
    sources.push({
      type: "program_topic",
      reference: question.classification.primary_topic.code,
      title: question.classification.primary_topic.topic,
    });
  }

  sources.push(...(externalSourcesByQuestion.get(question.number) ?? []));

  question.explanation = {
    status: "completed",
    summary: [markdown(entry.summary)],
    option_feedback: question.options.map((option) => {
      const isOfficialOption = option.id === correctOption;
      const isDisputed =
        entry.answer_review_status === "disputed" &&
        isOfficialOption;
      const note =
        entry.option_notes[option.id] === "="
          ? entry.summary
          : entry.option_notes[option.id];

      return {
        option_id: option.id,
        verdict: isDisputed
          ? "official_key_disputed"
          : isOfficialOption
            ? "correct"
            : "incorrect",
        blocks: [markdown(note)],
      };
    }),
    answer_review: {
      status: entry.answer_review_status,
      official_option: correctOption,
      note:
        entry.answer_review_note ??
        "Офіційний ключ узгоджується з предметним поясненням.",
    },
    sources,
    review: {
      status: "editorial_review_completed",
      reviewed_on: completedOn,
      confidence:
        entry.answer_review_status === "disputed"
          ? "low"
          : entry.answer_review_status === "verified_with_caveat"
            ? "medium"
            : "high",
    },
  };
}

dataset.dataset.status = "explained";
dataset.explanations = {
  status: "completed",
  method: "manual_editorial_explanations_with_per_option_feedback",
  input: `data/classified/${sourceId}.json`,
  report: `reports/${sourceId}-explanations.json`,
  completed_on: completedOn,
  language: "uk",
};

const preExplanationContentPreserved =
  JSON.stringify(snapshotPreExplanationContent(dataset)) ===
  JSON.stringify(snapshotPreExplanationContent(inputDataset));

if (!preExplanationContentPreserved) {
  fail("Official or classification content changed while adding explanations.");
}

const optionFeedbackCount = dataset.questions.reduce(
  (sum, question) =>
    sum + question.explanation.option_feedback.length,
  0,
);
const answerReviewCounts = counts(
  dataset.questions.map(
    (question) => question.explanation.answer_review.status,
  ),
);
const confidenceCounts = counts(
  dataset.questions.map(
    (question) => question.explanation.review.confidence,
  ),
);
const summaryWordCounts = dataset.questions.map((question) =>
  wordCount(question.explanation.summary[0].text),
);
const totalExplanationWordCount = dataset.questions.reduce(
  (sum, question) =>
    sum +
    wordCount(question.explanation.summary[0].text) +
    question.explanation.option_feedback.reduce(
      (optionSum, feedback) =>
        optionSum + wordCount(feedback.blocks[0].text),
      0,
    ),
  0,
);

if (optionFeedbackCount !== expectedOptionCount) {
  fail(
    `Expected ${expectedOptionCount} option feedback entries, found ${optionFeedbackCount}.`,
  );
}

const sectionBatches = [
  ...new Set(
    dataset.questions.map(
      (question) =>
        question.classification.primary_topic?.section_code ??
        "unmapped",
    ),
  ),
].map((sectionCode) => {
  const questions = dataset.questions.filter(
    (question) =>
      (question.classification.primary_topic?.section_code ??
        "unmapped") === sectionCode,
  );

  return {
    section_code: sectionCode,
    section:
      questions[0].classification.primary_topic?.section ??
      "Поза програмою 2025",
    question_count: questions.length,
    question_numbers: questions.map((question) => question.number),
    answer_review_counts: counts(
      questions.map(
        (question) => question.explanation.answer_review.status,
      ),
    ),
    completed: questions.every(
      (question) =>
        question.explanation.status === "completed" &&
        question.explanation.review.status ===
          "editorial_review_completed",
    ),
  };
});

const report = {
  schema_version: 1,
  source_id: sourceId,
  status: "explanations_completed",
  completed_on: completedOn,
  input: {
    file: relative(projectRoot, inputPath),
    sha256: sha256(inputPath),
  },
  tools: {
    node: process.version,
    ruby: toolVersion("ruby"),
  },
  method: {
    approach:
      "Manual Ukrainian explanations with a summary, feedback for every option, answer-key review, program-topic references, and targeted external sources.",
    official_answer_policy:
      "Never change answer.correct_option. Record technical disagreement in explanation.answer_review.",
  },
  statistics: {
    question_count: dataset.questions.length,
    completed_explanation_count: dataset.questions.filter(
      (question) => question.explanation.status === "completed",
    ).length,
    option_feedback_count: optionFeedbackCount,
    total_explanation_word_count: totalExplanationWordCount,
    average_summary_word_count: Number(
      (
        summaryWordCounts.reduce((sum, value) => sum + value, 0) /
        summaryWordCounts.length
      ).toFixed(2),
    ),
    answer_review_counts: answerReviewCounts,
    confidence_counts: confidenceCounts,
    external_source_question_count:
      externalSourcesByQuestion.size,
  },
  answer_review: {
    caveat_question_numbers: dataset.questions
      .filter(
        (question) =>
          question.explanation.answer_review.status ===
          "verified_with_caveat",
      )
      .map((question) => question.number),
    disputed_questions: dataset.questions
      .filter(
        (question) =>
          question.explanation.answer_review.status === "disputed",
      )
      .map((question) => ({
        question: question.number,
        official_option: question.answer.correct_option,
        note: question.explanation.answer_review.note,
      })),
  },
  section_batches: sectionBatches,
  validation: {
    complete_question_sequence: true,
    four_feedback_entries_per_question: true,
    official_answers_unchanged: preExplanationContentPreserved,
    classifications_unchanged: preExplanationContentPreserved,
    all_explanations_reviewed: dataset.questions.every(
      (question) =>
        question.explanation.review.status ===
        "editorial_review_completed",
    ),
  },
  outputs: {
    explained_yaml: relative(projectRoot, outputYamlPath),
    explained_json: relative(projectRoot, outputJsonPath),
    report: relative(projectRoot, reportPath),
  },
};

const files = [
  [outputJsonPath, `${JSON.stringify(dataset, null, 2)}\n`],
  [outputYamlPath, jsonToYaml(dataset)],
  [reportPath, `${JSON.stringify(report, null, 2)}\n`],
];

for (const [path, content] of files) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, content, "utf8");
  renameSync(temporaryPath, path);
}

console.log(`Explained questions: ${dataset.questions.length}`);
console.log(`Option feedback entries: ${optionFeedbackCount}`);
console.log(
  `Answer review: ${Object.entries(answerReviewCounts)
    .map(([status, count]) => `${status}=${count}`)
    .join(", ")}`,
);
console.log(`YAML: ${relative(projectRoot, outputYamlPath)}`);
console.log(`Report: ${relative(projectRoot, reportPath)}`);
