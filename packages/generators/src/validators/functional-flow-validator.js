"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionalFlowValidator = void 0;
const shared_1 = require("@website-generator/shared");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FunctionalFlowValidator {
    /**
     * Validates that a generated Todo App has functional end-to-end connections.
     * - Prisma model exists
     * - Backend routes exist (GET, POST, PUT, DELETE)
     * - Frontend forms and API calls exist
     */
    static async validate(targetDir, reqs) {
        const appNameLower = reqs.appName.toLowerCase();
        // We only enforce this strict validator for the Todo App as requested
        if (appNameLower !== 'todo app' && appNameLower !== 'todo') {
            return { isValid: true, errors: [] };
        }
        shared_1.Logger.info('[FunctionalFlowValidator] Validating Todo App functional flow...');
        const errors = [];
        const entity = 'Task';
        // 1. Validate Prisma Model
        try {
            const schemaPath = path_1.default.join(targetDir, 'database', 'prisma', 'schema.prisma');
            const schemaContent = await promises_1.default.readFile(schemaPath, 'utf-8');
            if (!schemaContent.includes('model Task {') && !schemaContent.includes('model task {')) {
                errors.push({ entity, missing: 'Prisma model (Task)' });
            }
        }
        catch (e) {
            errors.push({ entity, missing: 'database/prisma/schema.prisma file' });
        }
        // 2. Validate Backend Routes
        let backendCode = '';
        try {
            // Gather all backend route code for simple scanning
            const routesDir = path_1.default.join(targetDir, 'backend', 'src', 'routes');
            const files = await promises_1.default.readdir(routesDir);
            for (const file of files) {
                if (file.endsWith('.ts')) {
                    backendCode += await promises_1.default.readFile(path_1.default.join(routesDir, file), 'utf-8') + '\n';
                }
            }
            const indexCode = await promises_1.default.readFile(path_1.default.join(targetDir, 'backend', 'src', 'index.ts'), 'utf-8');
            backendCode += indexCode;
        }
        catch (e) {
            // Missing backend code entirely
        }
        const checkBackendRoute = (method, route) => {
            // Look for signatures like router.get('/', router.post('/', router.put('/:id'
            // or explicit matches in index.ts like app.use('/api/tasks'
            const lowerCode = backendCode.toLowerCase();
            const hasMethod = lowerCode.includes(`${method.toLowerCase()}('/`) || lowerCode.includes(`${method.toLowerCase()}("/`) || lowerCode.includes(`${method.toLowerCase()}(\`/`);
            const hasEndpointName = lowerCode.includes('tasks') || lowerCode.includes('todo');
            if (!hasMethod || !hasEndpointName) {
                errors.push({ entity, missing: `${method} ${route}` });
            }
        };
        if (backendCode) {
            checkBackendRoute('GET', '/api/tasks');
            checkBackendRoute('POST', '/api/tasks');
            checkBackendRoute('PUT', '/api/tasks/:id');
            checkBackendRoute('DELETE', '/api/tasks/:id');
        }
        else {
            errors.push({ entity, missing: 'Backend Routes directory/files' });
        }
        // 3. Validate Frontend API Calls and Forms
        let frontendCode = '';
        try {
            async function readDirRecursive(dir) {
                const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const res = path_1.default.resolve(dir, entry.name);
                    if (entry.isDirectory()) {
                        await readDirRecursive(res);
                    }
                    else if (res.endsWith('.ts') || res.endsWith('.tsx')) {
                        frontendCode += await promises_1.default.readFile(res, 'utf-8') + '\n';
                    }
                }
            }
            await readDirRecursive(path_1.default.join(targetDir, 'frontend', 'src'));
        }
        catch (e) {
            // Frontend not generated?
        }
        if (frontendCode) {
            // Check for form submission
            if (!frontendCode.includes('<form') && !frontendCode.includes('onSubmit')) {
                errors.push({ entity, missing: 'Frontend form for creating tasks' });
            }
            // Check for fetch/axios API calls matching standard methods
            const hasPost = frontendCode.includes('POST') || frontendCode.includes('axios.post');
            const hasPut = frontendCode.includes('PUT') || frontendCode.includes('PATCH') || frontendCode.includes('axios.put') || frontendCode.includes('axios.patch');
            const hasDelete = frontendCode.includes('DELETE') || frontendCode.includes('axios.delete');
            const hasGet = frontendCode.includes('fetch(') || frontendCode.includes('axios.get') || frontendCode.includes('GET');
            if (!hasGet)
                errors.push({ entity, missing: 'Frontend API call: GET tasks' });
            if (!hasPost)
                errors.push({ entity, missing: 'Frontend API call: POST task' });
            if (!hasPut)
                errors.push({ entity, missing: 'Frontend API call: PUT/UPDATE task' });
            if (!hasDelete)
                errors.push({ entity, missing: 'Frontend API call: DELETE task' });
        }
        else {
            errors.push({ entity, missing: 'Frontend src directory/files' });
        }
        if (errors.length > 0) {
            shared_1.Logger.error(`[FunctionalFlowValidator] Validation failed with ${errors.length} missing links.`);
        }
        else {
            shared_1.Logger.info('[FunctionalFlowValidator] Todo App functional flow validated successfully.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.FunctionalFlowValidator = FunctionalFlowValidator;
