const path = require('path');
const JSZip = require('jszip');
const { htmlToLatex } = require('./html');

module.exports = async function(buffer) {
    const zip = await JSZip.loadAsync(buffer);

    const containerXml = await zip.file('META-INF/container.xml').async('string');
    const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
    if (!opfPath) throw new Error('Could not locate OPF file in EPUB');

    const opfDir = path.posix.dirname(opfPath);
    const opfXml = await zip.file(opfPath).async('string');

    const manifest = {};
    for (const m of opfXml.matchAll(/<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g)) {
        manifest[m[1]] = m[2];
    }

    const spineIds = [...opfXml.matchAll(/<itemref[^>]+idref="([^"]+)"/g)].map(m => m[1]);

    let output = '';
    for (const id of spineIds) {
        const href = manifest[id];
        if (!href) continue;
        const filePath = opfDir && opfDir !== '.' ? `${opfDir}/${href}` : href;
        const file = zip.file(filePath) || zip.file(href);
        if (!file) continue;
        output += htmlToLatex(await file.async('string'));
    }
    return output;
};
