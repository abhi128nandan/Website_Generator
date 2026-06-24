const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:\\website-generator-core\\website-generator-core\\generation-artifacts\\calculatordisplay-attempts.json', 'utf8'));
const raw = data[0].raw;
const script = `
import { FrontendAppGenerator } from './src/generators/frontend-generator';
import path from 'path';
import fs from 'fs';

async function run() {
  const targetDir = path.join(process.cwd(), '../../generation-artifacts/test-calc-attempt1');
  fs.mkdirSync(targetDir, { recursive: true });

  const provider = {
    generateText: async (p) => {
      return \`${raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
    }
  };

  try {
    await (FrontendAppGenerator as any).generateValidCode(provider, '...', true, 'CalculatorDisplay', targetDir, (l,m) => console.log(m));
    console.log('SUCCESS');
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

run();
`;
fs.writeFileSync('c:\\website-generator-core\\website-generator-core\\packages\\generators\\test-calculator-attempt1.ts', script);
