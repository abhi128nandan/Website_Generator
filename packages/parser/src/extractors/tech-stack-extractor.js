"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTechStack = extractTechStack;
const shared_1 = require("@website-generator/shared");
/**
 * Technology keyword dictionaries.
 * Values are sorted by popularity/likelihood — first match per category wins.
 */
const TECH_KEYWORDS = {
    frontend: [
        { keyword: 'react', display: 'React' },
        { keyword: 'next.js', display: 'Next.js' },
        { keyword: 'nextjs', display: 'Next.js' },
        { keyword: 'vue', display: 'Vue' },
        { keyword: 'vuejs', display: 'Vue' },
        { keyword: 'vue.js', display: 'Vue' },
        { keyword: 'angular', display: 'Angular' },
        { keyword: 'svelte', display: 'Svelte' },
        { keyword: 'sveltekit', display: 'SvelteKit' },
        { keyword: 'nuxt', display: 'Nuxt' },
        { keyword: 'remix', display: 'Remix' },
        { keyword: 'astro', display: 'Astro' },
        { keyword: 'vite', display: 'Vite' },
        { keyword: 'tailwind', display: 'TailwindCSS' },
        { keyword: 'tailwindcss', display: 'TailwindCSS' },
        { keyword: 'bootstrap', display: 'Bootstrap' },
        { keyword: 'material ui', display: 'Material UI' },
        { keyword: 'chakra', display: 'Chakra UI' },
    ],
    backend: [
        { keyword: 'express', display: 'Express' },
        { keyword: 'expressjs', display: 'Express' },
        { keyword: 'express.js', display: 'Express' },
        { keyword: 'fastify', display: 'Fastify' },
        { keyword: 'nestjs', display: 'NestJS' },
        { keyword: 'nest.js', display: 'NestJS' },
        { keyword: 'koa', display: 'Koa' },
        { keyword: 'hapi', display: 'Hapi' },
        { keyword: 'django', display: 'Django' },
        { keyword: 'flask', display: 'Flask' },
        { keyword: 'fastapi', display: 'FastAPI' },
        { keyword: 'spring boot', display: 'Spring Boot' },
        { keyword: 'spring', display: 'Spring' },
        { keyword: 'rails', display: 'Rails' },
        { keyword: 'ruby on rails', display: 'Rails' },
        { keyword: 'laravel', display: 'Laravel' },
        { keyword: 'gin', display: 'Gin' },
        { keyword: 'fiber', display: 'Fiber' },
    ],
    database: [
        { keyword: 'postgresql', display: 'PostgreSQL' },
        { keyword: 'postgres', display: 'PostgreSQL' },
        { keyword: 'mysql', display: 'MySQL' },
        { keyword: 'mongodb', display: 'MongoDB' },
        { keyword: 'mongo', display: 'MongoDB' },
        { keyword: 'sqlite', display: 'SQLite' },
        { keyword: 'redis', display: 'Redis' },
        { keyword: 'prisma', display: 'Prisma' },
        { keyword: 'supabase', display: 'Supabase' },
        { keyword: 'firebase', display: 'Firebase' },
        { keyword: 'firestore', display: 'Firestore' },
        { keyword: 'dynamodb', display: 'DynamoDB' },
        { keyword: 'mariadb', display: 'MariaDB' },
        { keyword: 'cockroachdb', display: 'CockroachDB' },
        { keyword: 'cassandra', display: 'Cassandra' },
    ],
};
/**
 * Extracts technology stack preferences from SRS text using keyword dictionary matching.
 *
 * Returns the first match per category (frontend, backend, database).
 * Case-insensitive word-boundary matching prevents false positives.
 */
function extractTechStack(text) {
    const lowerText = text.toLowerCase();
    const result = {};
    for (const category of ['frontend', 'backend', 'database']) {
        for (const { keyword, display } of TECH_KEYWORDS[category]) {
            // Use word-boundary-aware matching for short keywords
            // to avoid false positives (e.g., "express" in "expression")
            if (keyword.length <= 3) {
                // Very short keywords need exact word boundary matching
                const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
                if (pattern.test(lowerText)) {
                    result[category] = display;
                    break;
                }
            }
            else {
                // Longer keywords can use simple includes with a word-boundary check
                const idx = lowerText.indexOf(keyword);
                if (idx >= 0 && isWordBoundary(lowerText, idx, keyword.length)) {
                    result[category] = display;
                    break;
                }
            }
        }
    }
    shared_1.Logger.info(`[Parser:TechStack] Detected: frontend=${result.frontend || 'none'}, backend=${result.backend || 'none'}, database=${result.database || 'none'}`);
    return result;
}
/** Checks if the match at `idx` of length `len` is at word boundaries. */
function isWordBoundary(text, idx, len) {
    const before = idx > 0 ? text[idx - 1] : ' ';
    const after = idx + len < text.length ? text[idx + len] : ' ';
    const isWbChar = (c) => /[\s.,;:!?'"()\[\]{}<>/\\|@#$%^&*~`=+-]/.test(c);
    return isWbChar(before) && isWbChar(after);
}
/** Escapes special regex characters in a string. */
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
