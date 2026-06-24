const { FrontendAppGenerator } = require('./dist/generators/frontend-generator');
const fs = require('fs');

class MockProvider {
  async generateText(prompt) {
    return `import React from 'react';
import { SortAsc, SortDesc, Trash } from 'lucide-react';

export default function TaskList() {
  return (
    <div>
      <SortAsc />
      <SortDesc />
      <ul>
        <li>Task 1 <Trash /></li>
      </ul>
    </div>
  );
}`;
  }
}

async function main() {
  const provider = new MockProvider();
  
  const targetDir = 'c:/website-generator-core/website-generator-core/apps/runtime/generated-projects/bb13007e-5f3e-46c5-b5f1-cd17951f9ba4';
  const prompt = `Create a TaskList React component in TypeScript. It should have a list of tasks. Export it as default.`;
  
  console.log('Generating TaskList...');
  try {
    const code = await FrontendAppGenerator["generateValidCode"](
      provider,
      prompt,
      true, // isTsx
      'TaskList',
      targetDir,
      (level, msg) => console.log(msg)
    );
    console.log('Generation successful!');
    
    // Save report
    const reportPath = 'c:/website-generator-core/website-generator-core/generation-artifacts/tasklist-post-repair-report.json';
    const report = {
      status: 'SUCCESS',
      finalCodeSize: code.length
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
  } catch(e) {
    console.error('Generation failed:', e);
    const reportPath = 'c:/website-generator-core/website-generator-core/generation-artifacts/tasklist-post-repair-report.json';
    const report = {
      status: 'FAIL',
      error: e.message
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
}

main();
