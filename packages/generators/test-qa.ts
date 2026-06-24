import { FunctionalValidator } from './src/validators/functional-validator';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const targetDir = 'C:\\website-generator-core\\website-generator-core\\apps\\runtime\\generated-projects\\06748500-438d-4a8c-a195-e97c07126edb';
  const metaStr = await fs.readFile(path.join(targetDir, 'metadata.json'), 'utf-8');
  const metadata = JSON.parse(metaStr);
  const reqs = {
    workflows: metadata.workflows,
    classifiedMode: metadata.classifiedMode,
    architecture: metadata.architecture,
    frontendArchitecture: metadata.architecture,
  };

  console.log("Running FunctionalValidator.validate...");
  const result = await FunctionalValidator.validate(targetDir, reqs as any);
  console.log("RESULT:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
