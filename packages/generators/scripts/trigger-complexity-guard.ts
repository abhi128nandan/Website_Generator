import { FrontendComplexityGuard } from '../src/validators/frontend-complexity-guard';
import path from 'path';

async function run() {
  const reqs = {
    features: ['calculator', 'basic layout'],
    frontendArchitecture: {
      components: [
        { name: 'Button' },
        { name: 'Display' },
        { name: 'Keypad' },
        { name: 'Wrapper' },
        { name: 'ExtraComponent' } // 5th component, exceeds calculator limit of 4
      ],
      hooks: [
        { name: 'useCalculator' },
        { name: 'useMath' } // 2nd hook, exceeds calculator limit of 1
      ],
      services: [],
      pages: [
        { name: 'Home' }
      ]
    }
  };

  const targetDir = path.join(__dirname, '..'); // Output will be in packages/generators/generation-artifacts

  console.log("Triggering complexity guard...");
  try {
    await FrontendComplexityGuard.validate(reqs, targetDir);
    console.log("Success? This shouldn't happen.");
  } catch (err) {
    console.log("Caught expected error:");
    console.error(err.message);
  }
}

run();
