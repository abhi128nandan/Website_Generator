import React from 'react';

interface DigitButtonProps {
  digit: string;
  onClick: () => void;
}

const DigitButton: React.FC<DigitButtonProps> = ({ digit, onClick }) => {
  return (
    <button 
      className="digit-button" 
      onClick={onClick}
    >
      {digit}
    </button>
  );
};

export default DigitButton;