const XLSX = require('xlsx');

module.exports = async function(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let output = '';

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows.length) continue;

        output += `\\section{${escapeTex(sheetName)}}\n\n`;

        const colCount = Math.max(...rows.map(r => r.length));
        const colSpec = Array(colCount).fill('l').join(' ');

        output += `\\begin{longtable}{${colSpec}}\n\\toprule\n`;

        rows.forEach((row, i) => {
        const cells = Array(colCount).fill('').map((_, j) =>
            escapeTex(String(row[j] ?? ''))
        );
        output += cells.join(' & ') + ' \\\\\n';
        if (i === 0) output += '\\midrule\n';
        });

        output += `\\bottomrule\n\\end{longtable}\n\n`;
    }

    return output;
};

function escapeTex(text) {
    return text.replace(/[&%$#_{}~^\\]/g, c =>
        c === '\\' ? '\\textbackslash{}' : c === '&' ? '\\&' : '\\' + c
    );
}