#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  accessSync,
  constants,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
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
const sourceRelativePath =
  "raw/ЄФВВ - ІНФОРМАЦІЙНІ ТЕХНОЛОГІЇ/" +
  "YEFVV_2024-Informatsijni-tehnologiyi-na_sajt__.pdf";
const sourcePath = join(projectRoot, sourceRelativePath);
const outputDirectory = join(projectRoot, "sources", sourceId);
const pagesDirectory = join(outputDirectory, "pages");
const manifestPath = join(outputDirectory, "source.json");

const expectedSourceSha256 =
  "9f07d30a5c71ac087c9e11b6b2e5794a3f5ccc15ead05f69474c2f59312bef81";
const expectedPageCount = 29;
const expectedQuestionCount = 140;
const renderDpi = 180;

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

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parsePdfInfo(output) {
  const result = {};

  for (const line of output.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    result[key] = value;
  }

  return result;
}

function parseBoolean(value) {
  if (value === "yes") {
    return true;
  }
  if (value === "no") {
    return false;
  }
  return value;
}

function parsePageSize(value) {
  const match = value.match(/^([\d.]+) x ([\d.]+) pts/);
  if (!match) {
    fail(`Could not parse PDF page size: ${value}`);
  }

  return {
    width_points: Number(match[1]),
    height_points: Number(match[2]),
  };
}

function pngDimensions(path) {
  const buffer = readFileSync(path);
  const pngSignature = "89504e470d0a1a0a";

  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    fail(`Rendered page is not a PNG: ${path}`);
  }

  return {
    width_px: buffer.readUInt32BE(16),
    height_px: buffer.readUInt32BE(20),
  };
}

function toolVersion(command) {
  const result = spawnSync(command, ["-v"], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error || result.status !== 0) {
    fail(`Could not determine version of ${command}`);
  }

  const output = `${result.stdout}${result.stderr}`;
  return output.split("\n")[0].trim();
}

for (const command of ["pdfinfo", "pdftoppm"]) {
  requireCommand(command);
}

try {
  accessSync(sourcePath, constants.R_OK);
} catch {
  fail(`Source PDF is missing or unreadable: ${sourceRelativePath}`);
}

const sourceSha256 = sha256(sourcePath);
if (sourceSha256 !== expectedSourceSha256) {
  fail(
    [
      "Source checksum does not match the fixed document.",
      `Expected: ${expectedSourceSha256}`,
      `Actual:   ${sourceSha256}`,
    ].join("\n"),
  );
}

const pdfInfo = parsePdfInfo(run("pdfinfo", [sourcePath]));
const pageCount = Number(pdfInfo.Pages);
if (pageCount !== expectedPageCount) {
  fail(`Expected ${expectedPageCount} pages, found ${pageCount}`);
}

mkdirSync(outputDirectory, { recursive: true });
const temporaryDirectory = mkdtempSync(join(outputDirectory, ".render-"));

try {
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const pageName = `page-${String(pageNumber).padStart(3, "0")}`;

    execFileSync(
      "pdftoppm",
      [
        "-f",
        String(pageNumber),
        "-l",
        String(pageNumber),
        "-singlefile",
        "-png",
        "-r",
        String(renderDpi),
        sourcePath,
        join(temporaryDirectory, pageName),
      ],
      { stdio: "ignore" },
    );

    const renderedPath = join(temporaryDirectory, `${pageName}.png`);
    if (!existsSync(renderedPath)) {
      fail(`Page ${pageNumber} was not rendered`);
    }
  }

  const pageRecords = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const fileName = `page-${String(pageNumber).padStart(3, "0")}.png`;
    const renderedPath = join(temporaryDirectory, fileName);
    const dimensions = pngDimensions(renderedPath);

    pageRecords.push({
      number: pageNumber,
      file: `sources/${sourceId}/pages/${fileName}`,
      ...dimensions,
      size_bytes: statSync(renderedPath).size,
      sha256: sha256(renderedPath),
    });
  }

  rmSync(pagesDirectory, { recursive: true, force: true });
  renameSync(temporaryDirectory, pagesDirectory);

  const pageSize = parsePageSize(pdfInfo["Page size"]);
  const manifest = {
    schema_version: 1,
    source_id: sourceId,
    status: "fixed",
    document: {
      title: "ЄФВВ 2024 — Інформаційні технології",
      exam: "ЄФВВ",
      subject: "Інформаційні технології",
      year: 2024,
      language: "uk",
      origin: "official",
      question_count: expectedQuestionCount,
    },
    source: {
      file: sourceRelativePath,
      size_bytes: statSync(sourcePath).size,
      checksum: {
        algorithm: "sha256",
        value: sourceSha256,
      },
      pdf: {
        pages: pageCount,
        ...pageSize,
        rotation_degrees: Number(pdfInfo["Page rot"]),
        version: pdfInfo["PDF version"],
        encrypted: parseBoolean(pdfInfo.Encrypted),
        tagged: parseBoolean(pdfInfo.Tagged),
        optimized: parseBoolean(pdfInfo.Optimized),
        creation_date: pdfInfo.CreationDate,
        modification_date: pdfInfo.ModDate,
        author: pdfInfo.Author,
        creator: pdfInfo.Creator,
        producer: pdfInfo.Producer,
      },
    },
    rendering: {
      purpose: "visual verification during extraction and normalization",
      command: "pdftoppm",
      tool_version: toolVersion("pdftoppm"),
      dpi: renderDpi,
      format: "png",
      color_mode: "source",
      directory: `sources/${sourceId}/pages`,
      page_count: pageRecords.length,
      pages: pageRecords,
    },
  };

  const temporaryManifestPath = `${manifestPath}.tmp`;
  writeFileSync(
    temporaryManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  renameSync(temporaryManifestPath, manifestPath);

  console.log(`Fixed source: ${relative(projectRoot, sourcePath)}`);
  console.log(`SHA-256: ${sourceSha256}`);
  console.log(`Rendered pages: ${pageRecords.length}`);
  console.log(`Manifest: ${relative(projectRoot, manifestPath)}`);
} catch (error) {
  rmSync(temporaryDirectory, { recursive: true, force: true });
  throw error;
}
