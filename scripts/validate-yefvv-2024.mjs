#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const jsonPath = join(
  projectRoot,
  "data",
  "normalized",
  `${sourceId}.json`,
);
const yamlPath = join(
  projectRoot,
  "data",
  "normalized",
  `${sourceId}.yaml`,
);
const schemaPath = join(
  projectRoot,
  "schemas",
  "yefvv-it-question-dataset.schema.json",
);
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-validation.json`,
);
const manualValidationReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-manual-validation.json`,
);

const expectedQuestionCount = 140;
const expectedOptionIds = ["a", "b", "c", "d"];
const expectedPageCount = 29;
const allowedBlockTypes = new Set([
  "markdown",
  "math",
  "code",
  "table",
  "image",
]);
const allowedCodeLanguages = new Set(["cpp", "sql", "text"]);
const allowedMathDisplays = new Set(["inline", "block"]);
const allowedImageRoles = new Set(["prompt", "option"]);
const standaloneAnswerMarker =
  /(^|[\s])\(x\)(?=$|[\s.,;:!?])/iu;

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
    maxBuffer: 20 * 1024 * 1024,
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

function isSafeRelativePath(path) {
  if (!isNonEmptyString(path) || isAbsolute(path)) {
    return false;
  }

  const resolved = resolve(projectRoot, path);
  return (
    resolved === projectRoot ||
    resolved.startsWith(`${projectRoot}/`)
  );
}

function addError(errors, path, message) {
  errors.push({ path, message });
}

function exactKeys(value, expectedKeys, path, errors) {
  if (!isPlainObject(value)) {
    addError(errors, path, "Expected an object.");
    return false;
  }

  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    addError(
      errors,
      path,
      `Expected keys ${expected.join(", ")}; found ${actual.join(", ")}.`,
    );
    return false;
  }

  return true;
}

function validatePathList(value, path, errors, references) {
  if (!Array.isArray(value)) {
    addError(errors, path, "Expected an array of paths.");
    return;
  }

  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isSafeRelativePath(item)) {
      addError(errors, itemPath, "Expected a safe relative path.");
      return;
    }
    references.push({ path: item, source: itemPath });
  });
}

function validateBlock(block, path, errors, references, textValues) {
  if (!isPlainObject(block) || !allowedBlockTypes.has(block.type)) {
    addError(errors, path, "Unknown or missing content block type.");
    return;
  }

  if (block.type === "markdown") {
    exactKeys(block, ["type", "text"], path, errors);
    if (!isNonEmptyString(block.text)) {
      addError(errors, `${path}.text`, "Markdown text must not be empty.");
    } else {
      textValues.push({ path: `${path}.text`, value: block.text });
    }
    return;
  }

  if (block.type === "math") {
    exactKeys(
      block,
      ["type", "latex", "display", "source_images"],
      path,
      errors,
    );
    if (!isNonEmptyString(block.latex)) {
      addError(errors, `${path}.latex`, "LaTeX must not be empty.");
    } else {
      textValues.push({ path: `${path}.latex`, value: block.latex });
    }
    if (!allowedMathDisplays.has(block.display)) {
      addError(
        errors,
        `${path}.display`,
        "Math display must be inline or block.",
      );
    }
    validatePathList(
      block.source_images,
      `${path}.source_images`,
      errors,
      references,
    );
    return;
  }

  if (block.type === "code") {
    exactKeys(
      block,
      ["type", "language", "text", "source_images"],
      path,
      errors,
    );
    if (!allowedCodeLanguages.has(block.language)) {
      addError(errors, `${path}.language`, "Unsupported code language.");
    }
    if (!isNonEmptyString(block.text)) {
      addError(errors, `${path}.text`, "Code text must not be empty.");
    } else {
      textValues.push({ path: `${path}.text`, value: block.text });
    }
    validatePathList(
      block.source_images,
      `${path}.source_images`,
      errors,
      references,
    );
    return;
  }

  if (block.type === "table") {
    exactKeys(
      block,
      ["type", "columns", "rows", "source_images"],
      path,
      errors,
    );
    if (
      !Array.isArray(block.columns) ||
      block.columns.length === 0 ||
      block.columns.some((column) => !isNonEmptyString(column))
    ) {
      addError(
        errors,
        `${path}.columns`,
        "Table columns must be non-empty strings.",
      );
    }
    if (!Array.isArray(block.rows) || block.rows.length === 0) {
      addError(errors, `${path}.rows`, "Table must have rows.");
    } else {
      block.rows.forEach((row, rowIndex) => {
        if (
          !Array.isArray(row) ||
          row.length !== block.columns?.length ||
          row.some((cell) => typeof cell !== "string")
        ) {
          addError(
            errors,
            `${path}.rows[${rowIndex}]`,
            "Table row width and cell types must match the columns.",
          );
        }
      });
    }
    validatePathList(
      block.source_images,
      `${path}.source_images`,
      errors,
      references,
    );
    return;
  }

  exactKeys(
    block,
    ["type", "path", "alt", "role", "source_images"],
    path,
    errors,
  );
  if (!isSafeRelativePath(block.path)) {
    addError(errors, `${path}.path`, "Expected a safe relative image path.");
  } else {
    references.push({ path: block.path, source: `${path}.path` });
  }
  if (!isNonEmptyString(block.alt)) {
    addError(errors, `${path}.alt`, "Image alt text must not be empty.");
  }
  if (!allowedImageRoles.has(block.role)) {
    addError(errors, `${path}.role`, "Image role must be prompt or option.");
  }
  validatePathList(
    block.source_images,
    `${path}.source_images`,
    errors,
    references,
  );
}

