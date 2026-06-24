import { FrontendAppGenerator } from './src/generators/frontend-generator';
import path from 'path';
import fs from 'fs';

async function run() {
  const targetDir = path.join(process.cwd(), '../../generation-artifacts/test-calc');
  fs.mkdirSync(targetDir, { recursive: true });
  
  const prompt = `You are a Senior Frontend Developer. 
Create a React TSX component named CalculatorDisplay. 
It must be a functional component.
It must include a self-closing tag like <div className="display" /> or <CalculatorDisplay /> to test truncation.`;

  const provider = {
    generateText: async (p: string) => {
      return `
\`\`\`tsx
import React from 'react';

export default function CalculatorDisplay() {
  return (
    <div className="calculator-display">
      <div className="output" />
    </div>
  );
}
\`\`\`
      `;
    }
  };

  try {
    const code = await (FrontendAppGenerator as any).generateValidCode(
      provider,
      prompt,
      true,
      'CalculatorDisplay',
      targetDir,
      (lvl: number, msg: string) => console.log(`[${lvl}] ${msg}`)
    );
    console.log("SUCCESS");
  } catch (err) {
    console.error("FAILED:", err);
  }
}

run();
