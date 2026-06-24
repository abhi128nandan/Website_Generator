"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationNormalizer = void 0;
// --- Normalization pattern tables ---
const EMAIL_FIELDS = new Set(['email', 'useremail', 'contactemail', 'workemail', 'personalemail']);
const ENUM_DEFAULTS = {
    status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    role: ['USER', 'ADMIN', 'MODERATOR'],
    state: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
};
const BOOLEAN_PREFIXES = ['is', 'has', 'can', 'should', 'was'];
const DATE_PATTERNS = ['date', 'deadline', 'duedate'];
const DATE_SUFFIXES = ['at']; // matches createdAt, updatedAt, deletedAt, completedAt, startedAt...
const FLOAT_PATTERNS = ['amount', 'price', 'salary', 'cost', 'total', 'balance', 'rate', 'fee', 'wage', 'revenue', 'profit', 'discount', 'tax'];
const INT_PATTERNS = ['count', 'quantity', 'age', 'number', 'index', 'order', 'size', 'level', 'rank', 'score', 'year', 'month', 'day', 'rating'];
class RelationNormalizer {
    // Accumulated enums across all entities in a normalize() call
    static generatedEnums = new Map();
    // ================================================================
    // RULE 2-9: Generic field-level normalization (runs BEFORE relations)
    // ================================================================
    static normalizeFields(entities) {
        for (const entity of entities) {
            for (const field of entity.fields) {
                const lower = field.name.toLowerCase();
                // ------ Rule 2: createdAt ------
                if (field.name === 'createdAt') {
                    field.type = 'DateTime';
                    field.isRequired = true;
                    field.attributes = ['@default(now())'];
                    continue; // fully handled
                }
                // ------ Rule 3: updatedAt ------
                if (field.name === 'updatedAt') {
                    field.type = 'DateTime';
                    field.isRequired = true;
                    field.attributes = ['@updatedAt'];
                    continue; // fully handled
                }
                // Skip relation fields — normalize() handles them later
                if (field.isRelation)
                    continue;
                // ------ Rule 4: Email uniqueness ------
                if (EMAIL_FIELDS.has(lower)) {
                    field.type = 'String';
                    if (field.isUnique === undefined || field.isUnique === false) {
                        field.isUnique = true;
                    }
                }
                // ------ Rule 5: Enum detection ------
                if (ENUM_DEFAULTS[lower] && !field.isRelation) {
                    const enumName = entity.name + field.name.charAt(0).toUpperCase() + field.name.slice(1);
                    if (!RelationNormalizer.generatedEnums.has(enumName)) {
                        RelationNormalizer.generatedEnums.set(enumName, {
                            name: enumName,
                            values: ENUM_DEFAULTS[lower],
                        });
                    }
                    field.type = enumName;
                    if (!field.attributes)
                        field.attributes = [];
                    if (!field.attributes.some(a => a.includes('@default'))) {
                        field.attributes.push(`@default(${ENUM_DEFAULTS[lower][0]})`);
                    }
                    field.isRequired = false; // optional with default
                    continue;
                }
                // ------ Rule 7: Boolean normalization ------
                if (!field.isId && field.type === 'String') {
                    for (const prefix of BOOLEAN_PREFIXES) {
                        if (lower === prefix || (lower.startsWith(prefix) && lower.length > prefix.length && lower[prefix.length] === lower[prefix.length].toUpperCase())) {
                            field.type = 'Boolean';
                            if (!field.attributes)
                                field.attributes = [];
                            if (!field.attributes.some(a => a.includes('@default'))) {
                                field.attributes.push('@default(false)');
                            }
                            break;
                        }
                    }
                }
                // ------ Rule 8: Date normalization ------
                if (field.type === 'String' && !field.isId) {
                    const matchesDatePattern = DATE_PATTERNS.some(p => lower.includes(p));
                    const matchesDateSuffix = DATE_SUFFIXES.some(s => lower.endsWith(s) && lower.length > s.length);
                    if (matchesDatePattern || matchesDateSuffix) {
                        field.type = 'DateTime';
                    }
                }
                // ------ Rule 9: Number normalization ------
                if (field.type === 'String' && !field.isId) {
                    if (FLOAT_PATTERNS.some(p => lower.includes(p))) {
                        field.type = 'Float';
                    }
                    else if (INT_PATTERNS.some(p => lower.includes(p))) {
                        field.type = 'Int';
                    }
                }
            }
        }
    }
    // Parses an existing Prisma schema string into a list of PrismaEntities
    static parseExistingSchema(schema) {
        const entities = [];
        const modelRegex = /model\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
        let match;
        while ((match = modelRegex.exec(schema)) !== null) {
            const name = match[1];
            const body = match[2];
            const entity = { name, fields: [] };
            const lines = body.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line || line.startsWith('//') || line.startsWith('@@'))
                    continue;
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    const fieldName = parts[0];
                    let fieldType = parts[1];
                    let isList = false;
                    let isRequired = true;
                    if (fieldType.endsWith('[]')) {
                        isList = true;
                        fieldType = fieldType.slice(0, -2);
                    }
                    else if (fieldType.endsWith('?')) {
                        isRequired = false;
                        fieldType = fieldType.slice(0, -1);
                    }
                    const attributes = parts.slice(2).join(' ');
                    const isId = attributes.includes('@id');
                    const isUnique = attributes.includes('@unique');
                    const isRelation = attributes.includes('@relation');
                    let relationTarget;
                    if (isRelation || !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt'].includes(fieldType)) {
                        relationTarget = fieldType;
                    }
                    entity.fields.push({
                        name: fieldName,
                        type: fieldType,
                        isRequired,
                        isList,
                        isId,
                        isUnique,
                        isRelation,
                        relationTarget,
                        attributes: parts.slice(2)
                    });
                }
            }
            entities.push(entity);
        }
        return entities;
    }
    // ================================================================
    // Main normalize — orchestrates field normalization + relation pass
    // ================================================================
    static normalize(entities, existingEntities = []) {
        // Reset enum accumulator for this generation run
        RelationNormalizer.generatedEnums = new Map();
        const normalizedEntities = new Map();
        // 1. First pass: initialize and copy base fields
        for (const entity of entities) {
            const modelName = entity.name.replace(/[^a-zA-Z0-9]/g, '');
            if (!modelName)
                continue;
            const pEntity = {
                name: modelName,
                fields: []
            };
            for (const f of entity.fields) {
                const fieldName = f.name.replace(/[^a-zA-Z0-9]/g, '');
                if (!fieldName)
                    continue;
                pEntity.fields.push({
                    name: fieldName,
                    type: f.type,
                    isRequired: f.isRequired,
                    isId: f.isId,
                    isUnique: f.isUnique,
                    isRelation: f.isRelation,
                    relationTarget: f.relationTarget,
                    attributes: [],
                    isList: false
                });
            }
            normalizedEntities.set(modelName, pEntity);
        }
        // 1.5. Merge PREVIOUS fields to prevent data loss / field disappearance
        for (const existing of existingEntities) {
            if (normalizedEntities.has(existing.name)) {
                const target = normalizedEntities.get(existing.name);
                for (const existingField of existing.fields) {
                    const hasField = target.fields.some(f => f.name.toLowerCase() === existingField.name.toLowerCase());
                    if (!hasField) {
                        target.fields.push({
                            name: existingField.name,
                            type: existingField.type,
                            isRequired: existingField.isRequired,
                            isId: existingField.isId,
                            isUnique: existingField.isUnique,
                            isRelation: existingField.isRelation,
                            relationTarget: existingField.relationTarget,
                            attributes: existingField.attributes, // restore raw attributes
                            isList: existingField.isList
                        });
                        console.warn(`[RelationNormalizer] Restored missing field '${existingField.name}' to model '${existing.name}' from previous schema.`);
                    }
                }
            }
            else {
                // Model was completely dropped, restore it
                normalizedEntities.set(existing.name, existing);
                console.warn(`[RelationNormalizer] Restored missing model '${existing.name}' from previous schema.`);
            }
        }
        // 1.75. Safe Additive Migration: Make new required fields optional for existing models
        for (const [modelName, pEntity] of normalizedEntities.entries()) {
            const existing = existingEntities.find(e => e.name.toLowerCase() === modelName.toLowerCase());
            if (existing) {
                for (const field of pEntity.fields) {
                    const wasInExisting = existing.fields.some(ef => ef.name.toLowerCase() === field.name.toLowerCase());
                    if (!wasInExisting && field.isRequired) {
                        // New required field added to an existing table!
                        // Exclude structural fields which get defaults natively
                        if (!['id', 'createdat', 'updatedat'].includes(field.name.toLowerCase())) {
                            field.isRequired = false;
                            console.warn(`[RelationNormalizer] Rule 2 (Safe Migration): Made new field '${field.name}' optional on existing model '${modelName}'.`);
                        }
                    }
                }
            }
        }
        // 2. Generic field normalization (Rules 2-9) BEFORE relation pass
        RelationNormalizer.normalizeFields(Array.from(normalizedEntities.values()));
        // 3.1 Relation pass part 1: Ensure all reverse relations exist
        for (const [modelName, entity] of normalizedEntities.entries()) {
            const currentFields = [...entity.fields];
            for (const field of currentFields) {
                if (field.isRelation && field.relationTarget) {
                    const targetName = field.relationTarget;
                    const targetEntity = normalizedEntities.get(targetName);
                    if (!targetEntity)
                        continue;
                    if (field.isList) {
                        const reverseName = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`;
                        const hasReverse = targetEntity.fields.find(f => f.name === reverseName || f.type === modelName);
                        if (!hasReverse) {
                            targetEntity.fields.push({
                                name: reverseName,
                                type: modelName,
                                isRequired: false,
                                isRelation: true,
                                relationTarget: modelName,
                                isList: false
                            });
                        }
                    }
                    else {
                        const reverseName = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}s`;
                        const hasReverse = targetEntity.fields.find(f => f.name === reverseName || (f.type === modelName && f.isList));
                        if (!hasReverse) {
                            targetEntity.fields.push({
                                name: reverseName,
                                type: modelName,
                                isRequired: false,
                                isList: true,
                                isRelation: true,
                                relationTarget: modelName
                            });
                        }
                    }
                }
            }
        }
        // 3.2 Relation pass part 2: Add FKs and @relation to the ONE side
        for (const [modelName, entity] of normalizedEntities.entries()) {
            const newFields = [];
            for (const field of entity.fields) {
                if (field.isRelation && field.relationTarget) {
                    const targetName = field.relationTarget;
                    const targetEntity = normalizedEntities.get(targetName);
                    if (!targetEntity) {
                        newFields.push(field);
                        continue;
                    }
                    if (field.isList) {
                        // Many side: just keep it, strip @relation if present
                        newFields.push({
                            ...field,
                            attributes: field.attributes ? field.attributes.filter(a => !a.startsWith('@relation')) : []
                        });
                        continue;
                    }
                    let baseName = field.name;
                    if (baseName.endsWith('Id')) {
                        baseName = baseName.slice(0, -2);
                    }
                    const fkName = `${baseName}Id`;
                    const relName = baseName;
                    const hasFk = entity.fields.find(f => f.name === fkName && !f.isRelation) || newFields.find(f => f.name === fkName);
                    if (!hasFk) {
                        newFields.push({
                            name: fkName,
                            type: 'String',
                            isRequired: field.isRequired,
                        });
                    }
                    const constraintName = `${modelName}_${fkName}_fkey`;
                    const relationAttr = `@relation(fields: [${fkName}], references: [id], map: "${constraintName}")`;
                    newFields.push({
                        name: relName,
                        type: targetName,
                        isRequired: field.isRequired,
                        isRelation: true,
                        relationTarget: targetName,
                        attributes: [relationAttr]
                    });
                }
                else {
                    newFields.push(field);
                }
            }
            entity.fields = newFields;
            // 4. Structural guarantees: id, createdAt, updatedAt
            const hasId = entity.fields.some(f => f.isId || f.name === 'id');
            const hasCreatedAt = entity.fields.some(f => f.name === 'createdAt');
            const hasUpdatedAt = entity.fields.some(f => f.name === 'updatedAt');
            if (!hasId) {
                entity.fields.unshift({
                    name: 'id',
                    type: 'String',
                    isRequired: true,
                    isId: true,
                    attributes: ['@id', '@default(uuid())']
                });
            }
            else {
                const idField = entity.fields.find(f => f.isId || f.name === 'id');
                if (idField) {
                    idField.attributes = idField.attributes || [];
                    if (!idField.attributes.includes('@id'))
                        idField.attributes.push('@id');
                    if (!idField.attributes.includes('@default(uuid())'))
                        idField.attributes.push('@default(uuid())');
                    idField.type = 'String';
                }
            }
            if (!hasCreatedAt) {
                entity.fields.push({
                    name: 'createdAt',
                    type: 'DateTime',
                    isRequired: true,
                    attributes: ['@default(now())']
                });
            }
            if (!hasUpdatedAt) {
                entity.fields.push({
                    name: 'updatedAt',
                    type: 'DateTime',
                    isRequired: true,
                    attributes: ['@updatedAt']
                });
            }
        }
        return Array.from(normalizedEntities.values());
    }
    static validate(entities) {
        const validTypes = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt']);
        const constraintNames = new Set();
        const entityMap = new Map();
        const enumNames = new Set(Array.from(RelationNormalizer.generatedEnums.keys()));
        for (const entity of entities) {
            entityMap.set(entity.name, entity);
        }
        for (const entity of entities) {
            for (const field of entity.fields) {
                // Validate field types (now also allows enum names)
                if (!validTypes.has(field.type) && !entityMap.has(field.type) && !enumNames.has(field.type)) {
                    throw new Error(`[Prisma Compiler] Invalid field type '${field.type}' on '${entity.name}.${field.name}'`);
                }
                if (field.isRelation && field.relationTarget) {
                    const targetEntity = entityMap.get(field.relationTarget);
                    if (!targetEntity) {
                        throw new Error(`[Prisma Compiler] Orphan reference: '${entity.name}.${field.name}' references non-existent model '${field.relationTarget}'`);
                    }
                    if (field.attributes) {
                        for (const attr of field.attributes) {
                            const mapMatch = attr.match(/map:\s*"([^"]+)"/);
                            if (mapMatch) {
                                const constraintName = mapMatch[1];
                                if (constraintNames.has(constraintName)) {
                                    throw new Error(`[Prisma Compiler] Duplicated constraint name: '${constraintName}' on '${entity.name}.${field.name}'`);
                                }
                                constraintNames.add(constraintName);
                            }
                        }
                    }
                    const hasReverse = targetEntity.fields.find(f => f.type === entity.name && f.isRelation);
                    if (!hasReverse && field.type !== entity.name) {
                        throw new Error(`[Prisma Compiler] Missing reverse relation on '${field.relationTarget}' for '${entity.name}.${field.name}'`);
                    }
                }
            }
        }
    }
    static autoRepair(entities, errorMessage) {
        const repaired = JSON.parse(JSON.stringify(entities));
        const fieldMatch = errorMessage.match(/field\s+[`"']([^`"']+)[`"']/i);
        const modelMatch = errorMessage.match(/model\s+[`"']([^`"']+)[`"']/i);
        if (fieldMatch && modelMatch) {
            const fieldName = fieldMatch[1];
            const modelName = modelMatch[1];
            const model = repaired.find((m) => m.name === modelName);
            if (model) {
                model.fields = model.fields.filter((f) => f.name !== fieldName);
                console.warn(`[Auto-Repair] Dropped field '${fieldName}' from model '${modelName}'`);
                return repaired;
            }
        }
        console.warn(`[Auto-Repair] Executing aggressive fallback: dropping all relations`);
        for (const model of repaired) {
            model.fields = model.fields.map((f) => {
                if (f.isRelation || f.relationTarget) {
                    return {
                        ...f,
                        type: 'String',
                        isRelation: false,
                        relationTarget: undefined,
                        attributes: f.attributes ? f.attributes.filter((a) => !a.startsWith('@relation')) : []
                    };
                }
                return f;
            });
        }
        return repaired;
    }
    static render(entities) {
        let schemaPrisma = '';
        // Render enums first
        for (const [, enumDef] of RelationNormalizer.generatedEnums) {
            schemaPrisma += `\nenum ${enumDef.name} {\n`;
            for (const value of enumDef.values) {
                schemaPrisma += `  ${value}\n`;
            }
            schemaPrisma += `}\n`;
        }
        // Render models
        for (const entity of entities) {
            schemaPrisma += `\nmodel ${entity.name} {\n`;
            for (const field of entity.fields) {
                const typeModifier = field.isList ? '[]' : (field.isRequired ? '' : '?');
                const attrs = field.attributes ? field.attributes.join(' ') : '';
                let extraAttrs = '';
                if (field.isUnique && !field.isId)
                    extraAttrs += ' @unique';
                schemaPrisma += `  ${field.name} ${field.type}${typeModifier} ${attrs}${extraAttrs}`.trim() + '\n';
            }
            schemaPrisma += `}\n`;
        }
        return schemaPrisma;
    }
}
exports.RelationNormalizer = RelationNormalizer;
