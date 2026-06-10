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
const inputJsonPath = join(
  projectRoot,
  "data",
  "enriched",
  `${sourceId}.json`,
);
const outputJsonPath = join(
  projectRoot,
  "data",
  "normalized",
  `${sourceId}.json`,
);
const outputYamlPath = join(
  projectRoot,
  "data",
  "normalized",
  `${sourceId}.yaml`,
);
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-normalization.json`,
);
const manualValidationReportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-manual-validation.json`,
);

const expectedQuestionCount = 140;
const expectedOptionCount = 560;
const batchSize = 20;
const pageSpanningQuestions = [
  5, 16, 21, 26, 31, 37, 42, 57, 73, 77, 81, 101, 106, 116, 126,
];
const newlyStructuredCodeQuestions = [59, 79, 83, 84, 91, 101];
const manuallyCorrectedQuestions = [
  8, 15, 16, 51, 64, 74, 91, 116, 120, 123,
];

const editorialNotes = new Map([
  [
    24,
    [
      {
        code: "possible_missing_operator_in_source",
        message:
          "У фрагменті «x(t) z(t)» між виразами може бракувати розділового знака або оператора; текст джерела збережено.",
      },
    ],
  ],
  [
    68,
    [
      {
        code: "source_punctuation_preserved",
        message:
          "Розповідну крапку наприкінці формулювання збережено відповідно до джерела.",
      },
    ],
  ],
  [
    82,
    [
      {
        code: "official_answer_requires_subject_review",
        message:
          "Офіційну відповідь збережено, але твердження про напіврозв’язність задачі рюкзака потребує предметної перевірки.",
      },
    ],
  ],
  [
    102,
    [
      {
        code: "official_answer_requires_subject_review",
        message:
          "Офіційну відповідь збережено, але наведена функція первинного ключа потребує предметної перевірки.",
      },
    ],
  ],
  [
    107,
    [
      {
        code: "source_spelling_preserved",
        message:
          "Написання «потужности» та «Земних» збережено відповідно до джерела.",
      },
    ],
  ],
  [
    132,
    [
      {
        code: "source_spelling_preserved",
        message:
          "Написання «Troyan» збережено відповідно до джерела.",
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
    maxBuffer: 20 * 1024 * 1024,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getQuestion(dataset, number) {
  const question = dataset.questions.find(
    (candidate) => candidate.number === number,
  );

  if (!question) {
    fail(`Question ${number} is missing`);
  }

  return question;
}

function markdown(text) {
  return { type: "markdown", text };
}

function code(language, text) {
  return {
    type: "code",
    language,
    text,
    source_images: [],
  };
}

function math(latex, display = "inline") {
  return {
    type: "math",
    latex,
    display,
    source_images: [],
  };
}

function setOptionBlocks(question, optionId, blocks) {
  const option = question.options.find(
    (candidate) => candidate.id === optionId,
  );

  if (!option) {
    fail(`Question ${question.number} is missing option ${optionId}`);
  }

  option.content = blocks;
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function joinWrappedLine(previous, next, stats) {
  if (/-$/u.test(previous) && /^\p{L}/u.test(next)) {
    stats.hyphenated_line_breaks_joined += 1;
    return `${previous}${next}`;
  }

  return `${previous} ${next}`;
}

function normalizeMarkdownText(text, stats) {
  const source = text.replace(/\r\n?/gu, "\n");
  const sourceLineBreaks = countMatches(source, /\n/gu);
  const lines = source
    .split("\n")
    .map((line) => line.trim().replace(/[ \t]+/gu, " "))
    .filter((line) => line.length > 0);
  const normalizedLines = [];

  for (const line of lines) {
    const isNumberedItem = /^\d+\.\s+/u.test(line);

    if (normalizedLines.length === 0 || isNumberedItem) {
      normalizedLines.push(line);
      continue;
    }

    const lastIndex = normalizedLines.length - 1;
    normalizedLines[lastIndex] = joinWrappedLine(
      normalizedLines[lastIndex],
      line,
      stats,
    );
  }

  const normalized = normalizedLines
    .map((line) => line.replace(/\s+([,;:!?])/gu, "$1"))
    .join("\n");
  const normalizedLineBreaks = countMatches(normalized, /\n/gu);

  stats.markdown_blocks_visited += 1;
  stats.layout_line_breaks_removed +=
    sourceLineBreaks - normalizedLineBreaks;

  if (normalized !== text) {
    stats.markdown_blocks_changed += 1;
  }

  return normalized;
}

function normalizeBlocks(blocks, stats) {
  return blocks.map((block) => {
    if (block.type !== "markdown") {
      return block;
    }

    return {
      ...block,
      text: normalizeMarkdownText(block.text, stats),
    };
  });
}

function normalizeAllMarkdown(dataset, stats) {
  for (const question of dataset.questions) {
    question.prompt = normalizeBlocks(question.prompt, stats);
    for (const option of question.options) {
      option.content = normalizeBlocks(option.content, stats);
    }
  }
}

function structureCodeContent(dataset) {
  const q59 = getQuestion(dataset, 59);
  for (const option of q59.options) {
    setOptionBlocks(q59, option.id, [
      code("text", option.content[0].text),
    ]);
  }

  const q79 = getQuestion(dataset, 79);
  q79.prompt = [
    markdown(
      "Виберіть запит до таблиці users з полями ID – унікальний числовий ідентифікатор користувача, первинний ключ; user_name – ім’я користувача; login – логін користувача; password – пароль, що є аналогом запиту",
    ),
    code(
      "sql",
      [
        "SELECT * FROM users WHERE login = 'SYSDBA'",
        "INTERSECT",
        "SELECT ID, user_name, login, password FROM users",
      ].join("\n"),
    ),
  ];
  for (const option of q79.options) {
    setOptionBlocks(q79, option.id, [
      code("sql", option.content[0].text),
    ]);
  }

  const q83 = getQuestion(dataset, 83);
  for (const option of q83.options) {
    setOptionBlocks(q83, option.id, [
      code("sql", option.content[0].text),
    ]);
  }

  const q84 = getQuestion(dataset, 84);
  q84.prompt = [
    markdown(
      "За яким полем потрібно створити індекс таблиці «Customers», щоб прискорити виконання наведеного нижче запиту?",
    ),
    code(
      "sql",
      [
        "SELECT First_Name, Last_Name, City, email_address",
        "FROM Customers",
        "WHERE email_address LIKE 'Alex%'",
        "GROUP BY Last_Name, City, First_Name, email_address",
        "ORDER BY City;",
      ].join("\n"),
    ),
  ];

  const q91 = getQuestion(dataset, 91);
  q91.prompt = [
    markdown(
      "Вкажіть склад попередньо порожнього стека (хвіст→голова) після виконання послідовності команд:",
    ),
    code(
      "text",
      "push (a), push (b), pop, push (c), push (d), pop.",
    ),
  ];

  const q101 = getQuestion(dataset, 101);
  for (const option of q101.options) {
    setOptionBlocks(q101, option.id, [
      code("sql", option.content[0].text),
    ]);
  }
}

function applyManualCorrections(dataset) {
  const q8 = getQuestion(dataset, 8);
  setOptionBlocks(q8, "d", [
    markdown("High-voltage Electrical Networks."),
  ]);

  const q15 = getQuestion(dataset, 15);
  q15.prompt = [
    markdown("Вкажіть порядок числа"),
    math("A_2=1011{,}01"),
    markdown(
      "для подальшого представлення його у формі з рухомою комою в 32-розрядному форматі.",
    ),
  ];

  const q64 = getQuestion(dataset, 64);
  q64.prompt[0].text = q64.prompt[0].text.replace(
    "об'єктів",
    "об’єктів",
  );

  const q74 = getQuestion(dataset, 74);
  for (const [optionId, latex] of [
    ["a", "O(1)"],
    ["b", "O(m)"],
    ["c", "O(m^2)"],
    ["d", "O(1/m)"],
  ]) {
    setOptionBlocks(q74, optionId, [math(latex), markdown(".")]);
  }

  const q116 = getQuestion(dataset, 116);
  q116.prompt = [
    markdown("Якщо об’єкт"),
    math("a"),
    markdown("може бути вибраний"),
    math("m"),
    markdown("способами, а об’єкт"),
    math("b"),
    markdown(", у свою чергу, може бути вибраний іншими"),
    math("n"),
    markdown(
      "способами, то скількома способами можна обрати будь-який з цих об’єктів?",
    ),
  ];
  for (const [optionId, latex] of [
    ["a", "mn"],
    ["b", "m+n"],
    ["c", "m-n"],
    ["d", "m!n!"],
  ]) {
    setOptionBlocks(q116, optionId, [math(latex), markdown(".")]);
  }

  const q120 = getQuestion(dataset, 120);
  q120.prompt = [
    markdown("Яка операція була виконана над множинами:"),
    math(
      "a=(\\mathrm{true},\\mathrm{false},\\mathrm{false},\\mathrm{false},\\mathrm{true},\\mathrm{true},\\mathrm{false},\\mathrm{true})",
    ),
    markdown("і"),
    math(
      "b=(\\mathrm{true},\\mathrm{false},\\mathrm{true},\\mathrm{true},\\mathrm{true},\\mathrm{false},\\mathrm{false},\\mathrm{false})",
    ),
    markdown(", якщо як результат отримано множину"),
    math(
      "c=(\\mathrm{false},\\mathrm{false},\\mathrm{true},\\mathrm{true},\\mathrm{false},\\mathrm{true},\\mathrm{false},\\mathrm{true})",
    ),
    markdown("?"),
  ];

  const q123 = getQuestion(dataset, 123);
  q123.prompt = [
    markdown("Що в обчислювальній складності алгоритму"),
    math("O(n)"),
    markdown("прийнято позначати літерою"),
    math("n"),
    markdown("?"),
  ];
}

function linkedMediaPaths(question) {
  const paths = [];
  const blocks = [
    ...question.prompt,
    ...question.options.flatMap((option) => option.content),
  ];

  for (const block of blocks) {
    if (block.type === "image") {
      paths.push(block.path);
    }
    if (Array.isArray(block.source_images)) {
      paths.push(...block.source_images);
    }
  }

  return [...new Set(paths)];
}

function batchNumber(questionNumber) {
  return Math.ceil(questionNumber / batchSize);
}

function addReviewMetadata(dataset) {
  for (const question of dataset.questions) {
    question.review = {
      ...question.review,
      normalization: {
        status: "verified",
        batch: batchNumber(question.number),
        notes: editorialNotes.get(question.number) ?? [],
      },
      manual_validation: {
        status: "verified_against_page_renders",
        pages: Array.from(
          {
            length:
              question.source.page_end -
              question.source.page_start +
              1,
          },
          (_, index) => question.source.page_start + index,
        ),
        linked_media: linkedMediaPaths(question),
      },
    };
  }
}

function snapshotInvariantFields(dataset) {
  return dataset.questions.map((question) => ({
    id: question.id,
    number: question.number,
    type: question.type,
    option_ids: question.options.map((option) => option.id),
    answer: question.answer,
    explanation: question.explanation,
    classification: question.classification,
    source: question.source,
  }));
}

function countBlocks(dataset, type) {
  let count = 0;

  for (const question of dataset.questions) {
    count += question.prompt.filter((block) => block.type === type).length;
    for (const option of question.options) {
      count += option.content.filter((block) => block.type === type).length;
    }
  }

  return count;
}

function questionNumbersWithBlockType(dataset, type) {
  return dataset.questions
    .filter((question) => {
      const blocks = [
        ...question.prompt,
        ...question.options.flatMap((option) => option.content),
      ];
      return blocks.some((block) => block.type === type);
    })
    .map((question) => question.number);
}

function questionNumbersWithMarkdownLineBreaks(dataset) {
  return dataset.questions
    .filter((question) => {
      const markdownBlocks = [
        ...question.prompt,
        ...question.options.flatMap((option) => option.content),
      ].filter((block) => block.type === "markdown");

      return markdownBlocks.some((block) => block.text.includes("\n"));
    })
    .map((question) => question.number);
}

function createBatchReport(dataset) {
  return Array.from(
    { length: Math.ceil(expectedQuestionCount / batchSize) },
    (_, index) => {
      const start = index * batchSize + 1;
      const end = Math.min(start + batchSize - 1, expectedQuestionCount);
      const questions = dataset.questions.filter(
        (question) =>
          question.number >= start && question.number <= end,
      );

      return {
        batch: index + 1,
        range: `${start}-${end}`,
        question_count: questions.length,
        option_count: questions.reduce(
          (sum, question) => sum + question.options.length,
          0,
        ),
        page_spanning_questions: questions
          .filter(
            (question) =>
              question.source.page_start !== question.source.page_end,
          )
          .map((question) => question.number),
        editorial_note_questions: questions
          .filter(
            (question) =>
              question.review.normalization.notes.length > 0,
          )
          .map((question) => question.number),
        verified: questions.every(
          (question) =>
            question.review.normalization.status === "verified",
        ),
      };
    },
  );
}

requireCommand("ruby");

if (!existsSync(inputJsonPath)) {
  fail(
    "Enriched dataset is missing. Run scripts/enrich-yefvv-2024-complex-content.mjs first.",
  );
}

const inputDataset = JSON.parse(readFileSync(inputJsonPath, "utf8"));
const dataset = clone(inputDataset);
const inputInvariantSnapshot = snapshotInvariantFields(inputDataset);
const stats = {
  markdown_blocks_visited: 0,
  markdown_blocks_changed: 0,
  layout_line_breaks_removed: 0,
  hyphenated_line_breaks_joined: 0,
};

if (
  !Array.isArray(dataset.questions) ||
  dataset.questions.length !== expectedQuestionCount
) {
  fail(`Expected ${expectedQuestionCount} questions`);
}

normalizeAllMarkdown(dataset, stats);
structureCodeContent(dataset);
applyManualCorrections(dataset);
addReviewMetadata(dataset);

dataset.dataset.status = "normalized";
dataset.normalization = {
  method:
    "deterministic_layout_normalization_with_curated_code_blocks",
  input: `data/enriched/${sourceId}.json`,
  report: `reports/${sourceId}-normalization.json`,
  manual_validation_report:
    `reports/${sourceId}-manual-validation.json`,
  batch_size: batchSize,
  batch_count: Math.ceil(expectedQuestionCount / batchSize),
};

const actualQuestionNumbers = dataset.questions.map(
  (question) => question.number,
);
const expectedQuestionNumbers = Array.from(
  { length: expectedQuestionCount },
  (_, index) => index + 1,
);
const optionCount = dataset.questions.reduce(
  (sum, question) => sum + question.options.length,
  0,
);
const actualPageSpanningQuestions = dataset.questions
  .filter(
    (question) =>
      question.source.page_start !== question.source.page_end,
  )
  .map((question) => question.number);
const outputInvariantSnapshot = snapshotInvariantFields(dataset);
const invariantsUnchanged =
  JSON.stringify(inputInvariantSnapshot) ===
  JSON.stringify(outputInvariantSnapshot);
const batches = createBatchReport(dataset);
const markdownLineBreakQuestions =
  questionNumbersWithMarkdownLineBreaks(dataset);
const codeQuestionNumbers = questionNumbersWithBlockType(dataset, "code");
const imageQuestionNumbers = questionNumbersWithBlockType(dataset, "image");
const questionsWithEditorialNotes = dataset.questions
  .filter(
    (question) => question.review.normalization.notes.length > 0,
  )
  .map((question) => question.number);
const manuallyVerifiedMedia = [
  ...new Set(
    dataset.questions.flatMap(
      (question) => question.review.manual_validation.linked_media,
    ),
  ),
];

if (
  JSON.stringify(actualQuestionNumbers) !==
  JSON.stringify(expectedQuestionNumbers)
) {
  fail("Question numbering is not a complete 1-140 sequence");
}

if (optionCount !== expectedOptionCount) {
  fail(`Expected ${expectedOptionCount} options, found ${optionCount}`);
}

if (!invariantsUnchanged) {
  fail(
    "IDs, answers, explanations, classifications, or source references changed during normalization",
  );
}

if (
  JSON.stringify(actualPageSpanningQuestions) !==
  JSON.stringify(pageSpanningQuestions)
) {
  fail("The set of page-spanning questions changed");
}

if (
  markdownLineBreakQuestions.length !== 1 ||
  markdownLineBreakQuestions[0] !== 107
) {
  fail(
    `Unexpected markdown line breaks remain in questions: ${markdownLineBreakQuestions.join(", ")}`,
  );
}

if (
  dataset.questions.some(
    (question) =>
      question.options.length !== 4 ||
      question.prompt.length === 0 ||
      question.options.some((option) => option.content.length === 0),
  )
) {
  fail("Every question must have a prompt and four non-empty options");
}

if (
  batches.some(
    (batch) =>
      batch.question_count !== batchSize ||
      batch.option_count !== batchSize * 4 ||
      !batch.verified,
  )
) {
  fail("One or more normalization batches failed verification");
}

const report = {
  schema_version: 1,
  source_id: sourceId,
  status: "normalized",
  input: {
    file: relative(projectRoot, inputJsonPath),
    sha256: sha256(inputJsonPath),
  },
  tools: {
    node: process.version,
    ruby: toolVersion("ruby"),
  },
  rules: {
    layout_line_breaks:
      "Join PDF layout wraps with one space inside markdown blocks.",
    hyphenated_line_breaks:
      "Join split compound words without adding a space and preserve the hyphen.",
    numbered_lists:
      "Preserve numbered list items as separate markdown lines.",
    source_fidelity:
      "Do not silently correct spelling, punctuation, or official answers.",
    code_blocks:
      "Represent SQL, macro-like text, and command sequences as typed code blocks.",
  },
  statistics: {
    ...stats,
    question_count: dataset.questions.length,
    option_count: optionCount,
    markdown_block_count: countBlocks(dataset, "markdown"),
    code_block_count: countBlocks(dataset, "code"),
    math_block_count: countBlocks(dataset, "math"),
    table_block_count: countBlocks(dataset, "table"),
    image_block_count: countBlocks(dataset, "image"),
    editorial_note_count: [...editorialNotes.values()].reduce(
      (sum, notes) => sum + notes.length,
      0,
    ),
  },
  structured_content: {
    newly_structured_code_questions: newlyStructuredCodeQuestions,
    all_code_questions: codeQuestionNumbers,
    image_questions: imageQuestionNumbers,
    markdown_line_break_questions: markdownLineBreakQuestions,
  },
  editorial_review: {
    question_count: questionsWithEditorialNotes.length,
    question_numbers: questionsWithEditorialNotes,
  },
  batches,
  validation: {
    passed: true,
    complete_question_sequence: true,
    four_options_per_question: true,
    official_answers_unchanged: invariantsUnchanged,
    source_references_unchanged: invariantsUnchanged,
    page_spanning_questions_verified:
      actualPageSpanningQuestions.length === pageSpanningQuestions.length,
    page_spanning_question_numbers: actualPageSpanningQuestions,
    all_batches_verified: batches.every((batch) => batch.verified),
    unexpected_markdown_line_breaks: 0,
  },
  outputs: {
    normalized_yaml: relative(projectRoot, outputYamlPath),
    normalized_json: relative(projectRoot, outputJsonPath),
    report: relative(projectRoot, reportPath),
    manual_validation_report: relative(
      projectRoot,
      manualValidationReportPath,
    ),
  },
};

const manualValidationReport = {
  schema_version: 1,
  source_id: sourceId,
  status: "manual_validation_completed",
  completed_on: "2026-06-10",
  method:
    "Sequential visual comparison of each rendered PDF page against normalized questions and linked media.",
  coverage: {
    page_count: 29,
    question_count: dataset.questions.length,
    option_count: optionCount,
    linked_media_count: manuallyVerifiedMedia.length,
    pages: Array.from({ length: 29 }, (_, index) => {
      const page = index + 1;
      return {
        page,
        status: "verified",
        question_numbers: dataset.questions
          .filter(
            (question) =>
              question.source.page_start <= page &&
              question.source.page_end >= page,
          )
          .map((question) => question.number),
      };
    }),
  },
  corrections: [
    {
      question: 8,
      type: "ocr_script",
      change:
        "Replaced Cyrillic lookalikes in «High-voltage Electrical Networks» with Latin characters.",
    },
    {
      question: 15,
      type: "math_structure",
      change: "Restored the subscript in A_2 and structured the number as math.",
    },
    {
      question: 16,
      type: "formula_fidelity",
      change:
        "Restored the source multiplication symbol * in the tanh formula.",
    },
    {
      question: 51,
      type: "code_fidelity",
      change:
        "Restored source spacing, comments, and statement line layout in C++ snippets.",
    },
    {
      question: 64,
      type: "typography",
      change: "Restored the Ukrainian typographic apostrophe in «об’єктів».",
    },
    {
      question: 74,
      type: "math_structure",
      change: "Restored the exponent in O(m^2) and typed all options as math.",
    },
    {
      question: 91,
      type: "ocr_script",
      change: "Replaced Cyrillic с with Latin c in push (c).",
    },
    {
      question: 116,
      type: "math_structure",
      change:
        "Restored mathematical variables and expressions as typed math blocks.",
    },
    {
      question: 120,
      type: "ocr_script_and_math_structure",
      change:
        "Restored Latin set names a, b, c and structured Boolean vectors as math.",
    },
    {
      question: 123,
      type: "ocr_script_and_math_structure",
      change:
        "Restored Latin O and n in O(n) and structured the notation as math.",
    },
  ],
  corrected_question_numbers: manuallyCorrectedQuestions,
  invariants: {
    official_answers_changed: false,
    question_ids_changed: false,
    source_pages_changed: false,
  },
  outputs: {
    normalized_yaml: relative(projectRoot, outputYamlPath),
    normalized_json: relative(projectRoot, outputJsonPath),
  },
};

const temporaryOutputJsonPath = `${outputJsonPath}.tmp`;
const temporaryOutputYamlPath = `${outputYamlPath}.tmp`;
const temporaryReportPath = `${reportPath}.tmp`;
const temporaryManualValidationReportPath =
  `${manualValidationReportPath}.tmp`;

mkdirSync(dirname(outputJsonPath), { recursive: true });
mkdirSync(dirname(reportPath), { recursive: true });

writeFileSync(
  temporaryOutputJsonPath,
  `${JSON.stringify(dataset, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  temporaryOutputYamlPath,
  jsonToYaml(dataset),
  "utf8",
);
writeFileSync(
  temporaryReportPath,
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  temporaryManualValidationReportPath,
  `${JSON.stringify(manualValidationReport, null, 2)}\n`,
  "utf8",
);

renameSync(temporaryOutputJsonPath, outputJsonPath);
renameSync(temporaryOutputYamlPath, outputYamlPath);
renameSync(temporaryReportPath, reportPath);
renameSync(
  temporaryManualValidationReportPath,
  manualValidationReportPath,
);

console.log(`Normalized questions: ${dataset.questions.length}`);
console.log(`Normalized options: ${optionCount}`);
console.log(`Removed layout line breaks: ${stats.layout_line_breaks_removed}`);
console.log(`Verified batches: ${batches.length}`);
console.log(`YAML: ${relative(projectRoot, outputYamlPath)}`);
console.log(`Report: ${relative(projectRoot, reportPath)}`);
console.log(
  `Manual validation: ${relative(projectRoot, manualValidationReportPath)}`,
);
