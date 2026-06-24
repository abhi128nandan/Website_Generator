"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoContract = void 0;
exports.TodoContract = {
    appName: 'Todo App',
    entities: [
        {
            entity: 'Task',
            fields: [
                { name: 'id', type: 'String', isId: true, hasDefault: true },
                { name: 'title', type: 'String', required: true },
                { name: 'completed', type: 'Boolean', hasDefault: true },
                { name: 'createdAt', type: 'DateTime', hasDefault: true },
                { name: 'updatedAt', type: 'DateTime', hasDefault: true }
            ]
        }
    ]
};
