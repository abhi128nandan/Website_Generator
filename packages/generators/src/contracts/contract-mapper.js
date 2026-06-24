"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractMapper = void 0;
const shared_1 = require("@website-generator/shared");
class ContractMapper {
    /**
     * Maps a Canonical Contract Definition into a deterministic CrudArchitectureSchema object.
     * This guarantees identical architecture for core apps every single time.
     */
    static mapToArchitecture(contract) {
        shared_1.Logger.info(`[ContractMapper] Mapping canonical contract for ${contract.appName} to CrudArchitectureSchema...`);
        const entities = contract.entities.map(e => ({
            name: e.entity,
            fields: e.fields.map(f => ({
                name: f.name,
                type: f.type,
                isRequired: f.required !== false, // default true
                isId: !!f.isId,
                isUnique: !!f.isUnique,
                isRelation: !!f.isRelation,
                relationTarget: f.relationTarget,
                isArray: !!f.isArray,
                hasDefault: !!f.hasDefault
            }))
        }));
        const endpoints = [];
        const pages = [];
        const navigation = [];
        // Provide a Dashboard page by default
        pages.push({
            route: '/',
            componentName: 'DashboardPage',
            description: 'Main dashboard overview',
            features: ['View overall system metrics'],
            isDashboard: true
        });
        navigation.push({ label: 'Dashboard', route: '/' });
        for (const entityDef of contract.entities) {
            const entityName = entityDef.entity;
            const routeBase = `/${entityName.toLowerCase()}s`;
            const apiBase = `/api${routeBase}`;
            // Endpoints
            endpoints.push({ path: apiBase, method: 'GET', entity: entityName, description: `Get all ${entityName}s`, businessLogic: `Fetch and paginate ${entityName}s` }, { path: apiBase, method: 'POST', entity: entityName, description: `Create new ${entityName}`, businessLogic: `Validate and create new ${entityName}` }, { path: `${apiBase}/:id`, method: 'GET', entity: entityName, description: `Get ${entityName} by ID`, businessLogic: `Fetch single ${entityName}` }, { path: `${apiBase}/:id`, method: 'PUT', entity: entityName, description: `Update ${entityName}`, businessLogic: `Validate and update ${entityName}` }, { path: `${apiBase}/:id`, method: 'DELETE', entity: entityName, description: `Delete ${entityName}`, businessLogic: `Remove ${entityName}` });
            // Pages
            pages.push({
                route: routeBase,
                componentName: `${entityName}ListPage`,
                entity: entityName,
                description: `List and manage ${entityName}s`,
                features: [`View ${entityName}s`, `Delete ${entityName}s`, `Navigate to Create/Edit`]
            }, {
                route: `${routeBase}/new`,
                componentName: `${entityName}CreatePage`,
                entity: entityName,
                description: `Form to create a new ${entityName}`,
                features: [`Create new ${entityName}`]
            }, {
                route: `${routeBase}/:id/edit`,
                componentName: `${entityName}EditPage`,
                entity: entityName,
                description: `Form to edit an existing ${entityName}`,
                features: [`Update ${entityName}`]
            });
            navigation.push({ label: `${entityName}s`, route: routeBase });
        }
        return {
            entities,
            endpoints,
            pages,
            navigation
        };
    }
}
exports.ContractMapper = ContractMapper;
