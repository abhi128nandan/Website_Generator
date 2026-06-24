"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckpointManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
class CheckpointManager {
    projectId;
    projectRoot;
    baseDir;
    constructor(projectId, projectRoot) {
        this.projectId = projectId;
        this.projectRoot = projectRoot;
        this.baseDir = path_1.default.join(this.projectRoot, '.websiteGenerator', 'checkpoints');
    }
    async init() {
        try {
            await promises_1.default.mkdir(this.baseDir, { recursive: true });
        }
        catch { }
    }
    async save(stage, state) {
        await this.init();
        // Remove non-serializable or volatile properties if any
        const stateSnapshot = JSON.parse(JSON.stringify(state));
        const hash = (0, crypto_1.createHash)('sha256').update(JSON.stringify(stateSnapshot)).digest('hex');
        const checkpoint = {
            id: (0, crypto_1.randomUUID)(),
            projectId: this.projectId,
            stage,
            timestamp: new Date().toISOString(),
            stateSnapshot,
            hash
        };
        const filePath = path_1.default.join(this.baseDir, `${stage}.json`);
        await promises_1.default.writeFile(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');
        return checkpoint;
    }
    async restore(stage) {
        const filePath = path_1.default.join(this.baseDir, `${stage}.json`);
        try {
            const data = await promises_1.default.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async getLastValid() {
        try {
            const files = await promises_1.default.readdir(this.baseDir);
            const checkpoints = [];
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                const data = await promises_1.default.readFile(path_1.default.join(this.baseDir, file), 'utf-8');
                checkpoints.push(JSON.parse(data));
            }
            if (checkpoints.length === 0)
                return null;
            // Sort descending by timestamp
            checkpoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return checkpoints[0];
        }
        catch {
            return null;
        }
    }
}
exports.CheckpointManager = CheckpointManager;
