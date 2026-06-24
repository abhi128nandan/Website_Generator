import fs from 'fs/promises';
import path from 'path';
import { GraphState } from '../graph/state';

export class ArtifactManager {
  private baseDir: string;

  constructor(private projectId: string, private projectRoot: string) {
    this.baseDir = path.join(this.projectRoot, '.websiteGenerator', 'artifacts');
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {}
  }

  async generateArtifacts(state: GraphState): Promise<void> {
    await this.init();

    // 1. architecture.json
    if (state.requirements) {
      await fs.writeFile(
        path.join(this.baseDir, 'architecture.json'),
        JSON.stringify(state.requirements, null, 2),
        'utf-8'
      );
    }

    // 2. execution-plan.md
    const plan = `# Execution Plan for ${this.projectId}
    
## Stages
- Planner
- Generator
- Dependencies
- Prisma
- Backend
- Frontend
- Validator

## Status
${state.status}
`;
    await fs.writeFile(path.join(this.baseDir, 'execution-plan.md'), plan, 'utf-8');

    // 3. runtime-report.json
    await fs.writeFile(
      path.join(this.baseDir, 'runtime-report.json'),
      JSON.stringify(state.runtime, null, 2),
      'utf-8'
    );

    // 4. repair-history.json
    await fs.writeFile(
      path.join(this.baseDir, 'repair-history.json'),
      JSON.stringify(state.repairs, null, 2),
      'utf-8'
    );
    
    // 5. logs (append to existing)
    const logsContent = state.logs.map(l => JSON.stringify(l)).join('\n');
    await fs.mkdir(path.join(this.baseDir, 'logs'), { recursive: true });
    await fs.appendFile(
      path.join(this.baseDir, 'logs', 'structured.jsonl'),
      logsContent + (logsContent.length > 0 ? '\n' : ''),
      'utf-8'
    );
  }
}
