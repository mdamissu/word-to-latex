const path = require('path');
const fs = require('fs');
const convertPdf   = require('./converters/pdf');
const convertWord  = require('./converters/word');
const convertExcel = require('./converters/excel');
const convertHtml  = require('./converters/html');
const convertText  = require('./converters/text');
const convertCsv        = require('./converters/csv');
const convertEpub       = require('./converters/epub');
const convertPowerPoint = require('./converters/powerpoint');

const EXT_MAP = {
  '.pdf':  convertPdf,
  '.docx': convertWord,
  '.doc':  convertWord,
  '.xlsx': convertExcel,
  '.xls':  convertExcel,
  '.html': convertHtml,
  '.htm':  convertHtml,
  '.txt':  convertText,
  '.csv':  convertCsv,
  '.epub': convertEpub,
  '.pptx': convertPowerPoint,
  '.ppt':  convertPowerPoint,
};

async function convert(inputFile, outputFile, forceType) {
  const ext = forceType ? `.${forceType}` : path.extname(inputFile).toLowerCase();
  const converterFn = EXT_MAP[ext];

  if (!converterFn) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const buffer = fs.readFileSync(inputFile);
  const latex = await converterFn(buffer, inputFile);

  const wrapped = wrapLatex(latex);
  fs.writeFileSync(outputFile, wrapped, 'utf8');
}

function wrapLatex(body) {
  return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{hyperref}

\\begin{document}

${body}

\\end{document}`;
}

module.exports = { convert };