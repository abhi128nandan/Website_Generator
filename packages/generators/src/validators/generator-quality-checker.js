"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorQualityChecker = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const shared_1 = require("@website-generator/shared");
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
class GeneratorQualityChecker {
    /**
     * Performs physical sanity checks on the generated code directory.
     * Scans for:
     * 1. Missing component, hook, or service files identified in architecture.
     * 2. Broken TypeScript relative imports.
     * 3. TODO placeholders and mockup fallback strings.
     * 4. Swagger curly brace syntax in Express routes.
     */
    static async validate(targetDir, reqs) {
        const errors = [];
        const frontendDir = path_1.default.join(targetDir, 'frontend');
        const backendDir = path_1.default.join(targetDir, 'backend');
        // --- 1. Check Hook & Service File Coverage ---
        const arch = reqs.frontendArchitecture;
        if (arch) {
            if (arch.services) {
                for (const svc of arch.services) {
                    const filePath = path_1.default.join(frontendDir, 'src', 'services', `${svc.name}.ts`);
                    try {
                        const stats = await promises_1.default.stat(filePath);
                        if (stats.size === 0) {
                            errors.push(`Service file ${svc.name}.ts is empty.`);
                        }
                    }
                    catch {
                        errors.push(`Required service file is missing: frontend/src/services/${svc.name}.ts`);
                    }
                }
            }
            if (arch.hooks) {
                for (const hook of arch.hooks) {
                    const filePath = path_1.default.join(frontendDir, 'src', 'hooks', `${hook.name}.ts`);
                    try {
                        const stats = await promises_1.default.stat(filePath);
                        if (stats.size === 0) {
                            errors.push(`Hook file ${hook.name}.ts is empty.`);
                        }
                    }
                    catch {
                        errors.push(`Required hook file is missing: frontend/src/hooks/${hook.name}.ts`);
                    }
                }
            }
        }
        // --- 1.5. File Integrity Check ---
        const essentialFiles = [
            path_1.default.join(frontendDir, 'src', 'App.tsx'),
            path_1.default.join(frontendDir, 'src', 'main.tsx'),
            path_1.default.join(frontendDir, 'package.json'),
            path_1.default.join(frontendDir, 'index.html'),
        ];
        for (const filePath of essentialFiles) {
            try {
                await promises_1.default.access(filePath);
            }
            catch {
                const relPath = path_1.default.relative(targetDir, filePath);
                errors.push(`[Integrity] Essential file is missing: ${relPath}`);
            }
        }
        // --- 2. Check TS imports and Placeholder Content ---
        const srcDir = path_1.default.join(frontendDir, 'src');
        try {
            await this.scanDirRecursive(srcDir, async (filePath) => {
                const ext = path_1.default.extname(filePath);
                if (ext === '.ts' || ext === '.tsx') {
                    const content = await promises_1.default.readFile(filePath, 'utf-8');
                    const relPath = path_1.default.relative(targetDir, filePath);
                    // A. Scan for placeholder strings
                    const forbiddenPlaceholders = [
                        '// TODO',
                        'TODO: Implement',
                        'Feature One',
                        'Feature Two',
                        'Feature Three',
                        'Static cards',
                        'Empty dashboard',
                    ];
                    for (const ph of forbiddenPlaceholders) {
                        if (content.includes(ph)) {
                            errors.push(`[Placeholder] File ${relPath} contains forbidden placeholder pattern: "${ph}"`);
                        }
                    }
                    // Specific check for stub hooks returning null / empty state bypassing fetches
                    if (filePath.includes('hooks') && content.includes('setData(null)') && content.includes('// TODO')) {
                        errors.push(`[Stub Hook] Hook ${relPath} appears to be an unimplemented mock template.`);
                    }
                    // B. Scan for broken imports
                    const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
                    let match;
                    while ((match = importRegex.exec(content)) !== null) {
                        const importPath = match[1];
                        if (importPath.startsWith('.')) {
                            const resolvedDir = path_1.default.dirname(filePath);
                            const targetPath = path_1.default.resolve(resolvedDir, importPath);
                            const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
                            let resolved = false;
                            // Check with exact name first (in case extension is already present in import path)
                            try {
                                const stat = await promises_1.default.stat(targetPath);
                                if (stat.isDirectory()) {
                                    // If it's a directory, check for index files
                                    for (const possibleExt of possibleExtensions) {
                                        try {
                                            await promises_1.default.access(path_1.default.join(targetPath, 'index' + possibleExt));
                                            resolved = true;
                                            break;
                                        }
                                        catch { }
                                    }
                                }
                                else {
                                    resolved = true;
                                }
                            }
                            catch { }
                            if (!resolved) {
                                for (const possibleExt of possibleExtensions) {
                                    try {
                                        await promises_1.default.access(targetPath + possibleExt);
                                        resolved = true;
                                        break;
                                    }
                                    catch { }
                                }
                            }
                            // Try as directory (e.g. index.ts)
                            if (!resolved) {
                                for (const possibleExt of possibleExtensions) {
                                    try {
                                        await promises_1.default.access(path_1.default.join(targetPath, 'index' + possibleExt));
                                        resolved = true;
                                        break;
                                    }
                                    catch { }
                                }
                            }
                            if (!resolved) {
                                errors.push(`[Broken Import] File ${relPath} imports relative path "${importPath}" which cannot be resolved.`);
                            }
                        }
                    }
                }
            });
        }
        catch (e) {
            shared_1.Logger.warn(`[QualityChecker] Failed to scan frontend directory: ${e.message}`);
        }
        // --- 3. Scan Express Routes for Swagger Braces ---
        try {
            const backendSrcDir = path_1.default.join(backendDir, 'src');
            await promises_1.default.access(backendSrcDir);
            await this.scanDirRecursive(backendSrcDir, async (filePath) => {
                const ext = path_1.default.extname(filePath);
                if (ext === '.ts') {
                    const content = await promises_1.default.readFile(filePath, 'utf-8');
                    const relPath = path_1.default.relative(targetDir, filePath);
                    // Check for Swagger braces in app.get/post/put/delete routes
                    const routeBracesRegex = /app\.(get|post|put|delete|use)\s*\(\s*['"][^'"]*\{[^'"]+\}[^'"]*['"]/i;
                    if (routeBracesRegex.test(content)) {
                        errors.push(`[Swagger Route Path] Express route in backend/${relPath} contains OpenAPI parameter brackets (e.g. {id}) instead of Express colon notation (e.g. :id).`);
                    }
                }
            });
        }
        catch { }
        // --- 4. Build Validation ---
        try {
            await promises_1.default.access(frontendDir);
            shared_1.Logger.info(`[QualityChecker] Running build validation in ${frontendDir}...`);
            try {
                await execPromise('pnpm install --no-frozen-lockfile', { cwd: frontendDir });
                await execPromise('pnpm build', { cwd: frontendDir });
            }
            catch (e) {
                errors.push(`[Build Error] Frontend build failed:\n${e.stdout}\n${e.stderr}\n${e.message}`);
            }
        }
        catch {
            // frontend dir doesn't exist, skip build
        }
        const passed = errors.length === 0;
        shared_1.Logger.info(`[QualityChecker] Quality validation complete. Passed: ${passed}. Errors found: ${errors.length}`);
        if (!passed) {
            errors.forEach(err => shared_1.Logger.warn(`[QualityChecker Error] ${err}`));
        }
        return { passed, errors };
    }
    static async scanDirRecursive(dir, onFile) {
        let entries = [];
        try {
            entries = await promises_1.default.readdir(dir);
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path_1.default.join(dir, entry);
            const stat = await promises_1.default.stat(fullPath);
            if (stat.isDirectory()) {
                await this.scanDirRecursive(fullPath, onFile);
            }
            else {
                await onFile(fullPath);
            }
        }
    }
}
exports.GeneratorQualityChecker = GeneratorQualityChecker;
