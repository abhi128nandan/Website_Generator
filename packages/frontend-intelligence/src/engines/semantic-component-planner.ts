import { SemanticComponent, DomainContext } from '../types';

export class SemanticComponentPlanner {
  static async plan(domainContext: DomainContext): Promise<SemanticComponent[]> {
    // Generate semantic UI components instead of generic <Card> blocks
    return [
      {
        name: `${domainContext.entities[0] || 'Domain'}Dashboard`,
        purpose: 'Main dashboard view',
        props: [],
        states: ['loading', 'idle', 'error'],
        interactions: ['mount', 'refresh'],
        dependencies: []
      }
    ];
  }
}
