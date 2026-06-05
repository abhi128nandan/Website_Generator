import { GenerationRouter } from '../src/router/generation-router';
import { NormalizedRequirements } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const GOLDEN_TEMPLATES = [
  {
    appName: 'Calculator',
    appType: 'calculator app',
    features: ['basic arithmetic', 'history'],
    classifiedMode: 'frontend-app'
  },
  {
    appName: 'Todo App',
    appType: 'todo app',
    features: ['add tasks', 'remove tasks', 'persist tasks'],
    classifiedMode: 'frontend-app'
  },
  {
    appName: 'Counter',
    appType: 'counter app',
    features: ['increment', 'decrement'],
    classifiedMode: 'frontend-app'
  },
  {
    appName: 'Inventory',
    appType: 'inventory management system',
    features: ['product listing', 'stock tracking', 'CRUD operations'],
    classifiedMode: 'crud-admin'
  },
  {
    appName: 'CRM',
    appType: 'customer relationship management',
    features: ['contacts list', 'leads tracking', 'sales pipeline'],
    classifiedMode: 'crud-admin'
  },
  {
    appName: 'Student Management',
    appType: 'student information system',
    features: ['students list', 'grades tracking'],
    classifiedMode: 'crud-admin'
  }
];

async function runGoldenSuite() {
  console.log('🌟 Starting Golden Test Suite...');
  let failed = false;

  for (const template of GOLDEN_TEMPLATES) {
    console.log(`\n--------------------------------------------`);
    console.log(`🧪 Testing: ${template.appName} (${template.classifiedMode})`);
    
    const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), `paperclip-golden-${template.appName.toLowerCase().replace(/\\s+/g, '-')}-`));
    
    try {
      await GenerationRouter.generate(
        template as NormalizedRequirements,
        targetDir,
        (step, msg) => {
          // Minimal logging for the suite
          if (msg.includes('FATAL') || msg.includes('Failed')) {
            console.error(`[${template.appName}] ${msg}`);
          }
        }
      );
      console.log(`✅ Success: ${template.appName}`);
    } catch (e: any) {
      console.error(`❌ Failed: ${template.appName}`);
      console.error(e.message);
      failed = true;
    }
  }

  if (failed) {
    console.error('\n💥 Golden Test Suite failed. Check errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All Golden Tests passed!');
    process.exit(0);
  }
}

// Run the suite if executed directly
if (require.main === module) {
  runGoldenSuite().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
