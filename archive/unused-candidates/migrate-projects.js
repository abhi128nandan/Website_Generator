const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = 'C:\\paperclip-core\\paperclip-core';
const RUNTIME_ROOT = path.join(WORKSPACE_ROOT, 'runtime');
const TARGET_PROJECTS_DIR = path.join(RUNTIME_ROOT, 'generated-projects');
const TARGET_LOGS_DIR = path.join(RUNTIME_ROOT, 'logs');
const TARGET_TEMP_DIR = path.join(RUNTIME_ROOT, 'temp');

// 1. Create directories
fs.mkdirSync(TARGET_PROJECTS_DIR, { recursive: true });
fs.mkdirSync(TARGET_LOGS_DIR, { recursive: true });
fs.mkdirSync(TARGET_TEMP_DIR, { recursive: true });

// Sources
const sourceRepo = path.join(WORKSPACE_ROOT, 'generated-apps');
const sourceHome = 'C:\\Users\\abhi9\\PaperclipProjects';

const projects = new Map();

function loadRegistry(registryPath) {
  if (fs.existsSync(registryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      for (const p of data) {
        projects.set(p.id, p);
      }
      console.log(`Loaded ${data.length} projects from ${registryPath}`);
    } catch (e) {
      console.error(`Failed to read ${registryPath}:`, e);
    }
  }
}

// Load databases
loadRegistry(path.join(sourceRepo, 'projects.json'));
loadRegistry(path.join(sourceHome, 'projects.json'));

// Move project folders
function moveDirContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    if (fs.statSync(srcPath).isDirectory()) {
      if (fs.existsSync(destPath)) {
        console.log(`Target subdirectory ${destPath} already exists, replacing...`);
        try {
          fs.rmSync(destPath, { recursive: true, force: true });
        } catch (e) {
          console.warn(`Could not rm ${destPath}, skipping rename:`, e.message);
          continue;
        }
      }
      try {
        fs.renameSync(srcPath, destPath);
        console.log(`Moved project folder ${item} from ${srcDir}`);
      } catch (e) {
        console.error(`Failed to rename ${srcPath} to ${destPath}:`, e.message);
      }
    }
  }
}

moveDirContents(path.join(sourceRepo, 'projects'), TARGET_PROJECTS_DIR);
moveDirContents(path.join(sourceHome, 'projects'), TARGET_PROJECTS_DIR);

// Copy dashboards
const dashboardJsonSrc = path.join(sourceHome, 'reliability-dashboard.json');
const dashboardJsonDest = path.join(RUNTIME_ROOT, 'reliability-dashboard.json');
if (fs.existsSync(dashboardJsonSrc)) {
  try {
    fs.renameSync(dashboardJsonSrc, dashboardJsonDest);
    console.log('Moved reliability-dashboard.json');
  } catch (e) {
    console.error('Failed to move dashboard json:', e.message);
  }
}

const dashboardMdSrc = path.join(sourceHome, 'GENERATOR_RELIABILITY.md');
const dashboardMdDest = path.join(RUNTIME_ROOT, 'GENERATOR_RELIABILITY.md');
if (fs.existsSync(dashboardMdSrc)) {
  try {
    fs.renameSync(dashboardMdSrc, dashboardMdDest);
    console.log('Moved GENERATOR_RELIABILITY.md');
  } catch (e) {
    console.error('Failed to move dashboard md:', e.message);
  }
}

// Rewrite paths in projects map
const updatedProjects = Array.from(projects.values()).map(p => {
  const rootPath = path.join(TARGET_PROJECTS_DIR, p.id);
  const logsPath = path.join(rootPath, 'logs', 'generation.log');
  
  p.rootPath = rootPath;
  if (p.path) p.path = rootPath;
  if (p.logsPath) p.logsPath = logsPath;

  return p;
});

// Write registry
fs.writeFileSync(
  path.join(RUNTIME_ROOT, 'projects.json'),
  JSON.stringify(updatedProjects, null, 2),
  'utf8'
);
console.log(`Saved ${updatedProjects.length} projects to ${path.join(RUNTIME_ROOT, 'projects.json')}`);
