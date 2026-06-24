
import { FrontendAppGenerator } from './src/generators/frontend-generator';
import path from 'path';
import fs from 'fs';

async function run() {
  const targetDir = path.join(process.cwd(), '../../generation-artifacts/test-calc-attempt1');
  fs.mkdirSync(targetDir, { recursive: true });

  const provider = {
    generateText: async (p) => {
      return `import { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface CalculatorDisplayProps {
  value: string;
  onClear?: () => void;
  className?: string;
}

export default function CalculatorDisplay({ value, onClear, className = '' }: CalculatorDisplayProps) {
  const displayRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClear = useCallback(() => {
    if (onClear) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
      onClear();
    }
  }, [onClear]);

  return (
    <div
      ref={displayRef}
      className={\`relative min-h-[80px] max-h-[120px] p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white text-right text-2xl md:text-3xl lg:text-4xl font-mono font-light overflow-hidden transition-all duration-300 \${
        isAnimating ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100'
      } \${className}\`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-[glow_4s_ease-in-out_infinite] rounded-lg"></div>
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="flex justify-between items-center">
          <div className="w-full truncate pr-8">{value}</div>
          <button
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors duration-200 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear"
            disabled={!onClear}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}`;
    }
  };

  try {
    await (FrontendAppGenerator as any).generateValidCode(provider, '...', true, 'CalculatorDisplay', targetDir, (l,m) => console.log(m));
    console.log('SUCCESS');
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

run();
