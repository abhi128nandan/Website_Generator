"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomyEventBus = void 0;
const events_1 = require("events");
class AutonomyEventBus {
    static emitter = new events_1.EventEmitter();
    static emit(projectId, type, data) {
        const event = {
            projectId,
            type,
            timestamp: new Date().toISOString(),
            data
        };
        this.emitter.emit('event', event);
        this.emitter.emit(`project:${projectId}`, event);
    }
    static subscribe(callback) {
        this.emitter.on('event', callback);
        return () => this.emitter.off('event', callback);
    }
    static subscribeToProject(projectId, callback) {
        const eventName = `project:${projectId}`;
        this.emitter.on(eventName, callback);
        return () => this.emitter.off(eventName, callback);
    }
}
exports.AutonomyEventBus = AutonomyEventBus;
