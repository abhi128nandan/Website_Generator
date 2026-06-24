import { Router, Request } from 'express';
import multer from 'multer';
import { DocumentParser, RequirementExtractor } from '@website-generator/ai-engine';
import { GenerationRouter, MetricsTracker } from '@website-generator/generators';
import { ProjectRegistry } from '../registry';
import { logEmitter } from './logs';
import { ApplicationClassifier } from '../services/application-classifier';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { GenerationEvent } from '@website-generator/shared';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const extractor = new RequirementExtractor();

// Generated projects live in an ISOLATED directory outside any workspace
const WEBSITE_GENERATOR_PROJECTS_ROOT = path.join(os.homedir(), 'WebsiteGeneratorProjects', 'projects');

async function normalizeInput(req: Request): Promise<{ rawText: string, projectName: string, inputType: 'text' | 'upload' }> {
  if (req.is('application/json')) {
    if (!req.body.text) {
      throw new Error('No text provided in request body');
    }
    return { rawText: req.body.text, projectName: 'Text Generated App', inputType: 'text' };
  } else if (req.is('multipart/form-data') || req.file) {
    if (!req.file) {
      throw new Error('No SRS file uploaded');
    }
    const rawText = await DocumentParser.extractRawText(req.file.buffer, req.file.mimetype);
    const projectName = req.file.originalname.split('.')[0] || 'Generated App';
    return { rawText, projectName, inputType: 'upload' };
  } else {
    throw new Error('Unsupported Content-Type. Use multipart/form-data or application/json.');
  }
}

