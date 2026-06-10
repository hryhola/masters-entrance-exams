#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sourceId = "yefvv-it-2024";
const sourceManifestPath = join(
  projectRoot,
  "sources",
  sourceId,
  "source.json",
);
const draftJsonPath = join(
  projectRoot,
  "data",
  "drafts",
  `${sourceId}.json`,
);
const outputJsonPath = join(
  projectRoot,
  "data",
  "enriched",
  `${sourceId}.json`,
);
const outputYamlPath = join(
  projectRoot,
  "data",
  "enriched",
  `${sourceId}.yaml`,
);
const reportPath = join(
  projectRoot,
  "reports",
  `${sourceId}-complex-content.json`,
);
const embeddedImagesDirectory = join(
  projectRoot,
  "sources",
  sourceId,
  "embedded-images",
);
const assetsDirectory = join(projectRoot, "assets", sourceId);

const expectedEmbeddedImageCount = 45;
const expectedComplexQuestionNumbers = [
  9, 13, 16, 31, 38, 51, 57, 71, 75, 76, 86, 97, 103, 113, 119, 126,
  140,
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

function toolVersion(command, versionArgument = "-v") {
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

function pngDimensions(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`Expected PNG image: ${path}`);
  }

  return {
    width_px: buffer.readUInt32BE(16),
    height_px: buffer.readUInt32BE(20),
  };
}

function parsePdfImagesList(output) {
  const records = [];

  for (const line of output.split("\n")) {
    const match = line.match(
      /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+/u,
    );

    if (!match) {
      continue;
    }

    records.push({
      page: Number(match[1]),
      number: Number(match[2]),
      pdf_type: match[3],
      width_px: Number(match[4]),
      height_px: Number(match[5]),
      color: match[6],
      components: Number(match[7]),
      bits_per_component: Number(match[8]),
      encoding: match[9],
      interpolated: match[10] === "yes",
      object_id: Number(match[11]),
      object_generation: Number(match[12]),
      x_ppi: Number(match[13]),
      y_ppi: Number(match[14]),
    });
  }

  return records;
}

function sourceImagePath(number) {
  return `sources/${sourceId}/embedded-images/image-${String(number).padStart(
    3,
    "0",
  )}.png`;
}

function markdown(text) {
  return { type: "markdown", text };
}

function math(latex, display, imageNumbers) {
  return {
    type: "math",
    latex,
    display,
    source_images: imageNumbers.map(sourceImagePath),
  };
}

function code(language, text, imageNumbers) {
  return {
    type: "code",
    language,
    text,
    source_images: imageNumbers.map(sourceImagePath),
  };
}

function table(columns, rows, imageNumber) {
  return {
    type: "table",
    columns,
    rows,
    source_images: [sourceImagePath(imageNumber)],
  };
}

function image(path, alt, role, imageNumber) {
  return {
    type: "image",
    path,
    alt,
    role,
    source_images: [sourceImagePath(imageNumber)],
  };
}

function getQuestion(dataset, number) {
  const question = dataset.questions.find(
    (candidate) => candidate.number === number,
  );

  if (!question) {
    fail(`Question ${number} is missing from the draft dataset`);
  }

  return question;
}

function setOption(question, optionId, content) {
  const option = question.options.find(
    (candidate) => candidate.id === optionId,
  );

  if (!option) {
    fail(`Question ${question.number} is missing option ${optionId}`);
  }

  option.content = content;
}

