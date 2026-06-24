import fs from 'fs/promises';
import path from 'path';
import { FrontendAppGenerator } from '../src/generators/frontend-generator';
import { NormalizedRequirements } from '@website-generator/shared';
import { ProviderFactory } from '../../ai-engine/src/providers/factory';
import os from 'os';

const BENCHMARKS_DIR = path.join(__dirname, '..', 'benchmarks');
const SRS_DIR = path.join(BENCHMARKS_DIR, 'srs');
const RUNS_DIR = path.join(BENCHMARKS_DIR, 'runs');

interface BenchmarkResult {
  srsName: string;
  provider?: string;
  model?: string;
  generationSuccess: boolean;
  sanitizerSuccess: boolean | string | null;
  integritySuccess: boolean | string | null;
  compilationSuccess: boolean | string | null;
  error?: string;
}

async function runBenchmark() {
  const files = await fs.readdir(SRS_DIR);
  const srsFiles = files.filter(f => f.endsWith('.srs.txt'));
  
  if (srsFiles.length === 0) {
    console.log("No SRS files found.");
    return;
  }

  const results: BenchmarkResult[] = [];
  
  await fs.mkdir(RUNS_DIR, { recursive: true });

  for (const file of srsFiles) {
    console.log(`\n================================`);
    console.log(`Evaluating ${file}...`);
    console.log(`================================\n`);
    
    const content = await fs.readFile(path.join(SRS_DIR, file), 'utf-8');
    const runName = file.replace('.srs.txt', '');
    const targetDir = path.join(RUNS_DIR, runName);
    
    // Clean target dir if exists
    await fs.rm(targetDir, { recursive: true, force: true });
    await fs.mkdir(targetDir, { recursive: true });
    
    const reqs: NormalizedRequirements = {
      appName: 'BenchmarkApp',
      features: [content],
      isSinglePage: true,
      colorPalette: { primary: '#000000', secondary: '#ffffff' },
      theme: 'light',
      routing: false,
      dataModels: [],
      pages: []
    };

    const result: BenchmarkResult = {
      srsName: runName,
      provider: 'unknown',
      model: 'unknown',
      generationSuccess: false,
      sanitizerSuccess: null,
      integritySuccess: null,
      compilationSuccess: null
    };

    try {
      const provider = ProviderFactory.getProvider();
      result.provider = provider.constructor.name.replace('Provider', '').toLowerCase();
      result.model = provider.getModel?.() || 'unknown';
      
      const health = await provider.healthCheck();
      if (health.status === 'error') {
        throw new Error(`PROVIDER_INITIALIZATION_FAILURE: ${health.message}`);
      }

      await FrontendAppGenerator.generate(reqs, targetDir, (step, msg) => {
        // Minimal logging
      });
      result.generationSuccess = true;
      result.sanitizerSuccess = true;
      result.integritySuccess = true;
      result.compilationSuccess = true;
    } catch (err: any) {
      console.error(`[Error] ${err.stack || err.message}`);
      result.error = err.message;
      
      // Categorize failure based on explicitly defined error types
      if (err.message.includes('OUTPUT_SANITIZER_FAILURE')) {
        result.sanitizerSuccess = false;
        result.integritySuccess = 'skipped';
        result.compilationSuccess = 'skipped';
      } else if (err.message.includes('ARTIFACT_INTEGRITY_FAILURE')) {
        result.sanitizerSuccess = true;
        result.integritySuccess = false;
        result.compilationSuccess = 'skipped';
      } else if (err.message.includes('COMPILATION_VALIDATION_FAILURE')) {
        result.sanitizerSuccess = true;
        result.integritySuccess = true;
        result.compilationSuccess = false;
      } else if (err.message.includes('LLM_CONFIGURATION_FAILURE') || err.message.includes('PROVIDER_INITIALIZATION_FAILURE')) {
        result.sanitizerSuccess = 'not executed';
        result.integritySuccess = 'not executed';
        result.compilationSuccess = 'not executed';
      }
    }

    // Check rejection reports for any silent failures that might have been retried
    try {
      const reportStr = await fs.readFile(path.join(targetDir, 'generation-artifacts', 'rejection-report.json'), 'utf-8');
      const reports = JSON.parse(reportStr);
      for (const rep of reports) {
        if (rep.rejectionRule?.includes('OutputSanitizer')) result.sanitizerSuccess = false;
        if (rep.rejectionRule?.includes('ArtifactIntegrityValidator')) result.integritySuccess = false;
        if (rep.rejectionRule?.includes('CompilationValidator')) result.compilationSuccess = false;
      }
    } catch(e) {}
    
    results.push(result);
  }

  // Write report
  const reportPath = path.join(BENCHMARKS_DIR, 'benchmark-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary statistics
  const total = results.length;
  const genSuccess = results.filter(r => r.generationSuccess).length;
  const sanSuccess = results.filter(r => r.sanitizerSuccess === true).length;
  const intSuccess = results.filter(r => r.integritySuccess === true).length;
  const compSuccess = results.filter(r => r.compilationSuccess === true).length;

  console.log(`\n================================`);
  console.log(`BENCHMARK SUMMARY STATISTICS`);
  console.log(`================================`);
  console.log(`Total Scenarios      : ${total}`);
  console.log(`Generation Success   : ${genSuccess}/${total} (${((genSuccess/total)*100).toFixed(1)}%)`);
  console.log(`Sanitizer Success    : ${sanSuccess}/${total} (${((sanSuccess/total)*100).toFixed(1)}%)`);
  console.log(`Integrity Success    : ${intSuccess}/${total} (${((intSuccess/total)*100).toFixed(1)}%)`);
  console.log(`Compilation Success  : ${compSuccess}/${total} (${((compSuccess/total)*100).toFixed(1)}%)`);
  console.log(`\nDetailed report written to: ${reportPath}`);
}

runBenchmark().catch(console.error);
