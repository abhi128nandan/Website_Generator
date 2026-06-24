"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendValidator = void 0;
const http_1 = __importDefault(require("http"));
class BackendValidator {
    static async checkHealth(port) {
        return new Promise((resolve) => {
            const req = http_1.default.get(`http://localhost:${port}/api/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(res.statusCode === 200 && json.status === 'ok');
                    }
                    catch {
                        resolve(false);
                    }
                });
            });
            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }
}
exports.BackendValidator = BackendValidator;
