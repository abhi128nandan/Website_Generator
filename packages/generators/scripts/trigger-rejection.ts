import { FrontendAppGenerator } from '../src/generators/frontend-generator';
import { ProviderFactory } from '@website-generator/ai-engine';
import path from 'path';

async function triggerRejection() {
  // Mock Provider to return reasoning instead of pure code
  const mockProvider = {
    id: 'mock',
    model: 'mock',
    generateText: async (prompt: string) => {
      return `let me think...\nperhaps I should use a div.\nthe user said they want a button.\n\n\`\`\`tsx\nimport React from 'react';\n\nexport default function TestComponent() {\n  return <div>Test</div>;\n}\n\`\`\``;
    },
    generateJSON: async (prompt: string) => '{}'
  };
  
  (ProviderFactory as any).getProvider = () => mockProvider;

  const targetDir = path.join(process.cwd(), 'generation-artifacts', 'trigger-test');
  
  const reqs = {
    appName: 'TestApp',
    appType: 'Utility',
    features: [],
    entities: [],
    description: 'Test application',
    frontendArchitecture: {
      components: [
        { name: 'TestComponent', type: 'component', description: 'Test' }
      ],
      pages: [],
      hooks: [],
      services: []
    }
  };

  try {
    await FrontendAppGenerator.generate(reqs as any, targetDir, (step, msg) => {});
  } catch (e: any) {
    console.log("Caught expected error:", e.message);
  }
}

triggerRejection().catch(console.error);
