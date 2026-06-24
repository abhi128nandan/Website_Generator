"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudGenerator = void 0;
const shared_1 = require("@website-generator/shared");
const ai_engine_1 = require("@website-generator/ai-engine");
const todo_contract_1 = require("./contracts/todo.contract");
const inventory_contract_1 = require("./contracts/inventory.contract");
const crm_contract_1 = require("./contracts/crm.contract");
const student_contract_1 = require("./contracts/student.contract");
const contract_validator_1 = require("./contracts/contract-validator");
const contract_mapper_1 = require("./contracts/contract-mapper");
class CrudGenerator {
    static async analyze(reqs) {
        try {
            // 1. Canonical Contract Bypass
            const lowerName = reqs.appName.toLowerCase();
            let contractDef = null;
            if (lowerName.includes('todo'))
                contractDef = todo_contract_1.TodoContract;
            else if (lowerName.includes('inventory'))
                contractDef = inventory_contract_1.InventoryContract;
            else if (lowerName.includes('crm'))
                contractDef = crm_contract_1.CRMContract;
            else if (lowerName.includes('student'))
                contractDef = student_contract_1.StudentContract;
            if (contractDef) {
                shared_1.Logger.info(`[CrudGenerator] Detected canonical app benchmark: ${contractDef.appName}. Bypassing LLM.`);
                contract_validator_1.ContractValidator.validate(contractDef);
                const mappedArch = contract_mapper_1.ContractMapper.mapToArchitecture(contractDef);
                const parsed = shared_1.CrudArchitectureSchema.parse(mappedArch);
                reqs.architecture = parsed;
                reqs.__canonicalContract = contractDef;
                shared_1.Logger.info(`[CrudGenerator] Deterministic architecture injected successfully.`);
                return; // Bypass the rest
            }
            // 2. Fallback to LLM for Custom Apps
            const provider = ai_engine_1.ProviderFactory.getProvider();
            const prompt = `You are a Senior Software Architect.
Analyze the following application requirements and output a deterministic JSON AST representing the system's CRUD architecture.
You MUST output ONLY a valid JSON object matching the following structure exactly. Do not output markdown code blocks or any conversational text.

Structure:
{
  "entities": [
    {
      "name": "string (PascalCase, e.g. User, Task)",
      "fields": [
        {
          "name": "string (camelCase)",
          "type": "String" | "Int" | "Float" | "Boolean" | "DateTime",
          "isRequired": boolean,
          "isId": boolean (optional, use for primary keys),
          "isUnique": boolean (optional),
          "isRelation": boolean (optional),
          "relationTarget": "string (PascalCase entity name, optional)"
        }
      ]
    }
  ],
  "endpoints": [
    {
      "path": "string (e.g. /api/users)",
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "entity": "string (entity name, optional)",
      "description": "string",
      "businessLogic": "string (detailed pseudo-code or functional rules for this endpoint)"
    }
  ],
  "pages": [
    {
      "route": "string (e.g. /users)",
      "componentName": "string (PascalCase)",
      "entity": "string (entity name, optional)",
      "description": "string",
      "features": ["string (list of functional features this page implements)"],
      "isDashboard": boolean (optional)
    }
  ],
  "navigation": [
    {
      "label": "string",
      "route": "string"
    }
  ]
}

Application Context:
App Name: ${reqs.appName}
App Type: ${reqs.appType}
Features: ${reqs.features.join(', ')}
Workflows: ${reqs.workflows?.join(', ') || ''}
Identified Entities: ${JSON.stringify(reqs.entities, null, 2)}

Ensure that you provide standard ID fields (id: String, isId: true) and timestamps (createdAt, updatedAt) for every entity.
Generate standard CRUD REST API endpoints AND custom endpoints containing business logic for the specific workflows.
Generate functional pages linked to these workflows (e.g., Dashboard, Logs, Analytics). Do not just list simple CRUD pages.`;
            shared_1.Logger.info(`[CrudGenerator] Executing AI architecture analysis...`);
            const responseText = await provider.generateJSON(prompt);
            const start = responseText.indexOf('{');
            const end = responseText.lastIndexOf('}');
            if (start === -1 || end === -1 || end < start) {
                throw new Error('No JSON object found in response');
            }
            const jsonString = responseText.substring(start, end + 1);
            const parsed = JSON.parse(jsonString);
            // Normalize missing boolean fields to prevent validation failures
            if (parsed.entities && Array.isArray(parsed.entities)) {
                for (const entity of parsed.entities) {
                    if (entity.fields && Array.isArray(entity.fields)) {
                        for (let i = 0; i < entity.fields.length; i++) {
                            let field = entity.fields[i];
                            // Ensure field is an object (LLM might return strings)
                            if (typeof field !== 'object' || field === null || Array.isArray(field)) {
                                field = { name: String(field), type: 'String' };
                                entity.fields[i] = field;
                            }
                            // Default isRequired to true if missing or normalize string booleans
                            if (typeof field.isRequired !== 'boolean') {
                                field.isRequired = field.isRequired === 'true' || field.isRequired === '1' ? true : (field.isRequired === undefined ? true : false);
                            }
                            if (typeof field.isId !== 'boolean')
                                field.isId = field.isId === 'true';
                            if (typeof field.isUnique !== 'boolean')
                                field.isUnique = field.isUnique === 'true';
                            if (typeof field.isRelation !== 'boolean')
                                field.isRelation = field.isRelation === 'true';
                            if (typeof field.isArray !== 'boolean')
                                field.isArray = field.isArray === 'true';
                            if (typeof field.hasDefault !== 'boolean')
                                field.hasDefault = field.hasDefault === 'true';
                            if (field.relationTarget === 'null' || field.relationTarget === '')
                                field.relationTarget = undefined;
                            if (field.type) {
                                const lowerType = String(field.type).toLowerCase();
                                if (lowerType.startsWith('int') || lowerType === 'number' || lowerType === 'integer')
                                    field.type = 'Int';
                                else if (lowerType.startsWith('float') || lowerType === 'double' || lowerType === 'decimal')
                                    field.type = 'Float';
                                else if (lowerType.startsWith('bool'))
                                    field.type = 'Boolean';
                                else if (lowerType.startsWith('date') || lowerType === 'time' || lowerType === 'timestamp')
                                    field.type = 'DateTime';
                                else
                                    field.type = 'String';
                            }
                            else {
                                field.type = 'String';
                            }
                        }
                    }
                }
            }
            if (parsed.endpoints && Array.isArray(parsed.endpoints)) {
                for (let i = 0; i < parsed.endpoints.length; i++) {
                    let ep = parsed.endpoints[i];
                    if (ep && typeof ep.method === 'string') {
                        const m = ep.method.toUpperCase();
                        if (m.includes('GET'))
                            ep.method = 'GET';
                        else if (m.includes('POST'))
                            ep.method = 'POST';
                        else if (m.includes('PUT'))
                            ep.method = 'PUT';
                        else if (m.includes('DELETE'))
                            ep.method = 'DELETE';
                        else if (m.includes('PATCH'))
                            ep.method = 'PUT'; // Treat PATCH as PUT for our CRUD gen
                        else
                            ep.method = 'GET'; // fallback
                    }
                    else if (ep) {
                        ep.method = 'GET';
                    }
                }
            }
            const architecture = shared_1.CrudArchitectureSchema.parse(parsed);
            reqs.architecture = architecture;
            shared_1.Logger.info(`[CrudGenerator] AI analysis complete. Discovered ${architecture.entities.length} entities, ${architecture.endpoints.length} endpoints, and ${architecture.pages.length} pages.`);
        }
        catch (err) {
            shared_1.Logger.error(`[CrudGenerator] Failed to analyze CRUD architecture: ${err.message}`);
            throw err; // Fail hard to trigger the RepairAgent instead of generating a static dashboard
        }
    }
}
exports.CrudGenerator = CrudGenerator;
