const { CodeExtractor } = require('./dist/validators/code-extractor');
const { CodeIntegrityValidator } = require('./dist/validators/code-integrity-validator');
const { CodeValidityGate } = require('./dist/validators/code-validity-gate');
const { ReasoningLeakGate } = require('./dist/validators/reasoning-leak-gate');
const fs = require('fs');
const path = require('path');

const mockCalculatorCode = `import { useState } from 'react';
import { Calculator, Equals, Divide, Multiply, Subtract, Plus } from 'lucide-react';

interface CalculatorProps {
  className?: string;
}

export default function Calculator({ className = '' }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState('');
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNextValue, setWaitingForNextValue] = useState<boolean>(false);

  const handleNumber = (number: string) => {
    setDisplay(prev => prev === '0' ? number : prev + number);
  };

  return (
    <div className="calculator">
       {display} {waitingForNextValue}
    </div>
  );
}`;

console.log("Running ReasoningLeakGate...");
const leakRes = ReasoningLeakGate.validate(mockCalculatorCode);

console.log("Running CodeExtractor...");
const extractorRes = CodeExtractor.extractCodeArtifact(mockCalculatorCode, true, 'Calculator');

console.log("Running CodeValidityGate...");
const validityRes = CodeValidityGate.validate(extractorRes.code || mockCalculatorCode);

console.log("Running CodeIntegrityValidator...");
const integrityRes = CodeIntegrityValidator.validate(extractorRes.code || mockCalculatorCode, 'Calculator', true);

const report = {
  attempts: 1,
  validatorOutcomes: {
    ReasoningLeakGate: leakRes,
    CodeExtractor: {
      success: extractorRes.success,
      reason: extractorRes.reason || null
    },
    CodeValidityGate: validityRes,
    CodeIntegrityValidator: {
      valid: integrityRes.valid,
      reason: integrityRes.reason || null
    }
  },
  generatedCode: extractorRes.code || mockCalculatorCode
};

const artifactsDir = path.resolve(__dirname, '../../generation-artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });
const outputPath = path.join(artifactsDir, 'post-reasoning-consolidation-report.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log("Report generated at " + outputPath);
