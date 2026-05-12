module.exports = async function(buffer) {
    const lines = buffer.toString('utf8').split('\n').filter(l => l.trim());
    return lines.map(line => escapeTex(line.trim())).join('\n\n');
};

function escapeTex(text) {
    return text.replace(/[&%$#_{}~^\\]/g, c =>
        c === '\\' ? '\\textbackslash{}' : '\\' + c
    );
}
