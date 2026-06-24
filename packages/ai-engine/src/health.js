"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthChecker = void 0;
const providers_1 = require("./providers");
class HealthChecker {
    static cache = null;
    static CACHE_TTL = 30000; // 30 seconds
    static async check(force = false) {
        const now = Date.now();
        if (!force && this.cache && (now - this.cache.timestamp < this.CACHE_TTL)) {
            return {
                aiStatus: this.cache.status.status,
                provider: this.cache.status.provider,
                model: this.cache.status.model,
                message: this.cache.status.message,
                cached: true
            };
        }
        try {
            const provider = providers_1.ProviderFactory.getProvider();
            const status = await provider.healthCheck();
            this.cache = { status, timestamp: now };
            return {
                aiStatus: status.status,
                provider: status.provider,
                model: status.model,
                message: status.message,
                cached: false
            };
        }
        catch (e) {
            const errStatus = {
                status: 'error',
                provider: process.env.AI_PROVIDER || 'unknown',
                model: 'unknown',
                message: e.message
            };
            this.cache = { status: errStatus, timestamp: now };
            return {
                aiStatus: errStatus.status,
                provider: errStatus.provider,
                model: errStatus.model,
                message: errStatus.message,
                cached: false
            };
        }
    }
}
exports.HealthChecker = HealthChecker;
