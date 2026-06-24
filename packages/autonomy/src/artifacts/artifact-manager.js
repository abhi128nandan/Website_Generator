"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class ArtifactManager {
    projectId;
    projectRoot;
    baseDir;
    constructor(projectId, projectRoot) {
        this.projectId = projectId;
        this.projectRoot = projectRoot;
        this.baseDir = path_1.default.join(this.projectRoot, '.websiteGenerator', 'artifacts');
    }
    async init() {
        try {
            await promises_1.default.mkdir(this.baseDir, { recursive: true });
        }
        catch { }
    }
    async generateArtifacts(state) {
        await this.init();
        // 1. architecture.json
        if (state.requirements) {
            await promises_1.default.writeFile(path_1.default.join(this.baseDir, 'architecture.json'), JSON.stringify(state.requirements, null, 2), 'utf-8');
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
        await promises_1.default.writeFile(path_1.default.join(this.baseDir, 'execution-plan.md'), plan, 'utf-8');
        // 3. runtime-report.json
        await promises_1.default.writeFile(path_1.default.join(this.baseDir, 'runtime-report.json'), JSON.stringify(state.runtime, null, 2), 'utf-8');
        // 4. repair-history.json
        await promises_1.default.writeFile(path_1.default.join(this.baseDir, 'repair-history.json'), JSON.stringify(state.repairs, null, 2), 'utf-8');
        // 5. logs (append to existing)
        const logsContent = state.logs.map(l => JSON.stringify(l)).join('\n');
        await promises_1.default.mkdir(path_1.default.join(this.baseDir, 'logs'), { recursive: true });
        await promises_1.default.appendFile(path_1.default.join(this.baseDir, 'logs', 'structured.jsonl'), logsContent + (logsContent.length > 0 ? '\n' : ''), 'utf-8');
    }
}
exports.ArtifactManager = ArtifactManager;
