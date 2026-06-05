import { ContractDefinition, ContractField, Logger } from '@paperclip/shared';

const RESERVED_WORDS = new Set(['id', 'createdAt', 'updatedAt', 'class', 'function', 'return', 'if', 'else', 'const', 'let', 'var']);
const VALID_TYPES = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime']);

export class ContractValidator {
  static validate(contract: ContractDefinition): void {
    if (!contract.appName) {
      throw new Error(`ContractValidator Error: Missing appName.`);
    }
    
    if (!contract.entities || contract.entities.length === 0) {
      throw new Error(`ContractValidator Error: No entities defined in contract.`);
    }

    const allEntityNames = new Set(contract.entities.map(e => e.entity));

    for (const entityDef of contract.entities) {
      if (!entityDef.entity || entityDef.entity.trim() === '') {
        throw new Error(`ContractValidator Error: Entity missing a name.`);
      }

      if (!entityDef.fields || entityDef.fields.length === 0) {
        throw new Error(`ContractValidator Error: Entity '${entityDef.entity}' has no fields.`);
      }

      const fieldNames = new Set<string>();
      let hasId = false;

      for (const field of entityDef.fields) {
        // 1. Field exists
        if (!field.name || field.name.trim() === '') {
          throw new Error(`ContractValidator Error: Entity '${entityDef.entity}' has an unnamed field.`);
        }

        // 2. Unique field names per entity
        if (fieldNames.has(field.name)) {
          throw new Error(`ContractValidator Error: Duplicate field name '${field.name}' in entity '${entityDef.entity}'.`);
        }
        fieldNames.add(field.name);

        // 3. Reserved keyword checks
        // id, createdAt, updatedAt are fine as standard fields, but not others
        if (RESERVED_WORDS.has(field.name) && !['id', 'createdAt', 'updatedAt'].includes(field.name)) {
          throw new Error(`ContractValidator Error: Field name '${field.name}' in entity '${entityDef.entity}' is a reserved keyword.`);
        }

        if (field.isId) {
          hasId = true;
        }

        // 4. Valid types
        if (!VALID_TYPES.has(field.type)) {
          throw new Error(`ContractValidator Error: Invalid type '${field.type}' on field '${field.name}' in entity '${entityDef.entity}'.`);
        }

        // 5. Relation integrity
        if (field.isRelation) {
          if (!field.relationTarget) {
            throw new Error(`ContractValidator Error: Field '${field.name}' in entity '${entityDef.entity}' is marked as a relation but has no relationTarget.`);
          }
          if (!allEntityNames.has(field.relationTarget)) {
            throw new Error(`ContractValidator Error: Relation target '${field.relationTarget}' on field '${field.name}' in entity '${entityDef.entity}' does not exist in the contract.`);
          }
        }
      }

      if (!hasId) {
        throw new Error(`ContractValidator Error: Entity '${entityDef.entity}' does not have a primary key (isId: true).`);
      }
    }
  }
}