router.post('/', upload.single('srs'), async (req, res) => {
  try {
    const { rawText, projectName, inputType } = await normalizeInput(req);

    const projectId = randomUUID();
    const rootPath = path.join(WEBSITE_GENERATOR_PROJECTS_ROOT, projectId);

    // Force clean generation: delete existing directory if it somehow exists
    try {
      await fs.rm(rootPath, { recursive: true, force: true });
    } catch (e) {}
    await fs.mkdir(rootPath, { recursive: true });

    // CREATE METADATA IMMEDIATELY
    const initialMetadata = {
      id: projectId,
      status: 'generating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      frontendPort: null,
      backendPort: null,
      errors: []
    };
    await fs.writeFile(path.join(rootPath, 'metadata.json'), JSON.stringify(initialMetadata, null, 2), 'utf-8');

    await ProjectRegistry.addProject({
      id: projectId,
      name: projectName,
      createdAt: initialMetadata.createdAt,
      status: 'generating',
      inputType,
      rootPath
    });

    // Fire off async generation
    generatePipeline(projectId, rawText, rootPath).catch(async (err) => {
      console.error(err);
      
      const msg = err.message.toLowerCase();
      let errorCategory = 'GENERATION FAILED';
      let displayMessage = "Failed: " + err.message;
      
      if (msg.includes('document_extraction_invalid')) {
        errorCategory = 'PARSER ERROR';
        displayMessage = err.message;
        await MetricsTracker.incrementMetric('parserFailures');
      } else if (msg.includes('rate limit') || msg.includes('429')) {
        errorCategory = 'RATE LIMITED';
        const retryMatch = msg.match(/try again in ([0-9.]+s)/);
        const modelMatch = msg.match(/model `([^`]+)`/);
        
        if (retryMatch) {
           const retryTime = retryMatch[1];
           const modelStr = modelMatch ? ` (Model: ${modelMatch[1]})` : '';
           displayMessage = `Provider Error: Rate Limited${modelStr}. Please try again in ${retryTime}.`;
        } else {
           displayMessage = `Provider Error: Rate Limited. Please try again later.`;
        }
      } else if (msg.includes('api key') || msg.includes('authentication') || msg.includes('timeout') || msg.includes('400') || msg.includes('validation error') || msg.includes('provider')) {
        errorCategory = 'PROVIDER ERROR';
      } else if (msg.includes('compile error') || msg.includes('build failed') || msg.includes('tsc') || msg.includes('prisma validation') || msg.includes('code quality') || msg.includes('quality validation checks')) {
        errorCategory = 'BUILD FAILED';
      } else if (msg.includes('qa score is too low') || msg.includes('functional qa') || msg.includes('qa error') || msg.includes('reliability checks failed')) {
        errorCategory = 'QA FAILED';
      }

      await ProjectRegistry.updateProject(projectId, { status: 'error', errorCategory });
      await emitLog(projectId, rootPath, { step: 6, totalSteps: 6, message: displayMessage, status: 'error' }, "Failed: " + err.message);
      
      // Update metadata on failure
      try {
        const metadataPath = path.join(rootPath, 'metadata.json');
        const content = await fs.readFile(metadataPath, 'utf-8');
        const meta = JSON.parse(content);
        meta.status = 'failed';
        meta.errorCategory = errorCategory;
        meta.updatedAt = new Date().toISOString();
        meta.errors = meta.errors || [];
        meta.errors.push(err.message);
        await fs.writeFile(metadataPath, JSON.stringify(meta, null, 2), 'utf-8');
      } catch (e) {
        console.error('Failed to update metadata.json on error', e);
      }
    });

    res.json({ projectId });
  } catch (err: any) {
    res.status(400).json({ error: 'Document parsing failed', details: err.message });
  }
});

async function emitLog(projectId: string, rootPath: string, event: GenerationEvent, rawMessage?: string) {
  logEmitter.emit('log', { projectId, event });
  
  // Persist log
  try {
    const logsDir = path.join(rootPath, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    const logMessage = rawMessage || event.message;
    const logLine = `[${new Date().toISOString()}] Step ${event.step}/${event.totalSteps} [${event.status.toUpperCase()}]: ${logMessage}\n`;
    await fs.appendFile(path.join(logsDir, 'generation.log'), logLine);
  } catch (e) {
    console.error('Failed to persist log for project', projectId, e);
  }
}

async function generatePipeline(projectId: string, rawText: string, rootPath: string) {
  await emitLog(projectId, rootPath, { step: 2, totalSteps: 6, message: 'Extracting requirements...', status: 'in-progress' });
  const reqs = await extractor.extractRequirements(rawText);

  // --- Multi-Mode Classification ---
  await emitLog(projectId, rootPath, { step: 2, totalSteps: 6, message: 'Classifying application intent...', status: 'in-progress' });
  const classification = await ApplicationClassifier.classify(rawText, reqs);
  reqs.classifiedMode = classification.mode;
  await emitLog(projectId, rootPath, {
    step: 2, totalSteps: 6,
    message: `[AI] Detected application type: ${classification.mode} | Confidence: ${classification.confidence}% | Reasoning: ${classification.reasoning}`,
    status: 'in-progress'
  });

  try {
    const artifactsDir = path.join(rootPath, 'generation-artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });
    await fs.writeFile(path.join(artifactsDir, 'classification-report.json'), JSON.stringify(classification, null, 2), 'utf-8');
  } catch(e) {}

  if (classification.confidence < 50) {
    await MetricsTracker.incrementMetric('classificationFailures');
    await emitLog(projectId, rootPath, { step: 2, totalSteps: 6, message: `[CLASSIFIER]\nConfidence below threshold (50%).\n\nDetected:\n${classification.mode}\n\nConfidence:\n${classification.confidence}%\n\nGeneration blocked.`, status: 'error' });
    throw new Error(`Confidence below threshold. Detected: ${classification.mode} at ${classification.confidence}%. GenerationStatus = REVIEW_REQUIRED`);
  } else if (classification.confidence < 70) {
    await emitLog(projectId, rootPath, { step: 2, totalSteps: 6, message: `[CLASSIFIER WARNING]\nLow confidence classification (${classification.confidence}%).\n\nProceeding with generation.`, status: 'in-progress' });
  }

  await ProjectRegistry.updateProject(projectId, { 
    name: reqs.appName, 
    metadata: reqs,
    stack: [...reqs.frontend, ...reqs.backend, ...reqs.database]
  });

  // --- Route to correct generator ---
  await GenerationRouter.generate(reqs, rootPath, async (step, message) => {
    await emitLog(projectId, rootPath, { step, totalSteps: 6, message, status: 'in-progress' });
  });

  await ProjectRegistry.updateProject(projectId, { 
    status: 'completed', 
    logsPath: path.join(rootPath, 'logs', 'generation.log')
  });
  await emitLog(projectId, rootPath, { step: 6, totalSteps: 6, message: 'Project generation complete', status: 'completed' });
}

export default router;