function markComplexContentComplete(question, imageNumbers) {
  const retainedFlags = question.review.flags.filter(
    (flag) => flag === "spans_multiple_pages",
  );

  question.review = {
    transcription: "complex_content_transcribed",
    requires_visual_review: false,
    visual_verification: "completed",
    complex_content: "verified",
    source_image_numbers: imageNumbers,
    flags: retainedFlags,
  };
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

const imageMappings = [
  { number: 0, question: 9, placement: "option_a", representation: "image_asset" },
  { number: 1, question: 9, placement: "option_b", representation: "image_asset" },
  { number: 2, question: 9, placement: "option_c", representation: "image_asset" },
  { number: 3, question: 9, placement: "option_d", representation: "image_asset" },
  { number: 4, question: 13, placement: "prompt", representation: "math" },
  { number: 5, question: 13, placement: "option_a", representation: "math" },
  { number: 6, question: 16, placement: "option_a", representation: "math" },
  { number: 7, question: 16, placement: "option_b", representation: "math" },
  { number: 8, question: 16, placement: "option_c", representation: "math" },
  { number: 9, question: 16, placement: "option_d", representation: "math" },
  { number: 10, question: 31, placement: "prompt", representation: "math" },
  { number: 11, question: 38, placement: "prompt", representation: "math" },
  { number: 12, question: 38, placement: "option_c", representation: "math" },
  { number: 13, question: 51, placement: "option_a", representation: "code" },
  { number: 14, question: 51, placement: "option_c", representation: "code" },
  { number: 15, question: 51, placement: "option_d", representation: "code" },
  { number: 16, question: 51, placement: "option_b", representation: "code" },
  { number: 17, question: 51, placement: "prompt", representation: "code" },
  { number: 18, question: 57, placement: "option_a", representation: "math" },
  { number: 19, question: 57, placement: "option_b", representation: "math" },
  { number: 20, question: 57, placement: "prompt", representation: "math" },
  { number: 21, question: 57, placement: "option_c", representation: "math" },
  { number: 22, question: 57, placement: "option_d", representation: "math" },
  { number: 23, question: 71, placement: "prompt", representation: "image_asset" },
  { number: 24, question: 75, placement: "prompt", representation: "image_asset" },
  { number: 25, question: 76, placement: "prompt", representation: "math" },
  { number: 26, question: 76, placement: "option_a", representation: "math" },
  { number: 27, question: 76, placement: "option_b", representation: "math" },
  { number: 28, question: 76, placement: "option_c", representation: "math" },
  { number: 29, question: 76, placement: "option_d", representation: "math" },
  { number: 30, question: 86, placement: "prompt", representation: "table" },
  { number: 31, question: 97, placement: "prompt", representation: "math" },
  { number: 32, question: 97, placement: "prompt", representation: "math" },
  { number: 33, question: 97, placement: "prompt", representation: "math" },
  { number: 34, question: 97, placement: "option_a", representation: "math" },
  { number: 35, question: 97, placement: "option_b", representation: "math" },
  { number: 36, question: 97, placement: "option_c", representation: "math" },
  { number: 37, question: 97, placement: "option_d", representation: "math" },
  { number: 38, question: 103, placement: "prompt", representation: "math" },
  { number: 39, question: 103, placement: "prompt", representation: "math" },
  { number: 40, question: 103, placement: "prompt", representation: "math" },
  { number: 41, question: 113, placement: "prompt", representation: "image_asset" },
  { number: 42, question: 119, placement: "prompt", representation: "image_asset" },
  { number: 43, question: 126, placement: "prompt", representation: "code" },
  { number: 44, question: 140, placement: "prompt", representation: "image_asset" },
];

const assetDefinitions = new Map([
  [
    0,
    {
      path: `assets/${sourceId}/q009/option-a.png`,
      alt: "Варіант A ER-діаграми: «Студент» пов’язаний із «Оцінка», а «Оцінка» — з «Дисципліна»; біля «Оцінка» з обох боків стоять позначки множинності crow’s foot, біля «Дисципліна» — 0..1.",
      role: "option",
    },
  ],
  [
    1,
    {
      path: `assets/${sourceId}/q009/option-b.png`,
      alt: "Варіант B ER-діаграми: «Студент» пов’язаний із «Оцінка», а «Оцінка» — з «Дисципліна»; біля «Оцінка» та «Дисципліна» використано позначки множинності crow’s foot.",
      role: "option",
    },
  ],
  [
    2,
    {
      path: `assets/${sourceId}/q009/option-c.png`,
      alt: "Варіант C ER-діаграми: послідовність сутностей «Студент» — «Дисципліна» — «Оцінка» з позначкою множинності crow’s foot біля «Дисципліна» та «Оцінка».",
      role: "option",
    },
  ],
  [
    3,
    {
      path: `assets/${sourceId}/q009/option-d.png`,
      alt: "Варіант D ER-діаграми: послідовність сутностей «Студент» — «Дисципліна» — «Оцінка» з позначками множинності crow’s foot біля «Дисципліна».",
      role: "option",
    },
  ],
  [
    23,
    {
      path: `assets/${sourceId}/q071/prompt.png`,
      alt: "UML-схема із системною межею, акторами «Клієнт», «Клерк-службовець», «Сервіс оплат» і «Адміністратор» та овальними варіантами використання «Перевірка», «Допомога», «Оплата» й «Обслуговування».",
      role: "prompt",
    },
  ],
  [
    24,
    {
      path: `assets/${sourceId}/q075/prompt.png`,
      alt: "Орієнтований граф із шістьма вершинами V1–V6 та напрямленими ребрами; потрібно визначити вхідний степінь вершини V6.",
      role: "prompt",
    },
  ],
  [
    41,
    {
      path: `assets/${sourceId}/q113/prompt.png`,
      alt: "Сім комп’ютерів окремими лініями під’єднані до одного центрального мережевого комутатора.",
      role: "prompt",
    },
  ],
  [
    42,
    {
      path: `assets/${sourceId}/q119/prompt.png`,
      alt: "Орієнтований граф із шістьма вершинами V1–V6 та напрямленими ребрами; потрібно визначити вихідний степінь вершини V2.",
      role: "prompt",
    },
  ],
  [
    44,
    {
      path: `assets/${sourceId}/q140/prompt.png`,
      alt: "Дерево: корінь A має нащадків B та E; B має нащадків D і F; E має нащадка C.",
      role: "prompt",
    },
  ],
]);

for (const command of ["pdfimages", "ruby"]) {
  requireCommand(command);
}

if (!existsSync(sourceManifestPath) || !existsSync(draftJsonPath)) {
  fail(
    "Required stage 1 or stage 2 artifacts are missing. Run the earlier scripts first.",
  );
}

const manifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
const dataset = JSON.parse(readFileSync(draftJsonPath, "utf8"));
const sourcePath = join(projectRoot, manifest.source.file);

if (sha256(sourcePath) !== manifest.source.checksum.value) {
  fail("Source PDF checksum does not match the fixed manifest");
}

if (
  imageMappings.length !== expectedEmbeddedImageCount ||
  new Set(imageMappings.map((entry) => entry.number)).size !==
    expectedEmbeddedImageCount
) {
  fail("Embedded image mapping must cover exactly 45 unique image numbers");
}

const temporaryRoot = mkdtempSync(join(projectRoot, ".enrich-yefvv-"));
const temporaryEmbeddedDirectory = join(temporaryRoot, "embedded-images");
const temporaryAssetsDirectory = join(temporaryRoot, "assets");
mkdirSync(temporaryEmbeddedDirectory, { recursive: true });
mkdirSync(temporaryAssetsDirectory, { recursive: true });

try {
  const listOutput = execFileSync("pdfimages", ["-list", sourcePath], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const pdfImageMetadata = parsePdfImagesList(listOutput);

  if (pdfImageMetadata.length !== expectedEmbeddedImageCount) {
    fail(
      `Expected ${expectedEmbeddedImageCount} embedded images, found ${pdfImageMetadata.length}`,
    );
  }

  execFileSync(
    "pdfimages",
    [
      "-png",
      sourcePath,
      join(temporaryEmbeddedDirectory, "image"),
    ],
    { stdio: "ignore" },
  );

  const extractedFiles = readdirSync(temporaryEmbeddedDirectory)
    .filter((name) => /^image-\d{3}\.png$/u.test(name))
    .sort();

  if (extractedFiles.length !== expectedEmbeddedImageCount) {
    fail(
      `Expected ${expectedEmbeddedImageCount} extracted PNG files, found ${extractedFiles.length}`,
    );
  }

  for (const [imageNumber, definition] of assetDefinitions) {
    const sourceFile = join(
      temporaryEmbeddedDirectory,
      `image-${String(imageNumber).padStart(3, "0")}.png`,
    );
    const destinationFile = join(
      temporaryAssetsDirectory,
      definition.path.replace(`assets/${sourceId}/`, ""),
    );
    mkdirSync(dirname(destinationFile), { recursive: true });
    copyFileSync(sourceFile, destinationFile);
  }

  const q9 = getQuestion(dataset, 9);
  for (const [optionId, imageNumber] of [
    ["a", 0],
    ["b", 1],
    ["c", 2],
    ["d", 3],
  ]) {
    const definition = assetDefinitions.get(imageNumber);
    setOption(q9, optionId, [
      image(
        definition.path,
        definition.alt,
        definition.role,
        imageNumber,
      ),
    ]);
  }
  markComplexContentComplete(q9, [0, 1, 2, 3]);

  const q13 = getQuestion(dataset, 13);
  q13.prompt = [
    markdown("Чому дорівнює границя"),
    math("\\lim_{n \\to \\infty} \\frac{1}{n}", "inline", [4]),
    markdown("?"),
  ];
  setOption(q13, "a", [math("\\infty", "inline", [5])]);
  setOption(q13, "b", [math("0", "inline", [])]);
  setOption(q13, "c", [math("-1", "inline", [])]);
  setOption(q13, "d", [math("1", "inline", [])]);
  markComplexContentComplete(q13, [4, 5]);

  const q16 = getQuestion(dataset, 16);
  setOption(q16, "a", [
    math("F(x) = \\frac{1}{1 + \\exp(-x)}", "block", [6]),
  ]);
  setOption(q16, "b", [
    math(
      "\\theta(x) = \\begin{cases} 0, & x < 0, \\\\ 1, & x \\ge 0. \\end{cases}",
      "block",
      [7],
    ),
  ]);
  setOption(q16, "c", [
    math(
      "\\tanh(x) = 2 * \\operatorname{sigmoid}(2x) - 1",
      "block",
      [8],
    ),
  ]);
  setOption(q16, "d", [
    math("f(x) = \\max(0, x)", "block", [9]),
  ]);
  markComplexContentComplete(q16, [6, 7, 8, 9]);

  const q31 = getQuestion(dataset, 31);
  q31.prompt = [
    ...q31.prompt,
    math(
      [
        "\\begin{aligned}",
        "1)\\;& f(x)=cx; \\\\",
        "2)\\;& f(x)=e^{-cx^2}; \\\\",
        "3)\\;& f(x)=\\frac{1}{1+e^{-cx}}; \\\\",
        "4)\\;& f(x)=\\begin{cases}1, & x \\ge 0; \\\\ 0, & x < 0.\\end{cases}",
        "\\end{aligned}",
      ].join("\n"),
      "block",
      [10],
    ),
  ];
  markComplexContentComplete(q31, [10]);

  const q38 = getQuestion(dataset, 38);
  q38.prompt = [
    markdown("Обчисліть границю"),
    math(
      "\\lim_{\\Delta x \\to 0} \\frac{(x+\\Delta x)^3-x^3}{\\Delta x}",
      "inline",
      [11],
    ),
    markdown(", якщо вона існує."),
  ];
  setOption(q38, "a", [math("0", "inline", [])]);
  setOption(q38, "b", [math("3", "inline", [])]);
  setOption(q38, "c", [math("3x^2", "inline", [12])]);
  markComplexContentComplete(q38, [11, 12]);

  const q51 = getQuestion(dataset, 51);
  q51.prompt = [
    markdown(
      "Потрібно запрограмувати сховище даних – стек, членами класу якого є:",
    ),
    markdown(
      "//дані-члени; //конструктор; //деструктор та //функції-члени інтерфейсу стека",
    ),
    code(
      "cpp",
      [
        "class IntStack",
        "{",
        "private:",
        "    int *p;",
        "    int size, num;",
        "public:",
        "    IntStack (int);",
        "    ~IntStack(void);",
        "    void Push(int);",
        "    int Get(void);",
        "};",
      ].join("\n"),
      [17],
    ),
    markdown("Який опис відповідає деструктору класу?"),
  ];
  setOption(q51, "a", [
    code(
      "cpp",
      [
        "IntStack::IntStack(int s)",
        "{",
        "    p = new int[s];",
        "    size = s;",
        "    num = 0;",
        "}",
      ].join("\n"),
      [13],
    ),
  ]);
  setOption(q51, "b", [
    code(
      "cpp",
      [
        "IntStack::~IntStack(void)",
        "{",
        "    delete []p;",
        "}",
      ].join("\n"),
      [16],
    ),
  ]);
  setOption(q51, "c", [
    code(
      "cpp",
      [
        "void IntStack::Push(int elem)",
        "{",
        "    if (num < size) //контроль переповнювання стека",
        "    {",
        "        p[num] = elem;",
        "        num++; //лічильник кількості збережених елементів у стеку",
        "    }",
        "}",
      ].join("\n"),
      [14],
    ),
  ]);
  setOption(q51, "d", [
    code(
      "cpp",
      [
        "int IntStack::Get(void)",
        "{",
        "    if (num < 1) return 0;",
        "    num--; return p[num];",
        "}",
      ].join("\n"),
      [15],
    ),
  ]);
  markComplexContentComplete(q51, [13, 14, 15, 16, 17]);

  const q57 = getQuestion(dataset, 57);
  q57.prompt = [
    markdown("Задано функцію"),
    math("f(x)=\\cos^3 x,\\quad x\\in\\mathbb{R}.", "inline", [20]),
    markdown("Визначте"),
    math("f'(x)", "inline", []),
    markdown("."),
  ];
  setOption(q57, "a", [
    math("3\\cos^2 x\\cdot\\sin x", "inline", [18]),
  ]);
  setOption(q57, "b", [
    math("-3\\cos^2 x\\cdot\\sin x", "inline", [19]),
  ]);
  setOption(q57, "c", [
    math("-3\\sin^2 x\\cdot\\cos x", "inline", [21]),
  ]);
  setOption(q57, "d", [
    math("3\\sin^2 x\\cdot\\cos x", "inline", [22]),
  ]);
  markComplexContentComplete(q57, [18, 19, 20, 21, 22]);

  const q71 = getQuestion(dataset, 71);
  const q71Asset = assetDefinitions.get(23);
  q71.prompt.push(
    image(q71Asset.path, q71Asset.alt, q71Asset.role, 23),
  );
  markComplexContentComplete(q71, [23]);

  const q75 = getQuestion(dataset, 75);
  const q75Asset = assetDefinitions.get(24);
  q75.prompt.push(
    image(q75Asset.path, q75Asset.alt, q75Asset.role, 24),
  );
  markComplexContentComplete(q75, [24]);

  const q76 = getQuestion(dataset, 76);
  q76.prompt = [
    ...q76.prompt,
    math("f(x,y)=-x^3+4xy-2y^2+1.", "block", [25]),
  ];
  setOption(q76, "a", [math("(1;1)", "inline", [26])]);
  setOption(q76, "b", [
    math(
      "(0;0)\\quad\\text{та}\\quad\\left(\\frac{4}{3};\\frac{4}{3}\\right)",
      "inline",
      [27],
    ),
  ]);
  setOption(q76, "c", [
    math("\\left(\\frac{4}{3};\\frac{4}{3}\\right)", "inline", [28]),
  ]);
  setOption(q76, "d", [
    math("(0;0)\\quad\\text{та}\\quad(1;1)", "inline", [29]),
  ]);
  markComplexContentComplete(q76, [25, 26, 27, 28, 29]);

  const q86 = getQuestion(dataset, 86);
  q86.prompt = [
    markdown(
      "Дано таблицю «Студент» реляційної бази вказаної структури та змісту.",
    ),
    table(
      [
        "Ідентифікатор (число)",
        "Рейтинг (число)",
        "На бюджеті (логічне значення)",
      ],
      [
        ["1", "70", "ні"],
        ["2", "65", "так"],
        ["3", "93", "ні"],
        ["4", "85", "так"],
      ],
      30,
    ),
    markdown("До цієї таблиці зробили запит:"),
    code(
      "sql",
      [
        "SELECT Ідентифікатор",
        "FROM Студент",
        "WHERE (Рейтинг > 70 AND Рейтинг < 90) OR [На бюджеті]=true;",
      ].join("\n"),
      [],
    ),
    markdown(
      "Який перелік значень буде повернуто як результат виконання цього запиту?",
    ),
  ];
  markComplexContentComplete(q86, [30]);

  const q97 = getQuestion(dataset, 97);
  q97.prompt = [
    markdown("Визначте першу похідну"),
    math("\\frac{dy(x)}{dx}", "inline", [31]),
    markdown("від виразу"),
    math(
      "y(x)=1-\\left(e^{-(a\\cdot x)}\\right)",
      "inline",
      [32],
    ),
    markdown("якщо"),
    math("a=\\mathrm{const}.", "inline", [33]),
  ];
  setOption(q97, "a", [
    math("y'(x)=(-a)\\cdot e^{-(a\\cdot x)}", "inline", [34]),
  ]);
  setOption(q97, "b", [
    math(
      "y'(x)=\\left(-\\frac{1}{a}\\right)\\cdot e^{-(a\\cdot x)}",
      "inline",
      [35],
    ),
  ]);
  setOption(q97, "c", [
    math(
      "y'(x)=\\left(\\frac{1}{a}\\right)\\cdot e^{-(a\\cdot x)}",
      "inline",
      [36],
    ),
  ]);
  setOption(q97, "d", [
    math("y'(x)=a\\cdot e^{-(a\\cdot x)}", "inline", [37]),
  ]);
  markComplexContentComplete(q97, [31, 32, 33, 34, 35, 36, 37]);

  const q103 = getQuestion(dataset, 103);
  q103.prompt = [
    markdown("Яким об’єктом є добуток вектора стовпчика"),
    math(
      "\\begin{pmatrix}a_1\\\\a_2\\end{pmatrix}",
      "inline",
      [38],
    ),
    markdown("та вектора рядка"),
    math(
      "\\begin{pmatrix}b_1 & b_2 & b_3\\end{pmatrix}",
      "inline",
      [40],
    ),
    markdown(", тобто"),
    math(
      "\\begin{pmatrix}a_1\\\\a_2\\end{pmatrix}\\begin{pmatrix}b_1 & b_2 & b_3\\end{pmatrix}",
      "inline",
      [39],
    ),
    markdown("?"),
  ];
  markComplexContentComplete(q103, [38, 39, 40]);

  const q113 = getQuestion(dataset, 113);
  const q113Asset = assetDefinitions.get(41);
  q113.prompt.push(
    image(q113Asset.path, q113Asset.alt, q113Asset.role, 41),
  );
  markComplexContentComplete(q113, [41]);

  const q119 = getQuestion(dataset, 119);
  const q119Asset = assetDefinitions.get(42);
  q119.prompt.push(
    image(q119Asset.path, q119Asset.alt, q119Asset.role, 42),
  );
  markComplexContentComplete(q119, [42]);

  const q126 = getQuestion(dataset, 126);
  q126.prompt = [
    ...q126.prompt,
    code(
      "text",
      [
        "Оголосити чергу цілих чисел з ім’ям queue",
        "queue.Enqueue(0)",
        "queue.Enqueue(1)",
        "queue.Dequeue()",
        "queue.Enqueue(2)",
        "queue.Dequeue()",
      ].join("\n"),
      [43],
    ),
  ];
  markComplexContentComplete(q126, [43]);

  const q140 = getQuestion(dataset, 140);
  const q140Asset = assetDefinitions.get(44);
  q140.prompt = [
    markdown("Виконайте пошук в глибину (DFS), починаючи з вершини A."),
    image(q140Asset.path, q140Asset.alt, q140Asset.role, 44),
    markdown("Який правильний порядок обходу вершин?"),
  ];
  markComplexContentComplete(q140, [44]);

  dataset.dataset.status = "complex_content_enriched";
  dataset.enrichment = {
    method: "manual_transcription_with_embedded_image_inventory",
    source_embedded_images: `sources/${sourceId}/embedded-images`,
    assets_directory: `assets/${sourceId}`,
    report: `reports/${sourceId}-complex-content.json`,
    complex_question_count: expectedComplexQuestionNumbers.length,
  };

  const actualComplexQuestions = dataset.questions
    .filter(
      (question) =>
        question.review.complex_content === "verified",
    )
    .map((question) => question.number);

  if (
    JSON.stringify(actualComplexQuestions) !==
    JSON.stringify(expectedComplexQuestionNumbers)
  ) {
    fail(
      `Unexpected complex question set: ${actualComplexQuestions.join(", ")}`,
    );
  }

  for (const number of expectedComplexQuestionNumbers) {
    const question = getQuestion(dataset, number);
    if (question.review.requires_visual_review) {
      fail(`Question ${number} still requires visual review`);
    }
    if (
      question.options.some((option) => option.content.length === 0)
    ) {
      fail(`Question ${number} still has an empty option`);
    }
  }

  const inventory = imageMappings.map((mapping) => {
    const fileName = `image-${String(mapping.number).padStart(3, "0")}.png`;
    const path = join(temporaryEmbeddedDirectory, fileName);
    const pdfMetadata = pdfImageMetadata.find(
      (entry) => entry.number === mapping.number,
    );
    const dimensions = pngDimensions(path);
    const asset = assetDefinitions.get(mapping.number);

    if (!pdfMetadata) {
      fail(`PDF metadata is missing for image ${mapping.number}`);
    }

    return {
      number: mapping.number,
      question: mapping.question,
      page: pdfMetadata.page,
      placement: mapping.placement,
      representation: mapping.representation,
      extracted_file: sourceImagePath(mapping.number),
      asset_file: asset?.path ?? null,
      ...dimensions,
      size_bytes: statSync(path).size,
      sha256: sha256(path),
      pdf_object: {
        type: pdfMetadata.pdf_type,
        encoding: pdfMetadata.encoding,
        object_id: pdfMetadata.object_id,
        object_generation: pdfMetadata.object_generation,
        x_ppi: pdfMetadata.x_ppi,
        y_ppi: pdfMetadata.y_ppi,
      },
    };
  });

  const representationCounts = Object.fromEntries(
    [...new Set(inventory.map((entry) => entry.representation))]
      .sort()
      .map((representation) => [
        representation,
        inventory.filter(
          (entry) => entry.representation === representation,
        ).length,
      ]),
  );

  const report = {
    schema_version: 1,
    source_id: sourceId,
    status: "complex_content_enriched",
    source: {
      file: manifest.source.file,
      sha256: manifest.source.checksum.value,
    },
    tools: {
      pdfimages: toolVersion("pdfimages"),
      ruby: toolVersion("ruby", "--version"),
    },
    inventory: {
      embedded_image_count: inventory.length,
      representation_counts: representationCounts,
      web_asset_count: assetDefinitions.size,
      images: inventory,
    },
    questions: {
      enriched_count: actualComplexQuestions.length,
      enriched_numbers: actualComplexQuestions,
      formulas_transcribed: [13, 16, 31, 38, 57, 76, 97, 103],
      code_transcribed: [51, 126],
      tables_structured: [86],
      visual_assets_attached: [9, 71, 75, 113, 119, 140],
    },
    validation: {
      passed: true,
      all_embedded_images_mapped: inventory.length === 45,
      all_complex_questions_enriched:
        actualComplexQuestions.length ===
        expectedComplexQuestionNumbers.length,
      empty_options_in_complex_questions: 0,
      questions_requiring_visual_review_after_enrichment: 0,
    },
    outputs: {
      enriched_yaml: relative(projectRoot, outputYamlPath),
      enriched_json: relative(projectRoot, outputJsonPath),
      embedded_images: relative(
        projectRoot,
        embeddedImagesDirectory,
      ),
      web_assets: relative(projectRoot, assetsDirectory),
      report: relative(projectRoot, reportPath),
    },
  };

  const temporaryOutputJsonPath = `${outputJsonPath}.tmp`;
  const temporaryOutputYamlPath = `${outputYamlPath}.tmp`;
  const temporaryReportPath = `${reportPath}.tmp`;

  mkdirSync(dirname(outputJsonPath), { recursive: true });
  mkdirSync(dirname(reportPath), { recursive: true });
  mkdirSync(dirname(embeddedImagesDirectory), { recursive: true });
  mkdirSync(dirname(assetsDirectory), { recursive: true });

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

  rmSync(embeddedImagesDirectory, { recursive: true, force: true });
  renameSync(temporaryEmbeddedDirectory, embeddedImagesDirectory);
  rmSync(assetsDirectory, { recursive: true, force: true });
  renameSync(temporaryAssetsDirectory, assetsDirectory);
  renameSync(temporaryOutputJsonPath, outputJsonPath);
  renameSync(temporaryOutputYamlPath, outputYamlPath);
  renameSync(temporaryReportPath, reportPath);
  rmSync(temporaryRoot, { recursive: true, force: true });

  console.log(`Mapped embedded images: ${inventory.length}`);
  console.log(`Created web assets: ${assetDefinitions.size}`);
  console.log(`Enriched complex questions: ${actualComplexQuestions.length}`);
  console.log(`YAML: ${relative(projectRoot, outputYamlPath)}`);
  console.log(`Report: ${relative(projectRoot, reportPath)}`);
} catch (error) {
  rmSync(temporaryRoot, { recursive: true, force: true });
  throw error;
}
