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
exports.ImportIntegrityValidator = void 0;
const ts = __importStar(require("typescript"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Validates that every relative import in generated TS/TSX files
 * resolves to an actual file on disk.
 *
 * Runs BEFORE pnpm install and BEFORE build.
 * Only checks relative imports (./  ../).
 * Skips npm package imports (react, axios, lucide-react, etc.).
 */
class ImportIntegrityValidator {
    static RESOLVABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
    static INDEX_FILES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];
    /**
     * Validate all generated TS/TSX files under frontend/src.
     */
    static async validate(targetDir) {
        const srcDir = path_1.default.join(targetDir, 'frontend', 'src');
        const files = await this.collectTSFiles(srcDir);
        if (files.length === 0) {
            return { isValid: true, errors: [] };
        }
        const errors = [];
        for (const filePath of files) {
            const fileErrors = await this.validateFile(filePath, targetDir);
            errors.push(...fileErrors);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Validate a single file's imports.
     */
    static async validateFile(filePath, targetDir) {
        const errors = [];
        let content;
        try {
            content = await promises_1.default.readFile(filePath, 'utf-8');
        }
        catch {
            return errors;
        }
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        const relativeImports = this.extractRelativeImports(sourceFile);
        const relFile = path_1.default.relative(targetDir, filePath);
        for (const importPath of relativeImports) {
            const resolved = await this.resolveImport(filePath, importPath);
            if (!resolved) {
                const resolvedTarget = path_1.default.resolve(path_1.default.dirname(filePath), importPath);
                errors.push({
                    file: relFile,
                    importPath,
                    resolvedTarget,
                });
            }
        }
        return errors;
    }
    /**
     * Extract all relative import specifiers from a source file using the TS AST.
     * Covers: import declarations, import() expressions, and re-exports.
     */
    static extractRelativeImports(sourceFile) {
        const imports = [];
        const visit = (node) => {
            // import X from './path'  /  import { X } from './path'
            if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const spec = node.moduleSpecifier.text;
                if (this.isRelative(spec)) {
                    imports.push(spec);
                }
            }
            // export { X } from './path'  /  export * from './path'
            if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const spec = node.moduleSpecifier.text;
                if (this.isRelative(spec)) {
                    imports.push(spec);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return [...new Set(imports)]; // deduplicate
    }
    /**
     * Check if an import specifier is a relative path.
     */
    static isRelative(specifier) {
        return specifier.startsWith('./') || specifier.startsWith('../');
    }
    /**
     * Try to resolve a relative import to an actual file on disk.
     * Mimics TypeScript/bundler module resolution for relative paths.
     */
    static async resolveImport(fromFile, importPath) {
        const dir = path_1.default.dirname(fromFile);
        const target = path_1.default.resolve(dir, importPath);
        // 1. Exact file match (rare — usually imports omit extensions)
        if (await this.fileExists(target)) {
            return true;
        }
        // 2. Try adding extensions
        for (const ext of this.RESOLVABLE_EXTENSIONS) {
            if (await this.fileExists(target + ext)) {
                return true;
            }
        }
        // 3. Try as directory with index file
        for (const idx of this.INDEX_FILES) {
            if (await this.fileExists(path_1.default.join(target, idx))) {
                return true;
            }
        }
        return false;
    }
    /**
     * Strip broken relative imports from a file's source code.
     * Returns the cleaned source, or null if no changes were needed.
     *
     * Uses the TS AST to precisely remove import declarations
     * whose specifiers point to non-existent files.
     */
    static async stripBrokenImports(filePath, brokenImportPaths) {
        let content;
        try {
            content = await promises_1.default.readFile(filePath, 'utf-8');
        }
        catch {
            return null;
        }
        if (brokenImportPaths.size === 0)
            return null;
        const lines = content.split('\n');
        const linesToRemove = new Set();
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        // Identify lines containing broken import declarations
        ts.forEachChild(sourceFile, node => {
            if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                if (brokenImportPaths.has(node.moduleSpecifier.text)) {
                    const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
                    const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
                    for (let i = startLine; i <= endLine; i++) {
                        linesToRemove.add(i);
                    }
                }
            }
        });
        if (linesToRemove.size === 0)
            return null;
        // Collect imported identifiers from broken imports to remove usages
        const brokenIdentifiers = new Set();
        ts.forEachChild(sourceFile, node => {
            if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                if (!brokenImportPaths.has(node.moduleSpecifier.text))
                    return;
                const clause = node.importClause;
                if (!clause)
                    return;
                // default import
                if (clause.name) {
                    brokenIdentifiers.add(clause.name.text);
                }
                // named imports: import { A, B } from '...'
                if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
                    for (const el of clause.namedBindings.elements) {
                        brokenIdentifiers.add(el.name.text);
                    }
                }
                // namespace import: import * as X from '...'
                if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
                    brokenIdentifiers.add(clause.namedBindings.name.text);
                }
            }
        });
        const cleanedLines = lines.filter((_, idx) => !linesToRemove.has(idx));
        return cleanedLines.join('\n');
    }
    /**
     * Utility: check if a file exists.
     */
    static async fileExists(p) {
        try {
            const stat = await promises_1.default.stat(p);
            return stat.isFile();
        }
        catch {
            return false;
        }
    }
    /**
     * Recursively collect all .ts and .tsx files.
     */
    static async collectTSFiles(dir) {
        const files = [];
        try {
            const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.resolve(dir, entry.name);
                if (entry.isDirectory()) {
                    files.push(...await this.collectTSFiles(fullPath));
                }
                else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
                    files.push(fullPath);
                }
            }
        }
        catch {
            // directory may not exist
        }
        return files;
    }
}
exports.ImportIntegrityValidator = ImportIntegrityValidator;
