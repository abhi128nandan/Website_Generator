import { CompilationValidator } from '../src/validators/compilation-validator';

const validCode = `
import React from 'react';
interface Props { name: string; }
export default function TestComponent(props: Props) {
  return <div>{props.name}</div>;
}
`;

const invalidCode = `
import React from 'react';
export default function TestComponent() {
  const num: number = "string"; // Type error
  return <div>{num}</div>;
}
`;

console.log("Testing VALID code:");
const validResult = CompilationValidator.validate(validCode, true);
console.log(validResult.success ? "PASS" : "FAIL", validResult);

console.log("\nTesting INVALID code:");
const invalidResult = CompilationValidator.validate(invalidCode, true);
console.log(invalidResult.success ? "PASS" : "FAIL", invalidResult);
