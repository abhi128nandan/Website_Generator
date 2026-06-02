import fs from 'fs/promises';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { PipelineStage, Checkpoint } from '@paperclip/shared';
import { GraphState } from '../graph/state';

export class CheckpointManager {
  private baseDir: string;

  constructor(private projectId: string, private projectRoot: string) {
    this.baseDir = path.join(this.projectRoot, '.paperclip', 'checkpoints');
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {}
  }

  async save(stage: PipelineStage, state: GraphState): Promise<Checkpoint> {
    await this.init();

    // Remove non-serializable or volatile properties if any
    const stateSnapshot = JSON.parse(JSON.stringify(state));

    const hash = createHash('sha256').update(JSON.stringify(stateSnapshot)).digest('hex');

    const checkpoint: Checkpoint = {
      id: randomUUID(),
      projectId: this.projectId,
      stage,
      timestamp: new Date().toISOString(),
      stateSnapshot,
      hash
    };

    const filePath = path.join(this.baseDir, `${stage}.json`);
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');

    return checkpoint;
  }

  async restore(stage: PipelineStage): Promise<Checkpoint | null> {
    const filePath = path.join(this.baseDir, `${stage}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async getLastValid(): Promise<Checkpoint | null> {
    try {
      const files = await fs.readdir(this.baseDir);
      const checkpoints: Checkpoint[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const data = await fs.readFile(path.join(this.baseDir, file), 'utf-8');
        checkpoints.push(JSON.parse(data));
      }

      if (checkpoints.length === 0) return null;

      // Sort descending by timestamp
      checkpoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return checkpoints[0];
    } catch {
      return null;
    }
  }
}
