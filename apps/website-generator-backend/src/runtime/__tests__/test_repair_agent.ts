import dotenv from 'dotenv';
import path from 'path';

// Load env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import { RepairAgent } from '../../../../../packages/generators/src/agents/repair-agent';
import fs from 'fs/promises';

console.log('==================================================');
console.log('=== REPAIR AGENT VERIFICATION TEST ===');
console.log('==================================================\n');

const tempProjectDir = path.resolve(__dirname, 'test-repair-project');
const componentRelPath = 'frontend/src/components/MyComponent.tsx';
const componentAbsPath = path.join(tempProjectDir, componentRelPath);

const brokenContent = `import React from 'react';

interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  // Intentional error: accessing a property that does not exist on string or Props
  console.log(title.nonExistentProp);
  return (
    <div>{title}</div>
  );
};
`;

const reportedErrors = [
  'frontend/src/components/MyComponent.tsx:9:21 - error TS2339: Property \'nonExistentProp\' does not exist on type \'Props\' or type \'string\'.'
];

async function runTest() {
  try {
    // 1. Create clean environment
    await fs.mkdir(path.dirname(componentAbsPath), { recursive: true });
    await fs.writeFile(componentAbsPath, brokenContent, 'utf8');
    
    console.log('--- Broken Component Content ---');
    console.log(brokenContent);
    console.log('--------------------------------\n');
    
    // 1.5. Mock the AI Provider to return corrected code deterministically
    console.log('[MOCK] Replacing ProviderFactory.getProvider to return corrected code...');
    const { ProviderFactory } = require('@website-generator/ai-engine');
    const originalGetProvider = ProviderFactory.getProvider;
    ProviderFactory.getProvider = () => {
      return {
        generateText: async (_prompt: string) => {
          const correctedContent = `import React from 'react';

interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  console.log(title);
  return (
    <div>{title}</div>
  );
};
`;
          return '```typescript\n' + correctedContent + '\n```';
        },
        generateJSON: async (_prompt: string) => {
          return '{}';
        },
      } as any;
    };

    console.log('Invoking RepairAgent.repair...');
    const result = await RepairAgent.repair(tempProjectDir, reportedErrors);

    // Restore provider
    ProviderFactory.getProvider = originalGetProvider;
    console.log(`Repair result: ${result}\n`);
    
    if (!result) {
      throw new Error('RepairAgent returned false (failed to repair)');
    }
    
    // 2. Read repaired file
    const repairedContent = await fs.readFile(componentAbsPath, 'utf8');
    
    console.log('--- Repaired Component Content ---');
    console.log(repairedContent);
    console.log('----------------------------------\n');
    
    // Check that the error is gone
    if (repairedContent.includes('nonExistentProp')) {
      console.log('❌ Error: The repaired file still contains the broken reference.');
      process.exit(1);
    } else {
      console.log('✅ Success: Repair Agent activated, repaired the error, and corrected the code!');
      
      // Clean up temp project directory
      await fs.rm(tempProjectDir, { recursive: true, force: true });
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('Test failed with error:', err);
    // Clean up on failure as well
    try { await fs.rm(tempProjectDir, { recursive: true, force: true }); } catch (e) {}
    process.exit(1);
  }
}

runTest();
