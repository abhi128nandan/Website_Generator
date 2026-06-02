import { DomainContext } from '../types';

export class UXPatternEngine {
  static determinePattern(domain: DomainContext): string {
    if (domain.uxPatterns.includes('search UX')) return 'search-interface';
    if (domain.uxPatterns.includes('dashboard')) return 'dashboard-layout';
    return 'generic-flow';
  }
}