function validateContent(blocks, path, errors, references, textValues) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    addError(errors, path, "Content must contain at least one block.");
    return;
  }

  blocks.forEach((block, index) =>
    validateBlock(
      block,
      `${path}[${index}]`,
      errors,
      references,
      textValues,
    ),
  );
}

function validateDatasetShape(dataset) {
  const errors = [];
  const references = [];
  const textValues = [];

  if (
    !exactKeys(
      dataset,
      [
        "schema_version",
        "dataset",
        "extraction",
        "questions",
        "enrichment",
        "normalization",
      ],
      "$",
      errors,
    )
  ) {
    return { errors, references, textValues };
  }

  if (dataset.schema_version !== 1) {
    addError(errors, "$.schema_version", "Expected schema version 1.");
  }

  for (const key of ["extraction", "enrichment", "normalization"]) {
    if (!isPlainObject(dataset[key])) {
      addError(errors, `$.${key}`, "Expected an object.");
    }
  }

  if (!isPlainObject(dataset.dataset)) {
    addError(errors, "$.dataset", "Dataset metadata must be an object.");
  } else {
    exactKeys(
      dataset.dataset,
      [
        "id",
        "title",
        "exam",
        "subject",
        "year",
        "language",
        "status",
        "question_count",
        "source",
      ],
      "$.dataset",
      errors,
    );
    if (dataset.dataset.id !== sourceId) {
      addError(errors, "$.dataset.id", `Expected ${sourceId}.`);
    }
    if (!isNonEmptyString(dataset.dataset.title)) {
      addError(errors, "$.dataset.title", "Title must not be empty.");
    }
    if (dataset.dataset.exam !== "ЄФВВ") {
      addError(errors, "$.dataset.exam", "Expected ЄФВВ.");
    }
    if (dataset.dataset.subject !== "Інформаційні технології") {
      addError(
        errors,
        "$.dataset.subject",
        "Expected Інформаційні технології.",
      );
    }
    if (dataset.dataset.year !== 2024) {
      addError(errors, "$.dataset.year", "Expected 2024.");
    }
    if (dataset.dataset.language !== "uk") {
      addError(errors, "$.dataset.language", "Expected uk.");
    }
    if (dataset.dataset.status !== "normalized") {
      addError(errors, "$.dataset.status", "Expected normalized status.");
    }
    if (dataset.dataset.question_count !== expectedQuestionCount) {
      addError(
        errors,
        "$.dataset.question_count",
        `Expected ${expectedQuestionCount}.`,
      );
    }

    if (
      !exactKeys(
        dataset.dataset.source,
        ["file", "checksum"],
        "$.dataset.source",
        errors,
      )
    ) {
      // The detailed checksum validation is skipped when source is malformed.
    } else {
      if (!isSafeRelativePath(dataset.dataset.source.file)) {
        addError(
          errors,
          "$.dataset.source.file",
          "Expected a safe relative source path.",
        );
      }
      if (
        exactKeys(
          dataset.dataset.source.checksum,
          ["algorithm", "value"],
          "$.dataset.source.checksum",
          errors,
        )
      ) {
        if (dataset.dataset.source.checksum.algorithm !== "sha256") {
          addError(
            errors,
            "$.dataset.source.checksum.algorithm",
            "Expected sha256.",
          );
        }
        if (
          !/^[a-f0-9]{64}$/u.test(
            dataset.dataset.source.checksum.value ?? "",
          )
        ) {
          addError(
            errors,
            "$.dataset.source.checksum.value",
            "Expected a lowercase SHA-256 value.",
          );
        }
      }
    }
  }

  if (
    !Array.isArray(dataset.questions) ||
    dataset.questions.length !== expectedQuestionCount
  ) {
    addError(
      errors,
      "$.questions",
      `Expected exactly ${expectedQuestionCount} questions.`,
    );
    return { errors, references, textValues };
  }

  dataset.questions.forEach((question, index) => {
    const path = `$.questions[${index}]`;
    if (
      !exactKeys(
        question,
        [
          "id",
          "number",
          "type",
          "prompt",
          "options",
          "answer",
          "explanation",
          "classification",
          "source",
          "review",
        ],
        path,
        errors,
      )
    ) {
      return;
    }

    if (question.number !== index + 1) {
      addError(
        errors,
        `${path}.number`,
        `Expected question number ${index + 1}.`,
      );
    }
    const expectedId = `${sourceId}-${String(index + 1).padStart(3, "0")}`;
    if (question.id !== expectedId) {
      addError(errors, `${path}.id`, `Expected ${expectedId}.`);
    }
    if (question.type !== "single_choice") {
      addError(
        errors,
        `${path}.type`,
        "Expected single_choice question type.",
      );
    }

    validateContent(
      question.prompt,
      `${path}.prompt`,
      errors,
      references,
      textValues,
    );

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      addError(errors, `${path}.options`, "Expected exactly four options.");
    } else {
      question.options.forEach((option, optionIndex) => {
        const optionPath = `${path}.options[${optionIndex}]`;
        if (!exactKeys(option, ["id", "content"], optionPath, errors)) {
          return;
        }
        if (option.id !== expectedOptionIds[optionIndex]) {
          addError(
            errors,
            `${optionPath}.id`,
            `Expected option ${expectedOptionIds[optionIndex]}.`,
          );
        }
        validateContent(
          option.content,
          `${optionPath}.content`,
          errors,
          references,
          textValues,
        );
      });
    }

    if (
      !exactKeys(
        question.answer,
        ["correct_option", "source"],
        `${path}.answer`,
        errors,
      )
    ) {
      // Detailed answer validation is skipped when the object is malformed.
    } else if (!expectedOptionIds.includes(question.answer.correct_option)) {
      addError(
        errors,
        `${path}.answer.correct_option`,
        "Correct option must reference an existing option.",
      );
    } else if (
      Array.isArray(question.options) &&
      !question.options.some(
        (option) => option.id === question.answer.correct_option,
      )
    ) {
      addError(
        errors,
        `${path}.answer.correct_option`,
        "Correct option does not exist in the option list.",
      );
    }
    if (
      isPlainObject(question.answer) &&
      question.answer.source !== "official_marker"
    ) {
      addError(
        errors,
        `${path}.answer.source`,
        "Expected official_marker answer source.",
      );
    }

    if (!isPlainObject(question.explanation)) {
      addError(
        errors,
        `${path}.explanation`,
        "Explanation must be an object.",
      );
    }
    if (!isPlainObject(question.classification)) {
      addError(
        errors,
        `${path}.classification`,
        "Classification must be an object.",
      );
    }

    if (!isPlainObject(question.source)) {
      addError(errors, `${path}.source`, "Source must be an object.");
    } else {
      exactKeys(
        question.source,
        ["question_number", "page_start", "page_end"],
        `${path}.source`,
        errors,
      );
      if (question.source.question_number !== question.number) {
        addError(
          errors,
          `${path}.source.question_number`,
          "Source question number must match the question.",
        );
      }
      if (
        !Number.isInteger(question.source.page_start) ||
        !Number.isInteger(question.source.page_end) ||
        question.source.page_start < 1 ||
        question.source.page_end > expectedPageCount ||
        question.source.page_start > question.source.page_end
      ) {
        addError(
          errors,
          `${path}.source`,
          `Source pages must be ordered and within 1-${expectedPageCount}.`,
        );
      }
    }

    if (!isPlainObject(question.review)) {
      addError(errors, `${path}.review`, "Review must be an object.");
    } else if (
      !exactKeys(
        question.review.normalization,
        ["status", "batch", "notes"],
        `${path}.review.normalization`,
        errors,
      )
    ) {
      // Detailed normalization validation is skipped when malformed.
    } else if (
      question.review.normalization.status !== "verified" ||
      question.review.normalization.batch !==
        Math.ceil(question.number / 20) ||
      !Array.isArray(question.review.normalization.notes)
    ) {
      addError(
        errors,
        `${path}.review.normalization`,
        "Normalization status or batch is invalid.",
      );
    }
  });

  return { errors, references, textValues };
}

