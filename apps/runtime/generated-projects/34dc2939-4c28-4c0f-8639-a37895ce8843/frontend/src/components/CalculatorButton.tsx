import { Equal, Divide, Minus, Plus } from 'lucide-react';

interface CalculatorButtonProps {
  value: string;
  type?: 'number' | 'operator' | 'equal' | 'clear';
  onClick: (value: string) => void;
  isLarge?: boolean;
  isSecondary?: boolean;
  disabled?: boolean;
}

const CalculatorButton = ({
  value,
  type = 'number',
  onClick,
  isLarge = false,
  isSecondary = false,
  disabled = false,
}: CalculatorButtonProps): JSX.Element => {
  const getIconComponent = () => {
    const iconMap: Record<string, React.ReactNode> = {
      '/': <Divide className="w-5 h-5" />,
      '-': <Minus className="w-5 h-5" />,
      '+': <Plus className="w-5 h-5" />,
      '*': <Equal className="w-5 h-5 rotate-45" />,
      '=': <Equal className="w-5 h-5" />,
      'C': null,
    };
    return iconMap[value] || null;
  };

  const getButtonClasses = (): string => {
    let baseClasses = 'rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center';

    if (type === 'number') {
      baseClasses += isLarge
        ? ' text-xl h-16 w-16'
        : ' text-lg h-12 w-12 md:h-14 md:w-14';
      baseClasses += isSecondary
        ? ' bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'
        : ' bg-white text-gray-800 hover:bg-gray-100 focus:ring-blue-400';
    } else if (type === 'operator') {
      baseClasses += isLarge
        ? ' text-xl h-16 w-16'
        : ' text-lg h-12 w-12 md:h-14 md:w-14';
      baseClasses += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
    } else if (type === 'equal') {
      baseClasses += isLarge
        ? ' text-xl h-16 w-20 md:h-20 md:w-28'
        : ' text-lg h-12 w-16 md:h-14 md:w-20';
      baseClasses += ' bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
    } else if (type === 'clear') {
      baseClasses += isLarge
        ? ' text-xl h-16 w-16'
        : ' text-lg h-12 w-12 md:h-14 md:w-14';
      baseClasses += ' bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    }

    if (disabled) {
      baseClasses += ' opacity-50 cursor-not-allowed';
    }

    return baseClasses;
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={() => onClick(value)}
      disabled={disabled}
      aria-label={value}
    >
      {getIconComponent() || value}
    </button>
  );
};

export default CalculatorButton;