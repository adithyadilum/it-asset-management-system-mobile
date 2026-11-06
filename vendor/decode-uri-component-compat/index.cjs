// query-string 7 expects a CommonJS function; upstream 0.5.1 is ESM.
const decoder = require('decode-uri-component-modern');
module.exports = decoder.default;
