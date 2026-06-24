const { CompilationValidator } = require('./dist/validators/compilation-validator');
const { CompileGate } = require('./dist/validators/compile-gate');

const tsxContent = `import { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface CalculatorDisplayProps { value: string; onClear?: () => void; className?: string; }
export default function CalculatorDisplay({ value, onClear, className = '' }: CalculatorDisplayProps) {
  const displayRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  return <div ref={displayRef} className={className}>{value}</div>;
}`;

console.log("Running CompilationValidator...");
const compResult = CompilationValidator.validate(tsxContent, true, 'c:/some/fake/dir');

console.log("Running CompileGate...");
const gateResult = CompileGate.validate(tsxContent, true, 'CalculatorDisplay', 'c:/website-generator-core/website-generator-core/generation-artifacts/test-app/frontend');

console.log("Done");
