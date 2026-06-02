const http = require('http');
const fs = require('fs');
const path = require('path');

const PROJECTS_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', 'runtime', 'generated-projects');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function triggerGeneration(prompt) {
  console.log(`Triggering generation for prompt: "${prompt}"`);
  const result = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, { text: prompt });

  if (!result.projectId) {
    throw new Error(`Failed to trigger: ${JSON.stringify(result)}`);
  }
  console.log(`Success! Project ID: ${result.projectId}`);
  return result.projectId;
}

async function waitAndAudit(projectId, name) {
  console.log(`Waiting for project ${name} (${projectId}) to complete...`);
  const projectDir = path.join(PROJECTS_ROOT, projectId);
  const metadataPath = path.join(projectDir, 'metadata.json');
  const logPath = path.join(projectDir, 'logs', 'generation.log');

  let status = 'generating';
  let attempts = 0;
  
  while (status === 'generating') {
    attempts++;
    await new Promise(r => setTimeout(r, 5000));
    try {
      if (fs.existsSync(metadataPath)) {
        const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        status = meta.status;
      }
    } catch (e) {
      // metadata file might be writing
    }

    if (attempts % 6 === 0) {
      console.log(`Still generating ${name} (elapsed ~${attempts * 5}s)...`);
      if (fs.existsSync(logPath)) {
        const logLines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
        console.log(`  Last log line: ${logLines[logLines.length - 1]}`);
      }
    }

    if (attempts > 360) { // 30 minutes timeout
      throw new Error(`Generation for ${name} timed out!`);
    }
  }

  console.log(`Project ${name} completed generation with status: ${status}`);

  if (fs.existsSync(logPath)) {
    const logContent = fs.readFileSync(logPath, 'utf8');
    
    // Check validation markers
    const markers = [
      'AST Validation Started',
      'AST Validation Passed',
      'React Structure Validation Started',
      'React Structure Validation Passed',
      'Build Validation Started',
      'Build Passed',
      'Exit Code: 0'
    ];

    console.log(`\n--- Verification Logs for ${name} ---`);
    markers.forEach(marker => {
      const present = logContent.includes(marker);
      console.log(`[${present ? '✓' : '✗'}] Log contains "${marker}"`);
    });
    console.log('-------------------------------------\n');
    return logContent;
  } else {
    console.log(`❌ No generation.log found for ${name}!`);
    return null;
  }
}

async function runAudit() {
  try {
    console.log('Starting Validation Pipeline Audit...');
    
    // 1. Notes App
    const notesId = await triggerGeneration('Notes App with local storage persistence');
    await waitAndAudit(notesId, 'Notes App');

    // Pause to prevent hitting API rate limits
    console.log('Waiting 10 seconds before next generation...');
    await new Promise(r => setTimeout(r, 10000));

    // 2. Habit Tracker
    const habitId = await triggerGeneration('Habit Tracker with local storage persistence');
    await waitAndAudit(habitId, 'Habit Tracker');

    console.log('Waiting 10 seconds before next generation...');
    await new Promise(r => setTimeout(r, 10000));

    // 3. Weather Tracker
    const weatherId = await triggerGeneration('Weather Tracker with local storage persistence');
    await waitAndAudit(weatherId, 'Weather Tracker');

    console.log('E2E Audit Complete.');
  } catch (err) {
    console.error('Audit failed:', err);
  }
}

runAudit();
