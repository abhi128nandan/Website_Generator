"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairAgent = void 0;
const ai_engine_1 = require("@website-generator/ai-engine");
const shared_1 = require("@website-generator/shared");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const ast_validator_1 = require("../validators/ast-validator");
const react_structure_validator_1 = require("../validators/react-structure-validator");
class RepairAgent {
    static async logRepair(targetDir, message) {
        console.log(message);
        try {
            const logPath = path_1.default.join(targetDir, 'logs', 'generation.log');
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] Step 5/6 [IN-PROGRESS]: ${message}\n`;
            await promises_1.default.appendFile(logPath, logLine, 'utf8');
        }
        catch (e) {
            // ignore if path not writable or doesn't exist
        }
    }
    static async repair(targetDir, errors) {
        shared_1.Logger.info(`[RepairAgent] Attempting to repair generated files. Error count: ${errors.length}`);
        const provider = ai_engine_1.ProviderFactory.getProvider();
        // Parse errors to guess which files failed
        // Example error format: "frontend/src/App.tsx:10:5 - error TS1234: message" or build error mentioning a file
        const fileSet = new Set();
        for (const err of errors) {
            if (typeof err === 'object' && err !== null && 'file' in err) {
                fileSet.add(err.file);
            }
            else if (typeof err === 'string') {
                const match = err.match(/(frontend[\\/]src[\\/][^:]+\.tsx?)/);
                if (match) {
                    fileSet.add(match[1].replace(/\\/g, '/'));
                }
            }
        }
        // If no specific files detected, try looking at vite/tsc build errors
        if (fileSet.size === 0) {
            for (const err of errors) {
                if (typeof err === 'string') {
                    const match = err.match(/src[\\/]([^:]+\.tsx?)/);
                    if (match) {
                        fileSet.add('frontend/src/' + match[1].replace(/\\/g, '/'));
                    }
                }
            }
        }
        if (fileSet.size === 0) {
            shared_1.Logger.warn(`[RepairAgent] Could not identify specific files to repair from errors.`);
            return false; // Can't repair if we don't know which file failed
        }
        shared_1.Logger.info(`[RepairAgent] Identified files to repair: ${Array.from(fileSet).join(', ')}`);
        // 1. Snapshot error count before repair
        const astBefore = await ast_validator_1.ASTValidator.validate(targetDir);
        const reactBefore = await react_structure_validator_1.ReactStructureValidator.validate(targetDir);
        const X = astBefore.errors.length + reactBefore.errors.length;
        await this.logRepair(targetDir, "[REPAIR]\nSnapshot Created");
        await this.logRepair(targetDir, `[REPAIR]\nError Count Before: ${X}`);
        // 2. Snapshot file contents before repair
        const snapshot = new Map();
        for (const relFilePath of fileSet) {
            const absPath = path_1.default.join(targetDir, relFilePath);
            try {
                const content = await promises_1.default.readFile(absPath, 'utf-8');
                snapshot.set(relFilePath, content);
            }
            catch { }
        }
        let modifiedAny = false;
        for (const relFilePath of fileSet) {
            const absPath = path_1.default.join(targetDir, relFilePath);
            const fileContent = snapshot.get(relFilePath);
            if (fileContent === undefined)
                continue;
            const prompt = `You are an expert React/TypeScript Developer and Bug Fixer.
The following file has compilation or structural errors.

File: ${relFilePath}

Current Content:
\`\`\`typescript
${fileContent}
\`\`\`

Reported Errors:
${errors.map((e) => typeof e === 'string' ? e : JSON.stringify(e)).join('\n').substring(0, 2000)}

Requirements:
- Fix the errors mentioned.
- Ensure all imports resolve correctly.
- Fix any duplicate declarations or syntax errors.
- CRITICAL: Do NOT add new import statements for files that don't exist. If an error is about a missing module (TS2307 "Cannot find module"), REMOVE the broken import line and remove all references to the imported symbols. Inline the logic or use React state instead.
- CRITICAL: Do NOT create, reference, or assume the existence of any file not already imported successfully. Only use imports that are already resolving without errors.
- If a service, utility, or helper file is missing, do NOT import it. Implement the needed logic directly in this file.
- Output ONLY the raw corrected TS/TSX code within a markdown code block. Do not include conversational text or explanations.
`;
            let response = '';
            let success = false;
            const retries = 5;
            const delay = 10000;
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    response = await provider.generateText(prompt);
                    success = true;
                    break;
                }
                catch (err) {
                    const errMsg = err.message || '';
                    const errStr = JSON.stringify(err) || '';
                    const isRateLimit = errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('Rate limit') || errStr.includes('429');
                    if (isRateLimit && attempt < retries) {
                        const waitTime = delay * 2 * attempt;
                        shared_1.Logger.info(`[RepairAgent] Rate limit hit for ${relFilePath}. Retrying in ${waitTime / 1000}s (attempt ${attempt}/${retries})...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                    else if (attempt === retries) {
                        throw err;
                    }
                    else {
                        await new Promise(resolve => setTimeout(resolve, delay * attempt));
                    }
                }
            }
            try {
                const codeMatch = response.match(/```[a-z]*\n([\s\S]*?)```/);
                const correctedCode = codeMatch ? codeMatch[1].trim() : response.trim();
                await promises_1.default.writeFile(absPath, correctedCode);
                shared_1.Logger.info(`[RepairAgent] Successfully repaired ${relFilePath}`);
                modifiedAny = true;
            }
            catch (err) {
                shared_1.Logger.error(`[RepairAgent] Failed to repair ${relFilePath}: ${err.message}`);
                // Restore snapshot if we failed mid-loop
                if (modifiedAny) {
                    for (const [pathKey, origText] of snapshot.entries()) {
                        await promises_1.default.writeFile(path_1.default.join(targetDir, pathKey), origText, 'utf8');
                    }
                }
                return false;
            }
        }
        if (modifiedAny) {
            await this.logRepair(targetDir, "[REPAIR]\nRepair Applied");
            // 3. Post-repair validation
            const astAfter = await ast_validator_1.ASTValidator.validate(targetDir);
            const reactAfter = await react_structure_validator_1.ReactStructureValidator.validate(targetDir);
            const Y = astAfter.errors.length + reactAfter.errors.length;
            await this.logRepair(targetDir, `[REPAIR]\nError Count After: ${Y}`);
            // 4. Compare and rollback if worse
            if (Y > X) {
                await this.logRepair(targetDir, "[REPAIR]\nRollback Triggered");
                for (const [pathKey, origText] of snapshot.entries()) {
                    await promises_1.default.writeFile(path_1.default.join(targetDir, pathKey), origText, 'utf8');
                }
                return false;
            }
        }
        return true;
    }
}
exports.RepairAgent = RepairAgent;
