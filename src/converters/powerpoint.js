const JSZip = require('jszip');

module.exports = async function(buffer) {
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch (_) {
        throw new Error('Could not read file — is it a valid .pptx? Binary .ppt is not supported.');
    }

    const slideFiles = await getSlideOrder(zip);
    let output = '';
    for (let i = 0; i < slideFiles.length; i++) {
        const file = zip.file(slideFiles[i]);
        if (!file) continue;
        output += parseSlide(await file.async('string'));
    }
    return output;
};

async function getSlideOrder(zip) {
    try {
        const relsXml = await zip.file('ppt/_rels/presentation.xml.rels').async('string');
        const presXml = await zip.file('ppt/presentation.xml').async('string');

        const rIdToFile = {};
        for (const m of relsXml.matchAll(/Id="([^"]+)"[^>]+Target="([^"]+)"/g)) {
            if (m[2].includes('slide') && !m[2].includes('slideLayout') && !m[2].includes('slideMaster')) {
                const raw = m[2];
                const target = raw.startsWith('../') ? `ppt/${raw.slice(3)}` : `ppt/${raw}`;
                rIdToFile[m[1]] = target;
            }
        }

        const ordered = [];
        for (const m of presXml.matchAll(/<p:sldId[^>]+r:id="([^"]+)"/g)) {
            if (rIdToFile[m[1]]) ordered.push(rIdToFile[m[1]]);
        }
        if (ordered.length) return ordered;
    } catch (_) {}

    // Fallback: sort by slide number in filename
    return Object.keys(zip.files)
        .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
        .sort((a, b) => slideNum(a) - slideNum(b));
}

function slideNum(f) { return parseInt(f.match(/(\d+)\.xml$/)[1]); }

function parseSlide(xml) {
    let output = '';
    for (const sp of xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)) {
        const block = sp[0];
        const isTitle = /<p:ph\s[^>]*type="(?:title|ctrTitle)"/.test(block);

        const paragraphs = [];
        for (const p of block.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)) {
            const text = [...p[0].matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)]
                .map(m => decodeXml(m[1])).join('');
            if (text.trim()) paragraphs.push(text.trim());
        }
        if (!paragraphs.length) continue;

        if (isTitle) {
            output += `\\section{${escapeTex(paragraphs[0])}}\n\n`;
        } else if (paragraphs.length > 1) {
            output += '\\begin{itemize}\n';
            for (const p of paragraphs) output += `  \\item ${escapeTex(p)}\n`;
            output += '\\end{itemize}\n\n';
        } else {
            output += escapeTex(paragraphs[0]) + '\n\n';
        }
    }
    return output;
}

function decodeXml(text) {
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function escapeTex(text) {
    return text.replace(/[&%$#_{}~^\\]/g, c =>
        c === '\\' ? '\\textbackslash{}' : c === '&' ? '\\&' : '\\' + c
    );
}
