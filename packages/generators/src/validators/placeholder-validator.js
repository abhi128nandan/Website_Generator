"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderValidator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const CATEGORIES = [
    {
        name: 'Generic dashboard content',
        patterns: [
            /dashboard overview/i,
            /main screen/i,
            /quick actions/i,
            /recent activity/i,
            /application summary/i,
            /system overview/i,
            /welcome to/i
        ]
    },
    {
        name: 'Coming soon placeholders',
        patterns: [
            /coming soon/i,
            /under construction/i,
            /not yet implemented/i,
            /tbd/i
        ]
    },
    {
        name: 'Demo/sample content',
        patterns: [
            /sample data/i,
            /demo widget/i,
            /placeholder content/i,
            /lorem ipsum/i,
            /test user/i
        ]
    },
    {
        name: 'Feature placeholder cards',
        patterns: [
            /feature one/i,
            /feature two/i,
            /feature three/i,
            /start building here/i,
            /connect apis here/i
        ]
    }
];
class PlaceholderValidator {
    /**
     * Validates that the generated TS/TSX files do not contain placeholder UI text.
     */
    static async validate(targetDir) {
        const srcDir = path_1.default.join(targetDir, 'frontend', 'src');
        // Find all ts, tsx, js, jsx files
        const fileNames = [];
        async function collectFiles(dir) {
            try {
                const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const res = path_1.default.resolve(dir, entry.name);
                    if (entry.isDirectory()) {
                        await collectFiles(res);
                    }
                    else if (res.endsWith('.ts') || res.endsWith('.tsx') || res.endsWith('.js') || res.endsWith('.jsx')) {
                        fileNames.push(res);
                    }
                }
            }
            catch (e) {
                // Source dir might not exist if generation totally failed
            }
        }
        await collectFiles(srcDir);
        if (fileNames.length === 0) {
            return { isValid: true, errors: [] }; // Nothing to check
        }
        const errors = [];
        for (const fileName of fileNames) {
            try {
                const content = await promises_1.default.readFile(fileName, 'utf-8');
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    for (const category of CATEGORIES) {
                        for (const pattern of category.patterns) {
                            const match = line.match(pattern);
                            if (match) {
                                const relName = path_1.default.relative(targetDir, fileName);
                                errors.push(`[PLACEHOLDER]\nCategory: ${category.name}\nFile: ${relName}:${i + 1}\nMatched Text: ${match[0]}`);
                            }
                        }
                    }
                }
            }
            catch (e) {
                const relName = path_1.default.relative(targetDir, fileName);
                errors.push(`${relName} - Failed to read file for placeholder validation: ${e.message}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.PlaceholderValidator = PlaceholderValidator;
