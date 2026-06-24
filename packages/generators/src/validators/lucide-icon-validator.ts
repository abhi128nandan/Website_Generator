import * as ts from 'typescript';

export class LucideIconValidator {
  private static _validIconsCache: Set<string> | null = null;

  private static getValidIcons(): Set<string> {
    if (this._validIconsCache) {
      return this._validIconsCache;
    }

    const validIcons = new Set<string>();
    
    try {
      // 1. Dynamic runtime export discovery
      // Load runtime exports (covers all 4800+ icons, utilities, and factories)
      const lucide = require('lucide-react');
      for (const key of Object.keys(lucide)) {
        validIcons.add(key);
      }

      // Add common types manually since runtime exports won't expose TS types
      validIcons.add('LucideProps');
      validIcons.add('IconNode');
      validIcons.add('LucideIcon');
    } catch (e) {
      // Fail-open fallback: if we can't resolve lucide-react dynamically, 
      // we allow validation to pass to avoid blocking pipeline
      console.warn('LucideIconValidator: Failed to dynamically load lucide-react. Falling back to fail-open mode.', e);
    }

    this._validIconsCache = validIcons;
    return validIcons;
  }

  static validate(code: string): { isValid: boolean; reason?: string } {
    const sourceFile = ts.createSourceFile('temp.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let invalidIcon: string | null = null;
    
    const validIcons = this.getValidIcons();

    // If validIcons is completely empty (dynamic discovery failed entirely), we fail-open.
    const failOpen = validIcons.size === 0;

    ts.forEachChild(sourceFile, function visit(node) {
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          if (node.moduleSpecifier.text === 'lucide-react') {
            const importClause = node.importClause;
            if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
              for (const element of importClause.namedBindings.elements) {
                const name = element.propertyName ? element.propertyName.text : element.name.text;
                if (!failOpen && !validIcons.has(name)) {
                  invalidIcon = name;
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    });

    if (invalidIcon) {
      return { isValid: false, reason: `INVALID_LUCIDE_ICON: '${invalidIcon}' is not an allowed lucide-react icon.` };
    }

    return { isValid: true };
  }
}
