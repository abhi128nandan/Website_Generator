import { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className, contentClassName }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative inline-block ${className || ''}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg transform -translate-y-full ${
            contentClassName || ''
          }`}
          style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center">
            <span>{content}</span>
          </div>
          <div
            className="absolute w-3 h-3 bg-gray-900 transform rotate-45 -translate-x-1/2"
            style={{ top: '-5px', left: '50%' }}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;