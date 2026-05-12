const mammoth = require('mammoth');
const convertText = require('./text');
const { htmlToLatex } = require('./html');

module.exports = async function(buffer) {
    try {
        const result = await mammoth.convertToHtml({ buffer });
        return htmlToLatex(result.value);
    } catch (err) {
        if (err.message && err.message.includes('end of central directory')) {
            return convertText(buffer);
        }
        throw err;
    }
};
