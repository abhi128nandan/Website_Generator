"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LucideIconValidator = void 0;
var ts = require("typescript");
var LucideIconValidator = /** @class */ (function () {
    function LucideIconValidator() {
    }
    LucideIconValidator.getValidIcons = function () {
        if (this._validIconsCache) {
            return this._validIconsCache;
        }
        var validIcons = new Set();
        try {
            // 1. Dynamic runtime export discovery
            // Load runtime exports (covers all 4800+ icons, utilities, and factories)
            var lucide = require('lucide-react');
            for (var _i = 0, _a = Object.keys(lucide); _i < _a.length; _i++) {
                var key = _a[_i];
                validIcons.add(key);
            }
            // Add common types manually since runtime exports won't expose TS types
            validIcons.add('LucideProps');
            validIcons.add('IconNode');
            validIcons.add('LucideIcon');
        }
        catch (e) {
            // Fail-open fallback: if we can't resolve lucide-react dynamically, 
            // we allow validation to pass to avoid blocking pipeline
            console.warn('LucideIconValidator: Failed to dynamically load lucide-react. Falling back to fail-open mode.', e);
        }
        this._validIconsCache = validIcons;
        return validIcons;
    };
    LucideIconValidator.validate = function (code) {
        var sourceFile = ts.createSourceFile('temp.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        var invalidIcon = null;
        var validIcons = this.getValidIcons();
        // If validIcons is completely empty (dynamic discovery failed entirely), we fail-open.
        var failOpen = validIcons.size === 0;
        ts.forEachChild(sourceFile, function visit(node) {
            if (ts.isImportDeclaration(node)) {
                if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                    if (node.moduleSpecifier.text === 'lucide-react') {
                        var importClause = node.importClause;
                        if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
                            for (var _i = 0, _a = importClause.namedBindings.elements; _i < _a.length; _i++) {
                                var element = _a[_i];
                                var name_1 = element.propertyName ? element.propertyName.text : element.name.text;
                                if (!failOpen && !validIcons.has(name_1)) {
                                    invalidIcon = name_1;
                                }
                            }
                        }
                    }
                }
            }
            ts.forEachChild(node, visit);
        });
        if (invalidIcon) {
            return { isValid: false, reason: "INVALID_LUCIDE_ICON: '".concat(invalidIcon, "' is not an allowed lucide-react icon.") };
        }
        return { isValid: true };
    };
    LucideIconValidator._validIconsCache = null;
    return LucideIconValidator;
}());
exports.LucideIconValidator = LucideIconValidator;
