import { InteractionFlow, SemanticComponent } from '../types';

export class InteractionFlowEngine {
  static mapFlows(components: SemanticComponent[]): InteractionFlow[] {
    return components.map(c => ({
      trigger: `user interacts with ${c.name}`,
      states: c.states,
      transitions: ['fade-in', 'slide-up'],
      loadingBehavior: 'skeleton',
      errorBehavior: 'toast',
      successBehavior: 'update-ui'
    }));
  }
}
