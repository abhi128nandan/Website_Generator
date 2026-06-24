import fs from 'fs/promises';
import path from 'path';

const BENCHMARKS_DIR = path.join(__dirname, '..', 'benchmarks');
const RUNS_DIR = path.join(BENCHMARKS_DIR, 'runs');

async function analyze() {
  const summary = {
    totalFailures: 0,
    byStage: {
      OutputSanitizer: { count: 0, percentage: "0.0%", components: [] as string[] },
      CodeExtractor: { count: 0, percentage: "0.0%", components: [] as string[] },
      CodePresenceGate: { count: 0, percentage: "0.0%", components: [] as string[] },
      ArtifactIntegrityValidator: { count: 0, percentage: "0.0%", components: [] as string[] },
      Unknown: { count: 0, percentage: "0.0%", components: [] as string[] }
    }
  };

  try {
    const runs = await fs.readdir(RUNS_DIR);
    
    for (const run of runs) {
      const debugFile = path.join(RUNS_DIR, run, 'generation-artifacts', 'reasoning-failure-debug.json');
      
      try {
        const fileContent = await fs.readFile(debugFile, 'utf-8');
        const debugData = JSON.parse(fileContent);
        
        for (const failure of debugData) {
          const stage = failure.exactFailureStage || 'Unknown';
          summary.totalFailures++;
          
          if (summary.byStage[stage as keyof typeof summary.byStage]) {
            summary.byStage[stage as keyof typeof summary.byStage].count++;
            if (!summary.byStage[stage as keyof typeof summary.byStage].components.includes(failure.componentName)) {
              summary.byStage[stage as keyof typeof summary.byStage].components.push(failure.componentName);
            }
          } else {
            summary.byStage.Unknown.count++;
            if (!summary.byStage.Unknown.components.includes(failure.componentName)) {
              summary.byStage.Unknown.components.push(failure.componentName);
            }
          }
        }
      } catch (e) {
        // file might not exist if run succeeded or failed for non-reasoning reasons
      }
    }

    // calculate percentages
    for (const stage of Object.keys(summary.byStage)) {
      const stageData = summary.byStage[stage as keyof typeof summary.byStage];
      const perc = summary.totalFailures > 0 
        ? ((stageData.count / summary.totalFailures) * 100).toFixed(1) + "%"
        : "0.0%";
      stageData.percentage = perc;
    }

    const reportPath = path.join(process.cwd(), 'generation-artifacts', 'reasoning-failure-summary.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log(`Analytics complete. Evaluated ${summary.totalFailures} total reasoning failures.`);
    console.log(`Results saved to ${reportPath}`);
  } catch (err) {
    console.error("Error analyzing reasoning failures:", err);
  }
}

analyze();
