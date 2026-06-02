export interface PrismaField {
  name: string;
  type: string;
  isRequired: boolean;
  isId?: boolean;
  isUnique?: boolean;
  isRelation?: boolean;
  relationTarget?: string;
  attributes?: string[];
  isList?: boolean;
}

export interface PrismaEntity {
  name: string;
  fields: PrismaField[];
}

export class RelationNormalizer {
  static normalize(entities: any[]): PrismaEntity[] {
    const normalizedEntities: Map<string, PrismaEntity> = new Map();

    // 1. First pass: initialize and copy base fields
    for (const entity of entities) {
      const modelName = entity.name.replace(/[^a-zA-Z0-9]/g, '');
      if (!modelName) continue;
      
      const pEntity: PrismaEntity = {
        name: modelName,
        fields: []
      };

      for (const f of entity.fields) {
        const fieldName = f.name.replace(/[^a-zA-Z0-9]/g, '');
        if (!fieldName) continue;

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

    // 2. Second pass: normalize relations, add reverse relations and FKs
    for (const [modelName, entity] of normalizedEntities.entries()) {
      const newFields: PrismaField[] = [];

      for (const field of entity.fields) {
        if (field.isRelation && field.relationTarget) {
          const targetName = field.relationTarget;
          const targetEntity = normalizedEntities.get(targetName);
          
          if (!targetEntity) {
            // Target doesn't exist, preserve as relation so validate() catches the orphan
            newFields.push(field);
            continue;
          }

          let baseName = field.name;
          if (baseName.endsWith('Id')) {
            baseName = baseName.slice(0, -2);
          }
          
          const fkName = `${baseName}Id`;
          const relName = baseName;

          // Check if FK already exists as a non-relation field
          const hasFk = entity.fields.find(f => f.name === fkName && !f.isRelation) || newFields.find(f => f.name === fkName);
          if (!hasFk) {
            newFields.push({
              name: fkName,
              type: 'String',
              isRequired: field.isRequired,
            });
          }

          // Generate deterministic constraint name
          const constraintName = `${modelName}_${fkName}_fkey`;

          // Add relation attribute with mapped constraint
          const relationAttr = `@relation(fields: [${fkName}], references: [id], map: "${constraintName}")`;
          
          newFields.push({
            name: relName,
            type: targetName,
            isRequired: field.isRequired,
            isRelation: true,
            relationTarget: targetName,
            attributes: [relationAttr]
          });

          // Inject reverse relation in target entity
          // Using plural of the current model's camelCase name for the reverse relation array
          const reverseName = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}s`;
          
          const hasReverse = targetEntity.fields.find(f => f.name === reverseName || (f.type === modelName && f.isList));
          
          if (!hasReverse) {
            targetEntity.fields.push({
              name: reverseName,
              type: modelName,
              isRequired: false, // Prisma arrays don't need '?'
              isList: true,
              isRelation: true,
              relationTarget: modelName
            });
          }
        } else {
          newFields.push(field);
        }
      }

      entity.fields = newFields;

      // Ensure id, createdAt, updatedAt exist
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
      } else {
        const idField = entity.fields.find(f => f.isId || f.name === 'id');
        if (idField) {
          idField.attributes = idField.attributes || [];
          if (!idField.attributes.includes('@id')) idField.attributes.push('@id');
          if (!idField.attributes.includes('@default(uuid())')) idField.attributes.push('@default(uuid())');
          idField.type = 'String'; // Enforce uuid String type
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

  static validate(entities: PrismaEntity[]): void {
    const validTypes = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt']);
    const constraintNames = new Set<string>();
    const entityMap = new Map<string, PrismaEntity>();

    for (const entity of entities) {
      entityMap.set(entity.name, entity);
    }

    for (const entity of entities) {
      for (const field of entity.fields) {
        // Validate field types
        if (!validTypes.has(field.type) && !entityMap.has(field.type)) {
          throw new Error(`[Prisma Compiler] Invalid field type '${field.type}' on '${entity.name}.${field.name}'`);
        }

        // Validate relations
        if (field.isRelation && field.relationTarget) {
          const targetEntity = entityMap.get(field.relationTarget);
          if (!targetEntity) {
            throw new Error(`[Prisma Compiler] Orphan reference: '${entity.name}.${field.name}' references non-existent model '${field.relationTarget}'`);
          }

          // Check for constraint name duplication
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
          
          // Check for reverse relation
          const hasReverse = targetEntity.fields.find(f => f.type === entity.name && f.isRelation);
          if (!hasReverse && field.type !== entity.name) { // ignore self-relations to avoid confusing the validator unless we want strict self-relation checks
            throw new Error(`[Prisma Compiler] Missing reverse relation on '${field.relationTarget}' for '${entity.name}.${field.name}'`);
          }
        }
      }
    }
  }

  static autoRepair(entities: any[], errorMessage: string): any[] {
    // Deep clone to avoid mutating the original
    const repaired = JSON.parse(JSON.stringify(entities));
    
    const fieldMatch = errorMessage.match(/field\s+[`"']([^`"']+)[`"']/i);
    const modelMatch = errorMessage.match(/model\s+[`"']([^`"']+)[`"']/i);
    
    if (fieldMatch && modelMatch) {
      const fieldName = fieldMatch[1];
      const modelName = modelMatch[1];
      
      const model = repaired.find((m: any) => m.name === modelName);
      if (model) {
        // Drop the problematic field entirely
        model.fields = model.fields.filter((f: any) => f.name !== fieldName);
        console.warn(`[Auto-Repair] Dropped field '${fieldName}' from model '${modelName}'`);
        return repaired;
      }
    }
    
    // Aggressive fallback: convert all relations to primitive Strings
    console.warn(`[Auto-Repair] Executing aggressive fallback: dropping all relations`);
    for (const model of repaired) {
      model.fields = model.fields.map((f: any) => {
        if (f.isRelation || f.relationTarget) {
          return { ...f, type: 'String', isRelation: false, relationTarget: undefined };
        }
        return f;
      });
    }
    
    return repaired;
  }

  static render(entities: PrismaEntity[]): string {
    let schemaPrisma = '';
    
    for (const entity of entities) {
      schemaPrisma += `\nmodel ${entity.name} {\n`;
      for (const field of entity.fields) {
        const typeModifier = field.isList ? '[]' : (field.isRequired ? '' : '?');
        const attrs = field.attributes ? field.attributes.join(' ') : '';
        
        let extraAttrs = '';
        if (field.isUnique && !field.isId) extraAttrs += ' @unique';

        schemaPrisma += `  ${field.name} ${field.type}${typeModifier} ${attrs}${extraAttrs}`.trim() + '\n';
      }
      schemaPrisma += `}\n`;
    }
    
    return schemaPrisma;
  }
}
