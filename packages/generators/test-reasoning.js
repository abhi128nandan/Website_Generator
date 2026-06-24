const { ReasoningDetector } = require('./dist/validators/reasoning-detector.js');
const fs = require('fs');

const cases = [
  { text: 'await fetch()', expectFail: false },
  { text: 'const [waitingForNextValue, setWaitingForNextValue] = useState(false);', expectFail: false },
  { text: 'const firstName = "John";', expectFail: false },
  { text: 'waitUntil()', expectFail: false },
  { text: 'wait a moment', expectFail: true },
  { text: 'let me think about this', expectFail: true },
  { text: 'first we create the component', expectFail: true }
];

const results = {};

for (const { text, expectFail } of cases) {
  const result = ReasoningDetector.detectReasoning(text);
  const actualFail = result.hasReasoning;
  const pass = actualFail === expectFail;
  
  results[text] = {
    expectedToHaveReasoning: expectFail,
    actualHasReasoning: actualFail,
    matchedPhrase: result.matchedPhrase || null,
    pass
  };
}

const outputPath = 'c:\\\\website-generator-core\\\\website-generator-core\\\\generation-artifacts\\\\reasoning-consolidation-regression.json';
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log('Regression results written to ' + outputPath);
