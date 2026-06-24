"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendValidator = void 0;
const http_1 = __importDefault(require("http"));
class FrontendValidator {
    static async checkHealth(port) {
        return new Promise((resolve) => {
            const req = http_1.default.get(`http://localhost:${port}`, (res) => {
                resolve(res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 404); // React router might return 404 on base / sometimes depending on config
            });
            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }
}
exports.FrontendValidator = FrontendValidator;