function unique(values) {
  return [...new Set(values)];
}

function blockEntries(question) {
  const prompt = Array.isArray(question?.prompt) ? question.prompt : [];
  const options = Array.isArray(question?.options)
    ? question.options
    : [];

  return [
    ...prompt.map((block) => ({ location: "prompt", block })),
    ...options.flatMap((option) =>
      (Array.isArray(option?.content) ? option.content : []).map((block) => ({
        location: `option_${option.id}`,
        block,
      })),
    ),
  ];
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

let dataset;
let yamlDataset;
let schema;
let manualValidationReport;
let manualValidationReportError = null;

try {
  dataset = parseJson(jsonPath);
  recordCheck(
    "json_syntax",
    "Normalized JSON parses successfully.",
    true,
  );
} catch (error) {
  recordCheck(
    "json_syntax",
    "Normalized JSON parses successfully.",
    false,
    { error: error.message },
  );
}

try {
  yamlDataset = parseYaml(yamlPath);
  recordCheck(
    "yaml_syntax",
    "Normalized YAML parses safely without aliases.",
    true,
  );
} catch (error) {
  recordCheck(
    "yaml_syntax",
    "Normalized YAML parses safely without aliases.",
    false,
    { error: error.message },
  );
}

try {
  schema = parseJson(schemaPath);
  recordCheck("schema_syntax", "JSON Schema parses successfully.", true, {
    schema: schema.$id,
  });
} catch (error) {
  recordCheck(
    "schema_syntax",
    "JSON Schema parses successfully.",
    false,
    { error: error.message },
  );
}

try {
  manualValidationReport = parseJson(manualValidationReportPath);
} catch (error) {
  manualValidationReportError = error.message;
}

if (dataset && yamlDataset) {
  recordCheck(
    "yaml_json_equivalence",
    "YAML and JSON represent the same data.",
    JSON.stringify(dataset) === JSON.stringify(yamlDataset),
  );
}

let shape = { errors: [], references: [], textValues: [] };

if (dataset) {
  shape = validateDatasetShape(dataset);
  recordCheck(
    "schema_conformance",
    "Dataset conforms to the documented application schema.",
    shape.errors.length === 0,
    { error_count: shape.errors.length, errors: shape.errors },
  );

  const questions = Array.isArray(dataset.questions)
    ? dataset.questions.filter(isPlainObject)
    : [];
  const questionIds = questions
    .map((question) => question.id)
    .filter((id) => typeof id === "string");
  recordCheck(
    "unique_question_ids",
    "Every question ID is unique.",
    questions.length === expectedQuestionCount &&
      questionIds.length === questions.length &&
      unique(questionIds).length === questionIds.length,
    { count: questionIds.length, question_count: questions.length },
  );

  const answerMarkers = shape.textValues.filter(({ value }) =>
    standaloneAnswerMarker.test(value),
  );
  recordCheck(
    "no_service_answer_markers",
    "No standalone service marker (x) appears in content.",
    answerMarkers.length === 0,
    { matches: answerMarkers },
  );

  const missingReferences = shape.references.filter(
    (reference) => !existsSync(resolve(projectRoot, reference.path)),
  );
  const nonFileReferences = shape.references.filter((reference) => {
    const absolutePath = resolve(projectRoot, reference.path);
    return existsSync(absolutePath) && !statSync(absolutePath).isFile();
  });
  recordCheck(
    "file_references",
    "Every image and source-image reference points to an existing file.",
    missingReferences.length === 0 && nonFileReferences.length === 0,
    {
      reference_count: shape.references.length,
      unique_file_count: unique(
        shape.references.map((reference) => reference.path),
      ).length,
      missing: missingReferences,
      not_files: nonFileReferences,
    },
  );

  const visuallyDependentQuestions = questions.filter((question) =>
    blockEntries(question).some(
      ({ block }) =>
        block.type === "image" ||
        (Array.isArray(block.source_images) &&
          block.source_images.length > 0),
    ),
  );
  const unverifiedVisualQuestions = visuallyDependentQuestions
    .filter(
      (question) =>
        question.review?.requires_visual_review !== false ||
        question.review?.visual_verification !== "completed" ||
        question.review?.complex_content !== "verified",
    )
    .map((question) => question.number);
  recordCheck(
    "visual_verification",
    "Every visually dependent question has completed manual verification.",
    unverifiedVisualQuestions.length === 0,
    {
      visually_dependent_count: visuallyDependentQuestions.length,
      question_numbers: visuallyDependentQuestions.map(
        (question) => question.number,
      ),
      unverified_question_numbers: unverifiedVisualQuestions,
    },
  );

  const manualValidationErrors = [];
  const expectedMedia = unique(
    questions.flatMap((question) =>
      blockEntries(question).flatMap(({ block }) => [
        ...(block.type === "image" ? [block.path] : []),
        ...(Array.isArray(block.source_images)
          ? block.source_images
          : []),
      ]),
    ),
  ).sort();

  for (const question of questions) {
    const expectedPages = Array.from(
      {
        length:
          question.source.page_end -
          question.source.page_start +
          1,
      },
      (_, index) => question.source.page_start + index,
    );
    const expectedQuestionMedia = unique(
      blockEntries(question).flatMap(({ block }) => [
        ...(block.type === "image" ? [block.path] : []),
        ...(Array.isArray(block.source_images)
          ? block.source_images
          : []),
      ]),
    ).sort();
    const manualValidation = question.review?.manual_validation;
    const actualPages = manualValidation?.pages;
    const actualMedia = Array.isArray(manualValidation?.linked_media)
      ? unique(manualValidation.linked_media).sort()
      : null;

    if (
      manualValidation?.status !== "verified_against_page_renders" ||
      JSON.stringify(actualPages) !== JSON.stringify(expectedPages) ||
      JSON.stringify(actualMedia) !==
        JSON.stringify(expectedQuestionMedia)
    ) {
      manualValidationErrors.push({
        question: question.number,
        expected_pages: expectedPages,
        actual_pages: actualPages ?? null,
        expected_media: expectedQuestionMedia,
        actual_media: actualMedia,
      });
    }
  }

  const expectedPageCoverage = Array.from(
    { length: expectedPageCount },
    (_, index) => {
      const page = index + 1;
      return {
        page,
        status: "verified",
        question_numbers: questions
          .filter(
            (question) =>
              question.source.page_start <= page &&
              question.source.page_end >= page,
          )
          .map((question) => question.number),
      };
    },
  );
  const reportCoverage = manualValidationReport?.coverage;
  const reportMatches =
    manualValidationReportError === null &&
    manualValidationReport?.status === "manual_validation_completed" &&
    reportCoverage?.page_count === expectedPageCount &&
    reportCoverage?.question_count === expectedQuestionCount &&
    reportCoverage?.option_count === expectedQuestionCount * 4 &&
    reportCoverage?.linked_media_count === expectedMedia.length &&
    JSON.stringify(reportCoverage?.pages) ===
      JSON.stringify(expectedPageCoverage) &&
    manualValidationReport?.invariants?.official_answers_changed === false &&
    manualValidationReport?.invariants?.question_ids_changed === false &&
    manualValidationReport?.invariants?.source_pages_changed === false;

  recordCheck(
    "manual_page_validation",
    "Every question, source page, and linked medium is covered by the completed manual review.",
    manualValidationErrors.length === 0 && reportMatches,
    {
      report: relative(projectRoot, manualValidationReportPath),
      report_error: manualValidationReportError,
      verified_question_count:
        questions.length - manualValidationErrors.length,
      verified_page_count: reportCoverage?.pages?.filter(
        (page) => page.status === "verified",
      ).length ?? 0,
      linked_media_count: expectedMedia.length,
      question_errors: manualValidationErrors,
      report_matches_dataset: reportMatches,
    },
  );

  const sourceFile = dataset.dataset?.source?.file;
  const sourcePath = isSafeRelativePath(sourceFile)
    ? resolve(projectRoot, sourceFile)
    : null;
  const expectedChecksum = dataset.dataset?.source?.checksum?.value;
  const actualChecksum =
    sourcePath && existsSync(sourcePath) ? sha256(sourcePath) : null;
  recordCheck(
    "source_checksum",
    "The source PDF exists and matches its recorded SHA-256.",
    actualChecksum !== null && actualChecksum === expectedChecksum,
    {
      file: sourceFile,
      expected_sha256: expectedChecksum,
      actual_sha256: actualChecksum,
    },
  );

  const blockCounts = {};
  for (const question of questions) {
    for (const { block } of blockEntries(question)) {
      const type = block?.type ?? "unknown";
      blockCounts[type] = (blockCounts[type] ?? 0) + 1;
    }
  }
  recordCheck(
    "content_inventory",
    "All content blocks use known, validated types.",
    Object.keys(blockCounts).every((type) => allowedBlockTypes.has(type)),
    { block_counts: blockCounts },
  );
}

const passed = failures.length === 0;
const report = {
  schema_version: 1,
  source_id: sourceId,
  status: passed ? "validation_passed" : "validation_failed",
  inputs: {
    normalized_json: relative(projectRoot, jsonPath),
    normalized_yaml: relative(projectRoot, yamlPath),
    schema: relative(projectRoot, schemaPath),
    manual_validation_report: relative(
      projectRoot,
      manualValidationReportPath,
    ),
    json_sha256: existsSync(jsonPath) ? sha256(jsonPath) : null,
    yaml_sha256: existsSync(yamlPath) ? sha256(yamlPath) : null,
    schema_sha256: existsSync(schemaPath) ? sha256(schemaPath) : null,
    manual_validation_report_sha256: existsSync(
      manualValidationReportPath,
    )
      ? sha256(manualValidationReportPath)
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
    question_count: dataset?.questions?.length ?? null,
    option_count:
      (Array.isArray(dataset?.questions)
        ? dataset.questions
        : []
      ).reduce(
        (sum, question) => sum + (question.options?.length ?? 0),
        0,
      ),
  },
  checks,
};

mkdirSync(dirname(reportPath), { recursive: true });
const temporaryReportPath = `${reportPath}.tmp`;
writeFileSync(
  temporaryReportPath,
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
renameSync(temporaryReportPath, reportPath);

console.log(`Validation checks: ${checks.length}`);
console.log(`Passed checks: ${report.summary.passed_check_count}`);
console.log(`Failed checks: ${report.summary.failed_check_count}`);
console.log(`Report: ${relative(projectRoot, reportPath)}`);

if (!passed) {
  process.exit(1);
}
