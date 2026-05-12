const pdfParse = require('pdf-parse');

module.exports = async function(buffer) {
    const data = await pdfParse(buffer);
    const lines = data.text.split('\n').filter(l => l.trim());
    
    return lines.map(line => {
        // Heuristic: dòng ngắn, toàn chữ hoa → có thể là heading
        if (line.length < 60 && line === line.toUpperCase() && line.trim()) {
        return `\\section{${escapeTex(line.trim())}}`;
        }
        return escapeTex(line) + '\n';
    }).join('\n');
};

function escapeTex(text) {
    return text.replace(/[&%$#_{}~^\\]/g, c =>
        c === '\\' ? '\\textbackslash{}' : c === '&' ? '\\&' : '\\' + c
    );
}