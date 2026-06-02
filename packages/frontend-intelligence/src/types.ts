export interface DomainContext {
  domain: string;
  confidence: number;
  uxPatterns: string[];
  primaryActions: string[];
  entities: string[];
  visualStyle: string;
  interactionModels: string[];
}

export interface SemanticComponent {
  name: string;
  purpose: string;
  props: { name: string; type: string; required: boolean }[];
  states: string[];
  interactions: string[];
  dependencies: string[];
}

export interface InteractionFlow {
  trigger: string;
  states: string[];
  transitions: string[];
  loadingBehavior: string;
  errorBehavior: string;
  successBehavior: string;
}

export interface DesignSystem {
  typographyScale: Record<string, string>;
  spacingScale: Record<string, string>;
  colors: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: string;
  animations: Record<string, string>;
}

export interface SemanticAST {
  domainContext?: DomainContext;
  components: SemanticComponent[];
  flows: InteractionFlow[];
  designSystem?: DesignSystem;
  accessibilityRules: Record<string, string>;
  responsiveRules: Record<string, string>;
  isFallback: boolean;
  fallbackLayer?: 1 | 2 | 3 | 4 | 5;
}
