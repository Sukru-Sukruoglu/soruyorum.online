import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const [, , inputPathArg, outputPathArg] = process.argv;

if (!inputPathArg || !outputPathArg) {
  console.error("Usage: node scripts/render-markdown-report-to-pdf.mjs <input.md> <output.pdf>");
  process.exit(1);
}

const inputPath = path.resolve(inputPathArg);
const outputPath = path.resolve(outputPathArg);
const content = fs.readFileSync(inputPath, "utf8");

const fontCandidates = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
];

const boldFontCandidates = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
];

const regularFont = fontCandidates.find((candidate) => fs.existsSync(candidate));
const boldFont = boldFontCandidates.find((candidate) => fs.existsSync(candidate));

if (!regularFont || !boldFont) {
  console.error("Suitable system fonts were not found for PDF rendering.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const doc = new PDFDocument({ size: "A4", margin: 50 });
doc.pipe(fs.createWriteStream(outputPath));

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

function ensureSpace(height = 24) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function writeLine(text, options = {}) {
  const { font = regularFont, size = 11, color = "#111111", gapAfter = 6, indent = 0 } = options;
  ensureSpace(size + gapAfter + 6);
  doc.font(font).fontSize(size).fillColor(color).text(text, doc.page.margins.left + indent, doc.y, {
    width: pageWidth - indent,
    lineGap: 2,
  });
  doc.moveDown(gapAfter / 12);
}

for (const rawLine of content.split(/\r?\n/)) {
  const line = rawLine.trimEnd();

  if (!line.trim()) {
    doc.moveDown(0.45);
    continue;
  }

  if (line.startsWith("# ")) {
    writeLine(line.slice(2), { font: boldFont, size: 19, color: "#0f172a", gapAfter: 10 });
    continue;
  }

  if (line.startsWith("## ")) {
    writeLine(line.slice(3), { font: boldFont, size: 14, color: "#111827", gapAfter: 8 });
    continue;
  }

  if (line.startsWith("- ")) {
    writeLine(`• ${line.slice(2)}`, { font: regularFont, size: 11, color: "#222222", gapAfter: 4, indent: 10 });
    continue;
  }

  writeLine(line, { font: regularFont, size: 11, color: "#222222", gapAfter: 4 });
}

doc.end();