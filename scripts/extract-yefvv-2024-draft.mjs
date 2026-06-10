#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const manifestPath = join(projectRoot, "sources", sourceId, "source.json");
const textDirectory = join(projectRoot, "sources", sourceId, "text");
const draftPath = join(projectRoot, "data", "drafts", `${sourceId}.yaml`);
const draftJsonPath = join(
  projectRoot,
  "data",
  "drafts",
  `${sourceId}.json`,
);
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-draft-extraction.json`,
);

const expectedQuestionCount = 140;
const optionIds = ["a", "b", "c", "d"];

const visualReviewReasons = new Map([
  [9, ["answer_options_are_er_diagrams"]],
  [13, ["formula_missing_from_text_layer"]],
  [16, ["answer_options_contain_formula_images"]],
  [31, ["formula_list_is_image_based"]],
  [38, ["formula_missing_from_text_layer"]],
  [51, ["prompt_and_answer_options_contain_code_images"]],
  [57, ["prompt_and_answer_options_contain_formula_images"]],
  [71, ["prompt_contains_uml_diagram"]],
  [75, ["prompt_contains_directed_graph"]],
  [76, ["prompt_and_answer_options_contain_formula_images"]],
  [86, ["prompt_contains_data_table_image"]],
  [97, ["prompt_and_answer_options_contain_formula_images"]],
  [103, ["prompt_contains_vector_formula_images"]],
  [113, ["prompt_contains_network_topology_image"]],
  [119, ["prompt_contains_directed_graph"]],
  [126, ["prompt_contains_code_image"]],
  [140, ["prompt_contains_graph"]],
]);

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function requireCommand(command) {
  const result = spawnSync(command, ["-v"], {
    encoding: "utf8",
    stdio: "ignore",
  });

  if (result.error?.code === "ENOENT") {
    fail(`Required command is unavailable: ${command}`);
  }
}

function toolVersion(command) {
  const result = spawnSync(command, ["-v"], {
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

function normalizeNewlines(text) {
  return text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function cleanPageText(text, pageNumber) {
  const lines = normalizeNewlines(text)
    .replaceAll("\f", "")
    .split("\n");

  const cleaned = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === String(pageNumber)) {
      continue;
    }

    if (
      trimmed.includes(
        "(x) – правильний варіант відповіді на завдання",
      ) ||
      trimmed.startsWith("© Державна установа")
    ) {
      continue;
    }

    cleaned.push(line.replace(/\s+$/u, ""));
  }

  while (cleaned.length > 0 && cleaned[0].trim() === "") {
    cleaned.shift();
  }
  while (cleaned.length > 0 && cleaned.at(-1).trim() === "") {
    cleaned.pop();
  }

  return `${cleaned.join("\n")}\n`;
}

function normalizeBlock(lines) {
  const normalized = [];
  let previousWasBlank = false;

  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    const isBlank = line === "";

    if (isBlank && previousWasBlank) {
      continue;
    }

    normalized.push(line);
    previousWasBlank = isBlank;
  }

  while (normalized.length > 0 && normalized[0] === "") {
    normalized.shift();
  }
  while (normalized.length > 0 && normalized.at(-1) === "") {
    normalized.pop();
  }

  return normalized.join("\n");
}

function parseQuestions(lineRecords) {
  const questionStartPattern = /^\s*(\d{1,3})\.\s+(.*)$/u;
  const questions = [];
  let current = null;
  let expectedNumber = 1;

  for (const record of lineRecords) {
    const match = record.text.match(questionStartPattern);
    const candidateNumber = match ? Number(match[1]) : null;

    if (match && candidateNumber === expectedNumber) {
      if (current) {
        questions.push(current);
      }

      current = {
        number: candidateNumber,
        records: [{ ...record, text: match[2] }],
      };
      expectedNumber += 1;
      continue;
    }

    if (current) {
      current.records.push(record);
    }
  }

  if (current) {
    questions.push(current);
  }

  return questions;
}

function parseQuestion(question) {
  const optionPattern = /^\s*\((x?)\)\s*(.*)$/u;
  const markerIndexes = [];

  question.records.forEach((record, index) => {
    const match = record.text.match(optionPattern);
    if (match) {
      markerIndexes.push({
        index,
        isCorrect: match[1] === "x",
        firstLine: match[2],
      });
    }
  });

  const promptEnd = markerIndexes[0]?.index ?? question.records.length;
  const prompt = normalizeBlock(
    question.records.slice(0, promptEnd).map((record) => record.text),
  );

  const options = markerIndexes.map((marker, markerIndex) => {
    const nextIndex =
      markerIndexes[markerIndex + 1]?.index ?? question.records.length;
    const continuation = question.records
      .slice(marker.index + 1, nextIndex)
      .map((record) => record.text);

    return {
      id: optionIds[markerIndex] ?? `option-${markerIndex + 1}`,
      text: normalizeBlock([marker.firstLine, ...continuation]),
      isCorrect: marker.isCorrect,
    };
  });

  const pages = question.records.map((record) => record.page);
  const pageStart = Math.min(...pages);
  const pageEnd = Math.max(...pages);
  const correctOptions = options.filter((option) => option.isCorrect);
  const visualReasons = visualReviewReasons.get(question.number) ?? [];
  const emptyOptionIds = options
    .filter((option) => option.text === "" || option.text === ".")
    .map((option) => option.id);

  const flags = [...visualReasons];
  if (pageStart !== pageEnd) {
    flags.push("spans_multiple_pages");
  }
  if (emptyOptionIds.length > 0) {
    flags.push("one_or_more_options_missing_text");
  }
  if (prompt.length === 0) {
    flags.push("prompt_missing_text");
  }

  return {
    id: `${sourceId}-${String(question.number).padStart(3, "0")}`,
    number: question.number,
    type: "single_choice",
    prompt,
    options,
    correctOption: correctOptions[0]?.id ?? null,
    correctOptionCount: correctOptions.length,
    source: {
      pageStart,
      pageEnd,
    },
    review: {
      requiresVisualReview: visualReasons.length > 0,
      flags: [...new Set(flags)],
      emptyOptionIds,
    },
  };
}

function yamlString(value) {
  return JSON.stringify(value);
}

function yamlBlock(lines, indentation) {
  const prefix = " ".repeat(indentation);
  return lines
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function serializeQuestion(question) {
  const lines = [
    `  - id: ${question.id}`,
    `    number: ${question.number}`,
    "    type: single_choice",
    "    prompt:",
  ];

  if (question.prompt === "") {
    lines.push("      []");
  } else {
    lines.push("      - type: markdown");
    lines.push("        text: |-");
    lines.push(yamlBlock(question.prompt, 10));
  }

  lines.push("    options:");
  for (const option of question.options) {
    lines.push(`      - id: ${option.id}`);

    if (option.text === "") {
      lines.push("        content: []");
    } else {
      lines.push("        content:");
      lines.push("          - type: markdown");
      lines.push("            text: |-");
      lines.push(yamlBlock(option.text, 14));
    }
  }

  lines.push("    answer:");
  lines.push(
    `      correct_option: ${
      question.correctOption === null ? "null" : question.correctOption
    }`,
  );
  lines.push("      source: official_marker");
  lines.push("    explanation:");
  lines.push("      status: missing");
  lines.push("      blocks: []");
  lines.push("    classification:");
  lines.push("      status: pending");
  lines.push("    source:");
  lines.push(`      question_number: ${question.number}`);
  lines.push(`      page_start: ${question.source.pageStart}`);
  lines.push(`      page_end: ${question.source.pageEnd}`);
  lines.push("    review:");
  lines.push("      transcription: machine_extracted");
  lines.push(
    `      requires_visual_review: ${question.review.requiresVisualReview}`,
  );

  if (question.review.flags.length === 0) {
    lines.push("      flags: []");
  } else {
    lines.push("      flags:");
    for (const flag of question.review.flags) {
      lines.push(`        - ${flag}`);
    }
  }

  return lines.join("\n");
}

function toDatasetQuestion(question) {
  return {
    id: question.id,
    number: question.number,
    type: question.type,
    prompt:
      question.prompt === ""
        ? []
        : [{ type: "markdown", text: question.prompt }],
    options: question.options.map((option) => ({
      id: option.id,
      content:
        option.text === ""
          ? []
          : [{ type: "markdown", text: option.text }],
    })),
    answer: {
      correct_option: question.correctOption,
      source: "official_marker",
    },
    explanation: {
      status: "missing",
      blocks: [],
    },
    classification: {
      status: "pending",
    },
    source: {
      question_number: question.number,
      page_start: question.source.pageStart,
      page_end: question.source.pageEnd,
    },
    review: {
      transcription: "machine_extracted",
      requires_visual_review: question.review.requiresVisualReview,
      flags: question.review.flags,
    },
  };
}

function serializeYaml(manifest, questions, extraction) {
  const header = [
    "schema_version: 1",
    "",
    "dataset:",
    `  id: ${sourceId}`,
    `  title: ${yamlString(manifest.document.title)}`,
    `  exam: ${yamlString(manifest.document.exam)}`,
    `  subject: ${yamlString(manifest.document.subject)}`,
    `  year: ${manifest.document.year}`,
    `  language: ${manifest.document.language}`,
    "  status: draft",
    `  question_count: ${questions.length}`,
    "  source:",
    `    file: ${yamlString(manifest.source.file)}`,
    "    checksum:",
    `      algorithm: ${manifest.source.checksum.algorithm}`,
    `      value: ${manifest.source.checksum.value}`,
    "",
    "extraction:",
    "  method: deterministic_text_layer_parser",
    `  tool: ${yamlString(extraction.tool)}`,
    `  tool_version: ${yamlString(extraction.toolVersion)}`,
    `  cleaned_text_directory: ${yamlString(
      `sources/${sourceId}/text/pages`,
    )}`,
    `  report: ${yamlString(
      `reports/${sourceId}-draft-extraction.json`,
    )}`,
    "",
    "questions:",
  ];

  return `${header.join("\n")}\n${questions
    .map(serializeQuestion)
    .join("\n")}\n`;
}

function validateQuestions(questions) {
  const errors = [];

  if (questions.length !== expectedQuestionCount) {
    errors.push(
      `Expected ${expectedQuestionCount} questions, found ${questions.length}`,
    );
  }

  questions.forEach((question, index) => {
    const expectedNumber = index + 1;

    if (question.number !== expectedNumber) {
      errors.push(
        `Expected question ${expectedNumber}, found ${question.number}`,
      );
    }
    if (question.options.length !== 4) {
      errors.push(
        `Question ${question.number} has ${question.options.length} options`,
      );
    }
    if (question.correctOptionCount !== 1) {
      errors.push(
        `Question ${question.number} has ${question.correctOptionCount} correct markers`,
      );
    }
  });

  if (errors.length > 0) {
    fail(`Draft validation failed:\n${errors.join("\n")}`);
  }
}

for (const command of ["pdftotext"]) {
  requireCommand(command);
}

if (!existsSync(manifestPath)) {
  fail(
    `Source manifest is missing. Run scripts/fix-yefvv-2024-source.mjs first.`,
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const sourcePath = join(projectRoot, manifest.source.file);

if (!existsSync(sourcePath)) {
  fail(`Source PDF is missing: ${manifest.source.file}`);
}

const sourceChecksum = sha256(sourcePath);
if (sourceChecksum !== manifest.source.checksum.value) {
  fail(
    [
      "Source checksum does not match the fixed manifest.",
      `Expected: ${manifest.source.checksum.value}`,
      `Actual:   ${sourceChecksum}`,
    ].join("\n"),
  );
}

const temporaryRoot = mkdtempSync(join(projectRoot, ".extract-yefvv-"));
const temporaryPagesDirectory = join(temporaryRoot, "pages");
mkdirSync(temporaryPagesDirectory, { recursive: true });

try {
  const lineRecords = [];
  const cleanedPages = [];

  for (
    let pageNumber = 1;
    pageNumber <= manifest.source.pdf.pages;
    pageNumber += 1
  ) {
    const rawText = execFileSync(
      "pdftotext",
      [
        "-layout",
        "-f",
        String(pageNumber),
        "-l",
        String(pageNumber),
        sourcePath,
        "-",
      ],
      {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    const cleanedText = cleanPageText(rawText, pageNumber);
    const pageFileName = `page-${String(pageNumber).padStart(3, "0")}.txt`;
    writeFileSync(
      join(temporaryPagesDirectory, pageFileName),
      cleanedText,
      "utf8",
    );

    cleanedPages.push(
      `--- page ${String(pageNumber).padStart(3, "0")} ---\n${cleanedText}`,
    );

    for (const line of cleanedText.split("\n")) {
      lineRecords.push({ page: pageNumber, text: line });
    }
  }

  writeFileSync(
    join(temporaryRoot, "combined.txt"),
    cleanedPages.join("\n"),
    "utf8",
  );

  const questions = parseQuestions(lineRecords).map(parseQuestion);
  validateQuestions(questions);

  const extraction = {
    tool: "pdftotext",
    toolVersion: toolVersion("pdftotext"),
  };
  const dataset = {
    schema_version: 1,
    dataset: {
      id: sourceId,
      title: manifest.document.title,
      exam: manifest.document.exam,
      subject: manifest.document.subject,
      year: manifest.document.year,
      language: manifest.document.language,
      status: "draft",
      question_count: questions.length,
      source: {
        file: manifest.source.file,
        checksum: manifest.source.checksum,
      },
    },
    extraction: {
      method: "deterministic_text_layer_parser",
      tool: extraction.tool,
      tool_version: extraction.toolVersion,
      cleaned_text_directory: `sources/${sourceId}/text/pages`,
      report: `reports/${sourceId}-draft-extraction.json`,
    },
    questions: questions.map(toDatasetQuestion),
  };

  const report = {
    schema_version: 1,
    source_id: sourceId,
    status: "draft_extracted",
    source: {
      file: manifest.source.file,
      sha256: sourceChecksum,
      pages: manifest.source.pdf.pages,
    },
    extraction: {
      tool: extraction.tool,
      tool_version: extraction.toolVersion,
      question_count: questions.length,
      option_count: questions.reduce(
        (total, question) => total + question.options.length,
        0,
      ),
      correct_answer_count: questions.filter(
        (question) => question.correctOptionCount === 1,
      ).length,
    },
    review: {
      visual_review_question_count: questions.filter(
        (question) => question.review.requiresVisualReview,
      ).length,
      visual_review_questions: questions
        .filter((question) => question.review.requiresVisualReview)
        .map((question) => ({
          number: question.number,
          reasons: question.review.flags.filter(
            (flag) => flag !== "spans_multiple_pages",
          ),
        })),
      page_spanning_questions: questions
        .filter(
          (question) =>
            question.source.pageStart !== question.source.pageEnd,
        )
        .map((question) => ({
          number: question.number,
          page_start: question.source.pageStart,
          page_end: question.source.pageEnd,
        })),
      questions_with_empty_option_text: questions
        .filter((question) => question.review.emptyOptionIds.length > 0)
        .map((question) => ({
          number: question.number,
          option_ids: question.review.emptyOptionIds,
        })),
    },
    validation: {
      passed: true,
      expected_question_count: expectedQuestionCount,
      expected_options_per_question: 4,
      expected_correct_answers_per_question: 1,
    },
    outputs: {
      draft_yaml: relative(projectRoot, draftPath),
      draft_json: relative(projectRoot, draftJsonPath),
      cleaned_text: relative(projectRoot, textDirectory),
      report: relative(projectRoot, reportPath),
    },
  };

  mkdirSync(dirname(draftPath), { recursive: true });
  mkdirSync(dirname(reportPath), { recursive: true });
  mkdirSync(dirname(textDirectory), { recursive: true });

  const temporaryDraftPath = `${draftPath}.tmp`;
  const temporaryDraftJsonPath = `${draftJsonPath}.tmp`;
  const temporaryReportPath = `${reportPath}.tmp`;

  writeFileSync(
    temporaryDraftPath,
    serializeYaml(manifest, questions, extraction),
    "utf8",
  );
  writeFileSync(
    temporaryDraftJsonPath,
    `${JSON.stringify(dataset, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    temporaryReportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  rmSync(textDirectory, { recursive: true, force: true });
  renameSync(temporaryRoot, textDirectory);
  renameSync(temporaryDraftPath, draftPath);
  renameSync(temporaryDraftJsonPath, draftJsonPath);
  renameSync(temporaryReportPath, reportPath);

  console.log(`Extracted questions: ${questions.length}`);
  console.log(`Extracted options: ${report.extraction.option_count}`);
  console.log(
    `Questions requiring visual review: ${report.review.visual_review_question_count}`,
  );
  console.log(`Draft: ${relative(projectRoot, draftPath)}`);
  console.log(`Report: ${relative(projectRoot, reportPath)}`);
} catch (error) {
  rmSync(temporaryRoot, { recursive: true, force: true });
  throw error;
}
