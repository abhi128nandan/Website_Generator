import dotenv from 'dotenv';
import path from 'path';

// Load env from monorepo root (needed for ProviderFactory even though we mock it)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import { RepairAgent } from '../../../../../packages/generators/src/agents/repair-agent';
import { ProviderFactory } from '@paperclip/ai-engine';
import fs from 'fs/promises';

console.log('==================================================');
console.log('=== REPAIR AGENT ROLLBACK VERIFICATION TEST ===');
console.log('==================================================\n');

const tempProjectDir = path.resolve(__dirname, 'test-rollback-project');

// --- Setup: Create a minimal project with ONE known error ---

// This file has exactly 1 real error: duplicate identifier 'MyComponent'
const originalBrokenContent = `import React from 'react';

interface Props {
  title: string;
}

// One declaration — this is fine
export const MyComponent: React.FC<Props> = ({ title }) => {
  return (
    <div>{title}</div>
  );
};
`;

// This is what the mock AI will return — WORSE code with many syntax errors
const worseRepairedContent = `import React from 'react';

interface Props {
  title: string;
}

// Intentionally broken: multiple syntax errors introduced by bad repair
export const MyComponent: React.FC<Props> = ({ title }) => {
  const x = ;  // SyntaxError: Expression expected
  const y = {  // SyntaxError: Unclosed brace
  return (
    <div>{title}</div
  );  // SyntaxError: Missing closing >
};

export const MyComponent: React.FC<Props> = ({ title }) => { // Duplicate declaration
  return <div>duplicate</div>;
};
`;

// main.tsx (required by ReactStructureValidator)
const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
`;

// App.tsx (required by ReactStructureValidator) 
const appTsx = `import React from 'react';
import { MyComponent } from './components/MyComponent';

function App() {
  return <MyComponent title="hello" />;
}

export default App;
`;

async function setupProject() {
  // Clean up from any previous run
  try { await fs.rm(tempProjectDir, { recursive: true, force: true }); } catch {}

  // Create directory structure
  await fs.mkdir(path.join(tempProjectDir, 'frontend', 'src', 'components'), { recursive: true });
  await fs.mkdir(path.join(tempProjectDir, 'logs'), { recursive: true });

  // Write the files
  await fs.writeFile(
    path.join(tempProjectDir, 'frontend', 'src', 'components', 'MyComponent.tsx'),
    originalBrokenContent,
    'utf8'
  );
  await fs.writeFile(
    path.join(tempProjectDir, 'frontend', 'src', 'main.tsx'),
    mainTsx,
    'utf8'
  );
  await fs.writeFile(
    path.join(tempProjectDir, 'frontend', 'src', 'App.tsx'),
    appTsx,
    'utf8'
  );
}

async function runTest() {
  try {
    // 1. Setup the test project
    console.log('[SETUP] Creating test project structure...');
    await setupProject();
    console.log('[SETUP] Test project created at:', tempProjectDir);

    // 2. Read original file content for comparison later
    const originalContent = await fs.readFile(
      path.join(tempProjectDir, 'frontend', 'src', 'components', 'MyComponent.tsx'),
      'utf8'
    );

    // 3. Mock the AI Provider to return WORSE code
    console.log('[MOCK] Replacing ProviderFactory.getProvider to return worse code...');
    const originalGetProvider = ProviderFactory.getProvider;
    ProviderFactory.getProvider = () => {
      return {
        generateText: async (_prompt: string) => {
          // Return the worse code wrapped in a markdown code block (as the real LLM would)
          return '```typescript\n' + worseRepairedContent + '\n```';
        },
        generateJSON: async (_prompt: string) => {
          return '{}';
        },
      } as any;
    };

    // 4. Invoke RepairAgent with an error that points to MyComponent.tsx
    const errors = [
      'frontend/src/components/MyComponent.tsx:5:10 - error TS2322: Some type error'
    ];

    console.log('\n[TEST] Invoking RepairAgent.repair()...');
    const result = await RepairAgent.repair(tempProjectDir, errors);
    console.log(`[TEST] RepairAgent.repair() returned: ${result}`);

    // Restore provider
    ProviderFactory.getProvider = originalGetProvider;

    // 5. Verify that result is false (rollback should have triggered)
    if (result !== false) {
      throw new Error('Expected RepairAgent.repair() to return false after rollback, but got true');
    }
    console.log('✅ RepairAgent returned false (repair was rejected)');

    // 6. Verify that original file contents were restored
    const restoredContent = await fs.readFile(
      path.join(tempProjectDir, 'frontend', 'src', 'components', 'MyComponent.tsx'),
      'utf8'
    );

    if (restoredContent !== originalContent) {
      console.log('--- Expected (original) ---');
      console.log(originalContent);
      console.log('--- Got (restored) ---');
      console.log(restoredContent);
      throw new Error('File contents were NOT restored to original after rollback!');
    }
    console.log('✅ File contents were restored to original after rollback');

    // 7. Verify that generation.log contains the expected [REPAIR] markers
    const generationLog = await fs.readFile(
      path.join(tempProjectDir, 'logs', 'generation.log'),
      'utf8'
    );

    const requiredMarkers = [
      '[REPAIR]\nSnapshot Created',
      '[REPAIR]\nError Count Before:',
      '[REPAIR]\nRepair Applied',
      '[REPAIR]\nError Count After:',
      '[REPAIR]\nRollback Triggered',
    ];

    console.log('\n--- Verification of [REPAIR] Log Markers ---');
    let allPassed = true;
    for (const marker of requiredMarkers) {
      const found = generationLog.includes(marker);
      console.log(`[${found ? '✓' : '✗'}] Log contains "${marker.replace(/\n/g, '\\n')}"`);
      if (!found) allPassed = false;
    }

    if (!allPassed) {
      console.log('\n--- Full generation.log ---');
      console.log(generationLog);
      throw new Error('Not all required [REPAIR] log markers were found in generation.log');
    }
    console.log('✅ All [REPAIR] log markers present');

    // 8. Extract error counts to show proof of regression detection
    const beforeMatch = generationLog.match(/Error Count Before: (\d+)/);
    const afterMatch = generationLog.match(/Error Count After: (\d+)/);
    if (beforeMatch && afterMatch) {
      const before = parseInt(beforeMatch[1], 10);
      const after = parseInt(afterMatch[1], 10);
      console.log(`\n[PROOF] Error Count Before: ${before}`);
      console.log(`[PROOF] Error Count After:  ${after}`);
      console.log(`[PROOF] After > Before?     ${after > before} → Rollback triggered correctly`);
    }

    // 9. Cleanup
    await fs.rm(tempProjectDir, { recursive: true, force: true });

    console.log('\n==================================================');
    console.log('🎉 ALL ROLLBACK VERIFICATION TESTS PASSED 🎉');
    console.log('==================================================');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.message);
    // Cleanup on failure
    try { await fs.rm(tempProjectDir, { recursive: true, force: true }); } catch {}
    process.exit(1);
  }
}

runTest();
