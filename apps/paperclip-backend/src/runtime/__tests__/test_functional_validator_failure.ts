import { FunctionalValidator } from '../../../../../packages/generators/src/validators/functional-validator';
import { ProviderFactory } from '@paperclip/ai-engine';

console.log('==================================================');
console.log('=== FUNCTIONAL VALIDATOR FAILURE TEST ===');
console.log('==================================================\n');

// Mock ProviderFactory.getProvider to return an object that throws an error on generation
const originalGetProvider = ProviderFactory.getProvider;
ProviderFactory.getProvider = () => {
  return {
    generateJSON: async () => {
      throw new Error('Controlled Mock LLM Provider Failure');
    },
    generateText: async () => {
      throw new Error('Controlled Mock LLM Provider Failure');
    }
  } as any;
};

async function test() {
  const dummyReqs: any = {
    appName: 'TestApp',
    classifiedMode: 'frontend-app',
    features: ['Feature 1'],
    workflows: ['Workflow 1'],
  };
  
  const result = await FunctionalValidator.validate('dummy-dir', dummyReqs);
  console.log('Result Score:', result.score);
  console.log('Result Criteria:', JSON.stringify(result.criteria, null, 2));
  console.log('Result missingFunctionality:', result.missingFunctionality);
  console.log('Result feedback:', result.feedback);
  
  if (result.score === 0) {
    console.log('\n✅ Success: score = 0 as expected, not 100!');
    process.exit(0);
  } else {
    console.log('\n❌ Failure: score was not 0!');
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
