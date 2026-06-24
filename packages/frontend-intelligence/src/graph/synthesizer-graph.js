"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthesizerGraph = void 0;
const domain_analyzer_1 = require("../engines/domain-analyzer");
const semantic_fallback_engine_1 = require("../fallback/semantic-fallback-engine");
const semantic_component_planner_1 = require("../engines/semantic-component-planner");
const interaction_flow_engine_1 = require("../engines/interaction-flow-engine");
const design_token_engine_1 = require("../engines/design-token-engine");
class SynthesizerGraph {
    static async run(intent) {
        // In a full LangGraph implementation, these would be nodes
        // and StateGraph would orchestrate them. Here is the conceptual flow
        // that returns the final AST.
        let domainContext;
        let isFallback = false;
        let fallbackLayer = undefined;
        try {
            domainContext = await domain_analyzer_1.DomainAnalyzer.analyze(intent);
        }
        catch (e) {
            domainContext = semantic_fallback_engine_1.SemanticFallbackEngine.recover(intent);
            isFallback = true;
            fallbackLayer = 3; // topology inference
        }
        const components = await semantic_component_planner_1.SemanticComponentPlanner.plan(domainContext);
        const flows = interaction_flow_engine_1.InteractionFlowEngine.mapFlows(components);
        const designSystem = design_token_engine_1.DesignTokenEngine.generateSystem(domainContext);
        const ast = {
            domainContext,
            components,
            flows,
            designSystem,
            accessibilityRules: {},
            responsiveRules: {},
            isFallback,
            fallbackLayer
        };
        return ast;
    }
}
exports.SynthesizerGraph = SynthesizerGraph;
