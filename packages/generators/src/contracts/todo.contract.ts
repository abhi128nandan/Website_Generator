import { ContractDefinition } from '@paperclip/shared';

export const TodoContract: ContractDefinition = {
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
