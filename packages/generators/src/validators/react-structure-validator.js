"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactStructureValidator = void 0;
const ts = __importStar(require("typescript"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class ReactStructureValidator {
    static async validate(targetDir) {
        const srcDir = path_1.default.join(targetDir, 'frontend', 'src');
        const errors = [];
        try {
            // 1. Ensure App.tsx exists
            const appPath = path_1.default.join(srcDir, 'App.tsx');
            try {
                await promises_1.default.access(appPath);
            }
            catch {
                errors.push('App.tsx does not exist.');
            }
            // 2. Parse main.tsx and ensure it imports the correct entry file (App.tsx)
            const mainPath = path_1.default.join(srcDir, 'main.tsx');
            try {
                const mainContent = await promises_1.default.readFile(mainPath, 'utf-8');
                const sourceFile = ts.createSourceFile('main.tsx', mainContent, ts.ScriptTarget.ESNext, true);
                let importsApp = false;
                ts.forEachChild(sourceFile, node => {
                    if (ts.isImportDeclaration(node)) {
                        const moduleSpecifier = node.moduleSpecifier.text;
                        if (moduleSpecifier === './App' || moduleSpecifier === './App.tsx') {
                            importsApp = true;
                        }
                    }
                });
                if (!importsApp) {
                    errors.push('main.tsx does not import App.tsx.');
                }
            }
            catch (e) {
                errors.push('main.tsx does not exist or cannot be parsed.');
            }
            // 3. Read all files in the pages directory to ensure each has exactly one default export
            const pagesDir = path_1.default.join(srcDir, 'pages');
            try {
                const pages = await promises_1.default.readdir(pagesDir);
                for (const page of pages) {
                    if (!page.endsWith('.tsx') && !page.endsWith('.ts'))
                        continue;
                    if (page === 'index.ts')
                        continue; // skip barrel files
                    const pagePath = path_1.default.join(pagesDir, page);
                    const pageContent = await promises_1.default.readFile(pagePath, 'utf-8');
                    const sourceFile = ts.createSourceFile(page, pageContent, ts.ScriptTarget.ESNext, true);
                    let defaultExportCount = 0;
                    ts.forEachChild(sourceFile, node => {
                        if (ts.isExportAssignment(node)) {
                            defaultExportCount++;
                        }
                        else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
                            if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) &&
                                node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
                                defaultExportCount++;
                            }
                        }
                    });
                    if (defaultExportCount !== 1) {
                        errors.push(`Page ${page} must have exactly one default export. Found ${defaultExportCount}.`);
                    }
                }
            }
            catch (e) {
                // pages dir might not exist, that's okay if no pages
            }
            // 4. Scan components, hooks, and services to ensure no duplicate names across the project.
            const seenNames = new Set();
            const checkDuplicates = async (dirPath, category) => {
                try {
                    const files = await promises_1.default.readdir(dirPath);
                    for (const file of files) {
                        if (file === 'index.ts')
                            continue; // skip barrel files
                        const baseName = path_1.default.basename(file, path_1.default.extname(file));
                        if (seenNames.has(baseName)) {
                            errors.push(`Duplicate name detected: ${baseName} is used in multiple places (found in ${category}).`);
                        }
                        else {
                            seenNames.add(baseName);
                        }
                    }
                }
                catch { /* directory might not exist */ }
            };
            await checkDuplicates(path_1.default.join(srcDir, 'components'), 'components');
            await checkDuplicates(path_1.default.join(srcDir, 'hooks'), 'hooks');
            await checkDuplicates(path_1.default.join(srcDir, 'services'), 'services');
            await checkDuplicates(path_1.default.join(srcDir, 'pages'), 'pages');
        }
        catch (e) {
            errors.push(`Structure validation encountered an unexpected error: ${e.message}`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.ReactStructureValidator = ReactStructureValidator;
//# sourceMappingURL=react-structure-validator.js.map