const cheerio = require('cheerio');

module.exports = async function(buffer) {
    const html = buffer.toString('utf8');
    return htmlToLatex(html);
};

function htmlToLatex(html) {
    const $ = cheerio.load(html);
    let output = '';

    $('h1, h2, h3, h4, p, ul, ol, table').each((_, el) => {
        const tag = el.name.toLowerCase();

        if (tag === 'h1') output += `\\section{${nodeToLatex($, el)}}\n\n`;
        else if (tag === 'h2') output += `\\subsection{${nodeToLatex($, el)}}\n\n`;
        else if (tag === 'h3') output += `\\subsubsection{${nodeToLatex($, el)}}\n\n`;
        else if (tag === 'h4') output += `\\paragraph{${nodeToLatex($, el)}}\n\n`;
        else if (tag === 'p') {
            const text = nodeToLatex($, el);
            if (text.trim()) output += text + '\n\n';
        }
        else if (tag === 'ul') {
            output += '\\begin{itemize}\n';
            $(el).find('> li').each((_, li) => {
                output += `  \\item ${nodeToLatex($, li)}\n`;
            });
            output += '\\end{itemize}\n\n';
        }
        else if (tag === 'ol') {
            output += '\\begin{enumerate}\n';
            $(el).find('> li').each((_, li) => {
                output += `  \\item ${nodeToLatex($, li)}\n`;
            });
            output += '\\end{enumerate}\n\n';
        }
        else if (tag === 'table') {
            const rows = $(el).find('tr');
            const colCount = $(rows.first()).find('th,td').length;
            if (!colCount) return;
            output += `\\begin{tabular}{${'l'.repeat(colCount)}}\n\\hline\n`;
            rows.each((_, row) => {
                const cells = $(row).find('th,td').map((_, td) => nodeToLatex($, td)).get();
                output += cells.join(' & ') + ' \\\\\n\\hline\n';
            });
            output += `\\end{tabular}\n\n`;
        }
    });

    return output;
}

function nodeToLatex($, el) {
    let result = '';
    $(el).contents().each((_, node) => {
        if (node.type === 'text') {
            result += escapeTex(node.data);
        } else if (node.type === 'tag') {
            const tag = node.name.toLowerCase();
            const inner = nodeToLatex($, node);
            if (tag === 'strong' || tag === 'b') result += `\\textbf{${inner}}`;
            else if (tag === 'em' || tag === 'i')  result += `\\textit{${inner}}`;
            else if (tag === 'code')               result += `\\texttt{${inner}}`;
            else if (tag === 'a') {
                const href = $(node).attr('href') || '';
                result += href ? `\\href{${href}}{${inner}}` : inner;
            }
            else result += inner;
        }
    });
    return result;
}

function escapeTex(text) {
    return text.replace(/[&%$#_{}~^\\]/g, c =>
        c === '\\' ? '\\textbackslash{}' : c === '&' ? '\\&' : '\\' + c
    );
}

module.exports.htmlToLatex = htmlToLatex;
