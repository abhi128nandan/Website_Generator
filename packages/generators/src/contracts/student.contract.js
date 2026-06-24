"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentContract = void 0;
exports.StudentContract = {
    appName: 'Student Management App',
    entities: [
        {
            entity: 'Student',
            fields: [
                { name: 'id', type: 'String', isId: true, hasDefault: true },
                { name: 'firstName', type: 'String', required: true },
                { name: 'lastName', type: 'String', required: true },
                { name: 'email', type: 'String', required: true, isUnique: true },
                { name: 'enrollmentDate', type: 'DateTime', required: true, hasDefault: true },
                { name: 'gradeLevel', type: 'String', required: true },
                { name: 'gpa', type: 'Float' },
                { name: 'createdAt', type: 'DateTime', hasDefault: true },
                { name: 'updatedAt', type: 'DateTime', hasDefault: true }
            ]
        }
    ]
};
