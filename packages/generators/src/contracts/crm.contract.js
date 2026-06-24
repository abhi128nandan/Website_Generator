"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRMContract = void 0;
exports.CRMContract = {
    appName: 'CRM App',
    entities: [
        {
            entity: 'Contact',
            fields: [
                { name: 'id', type: 'String', isId: true, hasDefault: true },
                { name: 'firstName', type: 'String', required: true },
                { name: 'lastName', type: 'String', required: true },
                { name: 'email', type: 'String', required: true, isUnique: true },
                { name: 'phone', type: 'String' },
                { name: 'company', type: 'String' },
                { name: 'status', type: 'String', required: true }, // e.g. Lead, Active, Churned
                { name: 'createdAt', type: 'DateTime', hasDefault: true },
                { name: 'updatedAt', type: 'DateTime', hasDefault: true }
            ]
        }
    ]
};
