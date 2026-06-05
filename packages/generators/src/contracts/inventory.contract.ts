import { ContractDefinition } from '@paperclip/shared';

export const InventoryContract: ContractDefinition = {
  appName: 'Inventory App',
  entities: [
    {
      entity: 'Product',
      fields: [
        { name: 'id', type: 'String', isId: true, hasDefault: true },
        { name: 'name', type: 'String', required: true },
        { name: 'sku', type: 'String', required: true, isUnique: true },
        { name: 'price', type: 'Float', required: true },
        { name: 'stockQuantity', type: 'Int', required: true, hasDefault: true },
        { name: 'description', type: 'String' },
        { name: 'createdAt', type: 'DateTime', hasDefault: true },
        { name: 'updatedAt', type: 'DateTime', hasDefault: true }
      ]
    }
  ]
};
