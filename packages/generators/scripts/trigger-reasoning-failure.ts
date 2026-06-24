import { FrontendAppGenerator } from '../src/generators/frontend-generator';
import path from 'path';
import fs from 'fs/promises';

async function triggerReasoningFailure() {
  const reqs = {
    appName: "TestApp",
    features: ["basic layout"],
    frontendArchitecture: {
      components: [{ name: 'Header', type: 'layout', description: 'desc' }],
      services: [],
      hooks: [],
      pages: []
    }
  };

  const targetDir = path.join(__dirname, '..'); // packages/generators

  // We will mock the AI provider so it returns reasoning instead of code
  const mockProvider = {
    generateText: async (prompt: string) => {
      return `let me think about how to build this header...
Okay, here is the component:

\`\`\`tsx
import React from 'react';
export default function Header() {
  return <header>Header</header>;
}
\`\`\`
I hope this helps!`;
    },
    generateJSON: async () => "{}"
  };

  console.log("Triggering reasoning failure...");
  try {
    const generator = new FrontendAppGenerator();
    // Overriding the provider internally by hooking prototype or we can just mock ProviderFactory
    // Actually, just let's inject a mock provider into the environment?
    // Wait, the easiest way is to mock ProviderFactory.getProvider in the actual process.
  } catch (e) {
  }
}

triggerReasoningFailure();
