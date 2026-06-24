"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionTimeline = void 0;
class ExecutionTimeline {
    events = [];
    append(event) {
        this.events.push({
            ...event,
            timestamp: new Date().toISOString()
        });
    }
    snapshot() {
        return [...this.events];
    }
    since(timestamp) {
        const targetTime = new Date(timestamp).getTime();
        return this.events.filter(e => new Date(e.timestamp).getTime() > targetTime);
    }
    clear() {
        this.events = [];
    }
}
exports.ExecutionTimeline = ExecutionTimeline;
