"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLLMProvider = void 0;
class BaseLLMProvider {
    defaultModel;
    constructor(defaultModel) {
        this.defaultModel = defaultModel;
    }
    /**
     * Returns the currently configured model.
     */
    getModel() {
        return this.defaultModel;
    }
}
exports.BaseLLMProvider = BaseLLMProvider;
