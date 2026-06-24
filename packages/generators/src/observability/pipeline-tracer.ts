import * as fs from 'fs/promises';
import * as path from 'path';

export interface PipelineTrace {
  artifact: string;
  provider: string;
  model: string;

  raw: {
    length: number;
    startsWith: string;
    containsThink: boolean;
    containsFence: boolean;
  };

  sanitizer: {
    beforeLength: number;
    afterLength: number;
    removedThink: boolean;
    removedFence: boolean;
  };

  extractor: {
    codeStartIndex: number;
    firstLine: string;
    startsWithImport: boolean;
    startsWithExport: boolean;
    startsWithInterface: boolean;
    startsWithConst: boolean;
  };

  syntaxGate: {
    passed: boolean;
    error: string | null;
  };

  compileGate: {
    passed: boolean;
    error: string | null;
  };

  diff: {
    rawToSanitizedRemoved: number;
    sanitizedToExtractedRemoved: number;
  };
}

export class PipelineTracer {
  private static getBaseDir(targetDir: string) {
    return path.join(targetDir, 'generation-artifacts', 'pipeline-trace');
  }

  static async initializeTrace(targetDir: string, artifact: string, provider: string, model: string): Promise<PipelineTrace> {
    const trace: PipelineTrace = {
      artifact, provider, model,
      raw: { length: 0, startsWith: '', containsThink: false, containsFence: false },
      sanitizer: { beforeLength: 0, afterLength: 0, removedThink: false, removedFence: false },
      extractor: { codeStartIndex: -1, firstLine: '', startsWithImport: false, startsWithExport: false, startsWithInterface: false, startsWithConst: false },
      syntaxGate: { passed: false, error: null },
      compileGate: { passed: false, error: null },
      diff: { rawToSanitizedRemoved: 0, sanitizedToExtractedRemoved: 0 }
    };
    return trace;
  }

  static async recordRaw(targetDir: string, trace: PipelineTrace, rawText: string) {
    trace.raw.length = rawText.length;
    trace.raw.startsWith = rawText.substring(0, 50).replace(/\n/g, ' ');
    trace.raw.containsThink = rawText.includes('<think>');
    trace.raw.containsFence = rawText.includes('```');

    const artifactDir = path.join(this.getBaseDir(targetDir), trace.artifact);
    await fs.mkdir(artifactDir, { recursive: true });
    await fs.writeFile(path.join(artifactDir, '01-raw.txt'), rawText, 'utf-8');
  }

  static async recordSanitized(targetDir: string, trace: PipelineTrace, sanitizedText: string) {
    trace.sanitizer.beforeLength = trace.raw.length;
    trace.sanitizer.afterLength = sanitizedText.length;
    trace.sanitizer.removedThink = trace.raw.containsThink && !sanitizedText.includes('<think>');
    trace.sanitizer.removedFence = trace.raw.containsFence && !sanitizedText.includes('```');
    trace.diff.rawToSanitizedRemoved = trace.raw.length - sanitizedText.length;

    const artifactDir = path.join(this.getBaseDir(targetDir), trace.artifact);
    await fs.writeFile(path.join(artifactDir, '02-sanitized.txt'), sanitizedText, 'utf-8');
  }

  static async recordExtracted(targetDir: string, trace: PipelineTrace, extractedText: string, sanitizedText: string) {
    const lines = extractedText.trim().split('\n');
    const firstLine = lines.length > 0 ? lines[0].trim() : '';
    
    trace.extractor.codeStartIndex = sanitizedText.indexOf(extractedText);
    trace.extractor.firstLine = firstLine;
    trace.extractor.startsWithImport = firstLine.startsWith('import');
    trace.extractor.startsWithExport = firstLine.startsWith('export');
    trace.extractor.startsWithInterface = firstLine.startsWith('interface');
    trace.extractor.startsWithConst = firstLine.startsWith('const');
    trace.diff.sanitizedToExtractedRemoved = sanitizedText.length - extractedText.length;

    const artifactDir = path.join(this.getBaseDir(targetDir), trace.artifact);
    await fs.writeFile(path.join(artifactDir, '03-extracted.tsx'), extractedText, 'utf-8');
  }

  static async saveTrace(targetDir: string, trace: PipelineTrace) {
    const baseDir = this.getBaseDir(targetDir);
    await fs.mkdir(baseDir, { recursive: true });
    await fs.writeFile(path.join(baseDir, `${trace.artifact}.json`), JSON.stringify(trace, null, 2), 'utf-8');
  }

  static async updateHealth(targetDir: string, failureType: 'syntax' | 'compile' | 'corruption' | 'success') {
    const healthPath = path.join(targetDir, 'generation-artifacts', 'pipeline-health.json');
    let health = {
      artifactsGenerated: 0,
      syntaxFailures: 0,
      compileFailures: 0,
      corruptionFailures: 0,
      successfulArtifacts: 0
    };

    try {
      const data = await fs.readFile(healthPath, 'utf-8');
      health = JSON.parse(data);
    } catch (e) {}

    health.artifactsGenerated++;
    if (failureType === 'syntax') health.syntaxFailures++;
    if (failureType === 'compile') health.compileFailures++;
    if (failureType === 'corruption') health.corruptionFailures++;
    if (failureType === 'success') health.successfulArtifacts++;

    await fs.mkdir(path.dirname(healthPath), { recursive: true });
    await fs.writeFile(healthPath, JSON.stringify(health, null, 2), 'utf-8');
  }

  static runCorruptionDetector(extractedText: string) {
    const lower = extractedText.trim().toLowerCase();
    const badStarts = [
      "let me", "i think", "perhaps", "maybe", "first", "next",
      "the component", "the hook", "the service"
    ];

    for (const phrase of badStarts) {
      if (lower.startsWith(phrase)) {
        throw new Error(`PIPELINE_CORRUPTION_DETECTED: Starts with '${phrase}'`);
      }
    }

    const validStarters = ['import', 'export', 'interface', 'type', 'const', 'function', 'enum'];
    const firstWord = extractedText.trim().split(/\s+/)[0];
    if (!validStarters.includes(firstWord)) {
      throw new Error(`INVALID_CODE_START: Extracted output MUST start with a valid anchor. Found: '${firstWord}'`);
    }
  }
}
