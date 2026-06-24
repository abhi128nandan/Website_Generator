"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQueue = void 0;
const shared_1 = require("@website-generator/shared");
class RequestQueue {
    static queue = [];
    static isProcessing = false;
    static async enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processQueue();
        });
    }
    static async processQueue() {
        if (this.isProcessing || this.queue.length === 0)
            return;
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item)
                continue;
            let success = false;
            let attempt = 0;
            let delayMs = 1500;
            const maxRetries = 10;
            while (!success && attempt < maxRetries) {
                attempt++;
                try {
                    const result = await item.task();
                    item.resolve(result);
                    success = true;
                    // Add a tiny delay between requests to be nice to the API
                    await new Promise(r => setTimeout(r, 200));
                }
                catch (err) {
                    const errMsg = err.message || '';
                    const errStr = JSON.stringify(err) || '';
                    const isRateLimit = errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('Rate limit') || errStr.includes('429') || err?.status === 429;
                    const isDailyRateLimit = errMsg.includes('tokens per day') || errMsg.includes('TPD');
                    if (isDailyRateLimit) {
                        item.reject(new Error(`Daily API token limit exhausted. Cannot generate code. ${errMsg}`));
                        break;
                    }
                    if (isRateLimit) {
                        // Exponential backoff
                        const waitTime = delayMs * Math.pow(2, attempt);
                        shared_1.Logger.warn(`[RequestQueue] Rate limited. Retrying in ${waitTime}ms (Attempt ${attempt}/${maxRetries})`);
                        await new Promise(r => setTimeout(r, waitTime));
                    }
                    else {
                        // Not a rate limit error, reject immediately
                        item.reject(err);
                        break;
                    }
                }
            }
            if (!success && attempt >= maxRetries) {
                item.reject(new Error(`Rate limit retries exhausted after ${maxRetries} attempts.`));
            }
        }
        this.isProcessing = false;
    }
}
exports.RequestQueue = RequestQueue;
