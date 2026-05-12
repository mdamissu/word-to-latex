module.exports = async function(buffer) {
    const rows = parseCSV(buffer.toString('utf8'));
    if (!rows.length) return '';

    const colCount = Math.max(...rows.map(r => r.length));
    const colSpec = Array(colCount).fill('l').join(' ');

    let output = `\\begin{longtable}{${colSpec}}\n\\toprule\n`;
    rows.forEach((row, i) => {
        const cells = Array(colCount).fill('').map((_, j) => escapeTex(String(row[j] ?? '')));
        output += cells.join(' & ') + ' \\\\\n';
        if (i === 0) output += '\\midrule\n';
    });
    output += '\\bottomrule\n\\end{longtable}\n';
    return output;
};

function parseCSV(text) {
    const rows = [];
    for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        rows.push(parseLine(line));
    }
    return rows;
}

function parseLine(line) {
    const fields = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(field.trim());
            field = '';
        } else {
            field += ch;
        }
    }
    fields.push(field.trim());
    return fields;
}

function escapeTex(text) {
    return text.replace(/[&%$#_{}~^\\]/g, c =>
        c === '\\' ? '\\textbackslash{}' : c === '&' ? '\\&' : '\\' + c
    );
}
