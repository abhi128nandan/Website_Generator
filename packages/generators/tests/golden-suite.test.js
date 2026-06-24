"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generation_router_1 = require("../src/router/generation-router");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const GOLDEN_TEMPLATES = [
    {
        appName: 'Calculator',
        appType: 'calculator app',
        features: ['basic arithmetic', 'history'],
        classifiedMode: 'frontend-app'
    },
    {
        appName: 'Todo App',
        appType: 'todo app',
        features: ['add tasks', 'remove tasks', 'persist tasks'],
        classifiedMode: 'frontend-app'
    },
    {
        appName: 'Counter',
        appType: 'counter app',
        features: ['increment', 'decrement'],
        classifiedMode: 'frontend-app'
    },
    {
        appName: 'Inventory',
        appType: 'inventory management system',
        features: ['product listing', 'stock tracking', 'CRUD operations'],
        classifiedMode: 'crud-admin'
    },
    {
        appName: 'CRM',
        appType: 'customer relationship management',
        features: ['contacts list', 'leads tracking', 'sales pipeline'],
        classifiedMode: 'crud-admin'
    },
    {
        appName: 'Student Management',
        appType: 'student information system',
        features: ['students list', 'grades tracking'],
        classifiedMode: 'crud-admin'
    }
];
async function runGoldenSuite() {
    console.log('🌟 Starting Golden Test Suite...');
    let failed = false;
    for (const template of GOLDEN_TEMPLATES) {
        console.log(`\n--------------------------------------------`);
        console.log(`🧪 Testing: ${template.appName} (${template.classifiedMode})`);
        const targetDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), `website-generator-golden-${template.appName.toLowerCase().replace(/\\s+/g, '-')}-`));
        try {
            await generation_router_1.GenerationRouter.generate(template, targetDir, (step, msg) => {
                // Minimal logging for the suite
                if (msg.includes('FATAL') || msg.includes('Failed')) {
                    console.error(`[${template.appName}] ${msg}`);
                }
            });
            console.log(`✅ Success: ${template.appName}`);
        }
        catch (e) {
            console.error(`❌ Failed: ${template.appName}`);
            console.error(e.message);
            failed = true;
        }
    }
    if (failed) {
        console.error('\n💥 Golden Test Suite failed. Check errors above.');
        process.exit(1);
    }
    else {
        console.log('\n🎉 All Golden Tests passed!');
        process.exit(0);
    }
}
// Run the suite if executed directly
if (require.main === module) {
    runGoldenSuite().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
