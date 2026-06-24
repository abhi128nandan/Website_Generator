const { LucideIconValidator } = require('./dist/validators/lucide-icon-validator');

const tests = [
  'Loader', 'LogOut', 'LucideProps', 'createLucideIcon', 'Equal', 'Divide', 'Minus', 'Home', 'Settings',
  'Subtract', 'Equals', 'Multiply', 'Eraser'
];

const results = {};

for (const symbol of tests) {
  const code = `import { ${symbol} } from 'lucide-react';`;
  const res = LucideIconValidator.validate(code);
  results[symbol] = {
    result: res.isValid ? 'PASS' : 'FAIL',
    error: res.reason || null
  };
}

const fs = require('fs');
fs.writeFileSync('C:/website-generator-core/website-generator-core/generation-artifacts/lucide-regression-report.json', JSON.stringify(results, null, 2));
