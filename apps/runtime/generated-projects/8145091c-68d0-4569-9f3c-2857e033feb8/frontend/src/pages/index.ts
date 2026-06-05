import React from 'react';

interface DigitButtonProps {
  value: string;
  onClick: () => void;
  className?: string;
}

const DigitButton: React.FC<DigitButtonProps> = ({ value, onClick, className }) => {
  return (
    <button className={className} onClick={onClick}>
      {value}
    </button>
  );
};

export default DigitButton;