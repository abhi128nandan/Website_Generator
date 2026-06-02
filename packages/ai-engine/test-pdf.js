const pdfParse = require('pdf-parse');

console.log("Type of pdfParse:", typeof pdfParse);
console.log("Keys in pdfParse:", Object.keys(pdfParse));

if (typeof pdfParse === 'function') {
  console.log("It's a function!");
} else if (pdfParse.default) {
  console.log("Type of pdfParse.default:", typeof pdfParse.default);
}
